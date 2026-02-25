const ExcelJS = require('exceljs');

async function checkTemplate() {
  const templatePath = 'D:/AI_PJ/JISOWMS/OWMS/excel/양식.xlsx';

  console.log('Reading template:', templatePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  const worksheet = workbook.worksheets[1]; // '양식 (2)'
  console.log('Worksheet name:', worksheet.name);

  // Row 40-44 내용 확인
  console.log('\n=== Row 40-44 Content ===');
  for (let r = 40; r <= 44; r++) {
    const row = worksheet.getRow(r);
    console.log(`\nRow ${r}:`);
    for (let c = 1; c <= 14; c++) {
      const cell = row.getCell(c);
      if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
        const colName = String.fromCharCode(64 + c); // 1->A, 2->B, etc.
        console.log(`  ${colName}${r}: "${cell.value}" ${cell.master ? `(master: ${cell.master.address})` : ''}`);
      }
    }
  }
}

checkTemplate().catch(console.error);
