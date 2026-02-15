import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DateUtil } from '../common/utils/date.util';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import JSZip from 'jszip';

// 행 정보 구조체
interface DayRow {
  type: 'title' | 'content' | 'workType' | 'spacer' | 'holiday'; // 행 유형
  text: string; // 실제 텍스트
  isDayStart?: boolean; // 요일 라벨 표시 필요 여부
}

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);
  // 깨끗한 원본 양식 사용 (데이터 없는 빈 템플릿 → 매번 텍스트만 추가)
  private readonly templatePath = process.env.EXCEL_TEMPLATE_PATH || 'D:/AI_PJ/OWMS/excel/양식.xlsx';

  constructor(private prisma: PrismaService) { }

  async generateWeeklyReport(userId: number, dateStr: string): Promise<Buffer> {
    this.logger.log(
      `generateWeeklyReport start. User: ${userId}, Date: ${dateStr}`,
    );
    // 1. 날짜 및 데이터 조회 (기존 로직 유지)
    const targetDate = new Date(dateStr);
    const startOfWeek = DateUtil.getMonday(targetDate);
    const endOfWeek = DateUtil.setEndOfDay(new Date(startOfWeek.getTime() + 4 * 86400000)); // 월-금

    const startOfNextWeek = DateUtil.setStartOfDay(new Date(startOfWeek.getTime() + 7 * 86400000));
    const endOfNextWeek = DateUtil.setEndOfDay(new Date(startOfNextWeek.getTime() + 4 * 86400000)); // 월-금

    this.logger.debug('Querying data...');
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true, team: true },
    });
    const currentJobs = await this.prisma.job.findMany({
      where: { userId, jobDate: { gte: startOfWeek, lte: endOfWeek } },
      include: { project: true },
      orderBy: [{ jobDate: 'asc' }, { order: 'asc' }],
    });
    const nextJobs = await this.prisma.job.findMany({
      where: { userId, jobDate: { gte: startOfNextWeek, lte: endOfNextWeek } },
      include: { project: true },
      orderBy: [{ jobDate: 'asc' }, { order: 'asc' }],
    });

    const currentStatuses = await this.prisma.dailyStatus.findMany({
      where: { userId, date: { gte: startOfWeek, lte: endOfWeek } },
    });
    const nextStatuses = await this.prisma.dailyStatus.findMany({
      where: { userId, date: { gte: startOfNextWeek, lte: endOfNextWeek } },
    });

    // 주간 중요정보 사항 (WeeklyNote) 조회
    // 시간대 및 저장 기준(일/월) 오차를 극복하기 위해 범위를 넓혀 조회하고 가장 최근 것을 채택
    const searchStart = new Date(startOfWeek);
    searchStart.setDate(searchStart.getDate() - 2); // 토요일부터
    const searchEnd = new Date(startOfWeek);
    searchEnd.setDate(searchEnd.getDate() + 1); // 화요일까지

    const weeklyNote = await this.prisma.weeklyNote.findFirst({
      where: {
        userId: userId,
        weekStart: {
          gte: searchStart,
          lte: searchEnd,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    this.logger.debug(`Reading template from: ${this.templatePath}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.templatePath);
    const worksheet = workbook.worksheets[1]; // '양식 (2)'

    // 보고자/작성일 및 주간 날짜 범위 기입 (Row 4, 6)
    this.updateMetadata(
      worksheet,
      user,
      targetDate,
      startOfWeek,
      endOfWeek,
      startOfNextWeek,
      endOfNextWeek,
    );

    // 주간 중요정보 사항 처리 (Row 40-44)
    this.updateWeeklyNote(worksheet, weeklyNote);

    // 2. 데이터 가공 (요청된 텍스트 포맷 적용 및 일일 상태 반영)
    const currentByDay = this.formatJobsByDay(
      currentJobs,
      startOfWeek,
      currentStatuses,
    );
    const nextByDay = this.formatJobsByDay(
      nextJobs,
      startOfNextWeek,
      nextStatuses,
    );

    // 3. 페이지 확장 및 기입 로직
    // ── 엑셀 작성 규범 ──
    // 1페이지 데이터 영역: Row 7 ~ 39 (33행)
    // 비 데이터 영역:      Row 40 ~ 44 (중요정보사항, 절대 수정 금지)
    // 2페이지 데이터 영역: Row 45 ~ 84 (40행)
    const PAGE1_START_ROW = 7;
    const PAGE1_END_ROW = 39; // Row 39까지만 데이터 영역 (Row 40-44는 중요정보사항)
    const TEMPLATE_START = 45;
    const TEMPLATE_END = 84;
    const TEMPLATE_SIZE = TEMPLATE_END - TEMPLATE_START + 1;

    // 데이터 총 라인 수 계산
    const totalLines = [];
    let maxNeededRows = 0;
    let totalCurrentRows = 0;
    let totalNextRows = 0;

    for (let i = 0; i < 5; i++) {
      const cLines = currentByDay[i] || [];
      const nLines = nextByDay[i] || [];
      totalCurrentRows += cLines.length;
      totalNextRows += nLines.length;
      const max = Math.max(cLines.length, nLines.length, 1);
      totalLines.push({ current: cLines, next: nLines, count: max });
    }
    maxNeededRows = Math.max(totalCurrentRows, totalNextRows);

    // 기입 가능한 행 번호 리스트 생성 (Row 40-44 제외)
    const PAGE_RANGES = [
      { start: 7, end: 39 }, // 1페이지: Row 7~39 (33행)
      { start: 45, end: 84 }, // 2페이지: Row 45~84 (40행)
    ];

    // 필요한 행 수가 기본 용량(73행)을 초과하는 경우 동적 확장
    const DEFAULT_CAPACITY = 33 + 40;
    if (maxNeededRows > DEFAULT_CAPACITY) {
      const extraRowsNeeded = maxNeededRows - DEFAULT_CAPACITY;
      const extraPages = Math.ceil(extraRowsNeeded / TEMPLATE_SIZE);

      for (let p = 0; p < extraPages; p++) {
        const rangeStart = 85 + p * TEMPLATE_SIZE;
        const rangeEnd = rangeStart + TEMPLATE_SIZE - 1;

        // 2페이지(45-84)의 서식을 새 위치로 복사
        this.copyTemplateRows(
          worksheet,
          TEMPLATE_START,
          TEMPLATE_END,
          rangeStart,
        );

        // 사용 가능 범위에 추가
        PAGE_RANGES.push({ start: rangeStart, end: rangeEnd });
      }
    }

    const allAvailableRows: number[] = [];
    PAGE_RANGES.forEach((range) => {
      for (let r = range.start; r <= range.end; r++) {
        allAvailableRows.push(r);
      }
    });

    // 데이터 영역 초기화 및 기존 병합 해제 (데이터 영역 Col 1-14 한정)
    allAvailableRows.forEach((r) => {
      const row = worksheet.getRow(r);
      // 수평 병합 해제 (기존 데이터 영역만)
      try {
        worksheet.unMergeCells(`A${r}:B${r}`);
        worksheet.unMergeCells(`C${r}:E${r}`);
        worksheet.unMergeCells(`F${r}:G${r}`);
        worksheet.unMergeCells(`H${r}:N${r}`);
      } catch (e) {
        /* ignore */
      }

      // 데이터 컬럼(1~14)만 값 초기화
      for (let c = 1; c <= 14; c++) {
        const cell = row.getCell(c);
        if (cell.address === cell.master.address) {
          cell.value = null;
        }
      }
    });

    // 데이터 기입 (좌/우 독립 포인터, DayRow 구조 활용)
    let leftPtr = 0;
    let rightPtr = 0;

    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
      const { current, next } = totalLines[dayIdx];

      // 금주 (Left) - DayRow 배열 처리
      current.forEach((rowInfo) => {
        if (leftPtr >= allAvailableRows.length) return;
        const rNum = allAvailableRows[leftPtr];
        const row = worksheet.getRow(rNum);

        // 요일 라벨 기입 (isDayStart일 때만, 맞춤 서식 없이 값만)
        if (rowInfo.isDayStart) {
          const dayCell = row.getCell(1);
          dayCell.value = this.getDayHeader(
            dayIdx,
            new Date(startOfWeek.getTime() + dayIdx * 86400000),
          );
          dayCell.alignment = { vertical: 'middle' };
        }

        // spacer는 빈 행으로 유지 (값만 null, 병합은 유지)
        if (rowInfo.type !== 'spacer') {
          // 텍스트만 기입 (서식은 템플릿 원본 유지)
          row.getCell(3).value = rowInfo.text;
        }

        // 병합 적용
        try {
          worksheet.mergeCells(`A${rNum}:B${rNum}`);
          worksheet.mergeCells(`C${rNum}:E${rNum}`);
        } catch (e) {
          /* ignore */
        }

        leftPtr++;
      });

      // 차주 (Right) - DayRow 배열 처리
      next.forEach((rowInfo) => {
        if (rightPtr >= allAvailableRows.length) return;
        const rNum = allAvailableRows[rightPtr];
        const row = worksheet.getRow(rNum);

        // 요일 라벨 기입 (isDayStart일 때만, 맞춤 서식 없이 값만)
        if (rowInfo.isDayStart) {
          const dayCell = row.getCell(6);
          dayCell.value = this.getDayHeader(
            dayIdx,
            new Date(startOfNextWeek.getTime() + dayIdx * 86400000),
          );
          dayCell.alignment = { vertical: 'middle' };
        }

        // spacer는 빈 행으로 유지
        if (rowInfo.type !== 'spacer') {
          // 텍스트만 기입 (서식은 템플릿 원본 유지)
          row.getCell(8).value = rowInfo.text;
        }

        // 병합 적용
        try {
          worksheet.mergeCells(`F${rNum}:G${rNum}`);
          worksheet.mergeCells(`H${rNum}:N${rNum}`);
        } catch (e) {
          /* ignore */
        }

        rightPtr++;
      });
    }

    // 데이터가 없는 행들도 병합 구조는 유지 (템플릿 디자인 보존)
    const maxPtr = Math.max(leftPtr, rightPtr);
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
      } catch (e) {
        /* ignore */
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  private updateMetadata(
    worksheet: ExcelJS.Worksheet,
    user: any,
    targetDate: Date,
    start: Date,
    end: Date,
    nStart: Date,
    nEnd: Date,
  ) {
    // 보고자 및 작성일
    const row4 = worksheet.getRow(4);
    row4.getCell(1).value =
      `보고자 : ${user?.department?.name || '솔루션 사업부'} ${user?.name || ''}`;
    row4.getCell(8).value = `작 성 일 : ${this.formatDate(targetDate)}`;

    // 주간 날짜 범위 (Row 6)
    // 템플릿 수식이 있더라도 서식 일치와 정확성을 위해 모든 날짜 셀에 값을 명시적으로 기입
    const row6 = worksheet.getRow(6);
    const dateCells = [3, 5, 8, 10]; // C6, E6, H6, J6
    const dateFormat = 'yyyy"년" mm"월" dd"일"';

    row6.getCell(3).value = this.dateToExcelSerial(start);
    row6.getCell(5).value = this.dateToExcelSerial(end);
    row6.getCell(8).value = this.dateToExcelSerial(nStart);
    row6.getCell(10).value = this.dateToExcelSerial(nEnd);

    dateCells.forEach((col) => {
      row6.getCell(col).numFmt = dateFormat;
    });
  }

  /**
   * 주간 중요정보 사항 처리 (Row 40-44)
   * 데이터가 있으면 줄바꿈 기준으로 행 분리 기입, 없으면 해당 구간 초기화
   */
  private updateWeeklyNote(worksheet: ExcelJS.Worksheet, weeklyNote: any) {
    const startRow = 41;
    const endRow = 44;

    if (weeklyNote && weeklyNote.content && weeklyNote.content.trim()) {
      // 데이터가 있는 경우: 줄바꿈 기준으로 분리하여 기입
      const lines = weeklyNote.content
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l !== '');

      lines.forEach((line: string, idx: number) => {
        const rNum = startRow + idx;
        if (rNum <= endRow) {
          // Row 41 ~ 44 범위 내에서 기입
          const targetCell = worksheet.getRow(rNum).getCell(4); // D41, D42...
          const masterCell = targetCell.master; // 템플릿의 가로 병합(D:N) 마스터 셀

          masterCell.value = line;
          masterCell.alignment = {
            vertical: 'middle',
            horizontal: 'left',
            indent: 1,
          };
        }
      });
    } else {
      // 데이터가 없는 경우: Row 40-44 전체 초기화 (레이블 포함)
      for (let r = 40; r <= endRow; r++) {
        const row = worksheet.getRow(r);
        // Col 1~14 초기화
        for (let c = 1; c <= 14; c++) {
          const cell = row.getCell(c);
          if (cell.address === cell.master.address) {
            cell.value = null;
          }
        }
      }
    }
  }

  // JS Date → Excel 시리얼 넘버 변환 (UTC 기반, 타임존 오차 방지)
  private dateToExcelSerial(date: Date): number {
    // UTC로 변환하여 타임존(KST +0827/+0900 차이) 영향 제거
    const utcDate = Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const utcEpoch = Date.UTC(1900, 0, 1);
    const diff = utcDate - utcEpoch;
    // +2 보정: Excel 시리얼 1 = 1900-01-01 (기준값 +1) + 1900-02-29 유령 날짜 (+1)
    return Math.floor(diff / (24 * 60 * 60 * 1000)) + 2;
  }

  // 데이터 포맷팅 규칙 적용 (새 규칙: 줄바꿈 단위 행 생성, 일 간 spacer)
  private formatJobsByDay(
    jobs: any[],
    startOfPeriod: Date,
    statuses: any[],
  ): Record<number, DayRow[]> {
    const formatted: Record<number, DayRow[]> = {};
    for (let i = 0; i < 5; i++) formatted[i] = [];

    const grouped = this.groupJobsByDay(jobs);
    const statusMap: Record<number, any> = {};
    statuses.forEach((s) => {
      const d = new Date(s.date);
      const dayIdx = d.getDay() - 1;
      if (dayIdx >= 0 && dayIdx < 5) statusMap[dayIdx] = s;
    });

    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
      const dayRows: DayRow[] = [];
      const dayJobs = grouped[dayIdx] || [];
      const status = statusMap[dayIdx];
      const workType = status?.workType || '내근';

      // 1. 공휴일/연차/공가 처리
      if (workType === '공휴일' || workType === '연차' || workType === '공가') {
        const title =
          workType === '공휴일' && status.holidayName
            ? `[공휴일: ${status.holidayName}]`
            : `[${workType}]`;
        dayRows.push({ type: 'holiday', text: title, isDayStart: true });
      } else if (dayJobs.length > 0) {
        // 2. 일반 업무 처리 (제목과 내용을 줄바꿈 단위로 개별 행 생성)
        dayJobs.forEach((job, idx) => {
          // 2-1. 업무 제목 (줄바꿈 처리)
          const titleText = job.project?.projectName || job.title || '기타';
          const titleLines = titleText
            .split('\n')
            .map((l: string) => l.trim())
            .filter(Boolean);

          titleLines.forEach((line: string, lineIdx: number) => {
            dayRows.push({
              type: 'title',
              text: lineIdx === 0 ? `${idx + 1}. ${line}` : `   ${line}`,
              isDayStart: idx === 0 && lineIdx === 0,
            });
          });

          // 2-2. 업무 내용 (줄바꿈 처리)
          if (job.content && job.content.trim()) {
            const contentLines = job.content
              .split('\n')
              .map((l: string) => l.trim())
              .filter(Boolean);
            contentLines.forEach((line: string) => {
              dayRows.push({ type: 'content', text: `   ${line}` });
            });
          }
        });

        // 3. 근무형태 표시 (모든 업무 후 마지막에 추가)
        if (workType && !['연차', '공휴일', '공가'].includes(workType)) {
          dayRows.push({ type: 'workType', text: `<${workType}>` });
        }
      } else {
        // 데이터 없는 경우에도 근무형태 표시
        if (workType && !['연차', '공휴일', '공가'].includes(workType)) {
          dayRows.push({
            type: 'workType',
            text: `<${workType}>`,
            isDayStart: true,
          });
        }
      }

      // 4. 일 간 구분을 위한 spacer 추가 (마지막 요일 제외)
      if (dayIdx < 4 && dayRows.length > 0) {
        dayRows.push({ type: 'spacer', text: '' });
      }

      formatted[dayIdx] = dayRows;
    }
    return formatted;
  }

  private getDayHeader(dayIdx: number, date: Date) {
    const days = ['월', '화', '수', '목', '금'];
    return `${days[dayIdx]}(${String(date.getDate()).padStart(2, '0')})`;
  }

  /**
   * 템플릿 행들을 지정된 위치로 복사 (서식 및 병합 정보 포함)
   */
  private copyTemplateRows(
    worksheet: ExcelJS.Worksheet,
    start: number,
    end: number,
    target: number,
  ) {
    for (let i = start; i <= end; i++) {
      const sourceRow = worksheet.getRow(i);
      const targetRowNum = target + (i - start);
      const newRow = worksheet.getRow(targetRowNum);

      newRow.height = sourceRow.height;

      // 개별 셀의 값과 서식 복사
      sourceRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const newCell = newRow.getCell(colNumber);
        newCell.style = cell.style;
        newCell.value = cell.value;
      });

      // 병합 정보 복제 (데이터 영역 표준 병합 구조 적용)
      // A:B, C:E, F:G, H:N
      try {
        worksheet.mergeCells(`A${targetRowNum}:B${targetRowNum}`);
        worksheet.mergeCells(`C${targetRowNum}:E${targetRowNum}`);
        worksheet.mergeCells(`F${targetRowNum}:G${targetRowNum}`);
        worksheet.mergeCells(`H${targetRowNum}:N${targetRowNum}`);
      } catch (e) {
        // 이미 병합된 경우 무시
      }
    }
  }

  private getStartOfWeek(date: Date) {
    return DateUtil.getMonday(date);
  }

  private formatDate(date: Date) {
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}.`;
  }

  private groupJobsByDay(jobs: any[]) {
    const jobsByDay: Record<number, any[]> = {};
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

  /**
   * 팀원 전체의 주간 보고서를 생성하여 ZIP 파일 Buffer로 반환
   */
  async generateTeamWeeklyReport(
    teamId: number,
    dateStr: string,
  ): Promise<Buffer> {
    const users = await this.prisma.user.findMany({
      where: { teamId },
      include: { team: true },
    });

    if (users.length === 0) {
      throw new Error('해당 팀에 팀원이 존재하지 않습니다.');
    }

    const zip = new JSZip();

    // 병렬로 개별 엑셀 파일 생성
    const reportPromises = users.map(async (user) => {
      const buffer = await this.generateWeeklyReport(user.id, dateStr);
      const filename = `${user.name}_주간보고서_${dateStr}.xlsx`;
      zip.file(filename, buffer);
    });

    await Promise.all(reportPromises);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    return zipBuffer as unknown as Buffer;
  }
}
