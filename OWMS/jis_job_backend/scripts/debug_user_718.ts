import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUserWork() {
    const user = await prisma.user.findFirst({
        where: { name: '강명철' },
        include: { team: true, department: true }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('User Found:', JSON.stringify(user, null, 2));

    const today = new Date();
    const day = today.getDay();
    const diffToMon = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diffToMon);
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    console.log(`Checking range: ${monday.toISOString()} to ${friday.toISOString()}`);

    const jobs = await prisma.job.findMany({
        where: { userId: user.id, jobDate: { gte: monday, lte: friday } },
        orderBy: { jobDate: 'asc' }
    });

    console.log('Jobs Found:', jobs.length);
    jobs.forEach(j => {
        console.log(`- Job Date: ${j.jobDate.toISOString()}, Title: ${j.title}`);
    });

    const statuses = await prisma.dailyStatus.findMany({
        where: { userId: user.id, date: { gte: monday, lte: friday } },
        orderBy: { date: 'asc' }
    });

    console.log('Daily Statuses Found:', statuses.length);
    statuses.forEach(s => {
        console.log(`- Status Date: ${s.date?.toISOString()}, WorkType: ${s.workType}`);
    });
}

checkUserWork().finally(() => prisma.$disconnect());
