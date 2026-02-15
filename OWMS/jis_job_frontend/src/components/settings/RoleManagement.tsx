'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, ChevronRight, Users } from 'lucide-react';
import api from '@/lib/api';

interface UserData {
    id: number;
    userId: string;
    name: string;
    position: string | null;
    role: string;
    department: { id: number; name: string } | null;
    team: { id: number; name: string } | null;
}

// 권한 계층 구조 정의
const ROLE_HIERARCHY = [
    { key: 'CEO', label: '대표이사', color: 'yellow', desc: '전체 조직 총괄. 모든 데이터 열람 가능.' },
    { key: 'EXECUTIVE', label: '임원', color: 'purple', desc: '경영진 직속. 전 부서 데이터 열람 가능.' },
    { key: 'DEPT_HEAD', label: '부서장', color: 'blue', desc: '부서 총괄. 소속 부서 데이터 관리.' },
    { key: 'TEAM_LEADER', label: '팀장', color: 'green', desc: '팀 총괄. 소속 팀원 업무 관리.' },
    { key: 'MEMBER', label: '팀원', color: 'gray', desc: '일반 사용자. 본인 업무 관리.' },
];

const COLOR_MAP: Record<string, string> = {
    yellow: 'from-amber-50 to-amber-100 border-amber-200 text-amber-900 shadow-sm hover:shadow-md hover:border-amber-300',
    purple: 'from-violet-50 to-violet-100 border-violet-200 text-violet-900 shadow-sm hover:shadow-md hover:border-violet-300',
    blue: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-900 shadow-sm hover:shadow-md hover:border-indigo-300',
    green: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900 shadow-sm hover:shadow-md hover:border-emerald-300',
    gray: 'from-white to-stone-50 border-stone-200 text-slate-700 shadow-sm hover:shadow-md hover:border-stone-300',
};

const ICON_COLOR_MAP: Record<string, string> = {
    yellow: 'text-amber-500',
    purple: 'text-violet-500',
    blue: 'text-indigo-500',
    green: 'text-emerald-500',
    gray: 'text-slate-400',
};

export default function RoleManagement() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRole, setExpandedRole] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error('데이터 로드 실패:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // 권한별 사용자 그룹핑
    const groupedByRole = ROLE_HIERARCHY.map(role => ({
        ...role,
        users: users.filter(u => u.role === role.key),
    }));

    if (loading) return <div className="text-slate-500 text-center py-10">로딩 중...</div>;

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <Shield size={24} />
                </div>
                <span>권한 관리</span>
            </h3>

            <p className="text-sm text-slate-600 bg-white border border-stone-200 rounded-xl px-5 py-3 shadow-sm">
                5단계 권한 체계로 조직을 관리합니다. 사용자의 권한 변경은 <strong className="text-indigo-600 font-semibold">사용자 관리</strong> 탭에서 수행할 수 있습니다.
            </p>

            {/* 권한 계층 시각화 */}
            <div className="space-y-3 relative">
                {/* 계층 연결선 배경 line */}
                <div className="absolute left-[30px] top-4 bottom-4 w-px bg-stone-200 -z-10"></div>

                {groupedByRole.map((role, idx) => (
                    <div key={role.key} className="relative">
                        {/* 계층 연결선 (수평) */}
                        <div className="absolute left-[-20px] top-[26px] w-[20px] h-px bg-stone-200" style={{ left: `${idx * 16}px` }}></div>

                        {/* TODO: 계층 구조 시각화 개선 필요 시 다듬기 */}

                        <div className="space-y-1">
                            {/* 권한 카드 */}
                            <button
                                onClick={() => setExpandedRole(expandedRole === role.key ? null : role.key)}
                                className={`w-full bg-gradient-to-r ${COLOR_MAP[role.color]} border rounded-2xl p-4 transition-all text-left group`}
                                style={{ marginLeft: `${idx * 16}px`, width: `calc(100% - ${idx * 16}px)` }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-1.5 rounded-lg bg-white/60 ${ICON_COLOR_MAP[role.color]}`}>
                                            <Shield size={18} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-base block">{role.label}</span>
                                            <span className="text-xs opacity-80 font-medium">{role.desc}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-xs bg-white/50 px-2.5 py-1 rounded-full font-bold shadow-sm">
                                            {role.users.length}명
                                        </span>
                                        <ChevronRight size={16} className={`transition-transform text-slate-400 group-hover:text-slate-600 ${expandedRole === role.key ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>
                            </button>

                            {/* 펼친 사용자 목록 */}
                            {expandedRole === role.key && (
                                <div
                                    className="bg-white border border-stone-200 rounded-xl p-3 space-y-1 shadow-sm animate-in slide-in-from-top-2 fade-in duration-200"
                                    style={{ marginLeft: `${idx * 16}px`, width: `calc(100% - ${idx * 16}px)` }}
                                >
                                    {role.users.length > 0 ? (
                                        role.users.map(user => (
                                            <div key={user.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                        {user.name.slice(0, 1)}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-slate-800 font-bold">{user.name}</span>
                                                        <span className="text-xs text-slate-400 ml-1">({user.userId})</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 text-xs text-slate-500">
                                                    {user.position && <span className="font-medium">{user.position}</span>}
                                                    {user.department && (
                                                        <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100">
                                                            {user.department.name}{user.team ? ` · ${user.team.name}` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-slate-400 text-sm flex flex-col items-center gap-2">
                                            <Users size={20} className="opacity-50" />
                                            이 권한에 해당하는 사용자가 없습니다.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
