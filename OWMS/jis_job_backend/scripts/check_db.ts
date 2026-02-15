
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        console.log('DB Connection Successful');
        const count = await prisma.user.count();
        console.log(`User count: ${count}`);
        const departments = await prisma.department.findMany();
        console.log(`Departments: ${departments.length}`);
    } catch (e) {
        console.error('DB Connection Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
