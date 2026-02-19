'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserCog, Search, Plus, RotateCcw, Save, X, ChevronDown, Pencil } from 'lucide-react';
import api from '@/lib/api';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

interface UserData {
    id: number;
    userId: string;
    name: string;
    email: string | null;
    position: string | null;
    role: string;
    department: { id: number; name: string } | null;
    team: { id: number; name: string } | null;
}

interface DeptOption { id: number; name: string }
interface TeamOption { id: number; name: string; departmentId: number }

// 권한 레이블 매핑
const ROLE_LABELS: Record<string, string> = {
    CEO: '대표이사',
    EXECUTIVE: '임원',
    DEPT_HEAD: '부서장',
    TEAM_LEADER: '팀장',
    MEMBER: '팀원',
};

export default function UserManagement() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [departments, setDepartments] = useState<DeptOption[]>([]);
    const [teams, setTeams] = useState<TeamOption[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState<number | ''>('');
    const [filterTeam, setFilterTeam] = useState<number | ''>('');
    const [loading, setLoading] = useState(true);

    // 수정 모드
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    // 신규 사용자 모드
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newUser, setNewUser] = useState({ userId: '', name: '', position: '', role: 'MEMBER', departmentId: '', teamId: '', email: '' });

    // 토스트 메시지
    const [toast, setToast] = useState('');
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

    // 데이터 로드
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [usersRes, deptRes, teamRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/departments'),
                api.get('/admin/teams'),
            ]);
            setUsers(usersRes.data);
            setDepartments(deptRes.data);
            setTeams(teamRes.data);
        } catch (err) {
            console.error('데이터 로드 실패:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // 사용자 수정 저장
    const handleSaveUser = async () => {
        if (!editingUser) return;
        try {
            await api.patch(`/admin/users/${editingUser.id}`, {
                name: editingUser.name,
                position: editingUser.position,
                role: editingUser.role,
                departmentId: editingUser.department?.id || null,
                teamId: editingUser.team?.id || null,
                email: editingUser.email,
            });
            setEditingUser(null);
            showToast('사용자 정보가 수정되었습니다.');
            fetchData();
        } catch (err) {
            const error = err as ApiError;
            showToast(error.response?.data?.message || '수정 실패');
        }
    };

    // 비밀번호 초기화
    const handleResetPassword = async (id: number, name: string) => {
        if (!confirm(`${name}님의 비밀번호를 초기화하시겠습니까?`)) return;
        try {
            await api.post(`/admin/users/${id}/reset-password`);
            showToast(`${name}님의 비밀번호가 초기화되었습니다. (owms1234)`);
        } catch (err) {
            const error = err as ApiError;
            showToast(error.response?.data?.message || '초기화 실패');
        }
    };

    // 신규 사용자 생성
    const handleCreateUser = async () => {
        if (!newUser.userId.trim() || !newUser.name.trim()) {
            showToast('ID와 성명은 필수입니다.');
            return;
        }
        try {
            await api.post('/admin/users', {
                userId: newUser.userId.trim(),
                name: newUser.name.trim(),
                position: newUser.position || undefined,
                role: newUser.role || 'MEMBER',
                departmentId: newUser.departmentId ? Number(newUser.departmentId) : undefined,
                teamId: newUser.teamId ? Number(newUser.teamId) : undefined,
                email: newUser.email || undefined,
            });
            setShowCreateForm(false);
            setNewUser({ userId: '', name: '', position: '', role: 'MEMBER', departmentId: '', teamId: '', email: '' });
            showToast('사용자가 등록되었습니다. (초기 비밀번호: owms1234)');
            fetchData();
        } catch (err) {
            const error = err as ApiError;
            showToast(error.response?.data?.message || '등록 실패');
        }
    };

    // 필터링
    const filteredUsers = users.filter(u => {
        const matchSearch = !searchTerm ||
            u.name.includes(searchTerm) ||
            u.userId.includes(searchTerm) ||
            u.position?.includes(searchTerm);
        const matchDept = filterDept === '' || u.department?.id === filterDept;
        const matchTeam = filterTeam === '' || u.team?.id === filterTeam;
        return matchSearch && matchDept && matchTeam;
    });

    if (loading) return <div className="text-slate-500 dark:text-slate-400 text-center py-10">로딩 중...</div>;

    return (
        <div className="space-y-6">
            {/* 토스트 */}
            {toast && (
                <div className="fixed top-20 right-6 z-50 bg-indigo-600/90 backdrop-blur text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-right-5 fade-in duration-300">
                    {toast}
                </div>
            )}

            {/* 헤더 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <UserCog size={24} />
                    </div>
                    <span>사용자 관리</span>
                    <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800/30 font-medium">{users.length}명</span>
                </h3>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center justify-center space-x-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow transition-all"
                >
                    <Plus size={16} />
                    <span>신규 사용자 등록</span>
                </button>
            </div>

            {/* 검색 및 필터 */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="이름, ID, 직위 검색..."
                        className="w-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 transition-all shadow-sm"
                    />
                </div>

                <div className="flex gap-3">
                    {/* 부서 필터 */}
                    <div className="relative flex-1 md:flex-none md:w-40">
                        <select
                            value={filterDept}
                            onChange={(e) => {
                                setFilterDept(e.target.value ? Number(e.target.value) : '');
                                setFilterTeam('');
                            }}
                            className="w-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 appearance-none shadow-sm cursor-pointer"
                        >
                            <option value="">전체 부서</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* 팀 필터 */}
                    <div className="relative flex-1 md:flex-none md:w-40">
                        <select
                            value={filterTeam}
                            onChange={(e) => setFilterTeam(e.target.value ? Number(e.target.value) : '')}
                            disabled={!filterDept}
                            className={`w-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800/30 appearance-none shadow-sm transition-all ${!filterDept ? 'bg-stone-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-400 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <option value="">전체 팀</option>
                            {teams
                                .filter(t => filterDept && t.departmentId === filterDept)
                                .map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                            }
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* 신규 사용자 등록 폼 */}
            {showCreateForm && (
                <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl p-5 md:p-6 shadow-lg shadow-indigo-100/50 dark:shadow-indigo-900/20 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-bold text-indigo-900 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            신규 사용자 정보 입력
                        </h4>
                        <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"><X size={18} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">로그인 ID</label>
                            <input value={newUser.userId} onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })} className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all" placeholder="example" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">성명</label>
                            <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all" placeholder="홍길동" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">직위</label>
                            <input value={newUser.position} onChange={(e) => setNewUser({ ...newUser, position: e.target.value })} className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all" placeholder="사원" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">이메일</label>
                            <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all" placeholder="hong@company.com" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">권한</label>
                            <div className="relative">
                                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 appearance-none transition-all">
                                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">부서</label>
                            <div className="relative">
                                <select value={newUser.departmentId} onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value, teamId: '' })} className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 appearance-none transition-all">
                                    <option value="">부서 선택</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">팀</label>
                            <div className="relative">
                                <select value={newUser.teamId} onChange={(e) => setNewUser({ ...newUser, teamId: e.target.value })} className="w-full bg-stone-50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 appearance-none transition-all">
                                    <option value="">팀 선택</option>
                                    {teams.filter(t => !newUser.departmentId || t.departmentId === Number(newUser.departmentId)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button onClick={handleCreateUser} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm h-[38px]">
                                사용자 등록
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 사용자 테이블 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-600 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-stone-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-b border-stone-100 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">ID</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">성명</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">부서</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">팀</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">직위</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">권한</th>
                                <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group">
                                    {editingUser?.id === user.id ? (
                                        <>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">{user.userId}</td>
                                            <td className="px-6 py-4">
                                                <input value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100" autoFocus />
                                            </td>
                                            <td className="px-6 py-4">
                                                <select value={editingUser.department?.id || ''} onChange={(e) => { const dId = e.target.value ? Number(e.target.value) : null; const dept = departments.find(d => d.id === dId); setEditingUser({ ...editingUser, department: dept ? { id: dept.id, name: dept.name } : null, team: null }); }} className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-sm text-slate-900 outline-none">
                                                    <option value="">미배정</option>
                                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select value={editingUser.team?.id || ''} onChange={(e) => { const tId = e.target.value ? Number(e.target.value) : null; const team = teams.find(t => t.id === tId); setEditingUser({ ...editingUser, team: team ? { id: team.id, name: team.name } : null }); }} className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-sm text-slate-900 outline-none">
                                                    <option value="">미배정</option>
                                                    {teams.filter(t => !editingUser.department || t.departmentId === editingUser.department.id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input value={editingUser.position || ''} onChange={(e) => setEditingUser({ ...editingUser, position: e.target.value })} className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-sm text-slate-900 outline-none" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })} className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-sm text-slate-900 outline-none">
                                                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center space-x-1">
                                                    <button onClick={handleSaveUser} className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors"><Save size={14} /></button>
                                                    <button onClick={() => setEditingUser(null)} className="p-1.5 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors"><X size={14} /></button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{user.userId}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{user.name}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.department?.name || <span className="text-slate-300 dark:text-slate-500">-</span>}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.team?.name || <span className="text-slate-300 dark:text-slate-500">-</span>}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.position || <span className="text-slate-300 dark:text-slate-500">-</span>}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'CEO' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    user.role === 'EXECUTIVE' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                        user.role === 'DEPT_HEAD' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                            user.role === 'TEAM_LEADER' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                'bg-slate-50 text-slate-600 border-slate-100'
                                                    }`}>
                                                    {ROLE_LABELS[user.role] || user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center space-x-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingUser({ ...user })} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-all" title="수정"><Pencil size={14} /></button>
                                                    <button onClick={() => handleResetPassword(user.id, user.name)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded transition-all" title="비밀번호 초기화"><RotateCcw size={14} /></button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-400 text-sm bg-stone-50/50 dark:bg-slate-700/30">
                        <UserCog size={48} className="mx-auto text-slate-200 mb-3" />
                        <p>검색 결과가 없습니다.</p>
                    </div>
                )}
            </div>
        </div >
    );
}
