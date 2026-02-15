import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Weekly Stats Logic Verification ---');

    // 1. Target Team & Users
    const teamName = '솔루션개발팀';
    const team = await prisma.team.findFirst({
        where: { name: teamName },
        include: { users: true }
    });

    if (!team) {
        console.error('Team not found');
        return;
    }

    const userIds = team.users.map(u => u.id);
    console.log(`Team: ${teamName}, Users: ${userIds.length}`);

    // 2. Logic simulation (from WorkStatusService.getWeeklySummary)
    const targetDate = new Date();
    // Simulate 'getMonToFri'
    const getMonToFri = (baseDate: Date) => {
        const day = baseDate.getDay();
        const diffToMon = baseDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(baseDate);
        monday.setDate(diffToMon);
        monday.setHours(0, 0, 0, 0);

        const dates = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return { monday, dates };
    };

    const currentWeek = getMonToFri(targetDate);
    console.log('Current Week Dates (expected):', currentWeek.dates);

    const nextWeekDate = new Date(targetDate);
    nextWeekDate.setDate(targetDate.getDate() + 7);
    const nextWeek = getMonToFri(nextWeekDate);
    console.log('Next Week Dates (expected):', nextWeek.dates);

    // 3. Stats Calculation Check
    const checkStats = async (dates: string[], label: string) => {
        console.log(`\nChecking stats for ${label}...`);
        const start = new Date(dates[0]);
        const end = new Date(dates[4]); // Friday
        end.setDate(end.getDate() + 1); // Fix applied in service
        end.setHours(23, 59, 59, 999);

        console.log(`  Query Range: ${start.toISOString()} ~ ${end.toISOString()}`);

        const jobs = await prisma.job.findMany({
            where: {
                userId: { in: userIds },
                jobDate: { gte: start, lte: end }
            },
            select: { userId: true, jobDate: true }
        });

        const dailyStatuses = await prisma.dailyStatus.findMany({
            where: {
                userId: { in: userIds },
                date: { gte: start, lte: end }
            },
            select: { userId: true, date: true, workType: true }
        });

        console.log(`  Found Jobs: ${jobs.length}, DailyStatuses: ${dailyStatuses.length}`);

        let completedCount = 0;

        for (const uid of userIds) {
            const userName = team.users.find(u => u.id === uid)?.name;
            const userJobs = jobs.filter(j => j.userId === uid);
            const userStatuses = dailyStatuses.filter(ds => ds.userId === uid);
            const jobDates = new Set(userJobs.map(j => j.jobDate.toISOString().split('T')[0]));

            // Log raw dates for first user only to debug
            if (uid === userIds[0]) {
                console.log(`  [DEBUG User: ${userName}] Job Dates:`, Array.from(jobDates));
                console.log(`  [DEBUG User: ${userName}] Status Dates:`, userStatuses.map(s => `${s.date.toISOString().split('T')[0]}(${s.workType})`));
            }

            const isFull = dates.every(d => {
                if (jobDates.has(d)) return true;
                const status = userStatuses.find(s => s.date.toISOString().split('T')[0] === d);
                // Check logic: must be one of exempt types
                const isExempt = status && ['연차', '공가', '공휴일'].includes(status.workType);
                if (!isExempt) {
                    if (uid === userIds[0]) console.log(`    Missing or Not Exempt: ${d} (Status: ${status?.workType})`);
                }
                return isExempt;
            });

            if (isFull) {
                completedCount++;
            } else {
                console.log(`  User ${userName} is NOT COMPLETE.`);
            }
        }

        console.log(`  ${label} Result: ${completedCount} / ${userIds.length} completed.`);
    };

    await checkStats(currentWeek.dates, 'Current Week');
    await checkStats(nextWeek.dates, 'Next Week');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
