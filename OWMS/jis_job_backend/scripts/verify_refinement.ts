import { PrismaClient } from '@prisma/client';
import { WorkStatusService } from './src/work-status/work-status.service';

const prisma = new PrismaClient();
const service = new WorkStatusService(prisma as any);

async function verifyRefinedSummary() {
    try {
        // 1. Management Support (No Teams) - Should show 1 Dept Card
        console.log('\n--- Checking Management Support (ID 3, No Teams) ---');
        const user3 = { id: 75, role: 'MEMBER' };
        const res3 = await service.getWeeklySummary(user3);
        console.log('Result count:', res3.length);
        res3.forEach(r => console.log(`Card: ${r.teamName} (isTeam: ${r.isTeam})`));

        // 2. Solution Business Dept (Has Teams) - Should show ONLY Team Cards
        console.log('\n--- Checking Solution Business Dept (ID 2, Has Teams) ---');
        const user2 = { id: 6, role: 'MEMBER' }; // ID 6 belongs to Dept 2
        const res2 = await service.getWeeklySummary(user2);
        console.log('Result count:', res2.length);
        res2.forEach(r => console.log(`Card: ${r.teamName} (isTeam: ${r.isTeam})`));
    } catch (err: any) {
        console.error('CRITICAL ERROR:', err);
    }
}

verifyRefinedSummary().finally(() => prisma.$disconnect());
