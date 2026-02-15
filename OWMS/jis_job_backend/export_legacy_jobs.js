const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// MSSQL 연결 설정
const mssqlConfig = {
  server: '192.168.123.75',
  port: 2133,
  database: 'JIS_JOB',
  user: 'sa',
  password: 'ver30',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function exportLegacyJobs() {
  console.log('📥 === 레거시 DB 업무 목록 추출 시작 ===\n');

  let mssqlPool;

  try {
    // MSSQL 연결
    console.log('🔌 MSSQL 연결 중...');
    mssqlPool = await sql.connect(mssqlConfig);
    console.log('✅ MSSQL 연결 성공\n');

    // JIS_WORK_LIST 조회 (2024년 이후만, 샘플)
    console.log('📊 업무 데이터 조회 중...');
    const result = await mssqlPool.query`
      SELECT TOP 1000
        DATE,
        USER_CODE,
        DEPARTMENT,
        NAME,
        WORK_ORDER,
        TYPE,
        CONTENT,
        DATA_ORDER,
        WORK_TYPE_CODE,
        OUTPUT,
        PROJECT_KEY
      FROM JIS_WORK_LIST
      WHERE YEAR(DATE) >= 2024
      ORDER BY DATE DESC, USER_CODE, DATA_ORDER
    `;

    const jobs = result.recordset;
    console.log(`✅ ${jobs.length}개 업무 조회 완료\n`);

    // 날짜별로 그룹화
    const jobsByDate = {};
    jobs.forEach(job => {
      const dateStr = job.DATE.toISOString().split('T')[0];
      if (!jobsByDate[dateStr]) {
        jobsByDate[dateStr] = [];
      }
      jobsByDate[dateStr].push({
        user: job.NAME,
        userId: job.USER_CODE,
        department: job.DEPARTMENT,
        type: job.TYPE,
        content: job.CONTENT,
        order: job.DATA_ORDER,
        workTypeCode: job.WORK_TYPE_CODE,
        projectKey: job.PROJECT_KEY
      });
    });

    // JSON 파일로 저장
    const outputDir = path.join(__dirname, 'legacy_data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const jsonFile = path.join(outputDir, 'legacy_jobs.json');
    fs.writeFileSync(jsonFile, JSON.stringify(jobsByDate, null, 2), 'utf8');
    console.log(`📄 JSON 파일 저장: ${jsonFile}`);

    // 텍스트 파일로도 저장 (읽기 쉬운 형식)
    const txtFile = path.join(outputDir, 'legacy_jobs.txt');
    let txtContent = '='.repeat(100) + '\n';
    txtContent += '레거시 DB 업무 목록 (2024년 이후, 최대 1000건)\n';
    txtContent += '='.repeat(100) + '\n\n';

    const sortedDates = Object.keys(jobsByDate).sort().reverse();
    for (const date of sortedDates) {
      txtContent += `\n${'─'.repeat(100)}\n`;
      txtContent += `📅 날짜: ${date}\n`;
      txtContent += '─'.repeat(100) + '\n';

      jobsByDate[date].forEach((job, idx) => {
        txtContent += `\n[${idx + 1}] ${job.user} (${job.department})\n`;
        txtContent += `    타입: ${job.type || 'N/A'} | 순서: ${job.order || 0}\n`;
        txtContent += `    내용: ${job.content || '(내용 없음)'}\n`;
      });
    }

    fs.writeFileSync(txtFile, txtContent, 'utf8');
    console.log(`📄 텍스트 파일 저장: ${txtFile}`);

    // 통계 출력
    console.log('\n📊 === 통계 ===');
    console.log(`  총 업무 수: ${jobs.length}개`);
    console.log(`  기간: ${sortedDates[sortedDates.length - 1]} ~ ${sortedDates[0]}`);
    console.log(`  날짜 수: ${sortedDates.length}일`);

    // 사용자별 통계
    const userStats = {};
    jobs.forEach(job => {
      const user = job.NAME || '알 수 없음';
      userStats[user] = (userStats[user] || 0) + 1;
    });

    console.log('\n  사용자별 업무 수 (상위 10명):');
    Object.entries(userStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([user, count], idx) => {
        console.log(`    ${idx + 1}. ${user.padEnd(15)} ${count}개`);
      });

    console.log('\n✅ 추출 완료!');
    console.log(`📂 저장 위치: ${outputDir}`);

  } catch (err) {
    console.error('\n❌ 오류 발생:', err.message);
    throw err;
  } finally {
    if (mssqlPool) {
      await mssqlPool.close();
      console.log('\n🔌 MSSQL 연결 종료');
    }
  }
}

// 실행
exportLegacyJobs()
  .catch(console.error)
  .finally(() => {
    process.exit();
  });
