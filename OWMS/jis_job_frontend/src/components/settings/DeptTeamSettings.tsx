'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Users, Plus, Pencil, Check, X, Move, ArrowUpCircle, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { AxiosError } from 'axios';

function getErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof AxiosError) return err.response?.data?.message || fallback;
    if (err instanceof Error) return err.message;
    return fallback;
}

interface Department {
    id: number;
    name: string;
    _count: { users: number; teams: number };
    teams: Team[];
}

interface Team {
    id: number;
    name: string;
    departmentId: number;
    department?: { id: number; name: string };
    _count: { users: number };
}

export default function DeptTeamSettings() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    // 드래그 앤 드롭 상태
    const [draggedItem, setDraggedItem] = useState<{ type: 'team' | 'department', id: number } | null>(null);
    const [dropTargetDeptId, setDropTargetDeptId] = useState<number | null>(null);
    const [isPromoteTargetHovered, setIsPromoteTargetHovered] = useState(false);

    // 부서 추가/수정 상태
    const [newDeptName, setNewDeptName] = useState('');
    const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
    const [editDeptName, setEditDeptName] = useState('');

    // 팀 추가/수정 상태
    const [newTeamName, setNewTeamName] = useState('');
    const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
    const [editTeamName, setEditTeamName] = useState('');

    // 토스트 메시지
    const [toast, setToast] = useState('');

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
    };

    // 데이터 로드
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [deptRes, teamRes] = await Promise.all([
                api.get('/admin/departments'),
                api.get('/admin/teams'),
            ]);
            setDepartments(deptRes.data);
            setTeams(teamRes.data);
        } catch (err) {
            console.error('데이터 로드 실패:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // 부서 추가
    const handleAddDept = async () => {
        if (!newDeptName.trim()) return;
        try {
            await api.post('/admin/departments', { name: newDeptName.trim() });
            setNewDeptName('');
            showToast('부서가 추가되었습니다.');
            fetchData();
        } catch (err: unknown) {
            showToast(getErrorMessage(err, '부서 추가 실패'));
        }
    };

    // 부서 수정
    const handleEditDept = async (id: number) => {
        if (!editDeptName.trim()) return;
        try {
            await api.patch(`/admin/departments/${id}`, { name: editDeptName.trim() });
            setEditingDeptId(null);
            showToast('부서명이 수정되었습니다.');
            fetchData();
        } catch (err: unknown) {
            showToast(getErrorMessage(err, '부서 수정 실패'));
        }
    };

    // 팀 추가
    const handleAddTeam = async () => {
        if (!newTeamName.trim() || !selectedDeptId) return;
        try {
            await api.post('/admin/teams', { name: newTeamName.trim(), departmentId: selectedDeptId });
            setNewTeamName('');
            showToast('팀이 추가되었습니다.');
            fetchData();
        } catch (err: unknown) {
            showToast(getErrorMessage(err, '팀 추가 실패'));
        }
    };

    // 팀 수정
    const handleEditTeam = async (id: number) => {
        if (!editTeamName.trim()) return;
        try {
            await api.patch(`/admin/teams/${id}`, { name: editTeamName.trim() });
            setEditingTeamId(null);
            showToast('팀명이 수정되었습니다.');
            fetchData();
        } catch (err: unknown) {
            showToast(getErrorMessage(err, '팀 수정 실패'));
        }
    };

    // 삭제 타겟 상태
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'department' | 'team', id: number, name: string } | null>(null);

    // 부서 삭제 요청 (모달 열기)
    const handleDeleteDept = (id: number, name: string) => {
        setDeleteTarget({ type: 'department', id, name });
    };

    // 팀 삭제 요청 (모달 열기)
    const handleDeleteTeam = (id: number, name: string) => {
        setDeleteTarget({ type: 'team', id, name });
    };

    // 삭제 확정 처리
    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            if (deleteTarget.type === 'department') {
                await api.delete(`/admin/departments/${deleteTarget.id}`);
                showToast(`'${deleteTarget.name}' 부서가 삭제되었습니다.`);
                if (selectedDeptId === deleteTarget.id) setSelectedDeptId(null);
            } else {
                await api.delete(`/admin/teams/${deleteTarget.id}`);
                showToast(`'${deleteTarget.name}' 팀이 삭제되었습니다.`);
            }
            fetchData();
        } catch (err: unknown) {
            showToast(getErrorMessage(err, '삭제 실패'));
        } finally {
            setDeleteTarget(null);
        }
    };

    // 드래그 앤 드롭 핸들러 (통합)
    const handleDragStart = (e: React.DragEvent, type: 'team' | 'department', id: number) => {
        e.dataTransfer.setData('type', type);
        e.dataTransfer.setData('id', String(id));
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem({ type, id }); // 시각적 효과용 상태
    };

    const handleDrop = async (e: React.DragEvent, targetDeptId: number) => {
        const type = e.dataTransfer.getData('type') as 'team' | 'department';
        const id = Number(e.dataTransfer.getData('id'));

        if (!type || !id) return;

        // 같은 부서나 자기 자신으로의 드롭 방지
        if (type === 'department' && id === targetDeptId) return;
        const targetDept = departments.find(d => d.id === targetDeptId);

        // Case 1: 팀 이동 (기존 로직)
        if (type === 'team') {
            const team = teams.find(t => t.id === id);
            if (!team || team.departmentId === targetDeptId) return;

            try {
                await api.patch(`/admin/teams/${id}`, { departmentId: targetDeptId });
                showToast(`${team.name} 팀이 ${targetDept?.name}로 이동되었습니다.`);
                fetchData();
            } catch (err: unknown) {
                showToast(getErrorMessage(err, '팀 이동 실패'));
            }
        }
        // Case 2: 부서 강등 (신규 로직)
        else if (type === 'department') {
            const sourceDept = departments.find(d => d.id === id);
            if (!sourceDept) return;

            // 사용자 편의를 위해 confirm 제거 (즉시 반영 후 토스트 알림)
            // if (!confirm(...)) return;

            try {
                await api.post(`/admin/departments/${id}/demote`, { targetDeptId });
                showToast(`'${sourceDept.name}' 부서가 '${targetDept?.name}'의 팀으로 변경되었습니다.`);
                fetchData();
                if (selectedDeptId === id) setSelectedDeptId(null);
            } catch (err: unknown) {
                showToast(getErrorMessage(err, '부서 이동 실패'));
            }
        }

        setDraggedItem(null);
        setDropTargetDeptId(null);
    };

    // 팀 승격 처리
    const handlePromoteTeam = async (e: React.DragEvent) => {
        const type = e.dataTransfer.getData('type') as 'team' | 'department';
        const id = Number(e.dataTransfer.getData('id'));

        if (type !== 'team' || !id) return;

        const team = teams.find(t => t.id === id);
        if (!team) return;

        // 사용자 편의를 위해 confirm 제거
        // if (!confirm(`'${team.name}' 팀을 독립된 부서로 승격시키겠습니까?\n(팀원들은 새 부서 소속으로 자동 변경됩니다.)`)) {
        //     return;
        // }

        try {
            const res = await api.post(`/admin/teams/${team.id}/promote`);
            showToast(res.data.message);
            fetchData();
        } catch (err: unknown) {
            showToast(getErrorMessage(err, '팀 승격 실패'));
        }
        setDraggedItem(null);
        setIsPromoteTargetHovered(false);
    };

    // 순서 변경 핸들러
    const handleReorder = async (type: 'department' | 'team', id: number, direction: 'up' | 'down') => {
        try {
            await api.post(`/admin/${type}s/${id}/reorder`, { direction });
            fetchData();
        } catch (err: unknown) {
            showToast(getErrorMessage(err, '순서 변경 실패'));
        }
    };


    // 선택된 부서의 팀 필터링
    const filteredTeams = selectedDeptId
        ? teams.filter(t => t.departmentId === selectedDeptId)
        : teams;

    const selectedDept = departments.find(d => d.id === selectedDeptId);

    if (loading) return <div className="text-slate-500 text-center py-10">로딩 중...</div>;

    return (
        <div className="space-y-6">
            {/* 토스트 */}
            {toast && (
                <div className="fixed top-20 right-6 z-50 bg-indigo-600/90 backdrop-blur text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-right-5 fade-in duration-300">
                    {toast}
                </div>
            )}

            <h3 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Building2 size={24} />
                </div>
                <span>부서 · 팀 관리</span>
            </h3>

            <p className="text-sm text-slate-600 bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-start space-x-3 shadow-sm">
                <Move size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                    <strong>조직도 변경 가이드:</strong><br />
                    • <strong>팀 이동</strong>: 팀을 드래그하여 다른 부서에 놓으세요.<br />
                    • <strong>부서 통합</strong>: 부서를 드래그하여 다른 부서에 놓으면 하위 팀으로 합쳐집니다.<br />
                    • <strong>팀 승격</strong>: 팀을 아래 승격 영역에 놓으면 독립 부서가 됩니다.
                </span>
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 좌측: 부서 목록 */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4 h-full flex flex-col">
                    <div className="flex items-center justify-between">
                        <p className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            부서 목록
                        </p>
                        <span className="text-xs font-medium text-slate-500 bg-stone-100 px-2.5 py-1 rounded-full">{departments.length}개</span>
                    </div>

                    {/* 부서 추가 */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={newDeptName}
                            onChange={(e) => setNewDeptName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddDept()}
                            placeholder="새 부서명..."
                            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                        />
                        <button
                            onClick={handleAddDept}
                            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm hover:shadow transition-all"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* 부서 리스트 */}
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 flex-1">
                        {departments.map((dept, index) => (
                            <div
                                key={dept.id}
                                draggable // 부서도 드래그 가능
                                onDragStart={(e) => handleDragStart(e, 'department', dept.id)}
                                onClick={() => setSelectedDeptId(dept.id)}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    // 자기 자신 위에는 드롭 표시 안 함
                                    if (draggedItem?.type === 'department' && draggedItem.id === dept.id) return;
                                    setDropTargetDeptId(dept.id);
                                }}
                                onDragLeave={() => setDropTargetDeptId(null)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    handleDrop(e, dept.id);
                                }}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all border group ${selectedDeptId === dept.id
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                                    : dropTargetDeptId === dept.id
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 scale-[1.02] shadow-md'
                                        : 'bg-white border-stone-100 hover:bg-stone-50 text-slate-700'
                                    } ${draggedItem?.id === dept.id && draggedItem?.type === 'department' ? 'opacity-40 border-dashed border-slate-400' : ''}`}
                            >
                                {editingDeptId === dept.id ? (
                                    <div className="flex items-center space-x-2 flex-1">
                                        <input
                                            type="text"
                                            value={editDeptName}
                                            onChange={(e) => setEditDeptName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleEditDept(dept.id)}
                                            className="flex-1 bg-white border border-indigo-300 rounded px-2 py-1 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100"
                                            autoFocus
                                        />
                                        <button onClick={() => handleEditDept(dept.id)} className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"><Check size={14} /></button>
                                        <button onClick={() => setEditingDeptId(null)} className="p-1 bg-stone-100 text-slate-500 rounded hover:bg-stone-200"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-1.5 rounded-lg ${selectedDeptId === dept.id ? 'bg-indigo-100 text-indigo-600' : 'bg-stone-100 text-slate-400 group-hover:bg-white group-hover:text-indigo-500 transition-colors'}`}>
                                                <Building2 size={16} />
                                            </div>
                                            <span className="text-sm font-semibold">{dept.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${selectedDeptId === dept.id ? 'bg-white text-indigo-600 border border-indigo-100' : 'bg-stone-100 text-slate-500'}`}>
                                                {dept.teams.length}팀 · {dept._count.users}명
                                            </span>

                                            {/* 순서 변경 및 관리 버튼 그룹 */}
                                            <div className="flex items-center space-x-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleReorder('department', dept.id, 'up'); }}
                                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-stone-100 rounded transition-colors disabled:opacity-30 cursor-pointer"
                                                    disabled={index === 0}
                                                    title="위로 이동"
                                                >
                                                    <ChevronUp size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleReorder('department', dept.id, 'down'); }}
                                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-stone-100 rounded transition-colors disabled:opacity-30 cursor-pointer"
                                                    disabled={index === departments.length - 1}
                                                    title="아래로 이동"
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                                <div className="w-px h-3 bg-stone-200 mx-1"></div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingDeptId(dept.id); setEditDeptName(dept.name); }}
                                                    className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                                    title="수정"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept.id, dept.name); }}
                                                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                                    title="삭제"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* 승격 전용 드롭 영역 */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            if (draggedItem?.type === 'team') setIsPromoteTargetHovered(true);
                        }}
                        onDragLeave={() => setIsPromoteTargetHovered(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            handlePromoteTeam(e);
                        }}
                        className={`mt-4 border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center space-y-2 ${isPromoteTargetHovered
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-600 scale-[1.02]'
                            : 'bg-stone-50 border-stone-200 text-slate-400'
                            } ${draggedItem?.type === 'team' ? 'opacity-100' : 'opacity-50 grayscale'}`}
                    >
                        <ArrowUpCircle size={28} className={isPromoteTargetHovered ? 'text-indigo-500' : 'text-slate-300'} />
                        <div className="text-center">
                            <p className="text-xs font-bold">여기에 팀을 놓으면</p>
                            <p className="text-[10px]">독립된 부서로 승격됩니다.</p>
                        </div>
                    </div>
                </div>

                {/* 우측: 팀 목록 */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4 h-full flex flex-col">
                    <div className="flex items-center justify-between">
                        <p className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedDept ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                            {selectedDept ? `${selectedDept.name} 소속 팀` : '전체 팀 목록'}
                        </p>
                        <span className="text-xs font-medium text-slate-500 bg-stone-100 px-2.5 py-1 rounded-full">{filteredTeams.length}개</span>
                    </div>

                    {/* 팀 추가 (부서 선택 시에만) */}
                    {selectedDeptId && (
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                                placeholder={`${selectedDept?.name}에 새 팀 추가...`}
                                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                            />
                            <button
                                onClick={handleAddTeam}
                                className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-sm hover:shadow transition-all"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    )}

                    {/* 팀 리스트 */}
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 flex-1">
                        {filteredTeams.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm space-y-2 min-h-[200px] border-2 border-dashed border-stone-100 rounded-xl bg-stone-50/50">
                                <Users size={32} className="text-stone-200" />
                                <p>{selectedDeptId ? '이 부서에 등록된 팀이 없습니다.' : '좌측에서 부서를 선택하세요.'}</p>
                            </div>
                        ) : (
                            filteredTeams.map((team, index) => (
                                <div
                                    key={team.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'team', team.id)}
                                    className={`relative flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-stone-100 hover:bg-stone-50 hover:border-stone-200 text-slate-700 transition-all cursor-grab active:cursor-grabbing hover:shadow-sm overflow-hidden group ${draggedItem?.id === team.id && draggedItem?.type === 'team' ? 'opacity-40 scale-95 border-indigo-300 border-dashed' : ''
                                        }`}
                                >
                                    {editingTeamId === team.id ? (
                                        <div className="flex items-center space-x-2 flex-1">
                                            <input
                                                type="text"
                                                value={editTeamName}
                                                onChange={(e) => setEditTeamName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleEditTeam(team.id)}
                                                className="flex-1 bg-white border border-indigo-300 rounded px-2 py-1 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100"
                                                autoFocus
                                            />
                                            <button onClick={() => handleEditTeam(team.id)} className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"><Check size={14} /></button>
                                            <button onClick={() => setEditingTeamId(null)} className="p-1 bg-stone-100 text-slate-500 rounded hover:bg-stone-200"><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center space-x-3">
                                                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
                                                    <Users size={16} />
                                                </div>
                                                <span className="text-sm font-semibold">{team.name}</span>
                                                {!selectedDeptId && team.department && (
                                                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                                                        {team.department.name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-[11px] bg-stone-100 px-2 py-0.5 rounded-full text-slate-500 font-medium">
                                                    {team._count.users}명
                                                </span>

                                                {/* 팀 순서 변경 및 관리 버튼 */}
                                                <div className="flex items-center space-x-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {selectedDeptId && (
                                                        <>
                                                            <button
                                                                onClick={() => handleReorder('team', team.id, 'up')}
                                                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-stone-200 rounded transition-colors disabled:opacity-30"
                                                                disabled={index === 0}
                                                                title="위로 이동"
                                                            >
                                                                <ChevronUp size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReorder('team', team.id, 'down')}
                                                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-stone-200 rounded transition-colors disabled:opacity-30"
                                                                disabled={index === filteredTeams.length - 1}
                                                                title="아래로 이동"
                                                            >
                                                                <ChevronDown size={14} />
                                                            </button>
                                                            <div className="w-px h-3 bg-stone-200 mx-1"></div>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => { setEditingTeamId(team.id); setEditTeamName(team.name); }}
                                                        className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                        title="수정"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTeam(team.id, team.name)}
                                                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                                                        title="삭제"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* 드래그 힌트 애니메이션 바 */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 transition-transform duration-300 ${draggedItem?.id === team.id && draggedItem?.type === 'team' ? 'translate-x-0' : '-translate-x-full'}`}></div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 삭제 확인 모달 */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-stone-100">
                        <div className="p-6 space-y-4">
                            <div className="flex items-center space-x-3 text-rose-500">
                                <div className="p-3 bg-rose-50 rounded-full">
                                    <Trash2 size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">삭제 확인</h3>
                            </div>

                            <p className="text-slate-600 leading-relaxed">
                                <span className="font-bold text-slate-900">'{deleteTarget.name}'</span> {deleteTarget.type === 'department' ? '부서' : '팀'}를 정말 삭제하시겠습니까?
                            </p>

                            {deleteTarget.type === 'department' && (
                                <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl text-sm text-rose-600 flex items-start gap-2">
                                    <span className="mt-0.5">⚠️</span>
                                    <span>소속된 팀이나 인원이 없어야 삭제가 가능합니다.</span>
                                </div>
                            )}
                            {deleteTarget.type === 'team' && (
                                <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl text-sm text-rose-600 flex items-start gap-2">
                                    <span className="mt-0.5">⚠️</span>
                                    <span>소속된 인원이 없어야 삭제가 가능합니다.</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end space-x-3 p-4 bg-stone-50 border-t border-stone-100">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-stone-200 transition-all font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 transition-all font-medium flex items-center space-x-2"
                            >
                                <span>삭제하기</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
