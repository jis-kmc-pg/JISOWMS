const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentUsers() {
  try {
    console.log('📊 === 현재 OWMS DB 사용자 현황 ===\n');

    const users = await prisma.user.findMany({
      include: {
        department: true,
        team: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`총 사용자 수: ${users.length}명\n`);

    if (users.length > 0) {
      console.log('현재 사용자 목록:');
      console.log('─'.repeat(100));
      console.log('ID'.padEnd(5), 'USER_ID'.padEnd(15), 'NAME'.padEnd(15), 'DEPT'.padEnd(20), 'TEAM'.padEnd(20), 'ROLE'.padEnd(15));
      console.log('─'.repeat(100));

      users.forEach(user => {
        console.log(
          String(user.id).padEnd(5),
          (user.userId || 'N/A').padEnd(15),
          (user.name || 'N/A').padEnd(15),
          (user.department?.name || 'N/A').padEnd(20),
          (user.team?.name || 'N/A').padEnd(20),
          (user.role || 'N/A').padEnd(15)
        );
      });
    } else {
      console.log('⚠️ 현재 DB에 사용자가 없습니다.');
    }

  } catch (err) {
    console.error('❌ 오류:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentUsers();
