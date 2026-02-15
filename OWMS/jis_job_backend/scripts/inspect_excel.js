const ExcelJS = require('exceljs');

const filePath = 'D:/AI_PJ/OWMS/excel/양식_0209.xlsx';

async function inspect() {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[1]; // '양식 (2)'
        console.log(`--- Inspecting Sheet: ${worksheet.name} ---`);

        for (let i = 11; i <= 15; i++) {
            const row = worksheet.getRow(i);
            const values = [];
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                values[colNumber] = cell.value;
            });
            console.log(`Row ${i}:`, JSON.stringify(values.slice(1)));
        }

    } catch (error) {
        console.error("Error reading file:", error.message);
    }
}

inspect();
