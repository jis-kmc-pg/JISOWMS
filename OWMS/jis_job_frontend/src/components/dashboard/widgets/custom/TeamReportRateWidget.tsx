'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, UserX } from 'lucide-react';

interface TeamReportRateWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

export default function TeamReportRateWidget({ data, size }: TeamReportRateWidgetProps) {
    const isLarge = size === 'large';

    // /work-status/summary 에서 teams[0] = 내 팀
    const teams = data?.teams ?? [];
    const myTeam = teams[0];
    const entryRate = Number(myTeam?.entryRate ?? data?.entryRate ?? 0) || 0;

    // 직접 completed/total 이 있으면 사용, 없으면 entryRate 로 역산
    const total = Number(myTeam?.total ?? data?.total ?? 0) || 0;
    const completed = Number(
        myTeam?.completed ?? data?.completed ?? (total > 0 ? Math.round((entryRate / 100) * total) : 0)
    ) || 0;
    const missing = Math.max(0, total - completed);

    // 미작성자 목록 (currentWeek.incomplete 에 이름 배열 또는 객체 배열)
    const rawIncomplete: unknown[] =
        myTeam?.currentWeek?.incomplete ?? myTeam?.incomplete ?? data?.incomplete ?? [];
    const incompleteMembers: string[] = (Array.isArray(rawIncomplete) ? rawIncomplete : []).map(
        (item: unknown) => (typeof item === 'string' ? item : (item as { name?: string })?.name ?? '?')
    );

    // 상태 색상
    const isComplete = total > 0 && completed === total;
    const statusColor = isComplete
        ? 'text-emerald-500'
        : missing >= 3
            ? 'text-rose-500'
            : 'text-amber-500';

    const statusBg = isComplete
        ? 'bg-emerald-50 dark:bg-emerald-900/30'
        : missing >= 3
            ? 'bg-rose-50 dark:bg-rose-900/30'
            : 'bg-amber-50 dark:bg-amber-900/30';

    // ── Small은 medium과 동일 레이아웃 사용 (이번주/다음주 분할) ──

    // ── Large: 확장 레이아웃 (멤버 이름 목록 + 넓은 차트) ──
    if (isLarge) {
        const displayMembers = incompleteMembers.slice(0, 6);
        const moreCount = incompleteMembers.length - displayMembers.length;
        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        팀원 업무보고 작성률
                    </p>
                    <div className={`p-1.5 rounded-lg ${statusBg} ${statusColor}`}>
                        {isComplete ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    </div>
                </div>

                {total > 0 ? (
                    <div className="flex-1 min-h-0 flex gap-4">
                        {/* 좌측: 메인 숫자 + 프로그래스 */}
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="flex items-baseline gap-1">
                                <span className={`text-4xl font-black tabular-nums ${statusColor}`}>
                                    {completed}
                                </span>
                                <span className="text-2xl font-bold text-slate-300">/</span>
                                <span className="text-2xl font-bold text-slate-500 dark:text-slate-400 tabular-nums">{total}</span>
                                <span className="text-lg text-slate-400 dark:text-slate-400 font-bold ml-0.5">명</span>
                            </div>

                            {/* 프로그래스 바 */}
                            <div className="w-full mt-2 h-2.5 bg-stone-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${
                                        isComplete
                                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                            : missing >= 3
                                                ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                                                : 'bg-gradient-to-r from-amber-400 to-amber-500'
                                    }`}
                                    style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
                                />
                            </div>

                            <p className="text-xs text-slate-400 dark:text-slate-400 font-bold mt-1 tabular-nums">
                                작성률 {entryRate.toFixed(0)}%
                            </p>
                        </div>

                        {/* 우측: 미작성자 명단 */}
                        <div className="w-56 flex flex-col border-l border-stone-100 dark:border-slate-700 pl-4">
                            {incompleteMembers.length > 0 ? (
                                <>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <UserX size={14} className="text-rose-400" />
                                        <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                                            미작성자 ({incompleteMembers.length}명)
                                        </span>
                                    </div>
                                    <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
                                        {displayMembers.map((name, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800/30"
                                            >
                                                <div className="w-5 h-5 rounded-full bg-rose-200 dark:bg-rose-800/50 text-rose-600 dark:text-rose-300 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                                                    {name.charAt(0)}
                                                </div>
                                                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 truncate">
                                                    {name}
                                                </span>
                                            </div>
                                        ))}
                                        {moreCount > 0 && (
                                            <p className="text-[10px] text-rose-400 font-bold text-center">+{moreCount}명 더</p>
                                        )}
                                    </div>
                                </>
                            ) : missing > 0 ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <p className="text-sm text-amber-500 font-bold text-center">
                                        {missing}명 미작성
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-1" />
                                        <p className="text-xs text-emerald-500 font-bold">전원 작성 완료</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        <p className="text-xs text-slate-400 dark:text-slate-400 font-medium text-center">
                            팀 데이터가 없습니다
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // ── Medium: 이번주 / 다음주 좌우 분할 + 미작성자 ──
    const cw = myTeam?.currentWeek ?? {};
    const nw = myTeam?.nextWeek ?? {};
    const cwTotal = Number(cw.total ?? total) || 0;
    const cwCompleted = Number(cw.completed ?? completed) || 0;
    const cwRate = cwTotal > 0 ? Math.round((cwCompleted / cwTotal) * 100) : 0;
    const nwTotal = Number(nw.total ?? cwTotal) || 0;
    const nwCompleted = Number(nw.completed ?? 0) || 0;
    const nwRate = nwTotal > 0 ? Math.round((nwCompleted / nwTotal) * 100) : 0;

    const displayMembers = incompleteMembers.slice(0, 4);
    const moreCount = incompleteMembers.length - displayMembers.length;

    const weekCard = (label: string, c: number, t: number, rate: number) => {
        const done = t > 0 && c === t;
        const miss = Math.max(0, t - c);
        const color = done ? 'text-emerald-500' : miss >= 3 ? 'text-rose-500' : 'text-amber-500';
        const barClass = done
            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
            : miss >= 3
                ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                : 'bg-gradient-to-r from-amber-400 to-amber-500';
        return (
            <div className="flex-1 flex flex-col items-center px-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{label}</span>
                <div className="flex items-baseline gap-0.5 mt-0.5">
                    <span className={`text-2xl font-black tabular-nums ${color}`}>{c}</span>
                    <span className="text-base font-bold text-slate-300">/</span>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 tabular-nums">{t}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold ml-0.5">명</span>
                </div>
                <div className="w-full mt-1.5 h-1.5 bg-stone-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${barClass}`}
                        style={{ width: t > 0 ? `${(c / t) * 100}%` : '0%' }}
                    />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold mt-1 tabular-nums">{rate}%</p>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    팀원 업무보고 작성률
                </p>
                <div className={`p-1.5 rounded-lg ${statusBg} ${statusColor}`}>
                    {isComplete ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                </div>
            </div>

            {total > 0 ? (
                <div className="flex-1 min-h-0 flex flex-col">
                    {/* 이번주 / 다음주 좌우 분할 */}
                    <div className="flex items-stretch divide-x divide-stone-100 dark:divide-slate-700">
                        {weekCard('이번주', cwCompleted, cwTotal, cwRate)}
                        {weekCard('다음주', nwCompleted, nwTotal, nwRate)}
                    </div>

                    {/* 이번주 미작성자 명단 */}
                    {incompleteMembers.length > 0 ? (
                        <div className="w-full mt-2 pt-2 border-t border-stone-100 dark:border-slate-700">
                            <div className="flex items-center gap-1.5 mb-1">
                                <UserX size={12} className="text-rose-400" />
                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                                    이번주 미작성자
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {displayMembers.map((name, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30"
                                    >
                                        {name}
                                    </span>
                                ))}
                                {moreCount > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold text-rose-400">
                                        +{moreCount}명
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : missing > 0 ? (
                        <div className="w-full mt-2 pt-2 border-t border-stone-100 dark:border-slate-700">
                            <p className="text-xs text-amber-500 font-bold text-center">
                                이번주 {missing}명 미작성
                            </p>
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex items-center justify-center">
                    <p className="text-xs text-slate-400 dark:text-slate-400 font-medium text-center">
                        팀 데이터가 없습니다
                    </p>
                </div>
            )}
        </div>
    );
}
