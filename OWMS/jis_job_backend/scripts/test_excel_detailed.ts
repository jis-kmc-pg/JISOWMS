import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ExcelService } from './src/excel/excel.service';
import * as fs from 'fs';

async function testExcelGeneration() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const excelService = app.get(ExcelService);

    try {
        // 테스트 데이터: 2026-02-10 기준 (월요일)
        const userId = 1;
        const dateStr = '2026-02-10';

        console.log(`\n=== Excel 생성 테스트 시작 ===`);
        console.log(`userId: ${userId}, date: ${dateStr}\n`);

        const buffer = await excelService.generateWeeklyReport(userId, dateStr);

        const outputPath = './test_output_detailed.xlsx';
        fs.writeFileSync(outputPath, buffer);

        console.log(`✓ Excel 파일 생성 완료: ${outputPath}`);
        console.log(`\n다음 명령으로 검증하세요:`);
        console.log(`  node verify_detailed_layout.js\n`);

    } catch (error) {
        console.error('에러 발생:', error);
    } finally {
        await app.close();
    }
}

testExcelGeneration();
