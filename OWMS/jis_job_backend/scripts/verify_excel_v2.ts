import { PrismaClient } from '@prisma/client';
import { ExcelService } from './src/excel/excel.service';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    const prisma = new PrismaClient();
    const excelService = new (ExcelService as any)(prisma);

    try {
        console.log('Searching for a user...');
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error('No user found in database.');
            return;
        }
        console.log(`Found user: ${user.name} (ID: ${user.id})`);

        const dateStr = '2026-02-09';
        console.log(`Generating Excel report for userId ${user.id}, date ${dateStr}...`);

        const buffer = await excelService.generateWeeklyReport(user.id, dateStr);
        fs.writeFileSync('test_output_0209_v3.xlsx', buffer);
        console.log('Excel report generated successfully: test_output_0209_v3.xlsx');

        const stats = fs.statSync('test_output_0209_v3.xlsx');
        console.log(`File size: ${stats.size} bytes`);

    } catch (error: any) {
        console.error('Error generating report:', error);
        if (error.stack) {
            console.error(error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
