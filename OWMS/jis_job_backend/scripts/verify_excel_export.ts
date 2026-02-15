import { ExcelService } from './src/excel/excel.service';
import { PrismaService } from './src/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';

async function verifyExcel() {
    console.log('Starting Excel Export Verification...');

    // Manual Mock for PrismaService
    const mockPrismaService = {
        user: {
            findUnique: async () => ({
                id: 1,
                userId: 'admin',
                name: '관리자',
                dept: 'IT 지원팀'
            }),
        },
        job: {
            findMany: async ({ where }: any) => {
                console.log('Mock findMany called with:', where);
                // Mock data with newlines
                // Scenario: 
                // Job 1: Project Title + 3 lines of content = 4 lines total
                // Job 2: Project Title + 1 line of content = 2 lines total
                // Total lines expected in Excel cell = 6 lines (4 + 2)
                // This should trigger row expansion (maxLines = 6).
                return [
                    {
                        id: 1,
                        userId: 1,
                        jobDate: new Date('2026-02-04'),
                        content: 'Task 1 Line 1\nTask 1 Line 2\nTask 1 Line 3',
                        project: { projectName: 'Project A' },
                        order: 1
                    },
                    {
                        id: 2,
                        userId: 1,
                        jobDate: new Date('2026-02-04'),
                        content: 'Task 2 Single Line',
                        project: { projectName: 'Project B' },
                        order: 2
                    }
                ];
            },
        },
        dailyStatus: {
            findMany: async () => [
                { userId: 1, date: new Date('2026-02-04'), workType: '내근' }
            ],
        },
    };

    // Instantiate Service directly
    const excelService = new ExcelService(mockPrismaService as unknown as PrismaService);

    // Generate Report
    console.log('Generating Weekly Report for User 1, Date 2026-02-04 (Wednesday)...');
    // Note: Date string format might depend on locale, adhering to service logic
    try {
        const buffer = await excelService.generateWeeklyReport(1, '2026-02-04');

        const outputPath = path.join(__dirname, 'test_output.xlsx');
        fs.writeFileSync(outputPath, buffer);
        console.log(`Excel file saved to ${outputPath}`);

        // Verify Content
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(outputPath);
        const worksheet = workbook.worksheets[1]; // '양식 (2)'

        console.log('Verifying Row Expansion Logic...');

        // Find "Wednesday" (수) row index
        let wedRow = -1;
        worksheet.eachRow((row, rowNumber) => {
            const val = row.getCell(1).value?.toString() || '';
            if (val.includes('수(') || val === '수') {
                wedRow = rowNumber;
            }
        });

        if (wedRow === -1) {
            console.error('FAILED: Could not find "수" (Wednesday) row in the generated Excel.');
            // List first few rows for debugging
            console.log('First 10 rows of Column A:');
            for (let i = 1; i <= 10; i++) {
                console.log(`Row ${i}: ${worksheet.getRow(i).getCell(1).value}`);
            }
            return;
        }

        console.log(`"Wednesday" start row found at index: ${wedRow}`);

        // Find "Thursday" (목) row index to see if it shifted
        let thuRow = -1;
        worksheet.eachRow((row, rowNumber) => {
            const val = row.getCell(1).value?.toString() || '';
            if (val.includes('목(') || val === '목') {
                thuRow = rowNumber;
            }
        });

        if (thuRow === -1) {
            console.error('FAILED: Could not find "목" (Thursday) row. It might have been overwritten or lost.');
            return;
        }

        console.log(`"Thursday" start row found at index: ${thuRow}`);

        // Analyze layout
        // Original Template (Assumption): Mon, Tue, Wed, Thu, Fri are consecutive or separated by 1 row.
        // E.g., if Wed was at 10, Thu was at 11 or 12.
        // Now, Wed has 6 lines of content.
        // Logic: maxLines = 6. 
        // Inserted rows = maxLines - 1 = 5.
        // So Thu should be shifted down by 5 rows compared to original.
        // Or simply, the distance between Wed and Thu start rows should be roughly maxLines.
        // Actually, if we look at the row difference:
        // Row Diff = thuRow - wedRow.
        // Ideally, Diff should be >= maxLines (6).

        const rowDiff = thuRow - wedRow;
        console.log(`Row difference between Wed and Thu: ${rowDiff}`);
        console.log(`Expected content lines: 6`);

        if (rowDiff >= 6) {
            console.log('SUCCESS: Row gap verified. The rows have expanded to accommodate the content.');
        } else {
            console.error(`FAILURE: Row gap (${rowDiff}) is smaller than expected content length (6). Text might be overlapping or hidden.`);
            // Check cell content
            const cellContent = worksheet.getRow(wedRow).getCell(3).value?.toString() || '';
            console.log('Actual Cell Content length:', cellContent.split('\n').length || cellContent.split('\r\n').length);
        }

    } catch (err) {
        console.error('Error during verification:', err);
    }
}

verifyExcel().catch(console.error);
