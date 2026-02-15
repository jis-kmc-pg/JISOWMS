const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const prisma = new PrismaClient();

async function verify() {
    const userId = 2; // 홍길동
    const dateStr = '2026-02-09';
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    console.log("Setting dummy DailyStatus for testing...");
    // 2026-02-09 (월) -> 공휴일 (설날)
    // 2026-02-10 (화) -> 연차
    // 2026-02-11 (수) -> 외근

    await prisma.dailyStatus.upsert({
        where: { date_userId: { date: new Date('2026-02-09'), userId } },
        update: { workType: '공휴일', holidayName: '설날' },
        create: { date: new Date('2026-02-09'), userId, workType: '공휴일', holidayName: '설날' }
    });
    await prisma.dailyStatus.upsert({
        where: { date_userId: { date: new Date('2026-02-10'), userId } },
        update: { workType: '연차' },
        create: { date: new Date('2026-02-10'), userId, workType: '연차' }
    });
    await prisma.dailyStatus.upsert({
        where: { date_userId: { date: new Date('2026-02-11'), userId } },
        update: { workType: '외근' },
        create: { date: new Date('2026-02-11'), userId, workType: '외근' }
    });

    console.log("Running verify_excel_v2.ts to generate report...");
    const { execSync } = require('child_process');
    try {
        execSync('npx ts-node verify_excel_v2.ts', { cwd: 'd:/AI_PJ/OWMS/jis_job_backend', stdio: 'inherit' });
        console.log("Report generated. Inspecting results...");

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('test_output_0209_v3.xlsx');
        const worksheet = workbook.worksheets[1];

        // 7행부터 검사 (월요일)
        console.log("Row 7 (월):", worksheet.getRow(7).getCell(1).value, "|", worksheet.getRow(7).getCell(3).value);
        // 화요일은 월요일 업무 행수 + 1(공백) 이후
        // 이전 검사 결과에서 월요일 업무가 많았으므로 행 번호가 유동적일 수 있으나...
        // 대략적인 패턴 확인
        for (let i = 7; i <= 30; i++) {
            const r = worksheet.getRow(i);
            const val = r.getCell(3).value;
            if (val) console.log(`Row ${i}: ${val}`);
        }

    } catch (e) {
        console.error("Verification failed:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
