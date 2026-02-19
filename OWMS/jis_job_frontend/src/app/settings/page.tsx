'use client';

import { useState } from 'react';
import { Briefcase, User, Building2, UserCog, Shield, DoorOpen, Car } from 'lucide-react';
import JobsSettings from '@/components/settings/JobsSettings';
import ProfileSettings from '@/components/settings/ProfileSettings';
import DeptTeamSettings from '@/components/settings/DeptTeamSettings';
import UserManagement from '@/components/settings/UserManagement';
import RoleManagement from '@/components/settings/RoleManagement';
import MeetingRoomSettings from '@/components/settings/MeetingRoomSettings';
import VehicleSettings from '@/components/settings/VehicleSettings';

type TabId = 'profile' | 'jobs' | 'dept-team' | 'users' | 'roles' | 'meeting-room' | 'vehicles';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabId>('profile');

    const tabs = [
        { id: 'profile' as TabId, label: '프로필 설정', icon: <User size={18} />, group: '개인' },
        { id: 'jobs' as TabId, label: '업무 설정', icon: <Briefcase size={18} />, group: '개인' },
        { id: 'dept-team' as TabId, label: '부서 · 팀 관리', icon: <Building2 size={18} />, group: '관리' },
        { id: 'users' as TabId, label: '사용자 관리', icon: <UserCog size={18} />, group: '관리' },
        { id: 'roles' as TabId, label: '권한 관리', icon: <Shield size={18} />, group: '관리' },
        { id: 'meeting-room' as TabId, label: '회의실 관리', icon: <DoorOpen size={18} />, group: '관리' },
        { id: 'vehicles' as TabId, label: '차량 관리', icon: <Car size={18} />, group: '관리' },
    ];

    // 그룹별 분리
    const personalTabs = tabs.filter(t => t.group === '개인');
    const adminTabs = tabs.filter(t => t.group === '관리');

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">설정</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">시스템 및 개인화 설정을 관리합니다.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* 사이드바 탭 */}
                <div className="w-full md:w-64 space-y-6">
                    {/* 개인 설정 그룹 */}
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-400 font-bold mb-3 px-3">개인 설정</p>
                        <div className="space-y-1">
                            {personalTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabId)}
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

                    {/* 관리 기능 그룹 */}
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-400 font-bold mb-3 px-3">관리 기능</p>
                        <div className="space-y-1">
                            {adminTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabId)}
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
                </div>

                {/* 콘텐츠 영역 */}
                <div className="flex-1 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl p-8 min-h-[600px] shadow-sm">
                    <div className="animate-in fade-in duration-300">
                        {activeTab === 'profile' && <ProfileSettings />}
                        {activeTab === 'jobs' && <JobsSettings />}
                        {activeTab === 'dept-team' && <DeptTeamSettings />}
                        {activeTab === 'users' && <UserManagement />}
                        {activeTab === 'roles' && <RoleManagement />}
                        {activeTab === 'meeting-room' && <MeetingRoomSettings />}
                        {activeTab === 'vehicles' && <VehicleSettings />}
                    </div>
                </div>
            </div>
        </div>
    );
}
