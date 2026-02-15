const ExcelJS = require('exceljs');

const filePath = 'D:/AI_PJ/OWMS/jis_job_backend/test_output_0209_v3.xlsx';

async function inspect() {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[1]; // '양식 (2)'
        console.log(`--- Inspecting Generated Sheet: ${worksheet.name} ---`);

        // Print rows 11-20 to see the data
        for (let i = 11; i <= 20; i++) {
            const row = worksheet.getRow(i);
            const values = [];
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                values[colNumber] = cell.value;
            });
            if (values.some(v => v !== null && v !== undefined)) {
                console.log(`Row ${i}:`, JSON.stringify(values.slice(1)));
            }
        }

    } catch (error) {
        console.error("Error reading file:", error.message);
    }
}

inspect();
