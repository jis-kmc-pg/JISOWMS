import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function simulateService() {
    const targetDate = new Date(); // Current time is Wed Feb 11 13:42 KST

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
    console.log('Calculated Week Dates:', currentWeek.dates);

    // Mock User IDs for Solution Development Team members
    const userIds = [10]; // 강명철

    const start = new Date(currentWeek.dates[0]);
    const end = new Date(currentWeek.dates[4]);
    end.setHours(23, 59, 59, 999);
    console.log(`Query Range: ${start.toISOString()} to ${end.toISOString()}`);

    const jobs = await prisma.job.findMany({
        where: { userId: { in: userIds }, jobDate: { gte: start, lte: end } },
        select: { userId: true, jobDate: true }
    });

    console.log('Jobs found count:', jobs.length);
    if (jobs.length > 0) {
        const jobDates = new Set(jobs.map(j => j.jobDate.toISOString().split('T')[0]));
        console.log('Job Dates Set:', Array.from(jobDates));

        currentWeek.dates.forEach(d => {
            console.log(`Checking ${d} in Job Dates... ${jobDates.has(d)}`);
        });
    }
}

simulateService().finally(() => prisma.$disconnect());
