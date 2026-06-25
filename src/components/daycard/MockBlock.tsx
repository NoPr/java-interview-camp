import { useState } from 'react';
import type { ContentType } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { PLAN } from '../../data/plan';
import { getQuestionPriority } from '../../utils/questionMatcher';
import { SortableSection } from '../SortableSection';
import { mergeWithOrder } from '../../utils/mergeWithOrder';
import type { OrderableItem } from '../../utils/mergeWithOrder';
import { Block } from './Block';
import { AddRestoreControls } from './AddRestoreControls';
import { PriorityBadge } from './PriorityBadge';

// 渲染模拟题区块（折叠参考要点 + 计时器，支持增删）
// 预置模拟题要点展开使用 state.mockTipsExpanded 持久化；自定义模拟题保留本地 state
export function MockBlock({ currentDay }: { currentDay: number }) {
    const { state, dispatch } = useAppState();
    const [addingType, setAddingType] = useState<ContentType | null>(null);
    const [expandedMock, setExpandedMock] = useState<Set<string>>(new Set());

    const type: ContentType = 'mock';
    const key = `${currentDay}-${type}`;
    const day = PLAN.days[currentDay];
    const hidden = state.hiddenContent[key] || [];
    const custom = state.customContent[key] || [];
    const visiblePreset = (day.mock || [])
        .map((m, idx) => ({ m, idx }))
        .filter(({ idx }) => !hidden.includes(idx));

    // 合并预置与自定义 mock 为 OrderableItem[]，支持拖拽排序
    // 注意：mock 预置项 id 用 `${currentDay}-${idx}`（与勾选 key 一致，无 type 中段）
    const presetItems: OrderableItem[] = visiblePreset.map(({ m, idx }) => {
        const mockKey = `${currentDay}-${idx}`;
        const checked = !!state.mock[mockKey];
        const tipsKey = `${currentDay}-${idx}`;
        const isExpanded = !!state.mockTipsExpanded?.[tipsKey];
        const priority = getQuestionPriority(m.q);
        return {
            id: mockKey,
            node: (
                <div className={`mock-item content-item ${checked ? 'done' : ''}`}>
                    <div className="mock-top">
                        <div
                            className={`checkbox ${checked ? 'checked' : ''}`}
                            onClick={() => dispatch({ type: 'TOGGLE_MOCK', key: mockKey })}
                        />
                        <div className="mock-question">
                            {m.q}
                            <PriorityBadge priority={priority} />
                        </div>
                        <span className="ed-mock-timer">⏱ {idx < 2 ? '2min' : '3min'}</span>
                        <button
                            className="delete-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                dispatch({
                                    type: 'HIDE_PRESET',
                                    day: currentDay,
                                    contentType: type,
                                    index: idx,
                                });
                            }}
                            title="删除"
                        >
                            ×
                        </button>
                    </div>
                    {m.tips && (
                        <details
                            className="ed-mock-tips"
                            open={isExpanded}
                            onToggle={(e) =>
                                dispatch({
                                    type: 'SET_MOCK_TIPS',
                                    day: currentDay,
                                    index: idx,
                                    value: e.currentTarget.open,
                                })
                            }
                        >
                            <summary>参考要点</summary>
                            <p>{m.tips}</p>
                        </details>
                    )}
                </div>
            ),
        };
    });
    const customItems: OrderableItem[] = custom.map((item) => {
        const mockKey = `custom-${item.id}`;
        const checked = !!state.mock[mockKey];
        const expanded = expandedMock.has(`c-${item.id}`);
        const priority = getQuestionPriority(item.q || '');
        return {
            id: mockKey,
            node: (
                <div className={`mock-item content-item custom-item ${checked ? 'done' : ''}`}>
                    <div className="mock-top">
                        <div
                            className={`checkbox ${checked ? 'checked' : ''}`}
                            onClick={() => dispatch({ type: 'TOGGLE_MOCK', key: mockKey })}
                        />
                        <div className="mock-question">
                            {item.q}
                            <PriorityBadge priority={priority} />
                        </div>
                        <span className="ed-mock-timer">⏱ 3min</span>
                        <button
                            className="delete-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                dispatch({
                                    type: 'DELETE_CUSTOM',
                                    day: currentDay,
                                    contentType: type,
                                    id: item.id,
                                });
                            }}
                            title="删除"
                        >
                            ×
                        </button>
                    </div>
                    {item.tips && (
                        <details
                            className="ed-mock-tips"
                            open={expanded}
                            onToggle={(e) => {
                                const cKey = `c-${item.id}`;
                                setExpandedMock((prev) => {
                                    const next = new Set(prev);
                                    if (e.currentTarget.open) {
                                        next.add(cKey);
                                    } else {
                                        next.delete(cKey);
                                    }
                                    return next;
                                });
                            }}
                        >
                            <summary>参考要点</summary>
                            <p>{item.tips}</p>
                        </details>
                    )}
                </div>
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
        <Block variant="mock" num="05" title="模拟题" count="20min">
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
