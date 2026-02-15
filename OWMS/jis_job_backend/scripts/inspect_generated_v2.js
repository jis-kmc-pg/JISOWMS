const ExcelJS = require('exceljs');

const filePath = 'D:/AI_PJ/OWMS/jis_job_backend/test_output_0209_v3.xlsx';

async function inspect() {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[1]; // '양식 (2)'
        console.log(`--- Inspecting Sheet: ${worksheet.name} ---`);

        for (let i = 11; i <= 25; i++) {
            const row = worksheet.getRow(i);
            const col1 = row.getCell(1).value; // 요일
            const col3 = row.getCell(3).value; // 금주실시사항
            const col8 = row.getCell(8).value; // 차주계획사항

            if (col1 || col3 || col8) {
                console.log(`Row ${i}: [Col 1: ${col1}] [Col 3: ${col3}] [Col 8: ${col8}]`);
            }
        }

    } catch (error) {
        console.error("Error reading file:", error.message);
    }
}

inspect();
