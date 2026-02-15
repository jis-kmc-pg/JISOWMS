// Excel 출력 테스트 스크립트
const ExcelJS = require('exceljs');
const path = require('path');

async function testExcelOutput() {
    const outputPath = path.join(__dirname, 'test_output_detailed.xlsx');

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(outputPath);

        const worksheet = workbook.worksheets[1]; // '양식 (2)'

        console.log('\n=== 상세 행 레이아웃 검증 ===\n');
        console.log('Row | Col1-2 (요일) | Col3-5 (내용) | Col6-7 (요일) | Col8-14 (내용)');
        console.log(''.padEnd(100, '-'));

        // 7-50행 정도만 확인
        for (let r = 7; r <= 50; r++) {
            const row = worksheet.getRow(r);
            const col1 = row.getCell(1).value || '';
            const col3 = row.getCell(3).value || '';
            const col6 = row.getCell(6).value || '';
            const col8 = row.getCell(8).value || '';

            const col1Str = String(col1).substring(0, 10).replace(/\n/g, ' ');
            const col3Str = String(col3).substring(0, 30).replace(/\n/g, ' ');
            const col6Str = String(col6).substring(0, 10).replace(/\n/g, ' ');
            const col8Str = String(col8).substring(0, 30).replace(/\n/g, ' ');

            console.log(`${String(r).padStart(3)} | ${col1Str.padEnd(12)} | ${col3Str.padEnd(32)} | ${col6Str.padEnd(12)} | ${col8Str.padEnd(32)}`);
        }

        console.log('\n검증 완료!');
    } catch (error) {
        console.error('에러 발생:', error.message);
    }
}

testExcelOutput();
