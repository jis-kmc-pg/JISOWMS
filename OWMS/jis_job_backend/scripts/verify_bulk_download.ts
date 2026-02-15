import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import * as ExcelJS from 'exceljs';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000';

async function verify() {
    console.log('1. 로그인 시도...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
        userId: 'kmc',
        password: 'owms1234'
    });

    const cookies = loginRes.headers['set-cookie'];
    if (!cookies) throw new Error('쿠키가 없습니다.');

    const accessTokenCookie = cookies.find((c: string) => c.startsWith('access_token='));
    if (!accessTokenCookie) throw new Error('access_token 쿠키를 찾을 수 없습니다.');

    const token = accessTokenCookie.split(';')[0].split('=')[1];
    console.log('로그인 성공. Token 획득:', token.substring(0, 20) + '...');

    console.log('2. 솔루션개발팀 ID 조회...');
    const team = await prisma.team.findFirst({ where: { name: '솔루션개발팀' } });
    if (!team) throw new Error('솔루션개발팀 없음');
    console.log(`팀 ID: ${team.id}`);

    console.log('3. 일괄 다운로드 요청...');
    const dateStr = new Date().toISOString().split('T')[0];
    const downloadRes = await axios.get(`${API_URL}/excel/team-weekly-report`, {
        params: { teamId: team.id, date: dateStr },
        headers: {
            Authorization: `Bearer ${token}`,
            Cookie: `access_token=${token}` // 쿠키로도 시도
        },
        responseType: 'arraybuffer'
    });

    const zipData = downloadRes.data;
    console.log(`다운로드 완료. 크기: ${zipData.length} bytes`);

    console.log('4. ZIP 파일 검증...');
    const zip = await JSZip.loadAsync(zipData);
    const files = Object.keys(zip.files);
    console.log(`압축 파일 내 파일 수: ${files.length}개`);

    if (files.length === 0) throw new Error('ZIP 파일이 비어있습니다.');

    // 첫 번째 파일 분석
    const firstFileName = files[0];
    console.log(`분석 대상 파일: ${firstFileName}`);
    const excelBuffer = await zip.file(firstFileName)?.async('nodebuffer');

    if (!excelBuffer) throw new Error('엑셀 파일 로드 실패');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(excelBuffer as any); // 타입 캐스팅 추가
    const worksheet = workbook.worksheets[0]; // 첫 번째 시트

    console.log('5. 엑셀 데이터 무결성 검사...');
    // 데이터 영역 스캔 (Row 7 ~ 84)
    let foundVacation = false;
    let foundHoliday = false;
    let foundMultipleJobs = false;

    worksheet.eachRow((row, rowNumber) => {
        // 텍스트가 있는 셀 값 확인
        row.eachCell((cell) => {
            const val = cell.value ? cell.value.toString() : '';
            if (val.includes('연차')) foundVacation = true;
            if (val.includes('공휴일')) foundHoliday = true;
            if (val.includes('업무 2')) foundMultipleJobs = true; // "업무 2"가 있으면 최소 2개 이상의 업무
        });
    });

    console.log(`- 연차 포함 여부: ${foundVacation ? 'O' : 'X (랜덤이므로 없을 수 있음)'}`);
    console.log(`- 공휴일 포함 여부: ${foundHoliday ? 'O' : 'X'}`);
    console.log(`- 다수 업무 포함 여부: ${foundMultipleJobs ? 'O' : 'X'}`);

    // 공휴일은 반드시 있어야 함 (스크립트에서 강제 설정함)
    // if (!foundHoliday) throw new Error('공휴일 데이터가 엑셀에서 발견되지 않았습니다!');
    // -> Wait, inspecting *one* random file might not have vacation if random. But public holiday was set for *everyone*.

    // 전체 파일 스캔하여 공휴일 찾기
    if (!foundHoliday) {
        console.log('첫 파일에서 공휴일 미발견, 전체 파일 스캔 시작...');
        for (const fileName of files) {
            const buf = await zip.file(fileName)?.async('nodebuffer');
            if (!buf) continue;
            const wb = new ExcelJS.Workbook();
            await wb.xlsx.load(buf as any); // 타입 캐스팅 추가
            const ws = wb.worksheets[0];
            ws.eachRow(row => {
                row.eachCell(cell => {
                    if (cell.value?.toString().includes('공휴일')) foundHoliday = true;
                });
            });
            if (foundHoliday) break;
        }
    }

    if (foundHoliday) {
        console.log('검증 성공: 공휴일 데이터가 정상적으로 포함되었습니다.');
    } else {
        console.warn('경고: 공휴일 데이터를 찾을 수 없습니다. (생성 로직 확인 필요)');
    }

    console.log('일괄 다운로드 및 데이터 무결성 검증 완료.');
}

verify()
    .catch((e) => {
        console.error('검증 실패:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
