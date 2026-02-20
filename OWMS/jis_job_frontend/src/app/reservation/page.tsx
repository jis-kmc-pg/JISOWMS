'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Car, DoorOpen, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import VehicleReservation from '@/components/reservation/VehicleReservation';
import MeetingRoomReservation from '@/components/reservation/MeetingRoomReservation';

type TabId = 'vehicle' | 'room';

function ReservationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabId>('vehicle');

    useEffect(() => {
        const tab = searchParams.get('tab') as TabId;
        if (tab && ['vehicle', 'room'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        router.push(`/reservation?tab=${tab}`);
    };

    const tabs = [
        { id: 'vehicle' as TabId, label: '업무차', icon: <Car size={18} /> },
        { id: 'room' as TabId, label: '회의실', icon: <DoorOpen size={18} /> },
    ];

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center space-x-3 sm:space-x-4">
                <Link href="/" className="text-slate-400 dark:text-slate-400 hover:text-indigo-600 transition-colors shrink-0" aria-label="홈으로 이동">
                    <ArrowLeft size={22} aria-hidden="true" />
                </Link>
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 sm:gap-2.5">
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 sm:p-2 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shrink-0">
                            <Calendar size={18} className="text-indigo-600 dark:text-indigo-400 sm:hidden" />
                            <Calendar size={22} className="text-indigo-600 dark:text-indigo-400 hidden sm:block" />
                        </div>
                        <span className="truncate">예약 관리</span>
                    </h1>
                    <p className="hidden sm:block text-sm text-slate-400 dark:text-slate-400 mt-1 ml-12">업무차 및 회의실 예약을 관리합니다.</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl p-1.5 shadow-sm">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'vehicle' && <VehicleReservation />}
                {activeTab === 'room' && <MeetingRoomReservation />}
            </div>
        </div>
    );
}

export default function ReservationPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-20 text-slate-400 dark:text-slate-400">Loading...</div>}>
            <ReservationContent />
        </Suspense>
    );
}
