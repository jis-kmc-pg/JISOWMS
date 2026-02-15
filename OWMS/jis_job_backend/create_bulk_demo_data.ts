import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Script started.');
    // 1. 솔루션개발팀 (10명) 조회
    const teamName = '솔루션개발팀';
    const team = await prisma.team.findFirst({
        where: { name: teamName },
        include: { users: true }
    });

    if (!team) {
        console.log(`${teamName}을 찾을 수 없습니다.`);
        return;
    }

    console.log(`팀: ${team.name}, 팀원 수: ${team.users.length}`);

    // 2. 기준 날짜 설정 (현재 주간)
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // 이번주 월요일
    const monday = new Date(today); // Clone today
    monday.setDate(diff); // Set to monday
    monday.setHours(0, 0, 0, 0);

    console.log(`기준 월요일: ${monday.toISOString()}`);

    // 날짜 배열 생성
    const currentWeek: Date[] = [];
    for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        currentWeek.push(d);
    }

    const nextWeek: Date[] = [];
    for (let i = 7; i < 12; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        nextWeek.push(d);
    }

    const allDates = [...currentWeek, ...nextWeek];
    console.log(`생성할 날짜 수: ${allDates.length}일 (금주/차주 평일)`);

    // 삭제 범위 계산 (이번주 월요일 ~ 다음주 일요일)
    if (allDates.length === 0) {
        console.error('날짜 생성 실패');
        return;
    }

    const startDate = currentWeek[0];
    const deleteStart = new Date(startDate);
    deleteStart.setHours(0, 0, 0, 0);

    const endDate = nextWeek[nextWeek.length - 1];
    const deleteEnd = new Date(endDate);
    deleteEnd.setDate(deleteEnd.getDate() + 2); // 차주 일요일까지
    deleteEnd.setHours(23, 59, 59, 999);

    console.log(`삭제 범위: ${deleteStart.toISOString()} ~ ${deleteEnd.toISOString()}`);

    // 전사 공휴일 설정 (차주 수요일 가정)
    const publicHolidayDate = nextWeek[2];

    // 3. 데이터 생성
    for (const user of team.users) {
        console.log(`사용자 데이터 처리 중: ${user.name} (${user.id})`);

        // 3-0. 기존 데이터 삭제
        try {
            await prisma.dailyStatus.deleteMany({
                where: {
                    userId: user.id,
                    date: {
                        gte: deleteStart,
                        lte: deleteEnd
                    }
                }
            });
            await prisma.job.deleteMany({
                where: {
                    userId: user.id,
                    jobDate: {
                        gte: deleteStart,
                        lte: deleteEnd
                    }
                }
            });
        } catch (e) {
            console.error(`삭제 실패: ${e}`);
        }

        for (const date of allDates) {
            // 3-1. 날짜별 상태 결정
            let workType = '내근';
            let holidayName = null;

            const isPublicHoliday = date.getTime() === publicHolidayDate.getTime();

            if (isPublicHoliday) {
                workType = '공휴일';
                holidayName = '임시 공휴일';
            } else {
                // 10% 확률로 연차
                const rand = Math.random();
                if (rand < 0.1) {
                    workType = '연차';
                } else if (rand < 0.2) {
                    workType = '외근';
                }
            }

            try {
                // DailyStatus 생성
                await prisma.dailyStatus.create({
                    data: {
                        date: date,
                        userId: user.id,
                        workType,
                        holidayName
                    }
                });

                // 3-2. 업무 생성
                if (workType === '내근' || workType === '외근') {
                    const jobCount = Math.floor(Math.random() * 3) + 2; // 2~4개 업무

                    for (let j = 0; j < jobCount; j++) {
                        await prisma.job.create({
                            data: {
                                userId: user.id,
                                jobDate: date,
                                title: `${workType} 업무 ${j + 1}`,
                                content: `업무 내용 ${j + 1}\n진행 상황 공유\n특이사항 없음`, // 20자 미만 준수
                                jobType: 'NORMAL',
                                order: j + 1
                            }
                        });
                    }
                }
            } catch (e) {
                console.error(`데이터 생성 실패 (${date.toISOString()}): ${e}`);
            }
        }
    }

    console.log('솔루션개발팀 데모 데이터 생성이 완료되었습니다.');
}

main()
    .catch((e) => {
        console.error('메인 실행 오류:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
