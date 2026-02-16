'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Save, Check, BarChart3, List, AlertTriangle, Activity, LayoutGrid } from 'lucide-react';
import { useDashboardPreferences } from '../../../lib/hooks/useDashboardPreferences';
import { WIDGET_REGISTRY } from '../../../lib/widget-registry';
import { WidgetDef, WidgetPref, WidgetCategory, hasRolePermission, CATEGORY_LABELS } from '../../../types/dashboard';

/** 위젯 렌더러 타입에 따른 미리보기 스켈레톤 */
function WidgetPreviewThumb({ rendererType, size }: { rendererType: string; size: string }) {
    const isSmall = size === 'small';
    return (
        <div className={`${isSmall ? 'w-10 h-10' : 'w-12 h-10'} bg-gradient-to-br from-slate-50 to-stone-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-stone-200/50`}>
            {rendererType === 'chart' && (
                <BarChart3 size={isSmall ? 14 : 16} className="text-indigo-400" />
            )}
            {rendererType === 'stat' && (
                <Activity size={isSmall ? 14 : 16} className="text-emerald-400" />
            )}
            {rendererType === 'list' && (
                <List size={isSmall ? 14 : 16} className="text-amber-400" />
            )}
            {rendererType === 'alert' && (
                <AlertTriangle size={isSmall ? 14 : 16} className="text-rose-400" />
            )}
            {!['chart', 'stat', 'list', 'alert'].includes(rendererType) && (
                <LayoutGrid size={isSmall ? 14 : 16} className="text-slate-400" />
            )}
        </div>
    );
}

export default function DashboardSettingsPage() {
    const router = useRouter();
    const { preferences, loading, saving, savePreferences, resetPreferences } = useDashboardPreferences();
    const [localPrefs, setLocalPrefs] = useState<WidgetPref[]>([]);
    const [userRole, setUserRole] = useState<string>('MEMBER');
    const [hasChanges, setHasChanges] = useState(false);
    const [activeCategory, setActiveCategory] = useState<WidgetCategory | 'all'>('all');
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' }>({ show: false, message: '', type: 'success' });

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                setUserRole(parsed.role || 'MEMBER');
            } catch (e) {
                console.error('Failed to parse user data', e);
            }
        }
    }, []);

    useEffect(() => {
        if (preferences.length > 0) {
            setLocalPrefs(preferences);
        }
    }, [preferences]);

    // 토스트 자동 닫기
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const showToast = (message: string, type: 'success' | 'info' = 'success') => {
        setToast({ show: true, message, type });
    };

    // 권한에 맞는 위젯만 필터
    const availableWidgets = WIDGET_REGISTRY.filter(w => hasRolePermission(userRole, w.minRole));

    // 카테고리별 그룹화
    const categories: WidgetCategory[] = ['personal', 'team', 'dept', 'company'];
    const allWidgetsByCategory = categories
        .map(cat => ({
            category: cat,
            label: CATEGORY_LABELS[cat],
            widgets: availableWidgets.filter(w => w.category === cat),
        }))
        .filter(g => g.widgets.length > 0);

    // 활성 필터에 따른 위젯 목록
    const filteredWidgetGroups = activeCategory === 'all'
        ? allWidgetsByCategory
        : allWidgetsByCategory.filter(g => g.category === activeCategory);

    const isWidgetEnabled = (widgetId: string): boolean => {
        const pref = localPrefs.find(p => p.id === widgetId);
        return pref?.enabled ?? false;
    };

    const toggleWidget = useCallback((widgetId: string) => {
        setLocalPrefs(prev => {
            const existing = prev.find(p => p.id === widgetId);
            if (existing) {
                return prev.map(p => p.id === widgetId ? { ...p, enabled: !p.enabled } : p);
            }
            // 새로 추가
            return [...prev, { id: widgetId, enabled: true, order: prev.length }];
        });
        setHasChanges(true);
    }, []);

    const handleSave = async () => {
        try {
            await savePreferences(localPrefs);
            setHasChanges(false);
            showToast('위젯 설정이 저장되었습니다.', 'success');
            setTimeout(() => router.push('/dashboard'), 800);
        } catch {
            showToast('저장에 실패했습니다. 다시 시도해주세요.', 'info');
        }
    };

    const handleReset = async () => {
        try {
            await resetPreferences();
            setHasChanges(false);
            showToast('기본 설정으로 초기화되었습니다.', 'info');
        } catch {
            showToast('초기화에 실패했습니다.', 'info');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold animate-pulse">설정을 불러오는 중...</p>
            </div>
        );
    }

    // 활성화된 위젯 수
    const enabledCount = localPrefs.filter(p => p.enabled).length;

    // 카테고리 필터 탭 데이터
    const categoryTabs: { key: WidgetCategory | 'all'; label: string; count: number }[] = [
        { key: 'all', label: '전체', count: availableWidgets.length },
        ...categories
            .map(cat => ({
                key: cat as WidgetCategory | 'all',
                label: CATEGORY_LABELS[cat],
                count: availableWidgets.filter(w => w.category === cat).length,
            }))
            .filter(t => t.count > 0),
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            {/* 토스트 메시지 */}
            {toast.show && (
                <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right duration-300">
                    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border ${
                        toast.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                    }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            toast.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}>
                            <Check size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-bold">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2.5 rounded-xl hover:bg-stone-100 border border-transparent hover:border-stone-200 transition-all"
                    >
                        <ArrowLeft size={20} className="text-slate-500" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">위젯 설정</h2>
                        <p className="text-slate-500 font-medium mt-1">
                            대시보드에 표시할 위젯을 선택하세요. 위젯의 크기와 순서는 대시보드에서 직접 조정할 수 있습니다.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-400 mr-2">
                        {enabledCount}개 활성
                    </span>
                    <button
                        onClick={handleReset}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-stone-100 border border-stone-200 transition-all disabled:opacity-50"
                    >
                        <RotateCcw size={14} />
                        초기화
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={14} />
                        {saving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>

            {/* 카테고리 필터 탭 */}
            <div className="flex items-center gap-2 flex-wrap">
                {categoryTabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveCategory(tab.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                            activeCategory === tab.key
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'bg-white text-slate-500 border border-stone-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/50'
                        }`}
                    >
                        {tab.label}
                        <span className={`ml-1.5 text-xs ${
                            activeCategory === tab.key ? 'text-indigo-200' : 'text-slate-400'
                        }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* 카테고리별 위젯 토글 */}
            {filteredWidgetGroups.map(group => (
                <div key={group.category} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">
                        {group.label} 위젯 ({group.widgets.length}개)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.widgets.map((widget: WidgetDef) => {
                            const enabled = isWidgetEnabled(widget.id);
                            return (
                                <button
                                    key={widget.id}
                                    onClick={() => toggleWidget(widget.id)}
                                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${enabled
                                        ? 'border-indigo-300 bg-gradient-to-r from-indigo-50/60 to-purple-50/30 shadow-sm'
                                        : 'border-stone-100 bg-stone-50 hover:border-stone-200 hover:bg-stone-100/50'
                                        }`}
                                >
                                    <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${enabled
                                        ? 'bg-indigo-600 border-indigo-600'
                                        : 'border-stone-300 bg-white'
                                        }`}>
                                        {enabled && (
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* 미리보기 썸네일 */}
                                    <WidgetPreviewThumb rendererType={widget.rendererType} size={widget.size} />

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-700 truncate">{widget.title}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{widget.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase bg-stone-100 px-1.5 py-0.5 rounded">
                                                {widget.size}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase bg-stone-100 px-1.5 py-0.5 rounded">
                                                {widget.rendererType}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
