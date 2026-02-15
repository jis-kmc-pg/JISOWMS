// Row 6 날짜 기입 검증 스크립트
// C6에 2026-02-09(월요일) 시리얼 넘버 기입 후 수식 결과 확인
const ExcelJS = require('exceljs');
const path = require('path');

const TEMPLATE = 'D:/AI_PJ/OWMS/excel/양식.xlsx';
const OUTPUT = path.join(__dirname, 'test_row6_date.xlsx');

// excel.service.ts와 동일한 변환 함수
function dateToExcelSerial(date) {
    const epoch = new Date(1900, 0, 1);
    const diff = date.getTime() - epoch.getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000)) + 2;
}

async function main() {
    // 검증 1: 시리얼 넘버 변환 정확성
    const monday = new Date(2026, 1, 9); // 2026-02-09 월
    const serial = dateToExcelSerial(monday);
    console.log('=== 시리얼 넘버 변환 검증 ===');
    console.log(`2026-02-09 → 시리얼: ${serial}`);

    // 양식.xlsx 원본 기준값과 비교
    const origWb = new ExcelJS.Workbook();
    await origWb.xlsx.readFile(TEMPLATE);
    const origWs = origWb.worksheets[1];
    const origC6 = origWs.getRow(6).getCell(3).value;
    console.log(`양식.xlsx 원본 C6: ${origC6} (이것은 기존 날짜 시리얼)`);

    // 검증 2: 엑셀 생성 후 날짜 확인
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(TEMPLATE);
    const ws = wb.worksheets[1];

    // C6에 시리얼 넘버 기입
    ws.getRow(6).getCell(3).value = serial;
    console.log(`\nC6에 기입: ${serial}`);

    // 수식 셀 확인 (수식 보존 여부)
    const e6 = ws.getRow(6).getCell(5).value;
    const h6 = ws.getRow(6).getCell(8).value;
    const j6 = ws.getRow(6).getCell(10).value;
    console.log('E6 (금요일 수식):', JSON.stringify(e6));
    console.log('H6 (차주 월 수식):', JSON.stringify(h6));
    console.log('J6 (차주 금 수식):', JSON.stringify(j6));

    await wb.xlsx.writeFile(OUTPUT);
    console.log(`\n생성 완료: ${OUTPUT}`);

    // 검증 3: 생성된 파일 다시 읽어서 확인
    const vWb = new ExcelJS.Workbook();
    await vWb.xlsx.readFile(OUTPUT);
    const vWs = vWb.worksheets[1];

    console.log('\n=== 생성 결과 검증 ===');
    const vC6 = vWs.getRow(6).getCell(3).value;
    const vE6 = vWs.getRow(6).getCell(5).value;
    const vH6 = vWs.getRow(6).getCell(8).value;
    const vJ6 = vWs.getRow(6).getCell(10).value;

    console.log(`C6 (금주 월): ${JSON.stringify(vC6)}`);
    console.log(`E6 (금주 금): ${JSON.stringify(vE6)}`);
    console.log(`H6 (차주 월): ${JSON.stringify(vH6)}`);
    console.log(`J6 (차주 금): ${JSON.stringify(vJ6)}`);

    // 시리얼 → 날짜 역변환
    function serialToDate(s) {
        if (typeof s === 'object' && s.result) s = s.result;
        if (typeof s !== 'number') return String(s);
        const d = new Date(1900, 0, s - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    console.log('\n=== 날짜 해석 ===');
    console.log(`C6: ${serialToDate(vC6)} (기대: 2026-02-09 월)`);

    // E6가 수식이면 result 사용
    if (typeof vE6 === 'object' && vE6.formula) {
        console.log(`E6: 수식=${vE6.formula}, result=${serialToDate(vE6.result)} (기대: 2026-02-13 금) ✅ 수식 보존`);
    } else {
        console.log(`E6: ${serialToDate(vE6)} (기대: 2026-02-13 금)`);
    }

    if (typeof vH6 === 'object' && vH6.formula) {
        console.log(`H6: 수식=${vH6.formula}, result=${serialToDate(vH6.result)} (기대: 차주 월) ✅ 수식 보존`);
    } else {
        console.log(`H6: ${serialToDate(vH6)}`);
    }

    if (typeof vJ6 === 'object' && vJ6.formula) {
        console.log(`J6: 수식=${vJ6.formula}, result=${serialToDate(vJ6.result)} (기대: 차주 금) ✅ 수식 보존`);
    } else {
        console.log(`J6: ${serialToDate(vJ6)}`);
    }

    // 종합
    const c6Ok = vC6 === serial;
    const e6HasFormula = typeof vE6 === 'object' && vE6.formula;
    console.log(`\n=== 종합: C6 기입=${c6Ok ? '✅' : '❌'}, E6 수식 보존=${e6HasFormula ? '✅' : '❌'} ===`);
}

main().catch(e => { console.error(e); process.exit(1); });
