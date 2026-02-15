const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const userId = 1; // 관리자
        const startOfWeek = new Date(2026, 1, 9); // 2월 9일

        // 프로젝트 확인
        let project = await prisma.project.findFirst();
        if (!project) {
            project = await prisma.project.create({ data: { projectName: '거대 프로젝트' } });
        }

        // 기존 데이터 삭제
        const startDate = new Date(2026, 1, 9);
        const endDate = new Date(2026, 1, 20, 23, 59, 59);
        await prisma.job.deleteMany({ where: { userId, jobDate: { gte: startDate, lte: endDate } } });
        await prisma.dailyStatus.deleteMany({ where: { userId, date: { gte: startDate, lte: endDate } } });

        console.log('기존 데이터 정리 완료');

        // 3페이지 이상을 유도하기 위해 아주 긴 제목과 내용을 가진 업무 생성
        // 1페이지(33) + 2페이지(40) = 73행
        // 각 요일별로 20행 정도씩 생성 (총 100행 목표)
        for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
            const jobDate = new Date(startOfWeek);
            jobDate.setDate(jobDate.getDate() + dayIdx);

            const longContent = Array(15).fill(0).map((_, i) => `${dayIdx + 1}요일 업무 세부내용 라인 ${i + 1}`).join('\n');

            await prisma.job.create({
                data: {
                    userId,
                    projectId: project.id,
                    title: `${dayIdx + 1}요일 거대 업무`,
                    content: longContent, // 각 업무당 1(제목) + 15(내용) = 16행 소요
                    jobDate,
                    order: 1
                }
            });

            await prisma.dailyStatus.create({
                data: { userId, date: jobDate, workType: '내근' }
            });
        }
        // 요일 간 spacer 4개 + 업무당 16행 * 5 = 총 84행 정도 예상 (73행 초과 확정)

        console.log('거대 데모 데이터 생성 완료 (약 84행 이상)');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
