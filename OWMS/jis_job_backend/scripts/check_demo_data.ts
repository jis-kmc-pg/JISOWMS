import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const team = await prisma.team.findFirst({
        where: { name: '솔루션개발팀' },
        include: { users: true }
    });

    if (!team) return;
    const user = team.users[0]; // First user: 박승주

    const today = new Date(); // 2026-02-11
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    // Check next week Wednesday (Holiday)
    const holidayDate = new Date(monday);
    holidayDate.setDate(monday.getDate() + 9); // Mon + 9 = next Wed (Mon+7 is next Mon, +2 days) -> Mon(0) + 7 = NextMon(7). + 2 = Wed(9).
    // In create script:
    // currentWeek: i=0~4.
    // nextWeek: i=7~11.
    // publicHolidayDate = nextWeek[2] -> index 2 of nextWeek. nextWeek[0] is Mon+7. nextWeek[2] is Mon+9. Correct.

    console.log(`Checking holiday for user ${user.name} on ${holidayDate.toISOString().split('T')[0]}`);

    const status = await prisma.dailyStatus.findFirst({
        where: {
            userId: user.id,
            date: holidayDate
        }
    });
    console.log('DailyStatus:', status);

    const jobs = await prisma.job.findMany({
        where: {
            userId: user.id,
            jobDate: {
                gte: new Date(monday),
                lte: new Date(new Date(monday).setDate(monday.getDate() + 14))
            }
        }
    });
    console.log(`Total jobs found for 2 weeks: ${jobs.length}`);
    if (jobs.length > 0) {
        console.log('Sample Job:', jobs[0]);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
