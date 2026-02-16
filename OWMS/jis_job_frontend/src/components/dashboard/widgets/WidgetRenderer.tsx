'use client';

import React, { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { WidgetDef, WidgetSize } from '../../../types/dashboard';
import StatCard from '../StatCard';
import DashboardChart from '../DashboardChart';
import ListRenderer from './renderers/ListRenderer';
import AlertRenderer from './renderers/AlertRenderer';

// Calendar (window 객체 필요)
const CalendarRenderer = dynamic(() => import('./renderers/CalendarRenderer'), { ssr: false });

// ── MEMBER 위젯 ──
const WeeklyReportStatusWidget = dynamic(() => import('./custom/WeeklyReportStatusWidget'));
const DispatchOverviewWidget = dynamic(() => import('./custom/DispatchOverviewWidget'));
const RoomAvailabilityWidget = dynamic(() => import('./custom/RoomAvailabilityWidget'));
const VacationStatusWidget = dynamic(() => import('./custom/VacationStatusWidget'));
const RecentNoticesWidget = dynamic(() => import('./custom/RecentNoticesWidget'));
const BoardLatestWidget = dynamic(() => import('./custom/BoardLatestWidget'));
const QuickLinksWidget = dynamic(() => import('./custom/QuickLinksWidget'));

// ── TEAM_LEADER 위젯 ──
const TeamReportRateWidget = dynamic(() => import('./custom/TeamReportRateWidget'));
const TeamReportSummaryListWidget = dynamic(() => import('./custom/TeamReportSummaryListWidget'));
const TeamVacationTableWidget = dynamic(() => import('./custom/TeamVacationTableWidget'));
const TeamAttendanceWidget = dynamic(() => import('./custom/TeamAttendanceWidget'));
const TeamDispatchScheduleWidget = dynamic(() => import('./custom/TeamDispatchScheduleWidget'));
const TeamMeetingsWidget = dynamic(() => import('./custom/TeamMeetingsWidget'));
const TeamProjectsWidget = dynamic(() => import('./custom/TeamProjectsWidget'));
const PendingApprovalsWidget = dynamic(() => import('./custom/PendingApprovalsWidget'));

// ── DEPT_HEAD 위젯 ──
const DeptReportComparisonWidget = dynamic(() => import('./custom/DeptReportComparisonWidget'));
const DeptHeadcountWidget = dynamic(() => import('./custom/DeptHeadcountWidget'));
const DeptVacationStatsWidget = dynamic(() => import('./custom/DeptVacationStatsWidget'));
const DeptAttendanceStatsWidget = dynamic(() => import('./custom/DeptAttendanceStatsWidget'));
const DeptProjectsWidget = dynamic(() => import('./custom/DeptProjectsWidget'));
const DeptResourceUtilWidget = dynamic(() => import('./custom/DeptResourceUtilWidget'));
const ReportKeywordAnalysisWidget = dynamic(() => import('./custom/ReportKeywordAnalysisWidget'));

// ── EXECUTIVE/CEO 위젯 ──
const CompanyHeadcountWidget = dynamic(() => import('./custom/CompanyHeadcountWidget'));
const CompanyReportRateWidget = dynamic(() => import('./custom/CompanyReportRateWidget'));
const MonthlyVacationTrendWidget = dynamic(() => import('./custom/MonthlyVacationTrendWidget'));
const CompanyProjectsWidget = dynamic(() => import('./custom/CompanyProjectsWidget'));
const VehicleUtilizationWidget = dynamic(() => import('./custom/VehicleUtilizationWidget'));
const CompanyMeetingUtilWidget = dynamic(() => import('./custom/CompanyMeetingUtilWidget'));
const NoticesMgmtWidget = dynamic(() => import('./custom/NoticesMgmtWidget'));
const ExecutiveApprovalsWidget = dynamic(() => import('./custom/ExecutiveApprovalsWidget'));
const WorkforceUtilizationWidget = dynamic(() => import('./custom/WorkforceUtilizationWidget'));

// lucide icon 문자열 매핑
import * as LucideIcons from 'lucide-react';

function getLucideIcon(name: string): LucideIcons.LucideIcon {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const icons = LucideIcons as any;
    return (icons[name] || LucideIcons.LayoutDashboard) as LucideIcons.LucideIcon;
}

// ── Custom 위젯 ID → Component 매핑 ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CUSTOM_WIDGETS: Record<string, ComponentType<{ data: any; size: WidgetSize }>> = {
    // MEMBER
    'weekly-report-status': WeeklyReportStatusWidget,
    'dispatch-overview': DispatchOverviewWidget,
    'room-availability': RoomAvailabilityWidget,
    'vacation-status': VacationStatusWidget,
    'recent-notices': RecentNoticesWidget,
    'board-latest': BoardLatestWidget,
    'quick-links': QuickLinksWidget,
    // TEAM_LEADER
    'team-report-rate': TeamReportRateWidget,
    'team-report-summary': TeamReportSummaryListWidget,
    'team-vacation-table': TeamVacationTableWidget,
    'team-attendance': TeamAttendanceWidget,
    'team-dispatch-schedule': TeamDispatchScheduleWidget,
    'team-meeting-status': TeamMeetingsWidget,
    'team-projects': TeamProjectsWidget,
    'pending-approvals': PendingApprovalsWidget,
    // DEPT_HEAD
    'dept-report-comparison': DeptReportComparisonWidget,
    'dept-headcount': DeptHeadcountWidget,
    'dept-vacation-stats': DeptVacationStatsWidget,
    'dept-attendance-stats': DeptAttendanceStatsWidget,
    'dept-projects': DeptProjectsWidget,
    'dept-resource-util': DeptResourceUtilWidget,
    'report-keyword-analysis': ReportKeywordAnalysisWidget,
    // EXECUTIVE/CEO
    'company-headcount': CompanyHeadcountWidget,
    'company-report-rate': CompanyReportRateWidget,
    'company-vacation-trend': MonthlyVacationTrendWidget,
    'company-projects': CompanyProjectsWidget,
    'vehicle-utilization': VehicleUtilizationWidget,
    'company-meeting-util': CompanyMeetingUtilWidget,
    'company-notices-mgmt': NoticesMgmtWidget,
    'executive-approvals': ExecutiveApprovalsWidget,
    'workforce-utilization': WorkforceUtilizationWidget,
};

interface WidgetRendererProps {
    widgetDef: WidgetDef;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
}

export default function WidgetRenderer({ widgetDef, data }: WidgetRendererProps) {
    const { rendererType } = widgetDef;

    // ── stat 타입 ──
    if (rendererType === 'stat' && widgetDef.statConfig) {
        const cfg = widgetDef.statConfig;
        const Icon = getLucideIcon(cfg.icon);
        let value = getNestedValue(data, cfg.valueKey);

        if (cfg.format === 'percent') value = `${value}%`;
        else if (cfg.format === 'days') value = `${value}일`;
        else if (cfg.format === 'number') value = `${value}`;

        const label = cfg.labelKey ? getNestedValue(data, cfg.labelKey) : undefined;
        const trend = label !== undefined ? `${label}` : undefined;

        return (
            <StatCard
                title={widgetDef.title}
                value={value ?? '-'}
                icon={Icon}
                color={cfg.color}
                trend={trend}
            />
        );
    }

    // ── chart 타입 ──
    if (rendererType === 'chart' && widgetDef.chartConfig) {
        const cfg = widgetDef.chartConfig;
        const chartData = Array.isArray(data) ? data : (data?.data || data?.stats || []);

        return (
            <DashboardChart
                title={widgetDef.title}
                type={cfg.chartType}
                data={chartData}
                dataKey={cfg.dataKey}
                categoryKey={cfg.categoryKey}
                stacked={cfg.stacked}
                height={cfg.height}
            />
        );
    }

    // ── list 타입 ──
    if (rendererType === 'list' && widgetDef.listConfig) {
        const listData = Array.isArray(data) ? data : (data?.data || data?.items || data?.stats?.nextWeekPlans || []);
        return (
            <ListRenderer
                title={widgetDef.title}
                config={widgetDef.listConfig}
                data={listData}
            />
        );
    }

    // ── alert 타입 ──
    if (rendererType === 'alert' && widgetDef.alertConfig) {
        return (
            <AlertRenderer
                title={widgetDef.title}
                config={widgetDef.alertConfig}
                data={data}
            />
        );
    }

    // ── calendar 타입 ──
    if (rendererType === 'calendar') {
        return <CalendarRenderer title={widgetDef.title} data={data} size={widgetDef.size} />;
    }

    // ── custom 타입 (Map 기반 dispatch) ──
    if (rendererType === 'custom') {
        const Widget = CUSTOM_WIDGETS[widgetDef.id];
        if (Widget) {
            return <Widget data={data} size={widgetDef.size} />;
        }
    }

    // fallback
    return (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-full flex items-center justify-center">
            <p className="text-sm text-slate-400">{widgetDef.title} (미구현)</p>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}
