import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');
    const hash = await bcrypt.hash('admin123!', 10);
    const admin = await prisma.user.upsert({
        where: { userId: 'admin' },
        update: {},
        create: {
            userId: 'admin',
            name: '관리자',
            password: hash,
            role: 'ADMIN',
            dept: 'IT 지원팀',
        },
    });
    console.log('Seed successful:', admin.userId);
}

main().catch(console.error).finally(() => prisma.$disconnect());
