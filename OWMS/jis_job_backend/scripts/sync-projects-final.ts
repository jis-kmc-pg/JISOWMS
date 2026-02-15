import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const filePath = path.join(__dirname, '../legacy_data/projects_cleaned.txt');

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const projectNames = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    console.log(`Total projects to sync: ${projectNames.length}`);

    // 1. 기존 프로젝트 이름 가져오기 (중복 방지)
    const existingProjects = await prisma.project.findMany({
        select: { projectName: true }
    });
    const existingSet = new Set(existingProjects.map(p => p.projectName));

    const newProjectNames = Array.from(new Set(projectNames.filter(name => !existingSet.has(name))));
    console.log(`New unique projects to create: ${newProjectNames.length}`);

    // 2. 일괄 생성 (성능을 위해 chunk 단위로 처리)
    const chunkSize = 100;
    for (let i = 0; i < newProjectNames.length; i += chunkSize) {
        const chunk = newProjectNames.slice(i, i + chunkSize);
        await prisma.project.createMany({
            data: chunk.map(name => ({
                projectName: name,
                status: 'ACTIVE'
            })),
            skipDuplicates: true
        });
        console.log(`Inserted chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(newProjectNames.length / chunkSize)}`);
    }

    // 3. 기존 Job 테이블의 title들을 Project 테이블과 매칭하여 projectId 채우기
    console.log('\nMatching existing Jobs with created Projects...');
    const allProjects = await prisma.project.findMany();
    const projectMap = new Map(allProjects.map(p => [p.projectName, p.id]));

    const jobsToUpdate = await prisma.job.findMany({
        where: { projectId: null }
    });

    let matchedCount = 0;
    for (const job of jobsToUpdate) {
        const projectId = projectMap.get(job.title);
        if (projectId) {
            await prisma.job.update({
                where: { id: job.id },
                data: { projectId }
            });
            matchedCount++;
        }
    }

    console.log(`Matched and updated ${matchedCount} jobs.`);
    console.log('✅ Synchronization completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
