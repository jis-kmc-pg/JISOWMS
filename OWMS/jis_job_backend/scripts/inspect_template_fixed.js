const ExcelJS = require('exceljs');
const path = require('path');

async function inspect() {
    const workbook = new ExcelJS.Workbook();
    const templatePath = path.join('D:/AI_PJ/OWMS/excel', '양식_0209.xlsx');
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.worksheets[1]; // '양식 (2)'

    const fs = require('fs');
    let output = `--- Inspecting Original Template: ${worksheet.name} ---\n`;
    for (let i = 1; i <= 50; i++) {
        const row = worksheet.getRow(i);
        let rowInfo = `Row ${i}: `;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const isMaster = cell.address === cell.master.address;
            const value = cell.value ? cell.value.toString().replace(/\n/g, ' ') : 'null';
            if (isMaster) {
                rowInfo += `Col ${colNumber}: [S] ${value.substring(0, 30)} | `;
            } else {
                rowInfo += `Col ${colNumber}: [M] ${value.substring(0, 30)} | `;
            }
        });
        output += rowInfo + '\n';
    }
    fs.writeFileSync('template_dump_utf8.txt', output);
    console.log('Inspection completed. Check template_dump_utf8.txt');
}

inspect();
