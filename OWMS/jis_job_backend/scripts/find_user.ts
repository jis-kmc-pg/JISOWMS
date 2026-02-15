import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function find() {
    const user = await prisma.user.findFirst({
        where: { departmentId: 2 },
        select: { id: true, name: true, departmentId: true }
    });
    console.log(JSON.stringify(user, null, 2));
}
find().finally(() => prisma.$disconnect());
