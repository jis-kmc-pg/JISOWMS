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

async function exportJobs2025_2026() {
  console.log('📥 === 2025~2026년 업무 목록 추출 시작 ===\n');

  let mssqlPool;

  try {
    // MSSQL 연결
    console.log('🔌 MSSQL 연결 중...');
    mssqlPool = await sql.connect(mssqlConfig);
    console.log('✅ MSSQL 연결 성공\n');

    // 프로젝트 정보 조회 (제목 매핑용)
    console.log('📊 프로젝트 정보 조회 중...');
    const projectResult = await mssqlPool.query`
      SELECT PROJECT_KEY, PROJECT_NAME, GET_SUPPLY
      FROM JIS_PROJECT_SUM_NAME
      WHERE PROJECT_KEY IS NOT NULL
    `;

    const projectMap = new Map();
    projectResult.recordset.forEach(p => {
      projectMap.set(p.PROJECT_KEY, {
        name: p.PROJECT_NAME,
        client: p.GET_SUPPLY
      });
    });
    console.log(`✅ ${projectMap.size}개 프로젝트 매핑 완료\n`);

    // JIS_WORK_LIST 조회 (2025~2026년)
    console.log('📊 업무 데이터 조회 중... (시간이 소요될 수 있습니다)');
    const result = await mssqlPool.query`
      SELECT
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
      WHERE YEAR(DATE) >= 2025 AND YEAR(DATE) <= 2026
      ORDER BY DATE DESC, USER_CODE, DATA_ORDER
    `;

    const jobs = result.recordset;
    console.log(`✅ ${jobs.length}개 업무 조회 완료\n`);

    // 업무 분류
    const jobsByDate = {};
    const projectTitles = new Set();
    const workTitles = [];  // 업무 제목만 따로 수집

    jobs.forEach(job => {
      const dateStr = job.DATE.toISOString().split('T')[0];

      // 프로젝트 정보 매핑
      let projectInfo = null;
      if (job.PROJECT_KEY && projectMap.has(job.PROJECT_KEY)) {
        projectInfo = projectMap.get(job.PROJECT_KEY);
        projectTitles.add(projectInfo.name);
      }

      // 업무 제목 추출 (TYPE이 't' 또는 'm'이고 내용이 숫자로 시작하는 경우)
      const content = job.CONTENT || '';
      const isTitle = content.match(/^\s*\d+\.\s*(.+)/);
      if (isTitle && (job.TYPE === 't' || job.TYPE === 'm')) {
        workTitles.push({
          date: dateStr,
          user: job.NAME,
          title: isTitle[1].trim(),
          type: job.TYPE === 't' ? '차주계획' : '금주실시',
          projectKey: job.PROJECT_KEY,
          projectName: projectInfo ? projectInfo.name : null
        });
      }

      // 날짜별 그룹화
      if (!jobsByDate[dateStr]) {
        jobsByDate[dateStr] = [];
      }

      jobsByDate[dateStr].push({
        user: job.NAME,
        userId: job.USER_CODE,
        department: job.DEPARTMENT,
        type: job.TYPE,
        typeLabel: getTypeLabel(job.TYPE),
        content: content,
        order: job.DATA_ORDER,
        workTypeCode: job.WORK_TYPE_CODE,
        projectKey: job.PROJECT_KEY,
        projectName: projectInfo ? projectInfo.name : null,
        projectClient: projectInfo ? projectInfo.client : null
      });
    });

    // 출력 디렉토리
    const outputDir = path.join(__dirname, 'legacy_data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // 1. 전체 업무 JSON 저장
    const jsonFile = path.join(outputDir, 'jobs_2025_2026_full.json');
    fs.writeFileSync(jsonFile, JSON.stringify(jobsByDate, null, 2), 'utf8');
    console.log(`📄 전체 업무 JSON 저장: ${jsonFile}`);

    // 2. 전체 업무 텍스트 저장
    const txtFile = path.join(outputDir, 'jobs_2025_2026_full.txt');
    let txtContent = '='.repeat(100) + '\n';
    txtContent += '레거시 DB 업무 목록 (2025~2026년 전체)\n';
    txtContent += `총 ${jobs.length}개 업무\n`;
    txtContent += '='.repeat(100) + '\n\n';

    const sortedDates = Object.keys(jobsByDate).sort().reverse();
    for (const date of sortedDates) {
      txtContent += `\n${'─'.repeat(100)}\n`;
      txtContent += `📅 날짜: ${date}\n`;
      txtContent += '─'.repeat(100) + '\n';

      jobsByDate[date].forEach((job, idx) => {
        txtContent += `\n[${idx + 1}] ${job.user} (${job.department}) - ${job.typeLabel}\n`;
        if (job.projectName) {
          txtContent += `    📌 프로젝트: ${job.projectName}`;
          if (job.projectClient) txtContent += ` (${job.projectClient})`;
          txtContent += '\n';
        }
        txtContent += `    내용: ${job.content || '(내용 없음)'}\n`;
      });
    }

    fs.writeFileSync(txtFile, txtContent, 'utf8');
    console.log(`📄 전체 업무 텍스트 저장: ${txtFile}`);

    // 3. 업무 제목만 따로 저장
    const titlesJsonFile = path.join(outputDir, 'work_titles_2025_2026.json');
    fs.writeFileSync(titlesJsonFile, JSON.stringify(workTitles, null, 2), 'utf8');
    console.log(`📄 업무 제목 JSON 저장: ${titlesJsonFile}`);

    const titlesTxtFile = path.join(outputDir, 'work_titles_2025_2026.txt');
    let titlesContent = '='.repeat(100) + '\n';
    titlesContent += '업무 제목 목록 (2025~2026년)\n';
    titlesContent += `총 ${workTitles.length}개\n`;
    titlesContent += '='.repeat(100) + '\n\n';

    // 날짜별로 그룹화
    const titlesByDate = {};
    workTitles.forEach(t => {
      if (!titlesByDate[t.date]) titlesByDate[t.date] = [];
      titlesByDate[t.date].push(t);
    });

    const sortedTitleDates = Object.keys(titlesByDate).sort().reverse();
    for (const date of sortedTitleDates) {
      titlesContent += `\n📅 ${date}\n`;
      titlesContent += '─'.repeat(100) + '\n';

      titlesByDate[date].forEach((t, idx) => {
        titlesContent += `${idx + 1}. [${t.type}] ${t.user}: ${t.title}\n`;
        if (t.projectName) {
          titlesContent += `   📌 ${t.projectName}\n`;
        }
      });
      titlesContent += '\n';
    }

    fs.writeFileSync(titlesTxtFile, titlesContent, 'utf8');
    console.log(`📄 업무 제목 텍스트 저장: ${titlesTxtFile}`);

    // 4. 프로젝트 목록 저장
    const projectsFile = path.join(outputDir, 'projects_2025_2026.txt');
    let projectsContent = '='.repeat(100) + '\n';
    projectsContent += '프로젝트 목록 (2025~2026년 업무에서 추출)\n';
    projectsContent += `총 ${projectTitles.size}개\n`;
    projectsContent += '='.repeat(100) + '\n\n';

    Array.from(projectTitles).sort().forEach((name, idx) => {
      projectsContent += `${idx + 1}. ${name}\n`;
    });

    fs.writeFileSync(projectsFile, projectsContent, 'utf8');
    console.log(`📄 프로젝트 목록 저장: ${projectsFile}`);

    // 통계 출력
    console.log('\n📊 === 통계 ===');
    console.log(`  총 업무 수: ${jobs.length.toLocaleString()}개`);
    console.log(`  기간: ${sortedDates[sortedDates.length - 1]} ~ ${sortedDates[0]}`);
    console.log(`  날짜 수: ${sortedDates.length}일`);
    console.log(`  업무 제목 수: ${workTitles.length.toLocaleString()}개`);
    console.log(`  프로젝트 수: ${projectTitles.size}개`);

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
        console.log(`    ${idx + 1}. ${user.padEnd(15)} ${count.toLocaleString()}개`);
      });

    // 유형별 통계
    const typeStats = {};
    jobs.forEach(job => {
      const type = getTypeLabel(job.TYPE);
      typeStats[type] = (typeStats[type] || 0) + 1;
    });

    console.log('\n  업무 유형별:');
    Object.entries(typeStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`    ${type.padEnd(15)} ${count.toLocaleString()}개`);
      });

    console.log('\n✅ 추출 완료!');
    console.log(`📂 저장 위치: ${outputDir}`);
    console.log('\n생성된 파일:');
    console.log('  1. jobs_2025_2026_full.json - 전체 업무 (JSON)');
    console.log('  2. jobs_2025_2026_full.txt - 전체 업무 (텍스트)');
    console.log('  3. work_titles_2025_2026.json - 업무 제목만 (JSON)');
    console.log('  4. work_titles_2025_2026.txt - 업무 제목만 (텍스트)');
    console.log('  5. projects_2025_2026.txt - 프로젝트 목록');

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

function getTypeLabel(type) {
  const labels = {
    'm': '금주실시사항',
    't': '차주계획',
    'wt': '근무형태',
    'issue': '이슈'
  };
  return labels[type] || type || '기타';
}

// 실행
exportJobs2025_2026()
  .catch(console.error)
  .finally(() => {
    process.exit();
  });
