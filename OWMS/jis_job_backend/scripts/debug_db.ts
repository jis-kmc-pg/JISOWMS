import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('--- User Check: 노경은 ---');
    const u = await prisma.user.findFirst({
        where: { name: '노경은' },
        include: { department: true, team: true }
    });
    console.log(JSON.stringify(u, null, 2));

    console.log('--- All Departments ---');
    const depts = await prisma.department.findMany({ include: { _count: { select: { teams: true, users: true } } } });
    console.log(JSON.stringify(depts, null, 2));

    console.log('--- All Teams ---');
    const teams = await prisma.team.findMany({ include: { _count: { select: { users: true } }, department: true } });
    console.log(JSON.stringify(teams, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
