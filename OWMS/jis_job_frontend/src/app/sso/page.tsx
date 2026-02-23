'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function SsoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('SSO 로그인 처리 중...');

  useEffect(() => {
    const performSso = async () => {
      const token = searchParams.get('token');
      console.log('[SSO] 받은 토큰:', token ? '존재함' : '없음');
      console.log('[SSO] 토큰 길이:', token?.length || 0);

      if (!token) {
        console.error('[SSO] 토큰이 URL에 없습니다.');
        setStatus('error');
        setMessage('SSO 토큰이 없습니다.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      try {
        console.log('[SSO] API 호출 시작...');
        // SSO 엔드포인트 호출
        const res = await api.post('/auth/sso', { token });
        console.log('[SSO] API 응답:', res.data);

        if (res.data.user) {
          // 사용자 정보 저장
          localStorage.setItem('user_name', res.data.user.name);
          localStorage.setItem('user', JSON.stringify(res.data.user));

          setStatus('success');
          setMessage(`${res.data.user.name}님, 환영합니다!`);

          // 1초 후 대시보드로 이동
          setTimeout(() => router.push('/dashboard'), 1000);
        }
      } catch (error: any) {
        console.error('[SSO] 로그인 실패:', error);
        console.error('[SSO] 에러 상세:', error.response?.data);
        setStatus('error');
        setMessage(error.response?.data?.message || 'SSO 로그인에 실패했습니다.');

        // 3초 후 로그인 페이지로 이동
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    performSso();
  }, [searchParams, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#fdfbf7] dark:bg-slate-900">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white dark:bg-slate-800 p-10 shadow-2xl border border-stone-100 dark:border-slate-700">
        <div className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto h-16 w-16 text-indigo-600 animate-spin" />
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                로그인 중...
              </h2>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                로그인 성공!
              </h2>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="mx-auto h-16 w-16 text-red-600" />
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                로그인 실패
              </h2>
            </>
          )}

          <p className="text-slate-600 dark:text-slate-400 font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
