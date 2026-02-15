const sql = require('mssql');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

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

// 기본 비밀번호 (모든 사용자 초기값)
const DEFAULT_PASSWORD = 'owms1234';

// 유틸리티 함수
const getMonday = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

// Phase 1: 부서 마이그레이션
async function migrateDepartments(mssqlPool) {
  console.log('\n📂 === Phase 1: 부서 마이그레이션 ===');

  const result = await mssqlPool.query`
    SELECT DEPT_CODE, DEPT_NAME, SORT_NUM
    FROM JIS_DEPARTMENT
    ORDER BY SORT_NUM, DEPT_NAME
  `;

  const deptMap = {};
  let count = 0;

  for (const row of result.recordset) {
    try {
      const dept = await prisma.department.create({
        data: {
          name: row.DEPT_NAME,
          orderIndex: parseInt(row.SORT_NUM) || 0
        }
      });
      deptMap[row.DEPT_CODE] = dept.id;
      count++;
      console.log(`  ✓ ${row.DEPT_NAME} (ID: ${dept.id})`);
    } catch (err) {
      if (err.code === 'P2002') {
        // 중복된 부서는 기존 데이터 사용
        const existing = await prisma.department.findUnique({
          where: { name: row.DEPT_NAME }
        });
        deptMap[row.DEPT_CODE] = existing.id;
        console.log(`  ⚠ ${row.DEPT_NAME} (이미 존재, ID: ${existing.id})`);
      } else {
        throw err;
      }
    }
  }

  console.log(`✅ 부서 ${count}개 마이그레이션 완료`);
  return deptMap;
}

// Phase 2: 팀 마이그레이션
async function migrateTeams(mssqlPool, deptMap) {
  console.log('\n👥 === Phase 2: 팀 마이그레이션 ===');

  const result = await mssqlPool.query`
    SELECT DEPT_CODE, TEAM_CODE, TEAM_NAME, SORT_NUM
    FROM JIS_TEAM
    ORDER BY SORT_NUM, TEAM_NAME
  `;

  const teamMap = {};
  let count = 0;

  for (const row of result.recordset) {
    const departmentId = deptMap[row.DEPT_CODE];
    if (!departmentId) {
      console.log(`  ⚠ ${row.TEAM_NAME}: 부서를 찾을 수 없음 (${row.DEPT_CODE})`);
      continue;
    }

    try {
      const team = await prisma.team.create({
        data: {
          name: row.TEAM_NAME,
          departmentId: departmentId,
          orderIndex: parseInt(row.SORT_NUM) || 0
        }
      });
      teamMap[row.TEAM_CODE] = team.id;
      count++;
      console.log(`  ✓ ${row.TEAM_NAME} (ID: ${team.id})`);
    } catch (err) {
      if (err.code === 'P2002') {
        // 중복된 팀은 기존 데이터 사용
        const existing = await prisma.team.findFirst({
          where: {
            name: row.TEAM_NAME,
            departmentId: departmentId
          }
        });
        if (existing) {
          teamMap[row.TEAM_CODE] = existing.id;
          console.log(`  ⚠ ${row.TEAM_NAME} (이미 존재, ID: ${existing.id})`);
        }
      } else {
        throw err;
      }
    }
  }

  console.log(`✅ 팀 ${count}개 마이그레이션 완료`);
  return teamMap;
}

// Phase 3: 사용자 마이그레이션
async function migrateUsers(mssqlPool, deptMap, teamMap) {
  console.log('\n👤 === Phase 3: 사용자 마이그레이션 ===');

  const result = await mssqlPool.query`
    SELECT
      USER_CODE, USER_ID, NAME, DEPT_CODE, TEAM_CODE,
      RANK, PHONE, JOIN_DATE, USE_YN,
      ROLE_EXECUTIVE, ROLE_TEAMLEADER, ROLE_MANAGEMENT
    FROM JIS_USER
    WHERE USE_YN = '사용'
    ORDER BY NAME
  `;

  const userMap = {};
  let count = 0;
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const row of result.recordset) {
    // Role 결정
    let role = 'MEMBER';
    if (row.ROLE_EXECUTIVE === '1') role = 'EXECUTIVE';
    else if (row.ROLE_TEAMLEADER === '1') role = 'TEAM_LEADER';
    else if (row.ROLE_MANAGEMENT === '1') role = 'DEPT_HEAD';

    const departmentId = deptMap[row.DEPT_CODE] || null;
    const teamId = teamMap[row.TEAM_CODE] || null;

    try {
      const user = await prisma.user.create({
        data: {
          userId: row.USER_ID,
          name: row.NAME,
          password: hashedPassword,
          position: row.RANK || '사원',
          role: role,
          departmentId: departmentId,
          teamId: teamId,
          joinDate: row.JOIN_DATE ? new Date(row.JOIN_DATE) : null,
          annualLeaveOverride: null,
          carryoverLeave: 0
        }
      });
      userMap[row.USER_CODE] = user.id;
      count++;
      console.log(`  ✓ ${row.NAME} (${row.USER_ID}) - Role: ${role}`);
    } catch (err) {
      if (err.code === 'P2002') {
        console.log(`  ⚠ ${row.NAME} (${row.USER_ID}): 이미 존재`);
        const existing = await prisma.user.findUnique({
          where: { userId: row.USER_ID }
        });
        if (existing) {
          userMap[row.USER_CODE] = existing.id;
        }
      } else {
        console.error(`  ✗ ${row.NAME}: ${err.message}`);
      }
    }
  }

  console.log(`✅ 사용자 ${count}명 마이그레이션 완료`);
  console.log(`⚠️ 초기 비밀번호: ${DEFAULT_PASSWORD} (로그인 후 변경 필수)`);
  return userMap;
}

// Phase 4: 프로젝트 마이그레이션
async function migrateProjects(mssqlPool) {
  console.log('\n📋 === Phase 4: 프로젝트 마이그레이션 ===');

  // JIS_PROJECT_SUM_NAME을 우선 사용 (더 많은 데이터)
  const result = await mssqlPool.query`
    SELECT DISTINCT
      PROJECT_NAME,
      GET_SUPPLY
    FROM JIS_PROJECT_SUM_NAME
    WHERE PROJECT_NAME IS NOT NULL
      AND PROJECT_NAME != ''
    UNION
    SELECT DISTINCT
      PROJECT_NAME,
      GET_SUPPLY
    FROM JIS_PROJECT
    WHERE PROJECT_NAME IS NOT NULL
      AND PROJECT_NAME != ''
    ORDER BY PROJECT_NAME
  `;

  const projectMap = {};
  let count = 0;
  let batchSize = 100;
  let batch = [];

  for (const row of result.recordset) {
    const projectName = row.PROJECT_NAME.trim();
    const clientName = row.GET_SUPPLY ? row.GET_SUPPLY.trim() : null;
    const key = `${projectName}|${clientName || ''}`;

    if (projectMap[key]) continue; // 중복 방지

    batch.push({
      projectName: projectName,
      clientName: clientName,
      status: 'ACTIVE'
    });

    if (batch.length >= batchSize) {
      try {
        await prisma.project.createMany({
          data: batch,
          skipDuplicates: true
        });
        count += batch.length;
        console.log(`  ✓ ${count}개 프로젝트 처리됨...`);
        batch = [];
      } catch (err) {
        console.error(`  ✗ 배치 처리 오류: ${err.message}`);
      }
    }

    projectMap[key] = true;
  }

  // 남은 배치 처리
  if (batch.length > 0) {
    await prisma.project.createMany({
      data: batch,
      skipDuplicates: true
    });
    count += batch.length;
  }

  console.log(`✅ 프로젝트 ${count}개 마이그레이션 완료`);

  // 프로젝트 ID 맵 생성 (이후 Job 매핑용)
  const allProjects = await prisma.project.findMany();
  const projectIdMap = {};
  allProjects.forEach(p => {
    const key = `${p.projectName}|${p.clientName || ''}`;
    projectIdMap[key] = p.id;
  });

  return projectIdMap;
}

// Phase 5: 업무 마이그레이션 (대량 데이터 - 선택적)
async function migrateJobs(mssqlPool, userMap, projectIdMap, yearFilter = 2024) {
  console.log(`\n💼 === Phase 5: 업무 마이그레이션 (${yearFilter}년 이후) ===`);
  console.log('⚠️ 대량 데이터 처리 중... 시간이 소요될 수 있습니다.');

  const result = await mssqlPool.query`
    SELECT TOP 10000
      DATE, USER_CODE, CONTENT, TYPE, DATA_ORDER, PROJECT_KEY
    FROM JIS_WORK_LIST
    WHERE YEAR(DATE) >= ${yearFilter}
      AND TYPE IN ('m', 't')
      AND CONTENT IS NOT NULL
      AND CONTENT != ''
    ORDER BY DATE DESC, USER_CODE, DATA_ORDER
  `;

  let count = 0;
  let skipped = 0;
  let batchSize = 500;
  let batch = [];

  for (const row of result.recordset) {
    const userId = userMap[row.USER_CODE];
    if (!userId) {
      skipped++;
      continue;
    }

    const content = row.CONTENT.trim().replace(/^ - /, '').replace(/^-/, '');
    const title = row.TYPE === 'm' ? '금주 실시사항' : '차주 계획';
    const jobDate = new Date(row.DATE);

    batch.push({
      title: title,
      content: content,
      jobDate: jobDate,
      jobType: 'NORMAL',
      userId: userId,
      projectId: null, // PROJECT_KEY 매핑은 복잡하므로 생략 (필요 시 확장)
      isIssue: false,
      order: row.DATA_ORDER || 0
    });

    if (batch.length >= batchSize) {
      try {
        await prisma.job.createMany({
          data: batch,
          skipDuplicates: true
        });
        count += batch.length;
        console.log(`  ✓ ${count}개 업무 처리됨...`);
        batch = [];
      } catch (err) {
        console.error(`  ✗ 배치 처리 오류: ${err.message}`);
      }
    }
  }

  // 남은 배치 처리
  if (batch.length > 0) {
    await prisma.job.createMany({
      data: batch,
      skipDuplicates: true
    });
    count += batch.length;
  }

  console.log(`✅ 업무 ${count}개 마이그레이션 완료 (${skipped}개 스킵)`);
}

// Phase 6: 연차 마이그레이션
async function migrateVacations(mssqlPool, userMap) {
  console.log('\n🏖️ === Phase 6: 연차 마이그레이션 ===');

  const result = await mssqlPool.query`
    SELECT
      v.SIGN_CODE, v.TYPE, v.PERIOD, v.REQ_USER, v.REASON,
      s.SIGN_YN, s.RES_DATE
    FROM JIS_VACATION v
    LEFT JOIN JIS_SIGN s ON v.SIGN_CODE = s.SIGN_CODE
    WHERE v.REQ_USER IS NOT NULL
    ORDER BY v.REG_DATE DESC
  `;

  let count = 0;
  let skipped = 0;

  for (const row of result.recordset) {
    const userId = userMap[row.REQ_USER];
    if (!userId) {
      skipped++;
      continue;
    }

    // TYPE 매핑
    let type = 'FULL';
    if (row.TYPE && row.TYPE.includes('오전')) type = 'HALF_AM';
    else if (row.TYPE && row.TYPE.includes('오후')) type = 'HALF_PM';

    // PERIOD 파싱
    const dates = row.PERIOD ? row.PERIOD.split(',').map(d => d.trim()) : [];
    if (dates.length === 0) {
      skipped++;
      continue;
    }

    const startDate = new Date(dates[0]);
    const endDate = dates.length > 1 ? new Date(dates[dates.length - 1]) : startDate;

    // 승인 상태
    let status = 'PENDING';
    if (row.SIGN_YN === 'Y') status = 'APPROVED';
    else if (row.SIGN_YN === 'N') status = 'REJECTED';

    try {
      await prisma.vacation.create({
        data: {
          type: type,
          startDate: startDate,
          endDate: endDate,
          reason: row.REASON || '사유 없음',
          status: status,
          userId: userId
        }
      });
      count++;
    } catch (err) {
      console.error(`  ✗ ${row.SIGN_CODE}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`✅ 연차 ${count}개 마이그레이션 완료 (${skipped}개 스킵)`);
}

// Phase 7: 주간 중요 사항 마이그레이션
async function migrateWeeklyNotes(mssqlPool, userMap) {
  console.log('\n📝 === Phase 7: 주간 중요 사항 마이그레이션 ===');

  const result = await mssqlPool.query`
    SELECT PERIOD, USER_CODE, CONTENT, DATA_ORDER
    FROM JIS_IMPORTANT
    WHERE USER_CODE IS NOT NULL
      AND CONTENT IS NOT NULL
    ORDER BY PERIOD, USER_CODE, DATA_ORDER
  `;

  // 그룹화: PERIOD + USER_CODE
  const grouped = {};
  for (const row of result.recordset) {
    const key = `${row.PERIOD}|${row.USER_CODE}`;
    if (!grouped[key]) {
      grouped[key] = {
        period: row.PERIOD,
        userCode: row.USER_CODE,
        contents: []
      };
    }
    grouped[key].contents.push(row.CONTENT);
  }

  let count = 0;
  let skipped = 0;

  for (const key in grouped) {
    const { period, userCode, contents } = grouped[key];
    const userId = userMap[userCode];
    if (!userId) {
      skipped++;
      continue;
    }

    // PERIOD 파싱 (첫 날짜의 월요일)
    const dates = period.split(',').map(d => d.trim());
    const monday = getMonday(dates[0]);

    // 내용 결합
    const content = contents.slice(0, 4).join('\n'); // 최대 4줄

    try {
      await prisma.weeklyNote.create({
        data: {
          weekStart: monday,
          content: content,
          userId: userId
        }
      });
      count++;
    } catch (err) {
      if (err.code === 'P2002') {
        console.log(`  ⚠ ${monday.toISOString().split('T')[0]} (User ${userId}): 이미 존재`);
      } else {
        console.error(`  ✗ ${err.message}`);
      }
      skipped++;
    }
  }

  console.log(`✅ 주간 중요 사항 ${count}개 마이그레이션 완료 (${skipped}개 스킵)`);
}

// 메인 마이그레이션 함수
async function main() {
  console.log('🚀 === OWMS 레거시 데이터 마이그레이션 시작 ===\n');
  console.log(`소스: MSSQL (${mssqlConfig.server}:${mssqlConfig.port})`);
  console.log(`타겟: PostgreSQL (Prisma)\n`);

  let mssqlPool;

  try {
    // MSSQL 연결
    console.log('🔌 MSSQL 연결 중...');
    mssqlPool = await sql.connect(mssqlConfig);
    console.log('✅ MSSQL 연결 성공\n');

    // PostgreSQL 연결 확인
    await prisma.$connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // 단계별 마이그레이션 실행
    const deptMap = await migrateDepartments(mssqlPool);
    const teamMap = await migrateTeams(mssqlPool, deptMap);
    const userMap = await migrateUsers(mssqlPool, deptMap, teamMap);
    const projectIdMap = await migrateProjects(mssqlPool);

    // 업무 마이그레이션 (선택적 - 2024년 이후만)
    await migrateJobs(mssqlPool, userMap, projectIdMap, 2024);

    // 연차 마이그레이션
    await migrateVacations(mssqlPool, userMap);

    // 주간 중요 사항 마이그레이션
    await migrateWeeklyNotes(mssqlPool, userMap);

    console.log('\n\n🎉 === 마이그레이션 완료! ===');
    console.log('\n⚠️ 다음 단계:');
    console.log('1. 데이터 검증 (사용자, 부서, 팀 확인)');
    console.log('2. 사용자에게 초기 비밀번호 안내: owms1234');
    console.log('3. 로그인 후 비밀번호 변경 강제');

  } catch (err) {
    console.error('\n❌ 마이그레이션 실패:', err);
    throw err;
  } finally {
    // 연결 종료
    if (mssqlPool) {
      await mssqlPool.close();
      console.log('\n🔌 MSSQL 연결 종료');
    }
    await prisma.$disconnect();
    console.log('🔌 PostgreSQL 연결 종료');
  }
}

// 실행
main()
  .catch(console.error)
  .finally(async () => {
    process.exit();
  });
