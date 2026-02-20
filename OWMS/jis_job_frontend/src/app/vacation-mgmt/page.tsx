'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Settings, Plus, ClipboardList, Shield, Plane, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BulkVacation from '@/components/vacation/BulkVacation';
import AdminVacation from '@/components/vacation/AdminVacation';
import VacationStats from '@/components/vacation/VacationStats';

type TabId = 'bulk' | 'admin' | 'stats';

function VacationManagementContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabId>('bulk');

    useEffect(() => {
        const tab = searchParams.get('tab') as TabId;
        if (tab && ['bulk', 'admin', 'stats'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        router.push(`/vacation-mgmt?tab=${tab}`);
    };

    const tabs = [
        { id: 'bulk' as TabId, label: '연차 일괄 신청', icon: <Plus size={18} />, group: '신청 관리' },
        { id: 'admin' as TabId, label: '전체 연차 관리', icon: <Settings size={18} />, group: '운영 관리' },
        { id: 'stats' as TabId, label: '연차 실적 통계', icon: <ClipboardList size={18} />, group: '데이터 조회' },
    ];

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center space-x-3 sm:space-x-4">
                <Link href="/" className="text-slate-400 dark:text-slate-400 hover:text-indigo-600 transition-colors shrink-0" aria-label="홈으로 이동">
                    <ArrowLeft size={22} aria-hidden="true" />
                </Link>
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 sm:gap-2.5">
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 sm:p-2 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shrink-0">
                            <Plane size={18} className="text-indigo-600 dark:text-indigo-400 sm:hidden" />
                            <Plane size={22} className="text-indigo-600 dark:text-indigo-400 hidden sm:block" />
                        </div>
                        <span className="truncate">연차 관리</span>
                    </h1>
                    <p className="hidden sm:block text-sm text-slate-400 dark:text-slate-400 mt-1 ml-12">경영지원부 전용 임직원 휴가 및 연차 통합 관리 시스템입니다.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* 사이드바 */}
                <div className="w-full md:w-64 space-y-6">
                    {/* 관리 기능 그룹 */}
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-400 font-bold mb-3 px-3">관리 기능</p>
                        <div className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-sm font-bold ${activeTab === tab.id
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white hover:shadow-sm border border-transparent hover:border-stone-100 dark:hover:border-slate-700'
                                        }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Admin Note - Moved to simple alert if really needed, but removing from sidebar to match Settings exactly as requested. 
                        If user insists on note, we can add it as a small card. 
                        Let's keep a small info block but styled to be less obtrusive, or remove if "exactly like settings".
                        For now, I'll remove the big gradient card to match the clean look of Settings.
                    */}
                </div>

                {/* 콘텐츠 영역 */}
                <div className="flex-1 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl p-8 min-h-[600px] shadow-sm">
                    <div className="animate-in fade-in duration-300">
                        {activeTab === 'bulk' && <BulkVacation />}
                        {activeTab === 'admin' && <AdminVacation />}
                        {activeTab === 'stats' && <VacationStats />}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VacationManagementPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VacationManagementContent />
        </Suspense>
    );
}
