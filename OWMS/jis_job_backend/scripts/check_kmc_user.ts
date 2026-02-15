
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        const user = await prisma.user.findUnique({
            where: { userId: 'kmc' }
        });

        if (user) {
            console.log('User found:');
            console.log(`ID: ${user.id}`);
            console.log(`UserId: ${user.userId}`);
            console.log(`Name: ${user.name}`);

            const isMatch = await bcrypt.compare('owms1234', user.password);
            console.log(`Password 'owms1234' matches: ${isMatch}`);
        } else {
            console.log('User with ID "kmc" not found.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
