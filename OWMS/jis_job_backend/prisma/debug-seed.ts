import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'EXISTS' : 'MISSING');

const prisma = new PrismaClient();

async function main() {
    console.log('Attempting to connect to the database...');
    try {
        await prisma.$connect();
        console.log('Successfully connected to the database.');

        const adminPassword = await bcrypt.hash('admin123!', 10);
        console.log('Hashed password successfully.');

        const admin = await prisma.user.upsert({
            where: { userId: 'admin' },
            update: {},
            create: {
                userId: 'admin',
                name: '관리자',
                password: adminPassword,
                role: 'ADMIN',
                dept: 'IT 지원팀',
            },
        });

        console.log('Admin user created/updated:', admin.userId);
    } catch (err) {
        console.error('ERROR OCCURRED:');
        console.error(err);
        if (err.code) console.error('Error Code:', err.code);
        if (err.meta) console.error('Error Meta:', err.meta);
    }
}

main()
    .catch((e) => {
        console.error('FATAL ERROR:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
