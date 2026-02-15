// admin 계정 생성 스크립트 (1회성)
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
    const prisma = new PrismaClient();
    const hash = await bcrypt.hash('1234', 10);
    const result = await prisma.user.upsert({
        where: { userId: 'admin' },
        update: { password: hash },
        create: {
            userId: 'admin',
            name: '시스템관리자',
            password: hash,
            position: '관리자',
            role: 'CEO',
        },
    });
    console.log('admin 계정 생성 완료:', result.userId, result.name);
    await prisma.$disconnect();
}

main().catch(console.error);
