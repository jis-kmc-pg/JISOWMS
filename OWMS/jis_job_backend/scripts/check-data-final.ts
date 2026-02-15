import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Inspection (Detailed) ---');

    const totalJobs = await prisma.job.count();
    const jobTitles = await prisma.job.findMany({
        select: { title: true },
        distinct: ['title'],
    });

    const totalProjects = await prisma.project.count();
    const projectNames = await prisma.project.findMany({
        select: { projectName: true },
    });

    const totalUsers = await prisma.user.count();
    const totalDepartments = await prisma.department.count();
    const totalTeams = await prisma.team.count();

    console.log(`Total Job Records: ${totalJobs}`);
    console.log(`Unique Job Titles: ${jobTitles.length}`);
    console.log(`Total Project Records: ${totalProjects}`);
    console.log(`Total User Records: ${totalUsers}`);
    console.log(`Total Department Records: ${totalDepartments}`);
    console.log(`Total Team Records: ${totalTeams}`);

    const existingProjectNames = new Set(projectNames.map(p => p.projectName));
    const missingTitles = jobTitles.filter(j => j.title && !existingProjectNames.has(j.title));

    console.log(`\nJob Titles missing in Project table: ${missingTitles.length}`);

    if (missingTitles.length > 0) {
        console.log('\nSample Missing Titles from Jobs:');
        missingTitles.slice(0, 10).forEach((t, i) => console.log(`${i + 1}. ${t.title}`));
    }

    // Check unique titles from Job.content if needed? No, user said "업무제목" (title).
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
