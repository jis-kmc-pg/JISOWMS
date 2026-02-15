'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Settings, Plus, ClipboardList, Shield } from 'lucide-react';
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
            <div>
                <h2 className="text-2xl font-bold text-slate-800">연차 관리</h2>
                <p className="text-slate-500 mt-1 font-medium">경영지원부 전용 임직원 휴가 및 연차 통합 관리 시스템입니다.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* 사이드바 */}
                <div className="w-full md:w-64 space-y-6">
                    {/* 관리 기능 그룹 */}
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-3 px-3">관리 기능</p>
                        <div className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === tab.id
                                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm'
                                        : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm border border-transparent hover:border-stone-100'
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
                <div className="flex-1 bg-white border border-stone-200 rounded-2xl p-8 min-h-[600px] shadow-sm">
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
