import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying demo data cleanup...');
    const teamName = '솔루션개발팀';
    const team = await prisma.team.findFirst({
        where: { name: teamName },
        include: { users: true }
    });

    if (!team) return;

    const userIds = team.users.map(u => u.id);

    // 1. Check content length
    const jobs = await prisma.job.findMany({
        where: { userId: { in: userIds } }
    });

    let maxLength = 0;
    let maxLineLength = 0;
    let longContentCount = 0;

    for (const job of jobs) {
        if (job.content.length > maxLength) maxLength = job.content.length;
        const lines = job.content.split('\n');
        for (const line of lines) {
            if (line.length > maxLineLength) maxLineLength = line.length;
            if (line.length >= 20) {
                longContentCount++;
                // console.log(`Long line found (${line.length}): ${line}`);
            }
        }
    }

    console.log(`Max Content Length: ${maxLength}`);
    console.log(`Max Line Length: ${maxLineLength}`);
    if (longContentCount === 0 && maxLineLength < 20) {
        console.log('SUCCESS: All content lines are < 20 chars.');
    } else {
        console.error(`FAILURE: Found ${longContentCount} lines >= 20 chars.`);
    }

    // 2. Check Weekends
    // Get all dates for these users
    const dailyStatuses = await prisma.dailyStatus.findMany({
        where: { userId: { in: userIds } }
    });

    let weekendCount = 0;
    for (const ds of dailyStatuses) {
        const day = ds.date.getDay();
        if (day === 0 || day === 6) {
            weekendCount++;
            console.log(`Weekend data found: ${ds.date.toISOString()} (User: ${ds.userId})`);
        }
    }

    if (weekendCount === 0) {
        console.log('SUCCESS: No weekend data found.');
    } else {
        console.error(`FAILURE: Found ${weekendCount} weekend entries.`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
