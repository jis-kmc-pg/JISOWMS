// REST API를 통한 Excel 생성 테스트
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testExcelAPI() {
    try {
        console.log('\n=== Excel API 테스트 시작 ===\n');

        // API 엔드포인트 호출
        const response = await axios({
            method: 'get',
            url: 'http://localhost:3000/reports/weekly-excel',
            params: {
                userId: 1,
                date: '2026-02-10'
            },
            responseType: 'arraybuffer'
        });

        // 파일 저장
        const outputPath = path.join(__dirname, 'test_output_detailed.xlsx');
        fs.writeFileSync(outputPath, response.data);

        console.log(`✓ Excel 파일 생성 완료: ${outputPath}`);
        console.log(`✓ 파일 크기: ${response.data.length} bytes\n`);
        console.log(`다음 명령으로 검증하세요:`);
        console.log(`  node verify_detailed_layout.js\n`);

    } catch (error) {
        if (error.response) {
            console.error('API 에러:', error.response.status, error.response.data);
        } else {
            console.error('요청 실패:', error.message);
        }
    }
}

testExcelAPI();
