import { useState } from 'react';
import type { ContentType } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { SortableSection } from '../SortableSection';
import { mergeWithOrder } from '../../utils/mergeWithOrder';
import type { OrderableItem } from '../../utils/mergeWithOrder';
import { Block } from './Block';
import { TaskItem } from './TaskItem';
import { AddRestoreControls } from './AddRestoreControls';
import { renderWeakButton, renderWeakMarks } from './WeakMarks';
import type { BlockVariant } from './helpers';

// 渲染字符串数组类型区块（knowledge / mustKnow / tier5 / tier6）
// 合并预置与自定义内容，支持拖拽排序
export function StrBlock({
    variant,
    title,
    type,
    presetArr,
    currentDay,
}: {
    variant: BlockVariant;
    title: string;
    type: ContentType;
    presetArr: string[] | undefined;
    currentDay: number;
}) {
    const { state, dispatch } = useAppState();
    const [addingType, setAddingType] = useState<ContentType | null>(null);

    const key = `${currentDay}-${type}`;
    const hidden = state.hiddenContent[key] || [];
    const custom = state.customContent[key] || [];
    const visiblePreset = (presetArr || [])
        .map((text, idx) => ({ text, idx }))
        .filter(({ idx }) => !hidden.includes(idx));

    const presetItems: OrderableItem[] = visiblePreset.map(({ text, idx }) => {
        const taskKey = `${currentDay}-${type}-${idx}`;
        return {
            id: taskKey,
            node: (
                <TaskItem
                    checked={!!state.tasks[taskKey]}
                    onClick={() => dispatch({ type: 'TOGGLE_TASK', key: taskKey })}
                    onDelete={() =>
                        dispatch({
                            type: 'HIDE_PRESET',
                            day: currentDay,
                            contentType: type,
                            index: idx,
                        })
                    }
                >
                    {text}
                    {renderWeakButton(dispatch, taskKey, text)}
                    {renderWeakMarks(state, taskKey)}
                </TaskItem>
            ),
        };
    });
    const customItems: OrderableItem[] = custom.map((item) => {
        const taskKey = `custom-${item.id}`;
        return {
            id: taskKey,
            node: (
                <TaskItem
                    checked={!!state.tasks[taskKey]}
                    isCustom
                    onClick={() => dispatch({ type: 'TOGGLE_TASK', key: taskKey })}
                    onDelete={() =>
                        dispatch({
                            type: 'DELETE_CUSTOM',
                            day: currentDay,
                            contentType: type,
                            id: item.id,
                        })
                    }
                >
                    {item.content}
                    {renderWeakButton(dispatch, taskKey, item.content)}
                    {renderWeakMarks(state, taskKey)}
                </TaskItem>
            ),
        };
    });
    const mergedItems = mergeWithOrder(
        [...presetItems, ...customItems],
        state.contentOrder[key],
    );

    const restoreAll = () => {
        hidden.forEach((idx) =>
            dispatch({ type: 'RESTORE_PRESET', day: currentDay, contentType: type, index: idx }),
        );
    };

    return (
        <Block variant={variant} title={title}>
            <div className="task-list">
                <SortableSection
                    items={mergedItems}
                    onReorder={(order) =>
                        dispatch({
                            type: 'REORDER_CONTENT',
                            day: currentDay,
                            contentType: type,
                            order,
                        })
                    }
                />
            </div>
            <AddRestoreControls
                type={type}
                addingType={addingType}
                setAddingType={setAddingType}
                onAdd={(item) =>
                    dispatch({
                        type: 'ADD_CONTENT',
                        day: currentDay,
                        contentType: type,
                        item,
                    })
                }
                hiddenCount={hidden.length}
                onRestore={restoreAll}
            />
        </Block>
    );
}
