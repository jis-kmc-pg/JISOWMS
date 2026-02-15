const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Fixing Half-Day Vacation Constraints ---');

    // Find all HALF_AM/HALF_PM vacations where startDate != endDate
    const invalidHalfDays = await prisma.vacation.findMany({
        where: {
            OR: [
                { type: 'HALF_AM' },
                { type: 'HALF_PM' }
            ]
        }
    });

    let fixCount = 0;
    for (const v of invalidHalfDays) {
        if (v.startDate.getTime() !== v.endDate.getTime()) {
            await prisma.vacation.update({
                where: { id: v.id },
                data: { endDate: v.startDate }
            });
            fixCount++;
        }
    }

    console.log(`Successfully fixed ${fixCount} half-day records (set endDate = startDate).`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
