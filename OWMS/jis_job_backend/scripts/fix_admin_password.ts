import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = 'password';
    const hash = await bcrypt.hash(password, 10);

    try {
        const admin = await prisma.user.update({
            where: { userId: 'admin' },
            data: { password: hash },
        });
        console.log(`Admin (${admin.userId}) password updated to hash.`);
    } catch (e) {
        console.error('Failed to update admin:', e);
    }

    try {
        const testUser = await prisma.user.update({
            where: { userId: '99999' },
            data: { password: hash },
        });
        console.log(`Test User (${testUser.userId}) password updated.`);
    } catch (e) {
        // Ignore if not found
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
