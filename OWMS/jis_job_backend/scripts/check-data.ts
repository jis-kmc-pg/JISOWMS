import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Inspection ---');

    const jobTitles = await prisma.job.findMany({
        select: { title: true },
        distinct: ['title'],
    });

    const projectNames = await prisma.project.findMany({
        select: { projectName: true },
    });

    console.log(`Unique Job Titles: ${jobTitles.length}`);
    console.log(`Total Projects: ${projectNames.length}`);

    const existingProjectNames = new Set(projectNames.map(p => p.projectName));
    const missingTitles = jobTitles.filter(j => !existingProjectNames.has(j.title));

    console.log(`Missing Job Titles in Projects: ${missingTitles.length}`);

    if (missingTitles.length > 0) {
        console.log('\nSample Missing Titles:');
        missingTitles.slice(0, 20).forEach((t, i) => console.log(`${i + 1}. ${t.title}`));
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
