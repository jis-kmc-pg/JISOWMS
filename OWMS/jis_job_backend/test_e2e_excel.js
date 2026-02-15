// 실제 API 엔드투엔드 테스트 스크립트
// 1. DB에서 사용자/업무 데이터 조회
// 2. 실제 excel.service.ts와 동일한 로직으로 엑셀 생성
// 3. 생성 결과를 행 단위로 검증

const ExcelJS = require('exceljs');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const TEMPLATE_PATH = 'D:/AI_PJ/OWMS/excel/양식.xlsx';
const OUTPUT_PATH = path.join(__dirname, 'test_e2e_output.xlsx');

// excel.service.ts와 동일한 DayRow 구조
// type DayRow = { type: string; text: string; isDayStart?: boolean; }

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function formatDate(date) {
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}.`;
}

function getDayHeader(dayIdx, date) {
    const days = ['월', '화', '수', '목', '금'];
    return `${days[dayIdx]}(${String(date.getDate()).padStart(2, '0')})`;
}

function groupJobsByDay(jobs) {
    const jobsByDay = {};
    jobs.forEach((job) => {
        const d = new Date(job.jobDate);
        const day = d.getDay();
        const dayIdx = day - 1;
        if (dayIdx >= 0 && dayIdx < 5) {
            if (!jobsByDay[dayIdx]) jobsByDay[dayIdx] = [];
            jobsByDay[dayIdx].push(job);
        }
    });
    return jobsByDay;
}

function formatJobsByDay(jobs, startOfPeriod, statuses) {
    const formatted = {};
    for (let i = 0; i < 5; i++) formatted[i] = [];

    const grouped = groupJobsByDay(jobs);
    const statusMap = {};
    statuses.forEach(s => {
        const d = new Date(s.date);
        const dayIdx = d.getDay() - 1;
        if (dayIdx >= 0 && dayIdx < 5) statusMap[dayIdx] = s;
    });

    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
        const dayRows = [];
        const dayJobs = grouped[dayIdx] || [];
        const status = statusMap[dayIdx];
        const workType = status?.workType || '내근';

        if (workType === '공휴일' || workType === '연차') {
            const title = workType === '공휴일' && status.holidayName
                ? `[공휴일: ${status.holidayName}]`
                : `[${workType}]`;
            dayRows.push({ type: 'holiday', text: title, isDayStart: true });
        } else if (dayJobs.length > 0) {
            dayJobs.forEach((job, idx) => {
                const titleText = job.project?.projectName || job.title || '기타';
                const titleLines = titleText.split('\n').map(l => l.trim()).filter(Boolean);

                titleLines.forEach((line, lineIdx) => {
                    dayRows.push({
                        type: 'title',
                        text: lineIdx === 0 ? `${idx + 1}. ${line}` : `   ${line}`,
                        isDayStart: idx === 0 && lineIdx === 0
                    });
                });

                if (job.content && job.content.trim()) {
                    const contentLines = job.content.split('\n').map(l => l.trim()).filter(Boolean);
                    contentLines.forEach(line => {
                        dayRows.push({ type: 'content', text: `   ${line}` });
                    });
                }
            });

            if (workType && workType !== '연차' && workType !== '공휴일') {
                dayRows.push({ type: 'workType', text: `<${workType}>` });
            }
        } else {
            if (workType && workType !== '연차' && workType !== '공휴일') {
                dayRows.push({ type: 'workType', text: `<${workType}>`, isDayStart: true });
            }
        }

        if (dayIdx < 4 && dayRows.length > 0) {
            dayRows.push({ type: 'spacer', text: '' });
        }

        formatted[dayIdx] = dayRows;
    }
    return formatted;
}

async function main() {
    const prisma = new PrismaClient();

    try {
        // 1. 사용자 조회
        const users = await prisma.user.findMany();
        console.log('=== DB 사용자 목록 ===');
        users.forEach(u => console.log(`  id=${u.id} name=${u.name} userId=${u.userId}`));

        if (users.length === 0) {
            console.log('사용자 없음. 종료.');
            return;
        }

        const user = users.find(u => u.id === 1) || users[0];
        const targetDate = new Date('2026-02-10');
        const startOfWeek = getStartOfWeek(targetDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 4);
        endOfWeek.setHours(23, 59, 59, 999);

        const startOfNextWeek = new Date(startOfWeek);
        startOfNextWeek.setDate(startOfWeek.getDate() + 7);
        const endOfNextWeek = new Date(startOfNextWeek);
        endOfNextWeek.setDate(startOfNextWeek.getDate() + 4);
        endOfNextWeek.setHours(23, 59, 59, 999);

        console.log(`\n금주: ${formatDate(startOfWeek)} ~ ${formatDate(endOfWeek)}`);
        console.log(`차주: ${formatDate(startOfNextWeek)} ~ ${formatDate(endOfNextWeek)}`);

        // 2. 데이터 조회
        const currentJobs = await prisma.job.findMany({
            where: { userId: user.id, jobDate: { gte: startOfWeek, lte: endOfWeek } },
            include: { project: true },
            orderBy: [{ jobDate: 'asc' }, { order: 'asc' }],
        });
        const nextJobs = await prisma.job.findMany({
            where: { userId: user.id, jobDate: { gte: startOfNextWeek, lte: endOfNextWeek } },
            include: { project: true },
            orderBy: [{ jobDate: 'asc' }, { order: 'asc' }],
        });
        const currentStatuses = await prisma.dailyStatus.findMany({
            where: { userId: user.id, date: { gte: startOfWeek, lte: endOfWeek } },
        });
        const nextStatuses = await prisma.dailyStatus.findMany({
            where: { userId: user.id, date: { gte: startOfNextWeek, lte: endOfNextWeek } },
        });

        console.log(`\n금주 업무: ${currentJobs.length}건, 차주 업무: ${nextJobs.length}건`);
        console.log(`금주 상태: ${currentStatuses.length}건, 차주 상태: ${nextStatuses.length}건`);

        // 3. 데이터 포맷
        const currentByDay = formatJobsByDay(currentJobs, startOfWeek, currentStatuses);
        const nextByDay = formatJobsByDay(nextJobs, startOfNextWeek, nextStatuses);

        // 전체 행 수 출력
        let totalCurrentRows = 0;
        let totalNextRows = 0;
        for (let i = 0; i < 5; i++) {
            totalCurrentRows += (currentByDay[i] || []).length;
            totalNextRows += (nextByDay[i] || []).length;
        }
        console.log(`\n포맷 후 금주 행: ${totalCurrentRows}, 차주 행: ${totalNextRows}`);

        // 4. 엑셀 생성 (excel.service.ts와 동일한 로직)
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(TEMPLATE_PATH);
        const worksheet = workbook.worksheets[1];

        // 메타데이터 기입
        const row4 = worksheet.getRow(4);
        row4.getCell(1).value = `보고자 : ${user.dept || '솔루션 사업부'} ${user.name || ''}`;
        row4.getCell(8).value = `작 성 일 : ${formatDate(targetDate)}`;

        const row6 = worksheet.getRow(6);
        row6.getCell(3).value = formatDate(startOfWeek);
        row6.getCell(5).value = formatDate(endOfWeek);
        row6.getCell(8).value = formatDate(startOfNextWeek);
        row6.getCell(10).value = formatDate(endOfNextWeek);

        // 엑셀 작성 규범 적용
        const PAGE_RANGES = [
            { start: 7, end: 39 },   // 1페이지: Row 7~39 (33행)
            { start: 45, end: 84 }   // 2페이지: Row 45~84 (40행)
        ];
        const allAvailableRows = [];
        PAGE_RANGES.forEach(range => {
            for (let r = range.start; r <= range.end; r++) allAvailableRows.push(r);
        });

        // 데이터 영역 초기화
        allAvailableRows.forEach(r => {
            try {
                worksheet.unMergeCells(`A${r}:B${r}`);
                worksheet.unMergeCells(`C${r}:E${r}`);
                worksheet.unMergeCells(`F${r}:G${r}`);
                worksheet.unMergeCells(`H${r}:N${r}`);
            } catch (e) { }
            const row = worksheet.getRow(r);
            for (let c = 1; c <= 14; c++) {
                const cell = row.getCell(c);
                if (cell.address === cell.master.address) cell.value = null;
            }
        });

        // 데이터 기입
        const totalLines = [];
        for (let i = 0; i < 5; i++) {
            const cLines = currentByDay[i] || [];
            const nLines = nextByDay[i] || [];
            const max = Math.max(cLines.length, nLines.length, 1);
            totalLines.push({ current: cLines, next: nLines, count: max });
        }

        let leftPtr = 0;
        let rightPtr = 0;

        for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
            const { current, next } = totalLines[dayIdx];

            current.forEach((rowInfo) => {
                if (leftPtr >= allAvailableRows.length) return;
                const rNum = allAvailableRows[leftPtr];
                const row = worksheet.getRow(rNum);

                if (rowInfo.isDayStart) {
                    row.getCell(1).value = getDayHeader(dayIdx, new Date(startOfWeek.getTime() + dayIdx * 86400000));
                }

                if (rowInfo.type !== 'spacer') {
                    const cell = row.getCell(3);
                    cell.value = rowInfo.text;
                    cell.alignment = { vertical: 'top', wrapText: true, horizontal: 'left' };
                }

                try {
                    worksheet.mergeCells(`A${rNum}:B${rNum}`);
                    worksheet.mergeCells(`C${rNum}:E${rNum}`);
                } catch (e) { }

                leftPtr++;
            });

            next.forEach((rowInfo) => {
                if (rightPtr >= allAvailableRows.length) return;
                const rNum = allAvailableRows[rightPtr];
                const row = worksheet.getRow(rNum);

                if (rowInfo.isDayStart) {
                    row.getCell(6).value = getDayHeader(dayIdx, new Date(startOfNextWeek.getTime() + dayIdx * 86400000));
                }

                if (rowInfo.type !== 'spacer') {
                    const cell = row.getCell(8);
                    cell.value = rowInfo.text;
                    cell.alignment = { vertical: 'top', wrapText: true, horizontal: 'left' };
                }

                try {
                    worksheet.mergeCells(`F${rNum}:G${rNum}`);
                    worksheet.mergeCells(`H${rNum}:N${rNum}`);
                } catch (e) { }

                rightPtr++;
            });
        }

        // 빈 행 병합 유지
        allAvailableRows.forEach((rNum, idx) => {
            try {
                if (idx >= leftPtr) {
                    worksheet.mergeCells(`A${rNum}:B${rNum}`);
                    worksheet.mergeCells(`C${rNum}:E${rNum}`);
                }
                if (idx >= rightPtr) {
                    worksheet.mergeCells(`F${rNum}:G${rNum}`);
                    worksheet.mergeCells(`H${rNum}:N${rNum}`);
                }
            } catch (e) { }
        });

        await workbook.xlsx.writeFile(OUTPUT_PATH);
        console.log(`\n생성 완료: ${OUTPUT_PATH}`);

        // ============= 검증 =============
        console.log('\n========================================');
        console.log('     행 단위 검증 시작');
        console.log('========================================');

        const vWb = new ExcelJS.Workbook();
        await vWb.xlsx.readFile(OUTPUT_PATH);
        const vWs = vWb.worksheets[1];

        // 전체 데이터 영역 출력
        console.log('\n--- 1페이지 데이터 영역 (Row 7-39) ---');
        for (let r = 7; r <= 39; r++) {
            const c1 = vWs.getRow(r).getCell(1).value;
            const c3 = vWs.getRow(r).getCell(3).value;
            const c6 = vWs.getRow(r).getCell(6).value;
            const c8 = vWs.getRow(r).getCell(8).value;
            if (c1 || c3 || c6 || c8) {
                console.log(`Row ${String(r).padStart(2)}: 좌[${c1 || ''}] "${c3 || ''}" | 우[${c6 || ''}] "${c8 || ''}"`);
            }
        }

        console.log('\n--- 보호 구간 (Row 40-44) ---');
        let protectedOk = true;
        for (let r = 40; r <= 44; r++) {
            const vals = [];
            let hasUserData = false;
            for (let c = 1; c <= 14; c++) {
                const v = vWs.getRow(r).getCell(c).value;
                if (v !== null && v !== undefined) {
                    vals.push(`C${c}=${JSON.stringify(v).substring(0, 30)}`);
                    // Row 40은 완전히 비어야 함, Row 41-44는 중요정보사항만 존재
                    if (r === 40 && String(v).trim()) {
                        hasUserData = true;
                    }
                }
            }
            const status = r === 40 ? (hasUserData ? '❌ Row 40에 데이터!' : '✅ 비어있음') :
                (vals.length > 0 ? '✅ 중요정보사항 보존' : '⚠️ 확인필요');
            console.log(`Row ${r}: ${status} ${vals.join(' | ')}`);
            if (r === 40 && hasUserData) protectedOk = false;
        }

        console.log('\n--- 2페이지 데이터 영역 (Row 45-84) ---');
        let hasPage2Data = false;
        for (let r = 45; r <= 84; r++) {
            const c1 = vWs.getRow(r).getCell(1).value;
            const c3 = vWs.getRow(r).getCell(3).value;
            const c6 = vWs.getRow(r).getCell(6).value;
            const c8 = vWs.getRow(r).getCell(8).value;
            if (c1 || c3 || c6 || c8) {
                hasPage2Data = true;
                console.log(`Row ${String(r).padStart(2)}: 좌[${c1 || ''}] "${c3 || ''}" | 우[${c6 || ''}] "${c8 || ''}"`);
            }
        }
        if (!hasPage2Data) console.log('(2페이지에 기입된 데이터 없음 - 1페이지 내에서 모두 처리됨)');

        console.log('\n========================================');
        console.log('     종합 결과');
        console.log('========================================');
        console.log(`Row 40 보호: ${protectedOk ? '✅ 통과' : '❌ 실패'}`);
        console.log(`총 기입 가능 행: ${allAvailableRows.length} (1페이지: 33행 + 2페이지: 40행)`);
        console.log(`Row 40-44 제외: ${allAvailableRows.includes(40) ? '❌' : '✅'}`);
        console.log(`Row 39 → 45 연결: ${allAvailableRows[32] === 39 && allAvailableRows[33] === 45 ? '✅' : '❌'}`);

    } finally {
        await prisma.$disconnect();
    }
}

main().catch(e => { console.error('오류:', e); process.exit(1); });
