const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyJoinDate() {
  try {
    console.log('🔍 === 입사일 검증 ===\n');

    const users = await prisma.user.findMany({
      where: {
        joinDate: {
          not: null
        }
      },
      orderBy: {
        joinDate: 'asc'
      },
      take: 10
    });

    console.log('입사일이 있는 사용자 (입사일 오름차순, 상위 10명):');
    console.log('─'.repeat(80));
    console.log('NAME'.padEnd(20), 'USER_ID'.padEnd(15), 'JOIN_DATE');
    console.log('─'.repeat(80));

    users.forEach(user => {
      const joinDateStr = user.joinDate ? user.joinDate.toISOString().split('T')[0] : 'N/A';
      console.log(
        (user.name || 'N/A').padEnd(20),
        (user.userId || 'N/A').padEnd(15),
        joinDateStr
      );
    });

    // 통계
    const totalUsers = await prisma.user.count();
    const usersWithJoinDate = await prisma.user.count({
      where: {
        joinDate: {
          not: null
        }
      }
    });

    console.log('\n📊 통계:');
    console.log(`  전체 사용자: ${totalUsers}명`);
    console.log(`  입사일 있음: ${usersWithJoinDate}명`);
    console.log(`  입사일 없음: ${totalUsers - usersWithJoinDate}명`);

  } catch (err) {
    console.error('❌ 오류:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyJoinDate();
