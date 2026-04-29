'use client';

import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import ProfileSettings from '@/components/settings/ProfileSettings';

export default function ProfilePage() {
    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center space-x-3 sm:space-x-4">
                <Link
                    href="/"
                    className="text-slate-400 dark:text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                    aria-label="홈으로 이동"
                >
                    <ArrowLeft size={22} aria-hidden="true" />
                </Link>
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 sm:gap-2.5">
                        <User size={22} className="text-indigo-500" />
                        프로필 설정
                    </h1>
                </div>
            </div>
            <ProfileSettings />
        </div>
    );
}
