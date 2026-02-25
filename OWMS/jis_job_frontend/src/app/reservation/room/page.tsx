'use client';

import { DoorOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import MeetingRoomReservation from '@/components/reservation/MeetingRoomReservation';

export default function MeetingRoomReservationPage() {
    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center space-x-3 sm:space-x-4">
                <Link href="/" className="text-slate-400 dark:text-slate-400 hover:text-indigo-600 transition-colors shrink-0" aria-label="홈으로 이동">
                    <ArrowLeft size={22} aria-hidden="true" />
                </Link>
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 sm:gap-2.5">
                        <div className="bg-violet-50 dark:bg-violet-900/30 p-1.5 sm:p-2 rounded-xl border border-violet-100 dark:border-violet-800/30 shrink-0">
                            <DoorOpen size={18} className="text-violet-600 dark:text-violet-400 sm:hidden" />
                            <DoorOpen size={22} className="text-violet-600 dark:text-violet-400 hidden sm:block" />
                        </div>
                        <span className="truncate">회의실 예약</span>
                    </h1>
                    <p className="hidden sm:block text-sm text-slate-400 dark:text-slate-400 mt-1 ml-12">회의실 예약을 관리합니다.</p>
                </div>
            </div>

            {/* Content */}
            <MeetingRoomReservation />
        </div>
    );
}
