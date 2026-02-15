import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSummary() {
    try {
        console.log('--- Starting Debug ---');
        const testUsers = [
            { id: 75, role: 'MEMBER', label: '노경은 (Dept 3, No Teams)' },
            { id: 1, role: 'MEMBER', label: 'Admin? (Dept ?, Role Member)' },
            { id: 1, role: 'CEO', label: 'CEO (All Depts)' }
        ];

        for (const testUser of testUsers) {
            console.log(`\n--- Testing ${testUser.label} ---`);
            let baseWhere: any = {};
            if (testUser.role !== 'CEO' && testUser.role !== 'EXECUTIVE') {
                const user = await prisma.user.findUnique({
                    where: { id: testUser.id },
                    select: { departmentId: true }
                });
                console.log('User Dept ID:', user?.departmentId);
                if (!user || user.departmentId === null || user.departmentId === undefined) {
                    console.log('User has no department. Skipping role filter.');
                } else {
                    baseWhere = { id: user.departmentId };
                }
            }
            console.log('BaseWhere:', JSON.stringify(baseWhere));

            console.log('Querying departments...');
            const departments = await prisma.department.findMany({
                where: baseWhere,
                include: {
                    teams: {
                        include: { users: { select: { id: true } } },
                        orderBy: { orderIndex: 'asc' }
                    },
                    users: {
                        where: { teamId: null },
                        select: { id: true }
                    }
                },
                orderBy: { orderIndex: 'asc' }
            });

            console.log('Departments found:', departments.length);
            departments.forEach(d => {
                console.log(`- Dept: ${d.name}, Teams Count: ${d.teams.length}, Team-less Users: ${d.users.length}`);
            });
        }

    } catch (err: any) {
        console.error('CRITICAL ERROR:', err);
        if (err.message) console.error('Message:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugSummary();
