'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import api from '../../lib/api';
import { AxiosError } from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 이미 로그인된 경우 메인으로 이동
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('user')) {
      router.replace('/');
    }
  }, [router]);


  // ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { userId, password });

      const data = res.data;

      if (data.user) {
        localStorage.setItem('user_name', data.user.name);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // 로그인 성공 시 대시보드로 이동
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof AxiosError
        ? (err.response?.data?.message || err.message)
        : '로그인 실패';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#fdfbf7] dark:bg-slate-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-slate-800 p-10 shadow-2xl shadow-indigo-100/50 dark:shadow-slate-900/50 border border-stone-100 dark:border-slate-700">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-4 text-white shadow-lg shadow-indigo-500/30">
            <Lock size={24} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">OWMS Login</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">업무 관리 시스템에 접속하세요</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/30 p-4 text-sm font-bold text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30 flex items-center justify-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">아이디</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-400" />
                <input
                  id="userId"
                  name="userId"
                  type="text"
                  required
                  className="block w-full rounded-xl border-stone-200 dark:border-slate-600 bg-stone-50 dark:bg-slate-700/50 py-3.5 pl-11 text-slate-800 dark:text-slate-100 ring-1 ring-inset ring-stone-200 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-colors"
                  placeholder="아이디를 입력하세요"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full rounded-xl border-stone-200 dark:border-slate-600 bg-stone-50 dark:bg-slate-700/50 py-3.5 pl-11 pr-10 text-slate-800 dark:text-slate-100 ring-1 ring-inset ring-stone-200 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-colors"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  className="absolute right-4 top-3.5 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-indigo-600 px-3 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 transition-colors shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로그인 중...
                </span>
              ) : '로그인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
