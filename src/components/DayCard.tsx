import { useState } from 'react';
import { PLAN } from '../data/plan';
import { useAppState } from '../hooks/useAppState';
import type { ContentType, CustomItem, DayData, QuestionPriority } from '../types';
import { getQuestionPriority } from '../utils/questionMatcher';

// 区块变体类型（Editorial Hybrid 单色系）
type BlockVariant = 'review' | 'knowledge' | 'mustknow' | 'card' | 'algo' | 'interview' | 'mock';

// 生成唯一 ID，用于自定义内容条目
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// 计算某一天的任务完成情况（考虑隐藏的预置内容和自定义内容）
function getDayStats(dayNum: number, day: DayData, state: ReturnType<typeof useAppState>['state']) {
    const { tasks, mock, algo, customContent, hiddenContent } = state;
    let total = 0;
    let done = 0;

    // 统计字符串数组类型（knowledge/mustKnow/tier5/tier6）
    // 支持 hidden 隐藏预置内容和 custom 自定义内容
    const countStrArr = (arr: string[] | undefined, type: string) => {
        if (!arr) return;
        const hidden = hiddenContent[`${dayNum}-${type}`] || [];
        total += arr.length - hidden.length;
        arr.forEach((_, idx) => {
            if (hidden.includes(idx)) return;
            if (tasks[`${dayNum}-${type}-${idx}`]) done++;
        });
        const custom = customContent[`${dayNum}-${type}`] || [];
        total += custom.length;
        custom.forEach((item) => {
            if (tasks[`custom-${item.id}`]) done++;
        });
    };

    countStrArr(day.knowledge, 'knowledge');
    countStrArr(day.mustKnow, 'mustKnow');
    countStrArr(day.tier5, 'tier5');
    countStrArr(day.tier6, 'tier6');

    // tasks（复盘日）不支持增删，保持原逻辑
    const countArr = (arr: string[] | undefined, type: string) => {
        if (!arr) return;
        total += arr.length;
        arr.forEach((_, idx) => {
            if (tasks[`${dayNum}-${type}-${idx}`]) done++;
        });
    };
    countArr(day.tasks, 'tasks');

    // mock：支持 hidden 和 custom
    if (day.mock) {
        const hidden = hiddenContent[`${dayNum}-mock`] || [];
        total += day.mock.length - hidden.length;
        day.mock.forEach((_, idx) => {
            if (hidden.includes(idx)) return;
            if (mock[`${dayNum}-${idx}`]) done++;
        });
        const customMock = customContent[`${dayNum}-mock`] || [];
        total += customMock.length;
        customMock.forEach((item) => {
            if (mock[`custom-${item.id}`]) done++;
        });
    }

    // card：预置卡片不计入统计（保持现有行为），自定义卡片可勾选计入统计
    const customCard = customContent[`${dayNum}-card`] || [];
    total += customCard.length;
    customCard.forEach((item) => {
        if (tasks[`custom-${item.id}`]) done++;
    });

    if (day.algo) {
        total += 1;
        if (algo[`${dayNum}`]) done++;
    }

    return { total, done, progress: total === 0 ? 0 : done / total };
}

// 可勾选任务项
function TaskItem({
    checked,
    onClick,
    onDelete,
    children,
    isCustom,
}: {
    checked: boolean;
    onClick: () => void;
    onDelete?: () => void;
    children: React.ReactNode;
    isCustom?: boolean;
}) {
    return (
        <div
            className={`task-item content-item ${checked ? 'done' : ''} ${isCustom ? 'custom-item' : ''}`}
            onClick={onClick}
        >
            <div className={`checkbox ${checked ? 'checked' : ''}`} />
            <div className="task-text">{children}</div>
            {onDelete && (
                <button
                    className="delete-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    title="删除"
                >
                    ×
                </button>
            )}
        </div>
    );
}

// 任务区块（Editorial Hybrid 单色系 + 章节编号）
function Block({
    variant,
    num,
    title,
    count,
    desc,
    featured,
    children,
}: {
    variant: BlockVariant;
    num?: string;
    title: string;
    count?: string;
    desc?: string;
    featured?: boolean;
    children: React.ReactNode;
}) {
    return (
        <section
            className={`ed-block ed-block--${variant}${featured ? ' ed-block--featured' : ''}`}
        >
            <div className="ed-block-header">
                {num && <span className="ed-block-num">{num}</span>}
                <h3 className="ed-block-title">{title}</h3>
                {count && <span className="ed-block-count">{count}</span>}
            </div>
            {desc && <p className="ed-block-desc">{desc}</p>}
            <div className="ed-block-body">{children}</div>
        </section>
    );
}

// inline 输入框：根据类型显示不同字段
// knowledge/mustKnow/tier5/tier6: 1 个文本框；mock: 问题+要点；card: 标题+关键词；question: 题目
export function InlineInput({
    type,
    onConfirm,
    onCancel,
}: {
    type: ContentType;
    onConfirm: (item: CustomItem) => void;
    onCancel: () => void;
}) {
    const [v1, setV1] = useState('');
    const [v2, setV2] = useState('');

    const isMock = type === 'mock';
    const isCard = type === 'card';
    const isQuestion = type === 'question';
    const placeholder1 = isMock ? '问题' : isCard ? '标题' : isQuestion ? '题目' : '内容';
    const placeholder2 = isMock ? '答题要点' : '关键词';

    const handleConfirm = () => {
        const text1 = v1.trim();
        if (!text1) return;
        const id = generateId();
        if (isMock) {
            onConfirm({ id, content: '', q: text1, tips: v2.trim() });
        } else if (isCard) {
            onConfirm({ id, content: '', title: text1, keywords: v2.trim() });
        } else {
            onConfirm({ id, content: text1 });
        }
    };

    return (
        <div className="inline-input">
            <textarea
                placeholder={placeholder1}
                value={v1}
                onChange={(e) => setV1(e.target.value)}
                rows={2}
                autoFocus
            />
            {(isMock || isCard) && (
                <textarea
                    placeholder={placeholder2}
                    value={v2}
                    onChange={(e) => setV2(e.target.value)}
                    rows={2}
                />
            )}
            <div className="inline-input-actions">
                <button className="btn btn-active" onClick={handleConfirm}>
                    确认
                </button>
                <button className="btn" onClick={onCancel}>
                    取消
                </button>
            </div>
        </div>
    );
}

// 增删控制区：添加按钮 / inline 输入框 / 恢复链接
export function AddRestoreControls({
    type,
    addingType,
    setAddingType,
    onAdd,
    hiddenCount,
    onRestore,
    label = '添加',
}: {
    type: ContentType;
    addingType: ContentType | null;
    setAddingType: (t: ContentType | null) => void;
    onAdd: (item: CustomItem) => void;
    hiddenCount: number;
    onRestore: () => void;
    label?: string;
}) {
    const isAdding = addingType === type;
    return (
        <div className="add-delete-controls">
            {isAdding ? (
                <InlineInput
                    type={type}
                    onConfirm={(item) => {
                        onAdd(item);
                        setAddingType(null);
                    }}
                    onCancel={() => setAddingType(null)}
                />
            ) : (
                <>
                    <button className="add-btn" onClick={() => setAddingType(type)}>
                        + {label}
                    </button>
                    {hiddenCount > 0 && (
                        <span className="restore-link" onClick={onRestore}>
                            已删除 {hiddenCount} 项 [恢复]
                        </span>
                    )}
                </>
            )}
        </div>
    );
}

// 优先级标记：根据面试题库匹配结果渲染小圆角标签
// 仅 red（必考）和 yellow（常考）显示标记，其他不显示
function PriorityBadge({ priority }: { priority: QuestionPriority | null }) {
    if (priority !== 'red' && priority !== 'yellow') return null;
    const label = priority === 'red' ? '必考' : '常考';
    return (
        <span className={`mock-priority-badge ${priority}`} title={label}>
            {label}
        </span>
    );
}

export default function DayCard() {
    const { state, dispatch } = useAppState();
    const { currentDay, tier } = state;
    const day = PLAN.days[currentDay];
    // 当前展开添加输入框的类型
    const [addingType, setAddingType] = useState<ContentType | null>(null);
    // 自定义模拟题 tips 展开状态，key: `c-${id}`（预置已迁移至 state.mockTipsExpanded）
    const [expandedMock, setExpandedMock] = useState<Set<string>>(new Set());
    // 卡片翻转状态，key: `${day}-${cardIndex}`
    const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

    if (!day) {
        return <div className="content">未找到 Day {currentDay} 的数据</div>;
    }

    const stats = getDayStats(currentDay, day, state);
    const progressPercent = Math.round(stats.progress * 100);

    // 切换卡片翻转
    const toggleFlip = (key: string) => {
        setFlippedCards((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // 切换自定义模拟题 tips 展开（预置模拟题已使用 state.mockTipsExpanded 持久化）
    const toggleMockExpand = (mockKey: string) => {
        setExpandedMock((prev) => {
            const next = new Set(prev);
            if (next.has(mockKey)) {
                next.delete(mockKey);
            } else {
                next.add(mockKey);
            }
            return next;
        });
    };

    // 检查是否有 🔴 阻塞型自定义知识点
    // 注意：CustomItem 当前未定义 priority 字段，扩展类型后即可启用此提示
    const hasBlockingItems = (): boolean => {
        const custom = state.customContent[`${currentDay}-knowledge`] || [];
        return custom.some(
            (item) => (item as CustomItem & { priority?: string }).priority === 'red',
        );
    };
    const countBlockingItems = (): number => {
        const custom = state.customContent[`${currentDay}-knowledge`] || [];
        return custom.filter(
            (item) => (item as CustomItem & { priority?: string }).priority === 'red',
        ).length;
    };

    // 恢复某类型所有被隐藏的预置内容
    const restoreAll = (type: ContentType) => {
        const hidden = state.hiddenContent[`${currentDay}-${type}`] || [];
        hidden.forEach((idx) =>
            dispatch({ type: 'RESTORE_PRESET', day: currentDay, contentType: type, index: idx }),
        );
    };

    // 渲染字符串数组类型区块（knowledge/mustKnow/tier5/tier6）
    const renderStrBlock = (
        variant: BlockVariant,
        title: string,
        type: ContentType,
        presetArr: string[] | undefined,
    ) => {
        const key = `${currentDay}-${type}`;
        const hidden = state.hiddenContent[key] || [];
        const custom = state.customContent[key] || [];
        const visiblePreset = (presetArr || [])
            .map((text, idx) => ({ text, idx }))
            .filter(({ idx }) => !hidden.includes(idx));

        return (
            <Block variant={variant} title={title}>
                <div className="task-list">
                    {visiblePreset.map(({ text, idx }) => (
                        <TaskItem
                            checked={!!state.tasks[`${currentDay}-${type}-${idx}`]}
                            key={`p-${idx}`}
                            onClick={() =>
                                dispatch({
                                    type: 'TOGGLE_TASK',
                                    key: `${currentDay}-${type}-${idx}`,
                                })
                            }
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
                        </TaskItem>
                    ))}
                    {custom.map((item) => (
                        <TaskItem
                            checked={!!state.tasks[`custom-${item.id}`]}
                            key={`c-${item.id}`}
                            isCustom
                            onClick={() =>
                                dispatch({ type: 'TOGGLE_TASK', key: `custom-${item.id}` })
                            }
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
                        </TaskItem>
                    ))}
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
                    onRestore={() => restoreAll(type)}
                />
            </Block>
        );
    };

    // 渲染模拟题区块（折叠参考要点 + 计时器，支持增删）
    // 预置模拟题要点展开使用 state.mockTipsExpanded 持久化；自定义模拟题保留本地 state
    const renderMockBlock = () => {
        const type: ContentType = 'mock';
        const key = `${currentDay}-${type}`;
        const hidden = state.hiddenContent[key] || [];
        const custom = state.customContent[key] || [];
        const visiblePreset = (day.mock || [])
            .map((m, idx) => ({ m, idx }))
            .filter(({ idx }) => !hidden.includes(idx));

        return (
            <Block variant="mock" num="05" title="模拟题" count="20min">
                <div className="task-list">
                    {visiblePreset.map(({ m, idx }) => {
                        const mockKey = `${currentDay}-${idx}`;
                        const checked = !!state.mock[mockKey];
                        const tipsKey = `${currentDay}-${idx}`;
                        const isExpanded = !!state.mockTipsExpanded?.[tipsKey];
                        const priority = getQuestionPriority(m.q);
                        return (
                            <div
                                className={`mock-item content-item ${checked ? 'done' : ''}`}
                                key={`p-${idx}`}
                            >
                                <div className="mock-top">
                                    <div
                                        className={`checkbox ${checked ? 'checked' : ''}`}
                                        onClick={() =>
                                            dispatch({ type: 'TOGGLE_MOCK', key: mockKey })
                                        }
                                    />
                                    <div className="mock-question">
                                        {m.q}
                                        <PriorityBadge priority={priority} />
                                    </div>
                                    <span className="ed-mock-timer">
                                        ⏱ {idx < 2 ? '2min' : '3min'}
                                    </span>
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
                                        onToggle={() =>
                                            dispatch({
                                                type: 'TOGGLE_MOCK_TIPS',
                                                day: currentDay,
                                                index: idx,
                                            })
                                        }
                                    >
                                        <summary>参考要点</summary>
                                        <p>{m.tips}</p>
                                    </details>
                                )}
                            </div>
                        );
                    })}
                    {custom.map((item) => {
                        const mockKey = `custom-${item.id}`;
                        const checked = !!state.mock[mockKey];
                        const expanded = expandedMock.has(`c-${item.id}`);
                        const priority = getQuestionPriority(item.q || '');
                        return (
                            <div
                                className={`mock-item content-item custom-item ${checked ? 'done' : ''}`}
                                key={`c-${item.id}`}
                            >
                                <div className="mock-top">
                                    <div
                                        className={`checkbox ${checked ? 'checked' : ''}`}
                                        onClick={() =>
                                            dispatch({ type: 'TOGGLE_MOCK', key: mockKey })
                                        }
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
                                        onToggle={() => toggleMockExpand(`c-${item.id}`)}
                                    >
                                        <summary>参考要点</summary>
                                        <p>{item.tips}</p>
                                    </details>
                                )}
                            </div>
                        );
                    })}
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
                    onRestore={() => restoreAll(type)}
                />
            </Block>
        );
    };

    // 渲染知识卡片区块（3D 翻转 + 自评，支持增删）
    const renderCardBlock = () => {
        const type: ContentType = 'card';
        const key = `${currentDay}-${type}`;
        const hidden = state.hiddenContent[key] || [];
        const custom = state.customContent[key] || [];
        const presetCard = day.card && !hidden.includes(0) ? day.card : null;

        // 统一卡片列表：预置卡片 index 0，自定义卡片 index 1+
        // cardEval 的 key 为 `${day}-${idx}`，自定义卡片自评 pass 时同步标记 task 完成以保留统计
        const allCards: Array<{
            idx: number;
            title: string;
            keywords: string;
            isCustom: boolean;
            customId?: string;
        }> = [];
        if (presetCard) {
            allCards.push({
                idx: 0,
                title: presetCard.title,
                keywords: presetCard.keywords,
                isCustom: false,
            });
        }
        custom.forEach((item, i) => {
            allCards.push({
                idx: presetCard ? i + 1 : i,
                title: item.title || '',
                keywords: item.keywords || '',
                isCustom: true,
                customId: item.id,
            });
        });

        return (
            <Block variant="card" num="02" title="关键词卡片" count="25min" desc="核心概念速览，翻转验证掌握度">
                <div className="task-list">
                    {allCards.map((card) => {
                        const cardKey = `${currentDay}-${card.idx}`;
                        const evalResult = state.cardEval?.[cardKey];
                        const isFlipped = flippedCards[cardKey] || false;
                        return (
                            <div
                                key={card.isCustom ? `c-${card.customId}` : 'p-0'}
                                className={`ed-card ${isFlipped ? 'flipped' : ''} ${evalResult ? `eval-${evalResult}` : ''}`}
                                onClick={() => toggleFlip(cardKey)}
                            >
                                <div className="ed-card-inner">
                                    <div className="ed-card-front">
                                        <button
                                            className="ed-card-del"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (card.isCustom) {
                                                    dispatch({
                                                        type: 'DELETE_CUSTOM',
                                                        day: currentDay,
                                                        contentType: type,
                                                        id: card.customId!,
                                                    });
                                                } else {
                                                    dispatch({
                                                        type: 'HIDE_PRESET',
                                                        day: currentDay,
                                                        contentType: type,
                                                        index: 0,
                                                    });
                                                }
                                            }}
                                            title="删除"
                                        >
                                            ×
                                        </button>
                                        <div className="ed-card-title">{card.title}</div>
                                        <div className="ed-card-hint">点击翻转自测</div>
                                    </div>
                                    <div className="ed-card-back">
                                        <div className="ed-card-answer">{card.keywords}</div>
                                        <div
                                            className="ed-card-actions"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                className="ed-card-eval pass"
                                                onClick={() => {
                                                    dispatch({
                                                        type: 'TOGGLE_CARD_EVAL',
                                                        day: currentDay,
                                                        cardIndex: card.idx,
                                                        result: 'pass',
                                                    });
                                                    // 自定义卡片自评 pass 同步计入统计
                                                    if (card.isCustom && card.customId) {
                                                        dispatch({
                                                            type: 'TOGGLE_TASK',
                                                            key: `custom-${card.customId}`,
                                                            value: true,
                                                        });
                                                    }
                                                    setFlippedCards((prev) => ({
                                                        ...prev,
                                                        [cardKey]: false,
                                                    }));
                                                }}
                                            >
                                                ✅
                                            </button>
                                            <button
                                                className="ed-card-eval fail"
                                                onClick={() => {
                                                    dispatch({
                                                        type: 'TOGGLE_CARD_EVAL',
                                                        day: currentDay,
                                                        cardIndex: card.idx,
                                                        result: 'fail',
                                                    });
                                                    if (card.isCustom && card.customId) {
                                                        dispatch({
                                                            type: 'TOGGLE_TASK',
                                                            key: `custom-${card.customId}`,
                                                            value: false,
                                                        });
                                                    }
                                                    setFlippedCards((prev) => ({
                                                        ...prev,
                                                        [cardKey]: false,
                                                    }));
                                                }}
                                            >
                                                ❌
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                    onRestore={() => restoreAll(type)}
                />
            </Block>
        );
    };

    return (
        <div className="content">
            <div className="content-header">
                <div className="breadcrumb">
                    <span>Week {day.week}</span>
                    <span>›</span>
                    <span>Day {currentDay}</span>
                </div>
                <div className="day-title">
                    {day.isReview ? '🔄 ' : ''}{day.title}
                </div>
            </div>

            {/* 进度条 */}
            <div className="progress-bar-wrap">
                <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="progress-bar-text">
                    {stats.done}/{stats.total}（{progressPercent}%）
                </span>
            </div>

            {/* 阻塞提示条：有 🔴 优先级知识点时显示 */}
            {hasBlockingItems() && (
                <div className="ed-block-alert">
                    ⚠️ 今天有 {countBlockingItems()} 个阻塞型知识点需要优先处理
                </div>
            )}

            {/* 复盘日：显示 tasks 而不是 knowledge */}
            {day.isReview ? (
                <Block variant="algo" num="03" title="复盘任务" count={`${stats.done}/${stats.total}`}>
                    <div className="task-list">
                        {day.tasks?.map((task, idx) => (
                            <TaskItem
                                checked={!!state.tasks[`${currentDay}-tasks-${idx}`]}
                                key={idx}
                                onClick={() =>
                                    dispatch({
                                        type: 'TOGGLE_TASK',
                                        key: `${currentDay}-tasks-${idx}`,
                                    })
                                }
                            >
                                {task}
                            </TaskItem>
                        ))}
                    </div>
                </Block>
            ) : (
                <>
                    {/* 复习昨日（Day 2+） */}
                    {currentDay > 1 && (
                        <Block variant="review" num="00" title="复习昨日" count="20min">
                            <div className="ed-review-list">
                                <p className="ed-review-hint">
                                    回顾 Day {currentDay - 1} 的关键知识点和错题
                                </p>
                            </div>
                        </Block>
                    )}

                    {/* 重点知识 */}
                    {renderStrBlock('knowledge', '重点知识', 'knowledge', day.knowledge)}

                    {/* 必会题 */}
                    {renderStrBlock('mustknow', '必会题', 'mustKnow', day.mustKnow)}
                </>
            )}

            {/* 模拟题 */}
            {renderMockBlock()}

            {/* 算法题 */}
            {day.algo && (
                <Block variant="algo" num="03" title="算法练习" count="20min">
                    <div className="algo-item">
                        <div className="algo-left">
                            <div
                                className={`checkbox ${state.algo[`${currentDay}`] ? 'checked' : ''}`}
                                onClick={() =>
                                    dispatch({ type: 'TOGGLE_ALGO', key: `${currentDay}` })
                                }
                            />
                            <span className="algo-name">{day.algo.name}</span>
                        </div>
                        {day.algo.lc && (
                            <a
                                className="algo-tag"
                                href={`https://leetcode.cn/problems/${day.algo.lc}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                LC {day.algo.lc}
                            </a>
                        )}
                    </div>
                </Block>
            )}

            {/* 知识卡片 */}
            {renderCardBlock()}

            {/* tier5 内容：5h / 6h 档显示 */}
            {tier !== '3h' && renderStrBlock('interview', '深度拓展（5h+）', 'tier5', day.tier5)}

            {/* tier6 内容：6h 档显示 */}
            {tier === '6h' && renderStrBlock('interview', '扩展专题（6h）', 'tier6', day.tier6)}
        </div>
    );
}
