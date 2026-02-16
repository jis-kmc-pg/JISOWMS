'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, UserX } from 'lucide-react';

interface TeamReportRateWidgetProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    size: 'small' | 'medium' | 'large';
}

export default function TeamReportRateWidget({ data, size }: TeamReportRateWidgetProps) {
    const isSmall = size === 'small';
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
        ? 'bg-emerald-50'
        : missing >= 3
            ? 'bg-rose-50'
            : 'bg-amber-50';

    // ── Small: 컴팩트 stat 카드 (rate% + missing count 인라인) ──
    if (isSmall) {
        return (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide truncate">
                        업무보고 작성률
                    </p>
                    <div className={`p-1.5 rounded-lg ${statusBg} ${statusColor}`}>
                        {isComplete ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    </div>
                </div>

                <div className="flex-1 min-h-0 flex items-center justify-center">
                    {total > 0 ? (
                        <div className="flex items-center gap-3 w-full">
                            <span className={`text-3xl font-black tabular-nums ${statusColor}`}>
                                {entryRate.toFixed(0)}%
                            </span>
                            {missing > 0 && (
                                <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">
                                    {missing}명 미작성
                                </span>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 font-medium">데이터 없음</p>
                    )}
                </div>
            </div>
        );
    }

    // ── Large: 확장 레이아웃 (멤버 이름 목록 + 넓은 차트) ──
    if (isLarge) {
        const displayMembers = incompleteMembers.slice(0, 6);
        const moreCount = incompleteMembers.length - displayMembers.length;
        return (
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
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
                                <span className="text-2xl font-bold text-slate-500 tabular-nums">{total}</span>
                                <span className="text-lg text-slate-400 font-bold ml-0.5">명</span>
                            </div>

                            {/* 프로그래스 바 */}
                            <div className="w-full mt-2 h-2.5 bg-stone-100 rounded-full overflow-hidden">
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

                            <p className="text-xs text-slate-400 font-bold mt-1 tabular-nums">
                                작성률 {entryRate.toFixed(0)}%
                            </p>
                        </div>

                        {/* 우측: 미작성자 명단 */}
                        <div className="w-56 flex flex-col border-l border-stone-100 pl-4">
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
                                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-100"
                                            >
                                                <div className="w-5 h-5 rounded-full bg-rose-200 text-rose-600 flex items-center justify-center text-[9px] font-black flex-shrink-0">
                                                    {name.charAt(0)}
                                                </div>
                                                <span className="text-xs font-bold text-rose-600 truncate">
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
                        <p className="text-xs text-slate-400 font-medium text-center">
                            팀 데이터가 없습니다
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // ── Medium: 기존 레이아웃 (기본) ──
    const displayMembers = incompleteMembers.slice(0, 4);
    const moreCount = incompleteMembers.length - displayMembers.length;
    return (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                    팀원 업무보고 작성률
                </p>
                <div className={`p-1.5 rounded-lg ${statusBg} ${statusColor}`}>
                    {isComplete ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                </div>
            </div>

            {/* 메인 숫자 */}
            {total > 0 ? (
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
                    <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-black tabular-nums ${statusColor}`}>
                            {completed}
                        </span>
                        <span className="text-xl font-bold text-slate-300">/</span>
                        <span className="text-xl font-bold text-slate-500 tabular-nums">{total}</span>
                        <span className="text-base text-slate-400 font-bold ml-0.5">명</span>
                    </div>

                    {/* 프로그래스 바 */}
                    <div className="w-full mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
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

                    <p className="text-xs text-slate-400 font-bold mt-1 tabular-nums">
                        작성률 {entryRate.toFixed(0)}%
                    </p>

                    {/* 미작성자 명단 */}
                    {incompleteMembers.length > 0 && (
                        <div className="w-full mt-2 pt-2 border-t border-stone-100">
                            <div className="flex items-center gap-1.5 mb-1">
                                <UserX size={12} className="text-rose-400" />
                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                                    미작성자
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {displayMembers.map((name, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100"
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
                    )}

                    {incompleteMembers.length === 0 && missing > 0 && (
                        <div className="w-full mt-2 pt-2 border-t border-stone-100">
                            <p className="text-xs text-amber-500 font-bold text-center">
                                {missing}명 미작성
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex items-center justify-center">
                    <p className="text-xs text-slate-400 font-medium text-center">
                        팀 데이터가 없습니다
                    </p>
                </div>
            )}
        </div>
    );
}
