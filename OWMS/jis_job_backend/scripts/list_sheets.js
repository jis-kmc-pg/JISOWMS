const ExcelJS = require('exceljs');
const path = require('path');

async function listSheets() {
    const workbook = new ExcelJS.Workbook();
    const templatePath = path.join('D:/AI_PJ/OWMS/excel', '양식_0209.xlsx');
    await workbook.xlsx.readFile(templatePath);
    console.log('Worksheets:', workbook.worksheets.map((s, i) => `${i}: ${s.name}`));
}

listSheets();
