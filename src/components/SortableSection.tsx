import { type ReactNode, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    arrayMove,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OrderableItem } from '../utils/mergeWithOrder';

// 单个可拖拽条目：包裹内容，左侧加拖拽手柄
function SortableItem({ id, children }: { id: string; children: ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className={`content-item sortable-item ${isDragging ? 'dragging' : ''}`}>
            <button
                type="button"
                ref={setActivatorNodeRef}
                className="drag-handle"
                aria-label="拖动排序"
                {...attributes}
                {...listeners}
            >
                ⋮⋮
            </button>
            {children}
        </div>
    );
}

interface SortableSectionProps {
    // 已按 order 排好序的条目列表
    items: OrderableItem[];
    // 拖拽完成回调，参数为新的 id 顺序
    onReorder: (newOrder: string[]) => void;
}

// 可排序区块：提供 DndContext + SortableContext
export function SortableSection({ items, onReorder }: SortableSectionProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const ids = useMemo(() => items.map((i) => i.id), [items]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = ids.indexOf(String(active.id));
        const newIndex = ids.indexOf(String(over.id));
        // 边界校验
        if (oldIndex < 0 || newIndex < 0) return;
        if (oldIndex >= items.length || newIndex >= items.length) return;
        const newOrder = arrayMove(ids, oldIndex, newIndex);
        onReorder(newOrder);
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                    <SortableItem key={item.id} id={item.id}>
                        {item.node}
                    </SortableItem>
                ))}
            </SortableContext>
        </DndContext>
    );
}
