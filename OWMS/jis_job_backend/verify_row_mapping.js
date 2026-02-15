// 양식.xlsx 기반 Row 40 보호 검증 스크립트
const ExcelJS = require('exceljs');
const path = require('path');

const TEMPLATE_PATH = 'D:/AI_PJ/OWMS/excel/양식.xlsx';
const OUTPUT_PATH = path.join(__dirname, 'test_verify_row40.xlsx');

async function main() {
    // 원본 템플릿 Row 40-44 캡처
    const origWb = new ExcelJS.Workbook();
    await origWb.xlsx.readFile(TEMPLATE_PATH);
    const origWs = origWb.worksheets[1];

    const origSnapshot = {};
    for (let r = 40; r <= 44; r++) {
        const cells = [];
        for (let c = 1; c <= 14; c++) {
            cells.push(JSON.stringify(origWs.getRow(r).getCell(c).value));
        }
        origSnapshot[r] = cells;
    }

    // 수정된 로직과 동일한 PAGE_RANGES로 테스트
    const PAGE_RANGES = [
        { start: 7, end: 39 },
        { start: 45, end: 84 }
    ];
    const allAvailableRows = [];
    PAGE_RANGES.forEach(range => {
        for (let r = range.start; r <= range.end; r++) allAvailableRows.push(r);
    });

    // 테스트 엑셀 생성 (35개 행 = 1페이지 초과)
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(TEMPLATE_PATH);
    const ws = wb.worksheets[1];

    // 기입 가능 행만 초기화
    allAvailableRows.forEach(r => {
        try {
            ws.unMergeCells(`A${r}:B${r}`);
            ws.unMergeCells(`C${r}:E${r}`);
            ws.unMergeCells(`F${r}:G${r}`);
            ws.unMergeCells(`H${r}:N${r}`);
        } catch (e) { }
        const row = ws.getRow(r);
        for (let c = 1; c <= 14; c++) {
            const cell = row.getCell(c);
            if (cell.address === cell.master.address) cell.value = null;
        }
    });

    // 35줄 기입
    for (let i = 0; i < 35; i++) {
        const rNum = allAvailableRows[i];
        try {
            ws.mergeCells(`A${rNum}:B${rNum}`);
            ws.mergeCells(`C${rNum}:E${rNum}`);
        } catch (e) { }
        ws.getRow(rNum).getCell(3).value = `테스트_${i + 1}`;
    }

    // 나머지 빈 행 병합 유지  
    for (let i = 35; i < allAvailableRows.length; i++) {
        const rNum = allAvailableRows[i];
        try {
            ws.mergeCells(`A${rNum}:B${rNum}`);
            ws.mergeCells(`C${rNum}:E${rNum}`);
            ws.mergeCells(`F${rNum}:G${rNum}`);
            ws.mergeCells(`H${rNum}:N${rNum}`);
        } catch (e) { }
    }

    await wb.xlsx.writeFile(OUTPUT_PATH);

    // 검증
    const vWb = new ExcelJS.Workbook();
    await vWb.xlsx.readFile(OUTPUT_PATH);
    const vWs = vWb.worksheets[1];

    console.log('=== Row 39 (1페이지 마지막) ===');
    console.log(`값: "${vWs.getRow(39).getCell(3).value}" → ${vWs.getRow(39).getCell(3).value === '테스트_33' ? '✅' : '❌'}`);

    console.log('\n=== Row 40 비어있는지 확인 ===');
    let row40clean = true;
    for (let c = 1; c <= 14; c++) {
        const v = vWs.getRow(40).getCell(c).value;
        if (v !== null && v !== undefined && String(v).trim()) {
            console.log(`  C${c} = "${v}" ← ❌ 데이터 존재!`);
            row40clean = false;
        }
    }
    console.log(row40clean ? '✅ Row 40 완전히 비어있음' : '❌ Row 40에 데이터가 있습니다');

    console.log('\n=== Row 41-44 보존 확인 ===');
    let preserved = true;
    for (let r = 41; r <= 44; r++) {
        for (let c = 1; c <= 14; c++) {
            const orig = origSnapshot[r][c - 1];
            const curr = JSON.stringify(vWs.getRow(r).getCell(c).value);
            if (orig !== curr) {
                console.log(`  Row ${r} C${c}: 변경됨! ${orig} → ${curr}`);
                preserved = false;
            }
        }
    }
    console.log(preserved ? '✅ Row 41-44 중요정보사항 보존됨' : '❌ Row 41-44 변경 발생');

    console.log('\n=== Row 45 (2페이지 시작) ===');
    const v45 = vWs.getRow(45).getCell(3).value;
    console.log(`값: "${v45}" → ${v45 === '테스트_34' ? '✅ 넘침 데이터 이어서 기입' : '❌'}`);

    const allOk = row40clean && preserved && vWs.getRow(39).getCell(3).value === '테스트_33' && v45 === '테스트_34';
    console.log(`\n=== 종합: ${allOk ? '✅ 모든 검증 통과!' : '❌ 실패'} ===`);
}

main().catch(e => { console.error(e); process.exit(1); });
