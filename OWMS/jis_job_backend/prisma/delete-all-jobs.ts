import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Start deleting ALL jobs...');

    try {
        // Job 테이블 전체 삭제
        const deleteJobs = await prisma.job.deleteMany({});
        console.log(`✅ Deleted ${deleteJobs.count} jobs: All job records removed.`);

        console.log('🎉 All jobs deletion completed successfully.');
    } catch (error) {
        console.error('❌ Error during deletion:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
