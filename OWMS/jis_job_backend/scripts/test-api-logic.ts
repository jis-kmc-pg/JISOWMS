import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Testing ReportsService.getProjects logic ---');

    const status = undefined;
    const where = status === 'ALL' ? {} : { status: status || 'ACTIVE' };

    const projects = await prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });

    console.log(`Query Status: ${status || 'ACTIVE'}`);
    console.log(`Total Projects Found: ${projects.length}`);

    if (projects.length > 0) {
        console.log('Sample Projects:');
        projects.slice(0, 5).forEach(p => console.log(`- [${p.id}] ${p.projectName} (${p.status})`));
    } else {
        console.log('No ACTIVE projects found!');

        const anyProjects = await prisma.project.count();
        console.log(`Total projects in DB regardless of status: ${anyProjects}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
