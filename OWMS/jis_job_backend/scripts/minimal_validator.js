const ExcelJS = require('exceljs');
const fs = require('fs');

async function checkFile(path) {
    console.log(`Checking file: ${path}`);
    if (!fs.existsSync(path)) {
        console.error('File does not exist');
        return;
    }
    const stats = fs.statSync(path);
    console.log(`File size: ${stats.size} bytes`);

    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(path);
        console.log('SUCCESS: File is a valid Excel file.');
        console.log(`Sheet name: ${workbook.worksheets[0].name}`);
    } catch (err) {
        console.error('FAILURE: File is NOT a valid Excel file or is corrupted.');
        console.error(err.message);
    }
}

const target = process.argv[2] || 'test_output.xlsx';
checkFile(target);
