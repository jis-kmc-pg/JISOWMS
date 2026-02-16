'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Settings, Calendar } from 'lucide-react';
import { useDashboardPreferences } from '../../lib/hooks/useDashboardPreferences';
import WidgetGrid from '../../components/dashboard/widgets/WidgetGrid';

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 6) return '늦은 밤이에요';
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 14) return '점심 시간이에요';
    if (hour < 18) return '좋은 오후예요';
    return '좋은 저녁이에요';
}

function getFormattedDate(): string {
    const now = new Date();
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const day = days[now.getDay()];
    return `${now.getFullYear()}년 ${month}월 ${date}일 ${day}`;
}

export default function DashboardPage() {
    const { preferences, loading } = useDashboardPreferences();
    const [userRole, setUserRole] = useState<string>('MEMBER');
    const [userName, setUserName] = useState<string>('');

    const greeting = useMemo(() => getGreeting(), []);
    const formattedDate = useMemo(() => getFormattedDate(), []);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                setUserRole(parsed.role || 'MEMBER');
                setUserName(parsed.name || parsed.username || '');
            } catch (e) {
                console.error('Failed to parse user data', e);
            }
        }
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold animate-pulse">대시보드 데이터를 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 헤더 영역 */}
            <div className="flex items-start justify-between">
                <div>
                    {/* 인사말 */}
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                        {greeting}{userName ? `, ${userName}님` : ''}
                    </h2>
                    {/* 날짜 표시 */}
                    <div className="flex items-center gap-2 mt-2">
                        <Calendar size={14} className="text-slate-400" />
                        <p className="text-slate-500 font-medium text-sm">{formattedDate}</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/settings"
                    className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-700 border border-stone-200 dark:border-slate-700 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all duration-300"
                >
                    <Settings size={16} className="text-slate-400 group-hover:text-indigo-500 group-hover:rotate-90 transition-all duration-500" />
                    <span className="group-hover:text-indigo-600 transition-colors">위젯 설정</span>
                </Link>
            </div>

            <WidgetGrid preferences={preferences} userRole={userRole} />
        </div>
    );
}
