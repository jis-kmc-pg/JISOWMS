const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Reseting Roles ---');
    // kmc to TEAM_LEADER
    await prisma.user.updateMany({ where: { userId: 'kmc' }, data: { role: 'TEAM_LEADER' } });
    // 이상진 to DEPT_HEAD
    await prisma.user.updateMany({ where: { name: '이상진' }, data: { role: 'DEPT_HEAD' } });

    console.log('--- Fetching Departments and Users ---');
    const depts = await prisma.department.findMany({ include: { users: true } });

    const statuses = ['APPROVED', 'PENDING', 'REJECTED'];
    const types = ['ANNUAL', 'HALF_AM', 'HALF_PM'];
    const reasons = ['개인 사유 휴식', '병가', '가족 행사', '자격증 시험', '이사', '여행', '리프레시'];

    console.log('--- Generating Data ---');
    let count = 0;

    // Clear existing vacations to start fresh and avoid mess
    // await prisma.vacation.deleteMany(); // User didn't ask to clear, but "diverse" usually implies a fresh start. 
    // Actually, I'll just add many more to ensure density.

    for (const dept of depts) {
        console.log(`Processing Department: ${dept.name} (${dept.users.length} users)`);

        // Skip departments with 0 users
        if (dept.users.length === 0) continue;

        // Generate 10-15 records per department
        const recordsToCreate = Math.max(10, dept.users.length * 2);

        for (let i = 0; i < recordsToCreate; i++) {
            const user = dept.users[Math.floor(Math.random() * dept.users.length)];

            // Generate a random date in 2026
            const month = Math.floor(Math.random() * 12);
            const day = Math.floor(Math.random() * 25) + 1;
            const startDate = new Date(2026, month, day);
            const duration = Math.floor(Math.random() * 3); // 0-2 extra days
            const endDate = new Date(2026, month, day + duration);

            await prisma.vacation.create({
                data: {
                    userId: user.id,
                    type: types[Math.floor(Math.random() * types.length)],
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    startDate,
                    endDate,
                    reason: reasons[Math.floor(Math.random() * reasons.length)] + ' #' + (i + 1)
                }
            });
            count++;
        }
    }

    console.log(`Successfully generated ${count} vacation records across ${depts.length} departments.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
