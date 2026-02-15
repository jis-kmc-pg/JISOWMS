import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function main() {
    console.log('Seeding admin user...');
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
    console.log('Admin user created successfully:', admin.userId);
}

main()
    .catch((e) => {
        console.error('Seed Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
