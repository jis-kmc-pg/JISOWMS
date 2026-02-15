import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log(
    'DATABASE_URL check:',
    process.env.DATABASE_URL ? 'OK' : 'MISSING',
  );

  try {
    await prisma.$connect();
    console.log('Successfully connected to DB');

    const users = await prisma.user.findMany();
    console.log('Total users:', users.length);

    const admin = await prisma.user.findUnique({
      where: { userId: 'admin' },
    });

    if (admin) {
      console.log('Admin user FOUND:', admin.userId);
      console.log('Role:', admin.role);
    } else {
      console.log('Admin user NOT FOUND');
    }
  } catch (err) {
    console.error('DB Connection/Query Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
