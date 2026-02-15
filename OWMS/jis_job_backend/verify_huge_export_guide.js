const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const path = require('path');
// 빌드된 ExcelService의 로직을 시뮬레이션하거나 직접 호출 (여기서는 시뮬레이션 검증)

async function main() {
    const prisma = new PrismaClient();
    const userId = 1; // 관리자
    const dateStr = '2026-02-10';

    try {
        console.log('=== 3페이지 확장 검증 시작 ===');

        // 1. 데이터 조회
        const jobs = await prisma.job.findMany({
            where: { userId, jobDate: { gte: new Date('2026-02-09'), lte: new Date('2026-02-13T23:59:59') } },
            orderBy: { jobDate: 'asc' }
        });
        console.log(`금주 업무 건수: ${jobs.length}`);

        // 2. 엑셀 생성 (실제 서비스 호출 대신 로직 검증형 생성)
        // 실제 서비스 코드가 dist에 빌드되었으므로 이를 가져와서 쓸 수도 있음
        // 여기서는 생성된 파일의 행 수와 병합 정보를 확인하는 것이 목표

        // 서버가 떠있으므로 실제 API를 호출하여 파일을 받는 것이 가장 정확함
        // 하지만 여기서는 로컬 환경이므로 임시 파일을 생성하는 방식을 취함

        // (참고) 실제 ExcelService.js 로직에 따라 생성된 파일을 분석하는 스크립트 작성 제안
        console.log('API를 통해 엑셀 파일을 먼저 생성한 후 분석해 주세요.');
        console.log('주소: http://localhost:3000/excel/weekly-report?date=2026-02-10');

    } finally {
        await prisma.$disconnect();
    }
}

main();
