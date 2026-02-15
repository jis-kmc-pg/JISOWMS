const sql = require('mssql');
const { PrismaClient } = require('@prisma/client');

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

async function migrateJoinDateOnly() {
  console.log('🚀 === 입사일 마이그레이션 시작 ===\n');

  let mssqlPool;

  try {
    // MSSQL 연결
    console.log('🔌 레거시 MSSQL 연결 중...');
    mssqlPool = await sql.connect(mssqlConfig);
    console.log('✅ MSSQL 연결 성공\n');

    // PostgreSQL 연결 확인
    await prisma.$connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // 1. 레거시 DB에서 사용자 정보 조회 (USE_YN='사용'만)
    console.log('📥 레거시 DB에서 사용자 정보 조회 중...');
    const legacyResult = await mssqlPool.query`
      SELECT USER_CODE, USER_ID, NAME, JOIN_DATE
      FROM JIS_USER
      WHERE USE_YN = '사용'
      ORDER BY NAME
    `;

    const legacyUsers = legacyResult.recordset;
    console.log(`✅ 레거시 사용자 ${legacyUsers.length}명 조회 완료\n`);

    // 2. 현재 DB에서 모든 사용자 조회
    console.log('📥 현재 OWMS DB에서 사용자 정보 조회 중...');
    const currentUsers = await prisma.user.findMany();
    console.log(`✅ 현재 사용자 ${currentUsers.length}명 조회 완료\n`);

    // 3. 매칭을 위한 Map 생성
    const currentUserByIdMap = new Map();
    const currentUserByNameMap = new Map();

    currentUsers.forEach(user => {
      if (user.userId) {
        currentUserByIdMap.set(user.userId.toLowerCase(), user);
      }
      currentUserByNameMap.set(user.name, user);
    });

    // 4. 입사일 업데이트
    console.log('🔄 === 입사일 업데이트 시작 ===\n');

    let updatedCount = 0;
    let skippedCount = 0;
    let noMatchCount = 0;

    for (const legacyUser of legacyUsers) {
      // 매칭: userId 우선, 없으면 name
      let currentUser = null;
      let matchType = '';

      if (legacyUser.USER_ID) {
        currentUser = currentUserByIdMap.get(legacyUser.USER_ID.toLowerCase());
        matchType = 'userId';
      }

      if (!currentUser) {
        currentUser = currentUserByNameMap.get(legacyUser.NAME);
        matchType = 'name';
      }

      // 매칭 실패
      if (!currentUser) {
        console.log(`  ⚠️ 매칭 실패: ${legacyUser.NAME} (${legacyUser.USER_ID || 'ID없음'})`);
        noMatchCount++;
        continue;
      }

      // 입사일이 없으면 스킵
      if (!legacyUser.JOIN_DATE) {
        console.log(`  ⏭️ 입사일 없음: ${legacyUser.NAME} (현재 DB: ${currentUser.name})`);
        skippedCount++;
        continue;
      }

      // 입사일 업데이트
      try {
        const joinDate = new Date(legacyUser.JOIN_DATE);

        await prisma.user.update({
          where: { id: currentUser.id },
          data: { joinDate: joinDate }
        });

        console.log(`  ✅ 업데이트: ${currentUser.name.padEnd(15)} (매칭: ${matchType}) → ${joinDate.toISOString().split('T')[0]}`);
        updatedCount++;

      } catch (err) {
        console.error(`  ❌ 오류: ${currentUser.name} - ${err.message}`);
        skippedCount++;
      }
    }

    // 5. 결과 요약
    console.log('\n' + '='.repeat(80));
    console.log('📊 === 마이그레이션 결과 ===');
    console.log('='.repeat(80));
    console.log(`✅ 업데이트 성공: ${updatedCount}명`);
    console.log(`⏭️ 건너뜀:      ${skippedCount}명 (입사일 없음 또는 오류)`);
    console.log(`⚠️ 매칭 실패:    ${noMatchCount}명 (현재 DB에 없음)`);
    console.log('─'.repeat(80));
    console.log(`📌 총 처리:      ${legacyUsers.length}명`);
    console.log('='.repeat(80));

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
migrateJoinDateOnly()
  .catch(console.error)
  .finally(async () => {
    process.exit();
  });
