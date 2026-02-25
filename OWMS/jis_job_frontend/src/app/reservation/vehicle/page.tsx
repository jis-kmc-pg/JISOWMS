'use client';

import { Car, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import VehicleReservation from '@/components/reservation/VehicleReservation';

export default function VehicleReservationPage() {
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
                            <Car size={18} className="text-indigo-600 dark:text-indigo-400 sm:hidden" />
                            <Car size={22} className="text-indigo-600 dark:text-indigo-400 hidden sm:block" />
                        </div>
                        <span className="truncate">업무차 예약</span>
                    </h1>
                    <p className="hidden sm:block text-sm text-slate-400 dark:text-slate-400 mt-1 ml-12">업무차 예약을 관리합니다.</p>
                </div>
            </div>

            {/* Content */}
            <VehicleReservation />
        </div>
    );
}
