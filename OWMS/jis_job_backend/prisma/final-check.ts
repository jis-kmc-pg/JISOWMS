import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({ where: { userId: 'admin' } });
    console.log('FINAL_CHECK:', user ? 'SUCCESS' : 'FAILED');
}
main().finally(() => prisma.$disconnect());
