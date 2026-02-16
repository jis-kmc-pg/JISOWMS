'use client';

import React, { Component } from 'react';
import useSWR from 'swr';
import api from '../../../lib/api';
import { WidgetDef } from '../../../types/dashboard';
import WidgetRenderer from './WidgetRenderer';

// 개별 위젯 렌더 에러를 격리하는 ErrorBoundary
class WidgetErrorBoundary extends Component<
    { title: string; children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { title: string; children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-amber-100 dark:border-amber-900 shadow-sm h-full flex items-center justify-center min-h-[120px]">
                    <div className="text-center">
                        <p className="text-sm text-amber-500 font-medium">위젯을 표시할 수 없습니다.</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{this.props.title}</p>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// SWR fetcher
const fetcher = (url: string) => api.get(url).then(res => res.data);

interface WidgetContainerProps {
    widgetDef: WidgetDef;
}

export default function WidgetContainer({ widgetDef }: WidgetContainerProps) {
    // client-only 위젯 (apiPath 없음) 은 API 호출 생략
    const { data, error, isLoading } = useSWR(
        widgetDef.apiPath || null,
        fetcher,
        {
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            refreshInterval: 5 * 60 * 1000, // 5분마다 자동 갱신
            dedupingInterval: 30 * 1000,     // 30초 중복 요청 방지
        }
    );

    // client-only widget
    if (!widgetDef.apiPath) {
        return (
            <WidgetErrorBoundary title={widgetDef.title}>
                <WidgetRenderer widgetDef={widgetDef} data={{}} />
            </WidgetErrorBoundary>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-stone-200 dark:border-slate-700 shadow-sm h-full flex items-center justify-center min-h-[120px]">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 rounded-full animate-spin"></div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{widgetDef.title}</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-red-100 dark:border-red-900 shadow-sm h-full flex items-center justify-center min-h-[120px]">
                <div className="text-center">
                    <p className="text-sm text-red-400 font-medium">데이터를 불러올 수 없습니다.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{widgetDef.title}</p>
                </div>
            </div>
        );
    }

    return (
        <WidgetErrorBoundary title={widgetDef.title}>
            <WidgetRenderer widgetDef={widgetDef} data={data} />
        </WidgetErrorBoundary>
    );
}
