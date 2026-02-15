import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkJobTypes() {
    console.log('--- Job TITLE Distribution Analysis ---');
    const jobs = await prisma.job.findMany({
        select: {
            title: true
        }
    });

    const titleCounts: Record<string, number> = {};
    jobs.forEach(j => {
        const title = j.title.trim() || '(비어있음)';
        titleCounts[title] = (titleCounts[title] || 0) + 1;
    });

    const sortedTitles = Object.entries(titleCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    console.log('Top 20 Job Titles:');
    sortedTitles.forEach(([title, count]) => console.log(`- ${title}: ${count}건`));

    await prisma.$disconnect();
}

checkJobTypes();
