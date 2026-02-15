const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { id: true, userId: true, name: true, email: true, role: true }
    });
    console.log('Registered Users:', users);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
