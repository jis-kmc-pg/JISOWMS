'use client';

import React, { useState, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { GripVertical, Maximize2, Minimize2, Move } from 'lucide-react';
import { WidgetDef, WidgetPref, WidgetSize, hasRolePermission } from '../../../types/dashboard';
import { WIDGET_REGISTRY } from '../../../lib/widget-registry';
import { useDashboardPreferences } from '../../../lib/hooks/useDashboardPreferences';
import WidgetContainer from './WidgetContainer';

interface WidgetGridProps {
    preferences: WidgetPref[];
    userRole: string;
}

const sizeClasses: Record<string, string> = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large: 'col-span-1 md:col-span-2 lg:col-span-4',
};

const SIZE_CYCLE: WidgetSize[] = ['small', 'medium', 'large'];

interface SortableWidgetProps {
    def: WidgetDef;
    currentSize: WidgetSize;
    onResize: (id: string, size: WidgetSize) => void;
    isDragActive: boolean;
}

function SortableWidget({ def, currentSize, onResize, isDragActive }: SortableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        isDragging,
    } = useSortable({ id: def.id });

    const handleResize = () => {
        const currentIdx = SIZE_CYCLE.indexOf(currentSize);
        const nextSize = SIZE_CYCLE[(currentIdx + 1) % SIZE_CYCLE.length];
        onResize(def.id, nextSize);
    };
    const SizeIcon = currentSize === 'large' ? Minimize2 : Maximize2;

    return (
        <div
            ref={setNodeRef}
            className={`${sizeClasses[currentSize] || 'col-span-1'} group relative transition-opacity duration-200 h-full overflow-hidden ${
                isDragging ? 'opacity-25 ring-2 ring-indigo-300 ring-dashed rounded-2xl' : ''
            }`}
        >
            {/* 드래그 핸들 + 리사이즈 버튼 */}
            <div className={`absolute top-2 right-2 z-20 flex items-center gap-1 transition-opacity ${
                isDragActive ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
            }`}>
                <button
                    onClick={handleResize}
                    className="p-1 rounded-lg bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 border border-stone-200 dark:border-slate-600 shadow-sm text-slate-400 hover:text-indigo-500 transition-all"
                    title={`크기 변경 (현재: ${currentSize})`}
                >
                    <SizeIcon size={12} />
                </button>
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1 rounded-lg bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 border border-stone-200 dark:border-slate-600 shadow-sm text-slate-400 hover:text-indigo-500 cursor-grab active:cursor-grabbing transition-all"
                    title="드래그하여 이동"
                >
                    <GripVertical size={12} />
                </button>
            </div>
            <WidgetContainer widgetDef={{ ...def, size: currentSize }} />
        </div>
    );
}

export default function WidgetGrid({ preferences, userRole }: WidgetGridProps) {
    const { savePreferences } = useDashboardPreferences();
    const [localPrefs, setLocalPrefs] = useState<WidgetPref[]>(preferences);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    // 활성화된 위젯만 순서대로 정렬
    const enabledPrefs = localPrefs
        .filter(p => p.enabled)
        .sort((a, b) => a.order - b.order);

    // 위젯 정의 매핑 + 권한 체크
    const widgets: { def: WidgetDef; pref: WidgetPref }[] = [];
    for (const pref of enabledPrefs) {
        const def = WIDGET_REGISTRY.find(w => w.id === pref.id);
        if (def && hasRolePermission(userRole, def.minRole)) {
            widgets.push({ def, pref });
        }
    }

    const activeWidget = activeId
        ? widgets.find(w => w.def.id === activeId)
        : null;

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = widgets.findIndex(w => w.def.id === active.id);
        const newIndex = widgets.findIndex(w => w.def.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(widgets, oldIndex, newIndex);

        // 새 순서로 preferences 업데이트
        const newPrefs = localPrefs.map(p => {
            const newOrder = reordered.findIndex(w => w.def.id === p.id);
            return newOrder >= 0 ? { ...p, order: newOrder } : p;
        });

        setLocalPrefs(newPrefs);
        savePreferences(newPrefs).catch(() => {});
    }, [widgets, localPrefs, savePreferences]);

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
    }, []);

    const handleResize = useCallback((id: string, size: WidgetSize) => {
        const newPrefs = localPrefs.map(p =>
            p.id === id ? { ...p, size } : p
        );
        setLocalPrefs(newPrefs);
        savePreferences(newPrefs).catch(() => {});
    }, [localPrefs, savePreferences]);

    if (widgets.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500 font-medium">
                표시할 위젯이 없습니다. 설정에서 위젯을 추가해주세요.
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <SortableContext
                items={widgets.map(w => w.def.id)}
                strategy={rectSortingStrategy}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[250px]">
                    {widgets.map(({ def, pref }) => (
                        <SortableWidget
                            key={def.id}
                            def={def}
                            currentSize={pref.size || def.size}
                            onResize={handleResize}
                            isDragActive={activeId !== null}
                        />
                    ))}
                </div>
            </SortableContext>

            {/* 드래그 오버레이: 커서를 따라다니는 위젯 미리보기 */}
            <DragOverlay dropAnimation={null}>
                {activeWidget && (
                    <div className="rounded-2xl shadow-2xl ring-2 ring-indigo-400 opacity-90 pointer-events-none max-w-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-3">
                            <Move size={16} className="text-indigo-500 flex-shrink-0" />
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate">
                                {activeWidget.def.title}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 bg-stone-100 dark:bg-slate-700 px-2 py-0.5 rounded-md flex-shrink-0">
                                {activeWidget.pref.size || activeWidget.def.size}
                            </span>
                        </div>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
