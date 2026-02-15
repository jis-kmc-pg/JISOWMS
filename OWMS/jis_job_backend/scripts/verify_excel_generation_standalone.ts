import { Test, TestingModule } from '@nestjs/testing';
import { ExcelService } from './src/excel/excel.service';
import { PrismaService } from './src/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

async function verifyExcel() {
    console.log('Starting Excel Verification...');

    // Mock Prisma Service (No Jest required)
    const mockPrismaService = {
        user: {
            findUnique: async () => ({
                id: 10,
                name: '강명찬',
                department: { name: '솔루션사업부' },
                team: { name: '플랫폼팀' }
            }),
            findMany: async () => ([
                { id: 10, name: '강명찬' },
                { id: 11, name: '테스트' }
            ])
        },
        job: {
            findMany: async () => ([
                {
                    id: 1,
                    title: '테스트 업무 1',
                    content: '업무 내용 상세\n줄바꿈 테스트',
                    jobDate: new Date(),
                    project: { projectName: 'OWMS 개발' }
                }
            ])
        },
        dailyStatus: {
            findMany: async () => ([
                { date: new Date(), workType: '내근' }
            ])
        },
        weeklyNote: {
            findFirst: async () => ({
                content: '주간 이슈 사항입니다.\n특이사항 없음.'
            })
        }
    };

    const excelService = new ExcelService(mockPrismaService as any);

    // Force template path to absolute path for safety in script
    (excelService as any).templatePath = 'D:/AI_PJ/OWMS/excel/양식.xlsx';

    try {
        console.log(`Reading template from: ${(excelService as any).templatePath}`);
        if (!fs.existsSync((excelService as any).templatePath)) {
            console.error('Template file NOT FOUND!');
            return;
        }
        const stats = fs.statSync((excelService as any).templatePath);
        console.log(`Template file size: ${stats.size} bytes`);

        const dateStr = new Date().toISOString().split('T')[0];
        console.log(`Generating report for date: ${dateStr}`);

        const buffer = await excelService.generateWeeklyReport(1, dateStr);

        console.log(`Generated buffer size: ${buffer.length} bytes`);

        const outputPath = 'D:/AI_PJ/OWMS/verify_output.xlsx';
        fs.writeFileSync(outputPath, buffer);
        console.log(`Saved output to: ${outputPath}`);

        if (buffer.length < 10000) {
            console.warn('WARNING: Generated file seems too small!');
        } else {
            console.log('SUCCESS: Generated file size seems reasonable.');
        }

    } catch (error) {
        console.error('Verification FAILED:', error);
    }
}

verifyExcel();
