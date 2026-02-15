import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Start deleting demo projects...');

    try {
        // 1. Job 테이블에서 projectId 연결 해제 및 제목에 (구) 표시 추가 (선택사항, 일단은 연결만 해제)
        // 기존에 프로젝트와 연결된 업무들은 '일반 업무'로 통합되거나 독립된 업무로 남게 됨
        const updateJobs = await prisma.job.updateMany({
            where: {
                projectId: { not: null },
            },
            data: {
                projectId: null,
            },
        });
        console.log(`✅ Updated ${updateJobs.count} jobs: Detached from projects.`);

        // 2. Project 테이블 전체 삭제
        const deleteProjects = await prisma.project.deleteMany({});
        console.log(`✅ Deleted ${deleteProjects.count} projects: All demo projects removed.`);

        console.log('🎉 Demo projects deletion completed successfully.');
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
