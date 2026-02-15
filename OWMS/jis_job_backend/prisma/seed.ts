import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const boards = [
        { name: 'notice', displayName: '공지사항' },
        { name: 'free', displayName: '자유게시판' },
        { name: 'qna', displayName: '질의응답' },
        { name: 'issue', displayName: '이슈게시판' },
    ];

    for (const board of boards) {
        const existing = await prisma.board.findUnique({ where: { name: board.name } });
        if (!existing) {
            await prisma.board.create({ data: board });
            console.log(`Created board: ${board.displayName}`);
        } else {
            console.log(`Board already exists: ${board.displayName}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
