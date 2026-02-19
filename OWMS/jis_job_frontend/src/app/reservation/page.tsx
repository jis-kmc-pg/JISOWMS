'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Car, DoorOpen } from 'lucide-react';
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
