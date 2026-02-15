
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start fixing orderIndex...');

    // 1. Fix Departments
    const departments = await prisma.department.findMany({
        orderBy: { createdAt: 'asc' } // 생성 순서대로 정렬
    });

    console.log(`Found ${departments.length} departments.`);

    for (const [index, dept] of departments.entries()) {
        await prisma.department.update({
            where: { id: dept.id },
            data: { orderIndex: index + 1 }
        });
        console.log(`Updated Department ${dept.name}: orderIndex = ${index + 1}`);
    }

    // 2. Fix Teams
    const teams = await prisma.team.findMany({
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${teams.length} teams.`);

    // Group teams by department to reset index for each department (optional, but cleaner)
    // But globally unique or per-dept unique, doesn't matter much if we filter by dept.
    // However, our sort logic relies on relative order.
    // Let's do per-department logic to be safe.

    // Actually, simpler to just iterate all teams?
    // The query finds `adjacent` where `departmentId` matches.
    // So `orderIndex` needs to be distinct *within the department*.

    // Let's regrup.
    const teamsByDept: Record<number, typeof teams> = {};
    for (const team of teams) {
        if (!teamsByDept[team.departmentId]) teamsByDept[team.departmentId] = [];
        teamsByDept[team.departmentId].push(team);
    }

    for (const deptIdStr in teamsByDept) {
        const deptId = Number(deptIdStr);
        const deptTeams = teamsByDept[deptId];

        console.log(`Updating teams for Department ID ${deptId}...`);

        for (const [index, team] of deptTeams.entries()) {
            await prisma.team.update({
                where: { id: team.id },
                data: { orderIndex: index + 1 }
            });
            console.log(`  Updated Team ${team.name}: orderIndex = ${index + 1}`);
        }
    }

    console.log('Fix complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
