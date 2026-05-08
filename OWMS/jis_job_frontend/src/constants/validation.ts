/**
 * 전역 유효성 검사 상수
 *
 * 너비 단위(width)는 디스플레이 너비 기준:
 *   - 한글/한자/가나 등 동아시아 문자 = 2
 *   - 영문/숫자/공백/특수기호 = 1
 *
 * 이 파일의 값을 수정하면 시스템 전체에 적용됩니다.
 */

// ============================================================
// 한글/영문 너비 가중치 헬퍼
// ============================================================

/**
 * 텍스트의 디스플레이 너비를 계산합니다.
 * 한글/한자/가나 = 2, 그 외(영문/숫자/공백/기호) = 1.
 * 엑셀 등 고정폭 표시 환경에서 한 줄이 넘치지 않는지 판정용.
 */
export function getDisplayWidth(text: string): number {
    if (!text) return 0;
    let width = 0;
    for (const ch of text) {
        // CJK Symbols, 한자, 히라가나, 카타카나, 한글, 전각 형태
        if (/[　-鿿가-힯＀-￯]/.test(ch)) {
            width += 2;
        } else {
            width += 1;
        }
    }
    return width;
}

// ============================================================
// 일일업무 보고 관련 제한 (너비 단위)
// ============================================================

/**
 * 업무 제목/내용 1줄당 최대 너비
 * 한글 24자 ≈ 영문 48자 수준
 */
export const MAX_LINE_WIDTH = 48;

/**
 * 주간 정보 최대 줄 수
 */
export const MAX_WEEKLY_NOTE_LINES = 4;

/**
 * 주간 정보 1줄당 최대 너비
 */
export const MAX_WEEKLY_NOTE_LINE_WIDTH = 48;

// ============================================================
// 업무 목록 관리 관련 제한 (너비 단위)
// ============================================================

/**
 * 거래처명 최대 너비
 * 한글 10자 ≈ 영문 20자
 */
export const MAX_CLIENT_NAME_WIDTH = 20;

/**
 * 업무명 + 거래처명 결합 시 최대 너비
 * "거래처 : 업무명" 형식 (구분자 ' : ' = width 3)
 */
export const MAX_COMBINED_JOB_TITLE_WIDTH = MAX_LINE_WIDTH;

// ============================================================
// 하위호환 (기존 코드용 deprecated alias)
// ============================================================

/** @deprecated MAX_LINE_WIDTH 사용 */
export const MAX_CHARS_PER_LINE = MAX_LINE_WIDTH;
/** @deprecated MAX_WEEKLY_NOTE_LINE_WIDTH 사용 */
export const MAX_WEEKLY_NOTE_CHARS_PER_LINE = MAX_WEEKLY_NOTE_LINE_WIDTH;
/** @deprecated MAX_LINE_WIDTH 사용 */
export const MAX_PROJECT_NAME_LENGTH = MAX_LINE_WIDTH;
/** @deprecated MAX_CLIENT_NAME_WIDTH 사용 */
export const MAX_CLIENT_NAME_LENGTH = MAX_CLIENT_NAME_WIDTH;
/** @deprecated MAX_COMBINED_JOB_TITLE_WIDTH 사용 */
export const MAX_COMBINED_JOB_TITLE_LENGTH = MAX_COMBINED_JOB_TITLE_WIDTH;