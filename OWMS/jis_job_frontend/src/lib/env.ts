/**
 * 환경 변수 중앙 관리
 * 모든 환경 변수를 여기서 export하여 타입 안정성 확보
 */

export const env = {
  /**
   * Backend API URL
   */
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
} as const;

/**
 * 환경 변수 유효성 검사
 */
export function validateEnv() {
  if (!env.API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not defined');
  }
}
