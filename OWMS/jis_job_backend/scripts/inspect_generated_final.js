const ExcelJS = require('exceljs');
const path = require('path');

async function inspectGenerated() {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, 'test_output.xlsx');
    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[1];
        console.log(`--- Inspecting Generated Sheet: ${worksheet.name} ---`);

        for (let i = 1; i <= 20; i++) {
            const row = worksheet.getRow(i);
            const rowData = [];
            for (let j = 1; j <= 10; j++) {
                const cell = row.getCell(j);
                const val = cell.value;
                const isMerged = cell.master.address !== cell.address;
                if (val || !isMerged) {
                    rowData.push(`Col ${j}: [${isMerged ? 'M' : 'S'}] ${val}`);
                }
            }
            if (rowData.length > 0) {
                console.log(`Row ${i}: ${rowData.join(' | ')}`);
            }
        }

    } catch (error) {
        console.error("Error reading file:", error.message);
    }
}

inspectGenerated();
