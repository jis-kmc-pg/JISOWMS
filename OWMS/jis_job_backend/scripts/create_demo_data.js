// 데모 데이터 생성 + 엑셀 생성 + 검증 통합 스크립트
// 2월 9~13 (금주), 2월 16~20 (차주) 데이터를 2페이지 넘치도록 생성
const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const path = require('path');

const TEMPLATE = 'D:/AI_PJ/OWMS/excel/양식.xlsx';
const OUTPUT = path.join(__dirname, 'test_demo_output.xlsx');
const prisma = new PrismaClient();

// 데모 업무 목록 (2페이지 넘침 유도: 각 요일 7~8줄 → 총 35~40줄)
const DEMO_JOBS = {
    // 금주 (2월 9~13)
    current: [
        { dayOffset: 0, title: '교육관리 시스템 개편', content: 'DB 스키마 설계 및 마이그레이션\nAPI 엔드포인트 구현\n프론트엔드 화면 레이아웃 작업', order: 1 },
        { dayOffset: 0, title: '인프라 클라우드 전환', content: '클라우드 전환 계획서 작성\n비용 분석 및 보고', order: 2 },
        { dayOffset: 1, title: '교육관리 시스템 개편', content: '사용자 인증 모듈 구현\n권한 관리 기능 추가\n테스트 코드 작성', order: 1 },
        { dayOffset: 1, title: 'OWMS 주간보고 기능', content: '엑셀 출력 로직 개선\n행 매핑 규범 적용', order: 2 },
        { dayOffset: 2, title: '교육관리 시스템 개편', content: '대시보드 차트 구현\n통계 데이터 API 개발\n성능 최적화 작업', order: 1 },
        { dayOffset: 2, title: '보안 취약점 점검', content: 'OWASP 기준 점검\n취약점 보고서 작성', order: 2 },
        { dayOffset: 3, title: '교육관리 시스템 개편', content: '파일 업로드 기능 구현\n이미지 리사이징 처리\n스토리지 연동 테스트', order: 1 },
        { dayOffset: 3, title: '인프라 클라우드 전환', content: '스테이징 환경 구축\n로드밸런서 설정\nSSL 인증서 적용', order: 2 },
        { dayOffset: 4, title: '교육관리 시스템 개편', content: '통합 테스트 수행\n버그 수정 및 패치\n코드 리뷰 반영', order: 1 },
        { dayOffset: 4, title: '주간 업무 정리', content: '진행 현황 정리\n차주 계획 수립', order: 2 },
    ],
    // 차주 (2월 16~20)
    next: [
        { dayOffset: 0, title: '교육관리 시스템 배포', content: '운영 환경 배포 준비\n데이터 마이그레이션 계획\n롤백 시나리오 수립', order: 1 },
        { dayOffset: 0, title: '인프라 모니터링 구축', content: 'Prometheus 설치\nGrafana 대시보드 구성', order: 2 },
        { dayOffset: 1, title: '교육관리 시스템 배포', content: '배포 리허설 수행\n성능 모니터링 설정\n장애 대응 매뉴얼 작성', order: 1 },
        { dayOffset: 1, title: 'CI/CD 파이프라인 개선', content: '빌드 자동화 스크립트 작성\nDocker 이미지 최적화', order: 2 },
        { dayOffset: 2, title: '교육관리 시스템 운영', content: '사용자 피드백 수집\n긴급 패치 배포\n운영 로그 분석', order: 1 },
        { dayOffset: 2, title: '보안 패치 적용', content: 'CVE 패치 적용\n보안 스캔 수행', order: 2 },
        { dayOffset: 3, title: '교육관리 시스템 안정화', content: '성능 튜닝 작업\n캐시 전략 최적화\n쿼리 성능 개선', order: 1 },
        { dayOffset: 3, title: '인프라 비용 최적화', content: '리소스 사용량 분석\n예약 인스턴스 전환 검토\n스토리지 정리', order: 2 },
        { dayOffset: 4, title: '주간 업무 회고', content: '이번 주 성과 정리\n개선 사항 도출\n차주 계획 수립', order: 1 },
        { dayOffset: 4, title: '기술 문서 정리', content: '아키텍처 문서 갱신\nAPI 문서 업데이트', order: 2 },
    ],
};

async function main() {
    try {
        const userIds = [1, 2]; // 1: 관리자, 2: 홍길동
        const startOfWeek = new Date(2026, 1, 9);    // 2026-02-09 월
        const startOfNextWeek = new Date(2026, 1, 16); // 2026-02-16 월

        // 1. 프로젝트 확인/생성
        let project = await prisma.project.findFirst();
        if (!project) {
            project = await prisma.project.create({
                data: { projectName: '기본 프로젝트' },
            });
        }
        console.log(`사용할 프로젝트: ${project.projectName} (ID: ${project.id})`);

        for (const userId of userIds) {
            console.log(`\n--- 사용자 ID: ${userId} 데이터 생성 시작 ---`);

            // 2. 기존 데모 데이터 정리 (해당 날짜 범위)
            const startDate = new Date(2026, 1, 9);
            const endDate = new Date(2026, 1, 20, 23, 59, 59);
            await prisma.job.deleteMany({
                where: { userId, jobDate: { gte: startDate, lte: endDate } },
            });
            await prisma.dailyStatus.deleteMany({
                where: { userId, date: { gte: startDate, lte: endDate } },
            });
            console.log('기존 데모 데이터 정리 완료');

            // 3. 금주 업무 데이터 생성
            for (const job of DEMO_JOBS.current) {
                const jobDate = new Date(startOfWeek);
                jobDate.setDate(jobDate.getDate() + job.dayOffset);
                await prisma.job.create({
                    data: {
                        userId,
                        projectId: project.id,
                        title: job.title,
                        content: job.content,
                        jobDate,
                        order: job.order,
                    },
                });
            }
            console.log(`금주 업무 ${DEMO_JOBS.current.length}건 생성`);

            // 4. 차주 업무 데이터 생성
            for (const job of DEMO_JOBS.next) {
                const jobDate = new Date(startOfNextWeek);
                jobDate.setDate(jobDate.getDate() + job.dayOffset);
                await prisma.job.create({
                    data: {
                        userId,
                        projectId: project.id,
                        title: job.title,
                        content: job.content,
                        jobDate,
                        order: job.order,
                    },
                });
            }
            console.log(`차주 업무 ${DEMO_JOBS.next.length}건 생성`);

            // 5. 근무 상태 (내근) 생성
            for (let i = 0; i < 5; i++) {
                const d1 = new Date(startOfWeek);
                d1.setDate(d1.getDate() + i);
                await prisma.dailyStatus.create({
                    data: { userId, date: d1, workType: '내근' },
                });
                const d2 = new Date(startOfNextWeek);
                d2.setDate(d2.getDate() + i);
                await prisma.dailyStatus.create({
                    data: { userId, date: d2, workType: '내근' },
                });
            }
            console.log('근무 상태 10건 생성');
        }

        console.log('\n모든 사용자에 대한 데모 데이터 생성 완료.');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(e => { console.error('오류:', e); process.exit(1); });
