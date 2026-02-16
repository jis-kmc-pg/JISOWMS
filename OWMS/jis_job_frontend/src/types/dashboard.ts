export type WidgetSize = 'small' | 'medium' | 'large';
export type WidgetCategory = 'personal' | 'team' | 'dept' | 'company';
export type RendererType = 'stat' | 'chart' | 'list' | 'alert' | 'calendar' | 'custom';

export interface WidgetDef {
    id: string;
    title: string;
    description: string;
    category: WidgetCategory;
    minRole: string;
    size: WidgetSize;
    rendererType: RendererType;
    /** API 경로 (dynamic params는 런타임에 치환) */
    apiPath: string;
    /** stat 타입용 추가 설정 */
    statConfig?: {
        icon: string; // lucide icon 이름
        color: string;
        valueKey: string;
        labelKey?: string;
        format?: 'number' | 'percent' | 'days';
    };
    /** chart 타입용 추가 설정 */
    chartConfig?: {
        chartType: 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'horizontal-bar' | 'radar' | 'bar-donut';
        dataKey: string | string[];
        categoryKey?: string;
        stacked?: boolean;
        height?: number;
    };
    /** list 타입용 추가 설정 */
    listConfig?: {
        columns: { key: string; label: string; format?: string }[];
        emptyMessage?: string;
        maxItems?: number;
        linkTo?: string;
    };
    /** alert 타입용 설정 */
    alertConfig?: {
        checkKey: string; // data에서 확인할 키
        okMessage: string;
        warnMessage: string;
        icon: string;
    };
}

export interface WidgetPref {
    id: string;
    enabled: boolean;
    order: number;
    /** 사용자가 리사이즈한 크기 (미지정 시 레지스트리 기본 size 사용) */
    size?: WidgetSize;
}

export const ROLE_HIERARCHY = ['MEMBER', 'TEAM_LEADER', 'DEPT_HEAD', 'EXECUTIVE', 'CEO'];

export function hasRolePermission(userRole: string, minRole: string): boolean {
    return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minRole);
}

export const CATEGORY_LABELS: Record<WidgetCategory, string> = {
    personal: '개인',
    team: '팀',
    dept: '부서',
    company: '전사',
};
