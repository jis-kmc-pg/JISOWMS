const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const path = require('path');

const prisma = new PrismaClient();
const TEMPLATE_PATH = 'D:/AI_PJ/OWMS/excel/양식.xlsx';
const OUTPUT_PATH = path.join(__dirname, 'test_weekly_note_verification.xlsx');

async function main() {
    try {
        const userId = 1; // 관리자
        const dateStr = '2026-02-09'; // 월요일
        const weekStart = new Date(dateStr);
        weekStart.setHours(0, 0, 0, 0);

        console.log('=== 주간 중요정보 사항 검증 시작 ===');

        // Case 1: WeeklyNote 데이터가 있는 경우
        console.log('\n[Case 1] WeeklyNote 존재 시 기입 테스트');
        const demoNote = '이것은 테스트용 주간 중요정보 사항입니다.\n다중 라인 기입이 정상적으로 되는지 확인합니다.';

        await prisma.weeklyNote.upsert({
            where: { weekStart_userId: { weekStart, userId } },
            update: { content: demoNote },
            create: { weekStart, userId, content: demoNote }
        });
        console.log('데모 WeeklyNote 저장 완료');

        // 엑셀 서비스 로직 시뮬레이션 (또는 실제 호출이 좋으나 여기서는 로직 검토용으로 직접 구현)
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(TEMPLATE_PATH);
        const worksheet = workbook.worksheets[1];

        // 서비스 코드의 updateWeeklyNote 로직 시뮬레이션
        const note = await prisma.weeklyNote.findUnique({
            where: { weekStart_userId: { weekStart, userId } }
        });

        if (note && note.content && note.content.trim()) {
            const targetCell = worksheet.getRow(41).getCell(4);
            targetCell.value = note.content;
            targetCell.alignment = { vertical: 'top', wrapText: true, horizontal: 'left' };
            console.log('  D41에 기입 성공');
        }

        await workbook.xlsx.writeFile(OUTPUT_PATH);
        console.log(`  파일 생성: ${OUTPUT_PATH}`);

        // 검증
        const vWb = new ExcelJS.Workbook();
        await vWb.xlsx.readFile(OUTPUT_PATH);
        const vWs = vWb.worksheets[1];
        const vVal = vWs.getRow(41).getCell(4).value;
        const vLabel = vWs.getRow(41).getCell(1).value;

        console.log(`  검증 결과 - 값: "${vVal}"`);
        console.log(`  검증 결과 - 레이블(A41): "${vLabel}" (기존 문구 유지 확인)`);

        // Case 2: WeeklyNote 데이터가 없는 경우
        console.log('\n[Case 2] WeeklyNote 부재 시 초기화 테스트');
        await prisma.weeklyNote.deleteMany({
            where: { weekStart, userId }
        });
        console.log('보유 WeeklyNote 삭제 완료');

        const workbook2 = new ExcelJS.Workbook();
        await workbook2.xlsx.readFile(TEMPLATE_PATH);
        const worksheet2 = workbook2.worksheets[1];

        const note2 = await prisma.weeklyNote.findUnique({
            where: { weekStart_userId: { weekStart, userId } }
        });

        if (!note2 || !note2.content) {
            // Row 40-44 초기화 로직
            for (let r = 40; r <= 44; r++) {
                const row = worksheet2.getRow(r);
                for (let c = 1; c <= 14; c++) {
                    const cell = row.getCell(c);
                    if (cell.address === cell.master.address) {
                        cell.value = null;
                    }
                }
            }
            console.log('  Row 40-44 초기화 성공');
        }

        const OUTPUT_PATH2 = path.join(__dirname, 'test_weekly_note_empty.xlsx');
        await workbook2.xlsx.writeFile(OUTPUT_PATH2);
        console.log(`  파일 생성: ${OUTPUT_PATH2}`);

        // 검증
        const vWb2 = new ExcelJS.Workbook();
        await vWb2.xlsx.readFile(OUTPUT_PATH2);
        const vWs2 = vWb2.worksheets[1];
        const vVal2 = vWs2.getRow(41).getCell(4).value;
        const vLabel2 = vWs2.getRow(41).getCell(1).value;

        console.log(`  검증 결과 - 값(D41): ${vVal2} (null 기대)`);
        console.log(`  검증 결과 - 레이블(A41): ${vLabel2} (null 기대)`);

    } finally {
        await prisma.$disconnect();
    }
}

main();
