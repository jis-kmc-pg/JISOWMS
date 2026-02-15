import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const query = '호연테크';
    const count = await prisma.project.count({
        where: {
            projectName: {
                contains: query
            },
            status: 'ACTIVE'
        }
    });
    console.log(`Count for "${query}":`, count);

    const samples = await prisma.project.findMany({
        where: {
            projectName: {
                contains: query
            }
        },
        take: 10
    });
    console.log('Samples:', JSON.stringify(samples, null, 2));

    const allCount = await prisma.project.count();
    console.log('Total Projects in DB:', allCount);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
