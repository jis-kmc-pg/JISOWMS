'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calculator, Calendar, Download, Printer, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '../../lib/api';
import ToastNotification from '../../components/daily-report/ToastNotification';

interface UserStatus {
    id: number;
    name: string;
    department: string;
    status: 'DONE' | 'MISSING';
}

interface WeeklyStatus {
    date: string;
    dayOfWeek: string;
    users: UserStatus[];
}

export default function WeeklyStatusPage() {
    const [weeklyData, setWeeklyData] = useState<WeeklyStatus[]>([]);
    const [nextWeeklyData, setNextWeeklyData] = useState<WeeklyStatus[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);

    // View Mode: 'SUMMARY' | 'DETAIL'
    const [viewMode, setViewMode] = useState<'SUMMARY' | 'DETAIL'>('SUMMARY');
    const [summaryData, setSummaryData] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<{ id: number, name: string, isTeam: boolean, deptId?: number } | null>(null);
    // Detail View State
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailData, setDetailData] = useState<any[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const [selectedUser, setSelectedUser] = useState<{ name: string, date: string } | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Print Preview State
    const [showPrintModal, setShowPrintModal] = useState(false);

    const showToastMsg = (msg: string) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    useEffect(() => {
        if (viewMode === 'SUMMARY') {
            fetchSummary(selectedDate);
        } else {
            fetchWeeklyStatus(selectedDate, selectedTeam?.id, selectedTeam?.isTeam, selectedTeam?.deptId);
        }
    }, [selectedDate, viewMode, selectedTeam]);

    const fetchSummary = async (date: Date) => {
        setLoading(true);
        try {
            const offset = date.getTimezoneOffset() * 60000;
            const dateStr = new Date(date.getTime() - offset).toISOString().split('T')[0];
            const res = await api.get(`/work-status/summary?date=${dateStr}`);
            if (res.data) setSummaryData(Array.isArray(res.data) ? res.data : res.data.teams || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWeeklyStatus = async (date: Date, id?: number, isTeam: boolean = true, deptId?: number) => {
        setLoading(true);

        try {
            const offset = date.getTimezoneOffset() * 60000;
            const dateStr = new Date(date.getTime() - offset).toISOString().split('T')[0];

            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 7);
            const nextDateStr = new Date(nextDate.getTime() - offset).toISOString().split('T')[0];

            let queryParams = `?date=${dateStr}`;
            if (id && isTeam) {
                queryParams += `&teamId=${id}`;
            } else if (deptId && !isTeam) {
                queryParams += `&deptId=${deptId}`;
            }

            const [res, nextRes] = await Promise.all([
                api.get(`/work-status/weekly${queryParams}`),
                api.get(`/work-status/weekly${queryParams.replace(`date=${dateStr}`, `date=${nextDateStr}`)}`)
            ]);

            if (res.data) {
                setWeeklyData(res.data);
            }
            if (nextRes.data) {
                setNextWeeklyData(nextRes.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetail = async (dateStr: string, userId: number, userName: string) => {
        setDetailLoading(true);
        setIsDetailOpen(true);
        setSelectedUser({ name: userName, date: dateStr });

        try {
            const res = await api.get(`/work-status/detail?date=${dateStr}&userId=${userId}`);
            if (res.data) {
                setDetailData(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setDetailLoading(false);
        }
    };

    const downloadFile = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const downloadExcel = async (userId: number, userName: string) => {
        try {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const res = await api.get(`/excel/weekly-report?userId=${userId}&date=${dateStr}`, {
                responseType: 'blob'
            });
            // Error handling: if blob is actually a JSON error message
            if (res.data.type === 'application/json') {
                const text = await res.data.text();
                const json = JSON.parse(text);
                console.error('Server returned JSON error instead of Blob:', json);
                showToastMsg(`다운로드 실패: ${json.message || '서버 오류'}`);
                return;
            }

            // Force filename here
            const filename = `${userName}_주간보고서_${dateStr}.xlsx`;
            downloadFile(new Blob([res.data]), filename);
        } catch (error) {
            console.error('Excel download error:', error);
            showToastMsg('엑셀 다운로드 중 오류가 발생했습니다.');
        }
    };

    const downloadTeamBulkExcel = async (teamId: number, teamName: string) => {
        try {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const res = await api.get(`/excel/team-weekly-report?teamId=${teamId}&date=${dateStr}`, {
                responseType: 'blob'
            });

            // Error handling: if blob is actually a JSON error message
            if (res.data.type === 'application/json') {
                const text = await res.data.text();
                const json = JSON.parse(text);
                console.error('Server returned JSON error instead of Blob (ZIP):', json);
                showToastMsg(`일괄 다운로드 실패: ${json.message || '서버 오류'}`);
                return;
            }

            const filename = `${teamName}_주간보고서_일괄_${dateStr}.zip`;
            downloadFile(new Blob([res.data]), filename);
        } catch (error) {
            console.error('Bulk download error:', error);
            showToastMsg('일괄 다운로드 중 오류가 발생했습니다.');
        }
    };

    const handlePrevWeek = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 7);
        setSelectedDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 7);
        setSelectedDate(newDate);
    };

    const handlePrint = () => {
        window.print();
    };

    const getWeekDateRange = (date: Date) => {
        const day = date.getDay(); // 0(Sun) ~ 6(Sat)
        // Assume Sunday start for now matching backend logic
        const start = new Date(date);
        start.setDate(date.getDate() - day);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getMonth() + 1}월 ${end.getDate()}일`;
    };

    return (
        <div className="space-y-6 relative pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <Link href="/" className="text-slate-400 dark:text-slate-400 hover:text-indigo-600 transition-colors shrink-0" aria-label="홈으로 이동">
                        <ArrowLeft size={22} aria-hidden="true" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 sm:gap-2.5">
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 sm:p-2 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shrink-0">
                                <Calendar size={18} className="text-indigo-600 dark:text-indigo-400 sm:hidden" />
                                <Calendar size={22} className="text-indigo-600 dark:text-indigo-400 hidden sm:block" />
                            </div>
                            <span className="truncate">주간 업무 현황</span>
                        </h1>
                        <p className="hidden sm:block text-sm text-slate-400 dark:text-slate-400 mt-1 ml-12">팀원들의 주간 업무 작성 현황을 확인합니다.</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {viewMode === 'DETAIL' && (
                        <button
                            onClick={() => setViewMode('SUMMARY')}
                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
                        >
                            목록으로 돌아가기
                        </button>
                    )}
                    {/* Date Navigator */}
                    <div className="flex items-center space-x-4 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-xl p-2 shadow-sm">
                        <button onClick={handlePrevWeek} aria-label="이전 주" className="p-2 hover:bg-stone-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <ChevronLeft size={20} aria-hidden="true" />
                        </button>
                        <div className="flex items-center space-x-2 px-2">
                            <Calendar size={18} className="text-indigo-500" />
                            <span className="font-bold text-slate-700 dark:text-slate-200">{getWeekDateRange(selectedDate)}</span>
                        </div>
                        <button onClick={handleNextWeek} aria-label="다음 주" className="p-2 hover:bg-stone-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <ChevronRight size={20} aria-hidden="true" />
                        </button>
                    </div>

                    {/* Print Preview Button (Only in Detail Mode) */}
                    {viewMode === 'DETAIL' && (
                        <button
                            onClick={() => setShowPrintModal(true)}
                            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-slate-200 dark:shadow-slate-900/30 ml-2"
                        >
                            <Printer size={18} />
                            <span className="hidden sm:inline font-bold">프린트 미리보기</span>
                        </button>
                    )}
                </div>
            </div>

            {viewMode === 'SUMMARY' ? (
                /* 팀별 카드 대시보드 */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    {summaryData.map((team) => (
                        <button
                            type="button"
                            key={team.teamId}
                            onClick={() => {
                                setSelectedTeam({
                                    id: team.teamId,
                                    name: team.teamName,
                                    isTeam: team.isTeam,
                                    deptId: team.deptId
                                });
                                setViewMode('DETAIL');
                            }}
                            className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-3xl p-7 shadow-sm hover:shadow-2xl hover:border-indigo-300 transition-colors cursor-pointer group relative overflow-hidden text-left w-full"
                        >
                            {/* 데코레이션 배경 */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-bl-full -mr-12 -mt-12 group-hover:bg-indigo-100/50 transition-all duration-500 group-hover:scale-110"></div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{team.teamName}</h4>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest">Team Overview</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform duration-500 border border-indigo-50 dark:border-indigo-800/30">
                                        <Calculator size={22} />
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex items-center justify-between bg-stone-50/50 dark:bg-slate-700/30 p-3 rounded-2xl border border-stone-100 dark:border-slate-700">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">전체 팀원</span>
                                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/30 shadow-sm">{team.totalMembers}명</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-50/50 group-hover:bg-indigo-50/50 transition-colors">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter mb-2">금주 현황 (월-금)</p>
                                            <div className="flex items-baseline space-x-1 mb-1">
                                                <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{team.currentWeek.completed}</span>
                                                <span className="text-xs text-slate-400 dark:text-slate-400 font-bold">/ {team.totalMembers}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <div className="w-1 h-1 rounded-full bg-rose-400"></div>
                                                <p className="text-[10px] text-rose-400 font-bold">미작성 {team.currentWeek.incomplete}명</p>
                                            </div>
                                        </div>
                                        <div className="bg-violet-50/30 p-4 rounded-2xl border border-violet-50/50 group-hover:bg-violet-50/50 transition-colors">
                                            <p className="text-[10px] font-black text-violet-400 uppercase tracking-tighter mb-2">차주 현황 (월-금)</p>
                                            <div className="flex items-baseline space-x-1 mb-1">
                                                <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{team.nextWeek.completed}</span>
                                                <span className="text-xs text-slate-400 dark:text-slate-400 font-bold">/ {team.totalMembers}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <div className="w-1 h-1 rounded-full bg-rose-400"></div>
                                                <p className="text-[10px] text-rose-400 font-bold">미작성 {team.nextWeek.incomplete}명</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 일괄 다운로드 버튼 (전원 작성 시 노출) */}
                                    {team.currentWeek.incomplete === 0 && team.nextWeek.incomplete === 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                downloadTeamBulkExcel(team.teamId, team.teamName);
                                            }}
                                            className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-100 transition-all font-bold text-xs"
                                        >
                                            <Download size={14} />
                                            <span>전체 팀원 보고서 일괄 다운로드 (ZIP)</span>
                                        </button>
                                    )}
                                </div>

                                <div className="mt-8 pt-4 border-t border-stone-100 dark:border-slate-700 flex items-center justify-between text-indigo-500 font-black text-xs group-hover:px-1 transition-colors">
                                    <span>상세 데이터 그리드 보기</span>
                                    <div className="p-1 px-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                        <ChevronRight size={14} aria-hidden="true" />
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                    {loading && summaryData.length === 0 && (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-3xl animate-pulse shadow-sm" />
                        ))
                    )}
                </div>
            ) : (
                /* 팀 상세 그리드 뷰 */
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
                                <Calculator size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                                    <span className="text-indigo-600 dark:text-indigo-400">{selectedTeam?.name}</span> 상세 리포트
                                </h3>
                                <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Statistical Data Grid</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr>
                                    <th className="p-2 border-b border-stone-200 dark:border-slate-600 bg-stone-50 dark:bg-slate-700/50 font-medium sticky left-0 z-20 w-[100px] border-r border-stone-200/50 dark:border-slate-600/50" rowSpan={2}>
                                    </th>
                                    <th className="p-2 border-b border-stone-200 dark:border-slate-600 text-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold border-r border-stone-200/50 dark:border-slate-600/50 text-xs tracking-wider uppercase" colSpan={7}>
                                        금주 (Current)
                                    </th>
                                    <th className="p-2 border-b border-stone-200 dark:border-slate-600 text-center bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold text-xs tracking-wider uppercase" colSpan={7}>
                                        차주 (Next)
                                    </th>
                                </tr>
                                <tr>
                                    {/* Current Week Headers */}
                                    {weeklyData.map((day) => (
                                        <th key={`current-${day.date}`} className="p-2 border-b border-stone-200 dark:border-slate-600 text-center bg-stone-50 dark:bg-slate-700/50 border-r border-stone-100 dark:border-slate-700">
                                            <div className="flex flex-col items-center">
                                                <span className="text-slate-400 dark:text-slate-400 text-[10px] font-medium">{day.date.split('-').slice(1).join('.')}</span>
                                                <span className={`font-bold text-xs ${day.dayOfWeek === '일' ? 'text-rose-500 dark:text-rose-400' : day.dayOfWeek === '토' ? 'text-indigo-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {day.dayOfWeek}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                    {/* Next Week Headers */}
                                    {nextWeeklyData.map((day) => (
                                        <th key={`next-${day.date}`} className="p-2 border-b border-stone-200 dark:border-slate-600 text-center bg-stone-50 dark:bg-slate-700/50 border-r border-stone-100 dark:border-slate-700 last:border-r-0">
                                            <div className="flex flex-col items-center">
                                                <span className="text-slate-400 dark:text-slate-400 text-[10px] font-medium">{day.date.split('-').slice(1).join('.')}</span>
                                                <span className={`font-bold text-xs ${day.dayOfWeek === '일' ? 'text-rose-500 dark:text-rose-400' : day.dayOfWeek === '토' ? 'text-indigo-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {day.dayOfWeek}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {weeklyData.length > 0 && weeklyData[0].users.map((user, userIdx) => (
                                    <tr key={user.id} className="hover:bg-stone-50 dark:hover:bg-slate-700 transition-colors group">
                                        <td className="p-2 border-b border-stone-100 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 sticky left-0 z-10 bg-white dark:bg-slate-800 group-hover:bg-stone-50 dark:group-hover:bg-slate-700 transition-colors border-r border-stone-200/50 dark:border-slate-600/50 text-sm truncate shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center text-[10px] font-bold border border-stone-200 dark:border-slate-600">
                                                    {user.name.slice(0, 1)}
                                                </div>
                                                <span>{user.name}</span>
                                                <button
                                                    onClick={() => downloadExcel(user.id, user.name)}
                                                    className="p-1 hover:bg-emerald-50 rounded text-emerald-500/50 hover:text-emerald-600 transition-all ml-auto"
                                                    title="엑셀 다운로드"
                                                >
                                                    <Download size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        {/* Current Week Cells */}
                                        {weeklyData.map((day) => {
                                            const status = day.users[userIdx].status;
                                            return (
                                                <td key={`current-${day.date}-${user.id}`} className="p-2 border-b border-stone-100 dark:border-slate-700 text-center border-r border-stone-100/50 dark:border-slate-700/50">
                                                    {status === 'DONE' ? (
                                                        <button
                                                            onClick={() => fetchDetail(day.date, user.id, user.name)}
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 hover:bg-emerald-100 hover:scale-110 transition-all cursor-pointer shadow-sm"
                                                        >
                                                            <span className="text-[10px] font-bold">O</span>
                                                        </button>
                                                    ) : (
                                                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-300 border border-rose-100">
                                                            <span className="text-[10px] font-bold">-</span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        {/* Next Week Cells */}
                                        {nextWeeklyData.map((day) => {
                                            const nextUser = day.users.find(u => u.id === user.id);
                                            const status = nextUser ? nextUser.status : 'MISSING';

                                            return (
                                                <td key={`next-${day.date}-${user.id}`} className="p-2 border-b border-stone-100 dark:border-slate-700 text-center border-r border-stone-100/50 dark:border-slate-700/50 last:border-r-0">
                                                    {status === 'DONE' ? (
                                                        <button
                                                            onClick={() => fetchDetail(day.date, user.id, user.name)}
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 hover:bg-emerald-100 hover:scale-110 transition-all cursor-pointer shadow-sm"
                                                        >
                                                            <span className="text-[10px] font-bold">O</span>
                                                        </button>
                                                    ) : (
                                                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-300 border border-rose-100">
                                                            <span className="text-[10px] font-bold">-</span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(loading || (weeklyData.length === 0 && nextWeeklyData.length === 0)) && (
                            <div className="p-10 text-center text-slate-400 dark:text-slate-400 bg-stone-50/50 dark:bg-slate-700/30">
                                데이터를 불러오는 중입니다...
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex justify-end space-x-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300"></div>
                    <span>작성 완료 (클릭하여 상세 보기)</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-rose-100 border border-rose-200"></div>
                    <span>미작성</span>
                </div>
            </div>

            {/* Detail Drawer */}
            {isDetailOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
                        onClick={() => setIsDetailOpen(false)}
                        role="presentation"
                    ></div>
                    <div className="fixed top-0 right-0 h-full w-[400px] bg-white dark:bg-slate-800 border-l border-stone-200 dark:border-slate-600 shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8 border-b border-stone-100 dark:border-slate-700 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{selectedUser?.name}님의 업무</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar size={14} className="text-slate-400 dark:text-slate-400" />
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{selectedUser?.date}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDetailOpen(false)}
                                    aria-label="닫기"
                                    className="p-2 text-slate-400 dark:text-slate-400 hover:text-slate-600 hover:bg-stone-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {detailLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-32 bg-stone-100 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                                    ))}
                                </div>
                            ) : detailData.length > 0 ? (
                                <div className="space-y-4">
                                    {detailData.map((job) => (
                                        <div key={job.id} className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-100 dark:border-indigo-800/30">
                                                    {job.projectName}
                                                </span>
                                            </div>
                                            <h4 className="text-slate-800 dark:text-slate-100 font-bold mb-2 whitespace-pre-wrap text-base">{job.title}</h4>
                                            {job.content && (
                                                <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap border-t border-stone-100 dark:border-slate-700 pt-3 mt-2 leading-relaxed">
                                                    {job.content}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400 dark:text-slate-400 border-2 border-dashed border-stone-200 dark:border-slate-600 rounded-2xl bg-stone-50/50 dark:bg-slate-700/30 flex flex-col items-center gap-3">
                                    <div className="p-3 bg-stone-100 dark:bg-slate-700 rounded-full">
                                        <Calendar size={24} className="opacity-50" />
                                    </div>
                                    <p className="font-medium">등록된 상세 업무 내용이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
            {/* Print Preview Modal */}
            {showPrintModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
                        {/* Modal Header (No Print) */}
                        <div className="p-6 border-b border-stone-100 dark:border-slate-700 flex items-center justify-between bg-stone-50/50 dark:bg-slate-700/30 no-print">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300">
                                    <Printer size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">프린트 미리보기</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        깔끔하게 출력되도록 재구성된 화면입니다.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors"
                                >
                                    <Printer size={18} />
                                    <span>인쇄하기</span>
                                </button>
                                <button
                                    onClick={() => setShowPrintModal(false)}
                                    aria-label="닫기"
                                    className="p-2.5 hover:bg-stone-200 dark:hover:bg-slate-600 rounded-full transition-colors text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <X size={24} aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content (Print Target) */}
                        <div className="flex-1 overflow-auto p-8 bg-white dark:bg-slate-800 print-content" id="print-content">
                            {/* Print Header */}
                            <div className="mb-8 text-center border-b-2 border-slate-800 dark:border-slate-200 pb-4">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">주간 업무 보고서</h1>
                                <p className="text-lg font-bold text-slate-600 dark:text-slate-300">
                                    팀명: <span className="text-indigo-700 dark:text-indigo-400">{selectedTeam?.name}</span>
                                    <span className="mx-4 text-slate-300 dark:text-slate-500">|</span>
                                    기간: {getWeekDateRange(selectedDate)}
                                </p>
                            </div>

                            {/* Data Table */}
                            <div className="w-full">
                                <table className="w-full text-left border-collapse border border-slate-300">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-700">
                                            <th className="p-2 border border-slate-300 w-[80px]" rowSpan={2}>이름</th>
                                            <th className="p-2 border border-slate-300 text-center font-bold" colSpan={7}>금주 (Current)</th>
                                            <th className="p-2 border border-slate-300 text-center font-bold" colSpan={7}>차주 (Next)</th>
                                        </tr>
                                        <tr className="bg-slate-50 text-slate-600">
                                            {/* Current Week Headers */}
                                            {weeklyData.map((day) => (
                                                <th key={`p-current-${day.date}`} className="p-2 border border-slate-300 text-center text-xs">
                                                    <div>{day.date.split('-').slice(1).join('.')}</div>
                                                    <div className={`${day.dayOfWeek === '일' ? 'text-rose-500' : day.dayOfWeek === '토' ? 'text-blue-500' : ''}`}>{day.dayOfWeek}</div>
                                                </th>
                                            ))}
                                            {/* Next Week Headers */}
                                            {nextWeeklyData.map((day) => (
                                                <th key={`p-next-${day.date}`} className="p-2 border border-slate-300 text-center text-xs">
                                                    <div>{day.date.split('-').slice(1).join('.')}</div>
                                                    <div className={`${day.dayOfWeek === '일' ? 'text-rose-500' : day.dayOfWeek === '토' ? 'text-blue-500' : ''}`}>{day.dayOfWeek}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {weeklyData.length > 0 && weeklyData[0].users.map((user, userIdx) => (
                                            <tr key={user.id} className="text-sm">
                                                <td className="p-2 border border-slate-300 font-bold text-center bg-slate-50">
                                                    {user.name}
                                                </td>
                                                {/* Current Week Cells */}
                                                {weeklyData.map((day) => {
                                                    const status = day.users[userIdx].status;
                                                    return (
                                                        <td key={`p-current-${day.date}-${user.id}`} className="p-2 border border-slate-300 text-center">
                                                            {status === 'DONE' ? (
                                                                <span className="text-green-600 font-bold">O</span>
                                                            ) : (
                                                                <span className="text-red-300 font-bold">-</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                {/* Next Week Cells */}
                                                {nextWeeklyData.map((day) => {
                                                    const nextUser = day.users.find(u => u.id === user.id);
                                                    const status = nextUser ? nextUser.status : 'MISSING';
                                                    return (
                                                        <td key={`p-next-${day.date}-${user.id}`} className="p-2 border border-slate-300 text-center">
                                                            {status === 'DONE' ? (
                                                                <span className="text-green-600 font-bold">O</span>
                                                            ) : (
                                                                <span className="text-red-300 font-bold">-</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-8 text-right text-xs text-slate-400 no-print">
                                * 인쇄 시 배경 그래픽 옵션을 켜면 더 선명하게 출력됩니다.
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ToastNotification show={showToast} message={toastMessage} />
        </div>
    );
}
