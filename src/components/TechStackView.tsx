import { useState, useMemo } from 'react';
import { PLAN } from '../data/plan';
import { getTechStackById, getTechStackPointCount, formatDayRange } from '../data/techStacks';
import { INTERVIEW_QUESTIONS } from '../data/interviewQuestions';
import { useAppState } from '../hooks/useAppState';
import { InterviewQuestion, QuestionPriority, ContentType, CustomItem } from '../types';
import { priorityLabel } from '../utils/questionMatcher';
import { AddRestoreControls } from './DayCard';
import { SortableSection } from './SortableSection';
import { mergeWithOrder, type OrderableItem } from '../utils/mergeWithOrder';

// 优先级顺序，用于筛选徽章渲染
const PRIORITIES: QuestionPriority[] = ['red', 'yellow', 'green', 'gray'];

// 章节编号映射：面试优先 → 面试题库=01，必会题=02，重点知识=03，模拟题=04
const SECTION_NUMBERS: Record<string, string> = {
    question: '01',
    mustKnow: '02',
    knowledge: '03',
    mock: '04',
};

// 取题目的固有优先级（用于筛选徽章计数）
function getPriority(q: InterviewQuestion): QuestionPriority {
    return q.priority;
}

// 技术栈详情页：聚合该技术栈涉及的所有 Day 的知识点 / 必会题 / 模拟题
// 每条内容右侧显示 [Day X] 跳转按钮，勾选状态与 Day 卡片视图共享
// 支持添加自定义内容、隐藏预置内容、恢复已隐藏内容
// 末尾追加面试题库区块：按优先级标记，支持勾选掌握 / 调整优先级 / 增删
export function TechStackView() {
    const { state, dispatch } = useAppState();
    const stack = state.currentTechStack ? getTechStackById(state.currentTechStack) : null;
    // 当前展开添加输入框的类型
    const [addingType, setAddingType] = useState<ContentType | null>(null);

    // 聚合该技术栈涉及的所有 Day 的内容
    const { knowledge, mustKnow, mock } = useMemo(() => {
        const knowledge: Array<{ day: number; index: number; content: string }> = [];
        const mustKnow: Array<{ day: number; index: number; content: string }> = [];
        const mock: Array<{ day: number; index: number; q: string; tips: string }> = [];
        if (!stack) return { knowledge, mustKnow, mock };
        for (const day of stack.days) {
            const dayData = PLAN.days[day];
            if (!dayData) continue;
            dayData.knowledge?.forEach((content, index) => knowledge.push({ day, index, content }));
            dayData.mustKnow?.forEach((content, index) => mustKnow.push({ day, index, content }));
            dayData.mock?.forEach((m, index) => mock.push({ day, index, q: m.q, tips: m.tips }));
        }
        return { knowledge, mustKnow, mock };
    }, [stack]);

    // 当前技术栈的面试题库
    const questions: InterviewQuestion[] = stack ? (INTERVIEW_QUESTIONS[stack.id] || []) : [];

    // 计算完成率：已勾选的知识点 / 总知识点
    const completionStats = useMemo(() => {
        if (!stack) return { done: 0, total: 0, rate: 0 };
        let done = 0;
        let total = 0;
        // knowledge
        knowledge.forEach((item) => {
            total++;
            if (state.tasks[`${item.day}-knowledge-${item.index}`]) done++;
        });
        // mustKnow
        mustKnow.forEach((item) => {
            total++;
            if (state.tasks[`${item.day}-mustKnow-${item.index}`]) done++;
        });
        // mock
        mock.forEach((item) => {
            total++;
            if (state.mock[`${item.day}-${item.index}`]) done++;
        });
        // questions
        questions.forEach((q) => {
            total++;
            if (state.questionStatus[q.id]?.mastered) done++;
        });
        return { done, total, rate: total === 0 ? 0 : done / total };
    }, [stack, knowledge, mustKnow, mock, questions, state.tasks, state.mock, state.questionStatus]);

    if (!stack) {
        return (
            <div className="techstack-view empty">
                <div className="techstack-empty-illustration">📚</div>
                <p>请从左侧选择一个技术栈</p>
                <span className="techstack-empty-hint">按技术栈索引，快速定位复习</span>
            </div>
        );
    }

    // 跳转到指定 Day 卡片视图
    const jumpToDay = (day: number) => {
        dispatch({ type: 'SET_CURRENT_DAY', day });
        dispatch({ type: 'SET_CURRENT_VIEW', view: 'day' });
    };

    // ===== Editorial Hybrid：筛选 / 复习 / Day 跳转辅助 =====
    const filter = state.techStackFilter || 'all';
    const onlyUnmastered = filter === 'unmastered';

    // 收集当前技术栈所有未勾选的 knowledge/mustKnow/mock 的 task key
    const collectUnmasteredItems = (): string[] => {
        const ids: string[] = [];
        knowledge.forEach((item) => {
            const key = `${item.day}-knowledge-${item.index}`;
            if (!state.tasks[key]) ids.push(key);
        });
        mustKnow.forEach((item) => {
            const key = `${item.day}-mustKnow-${item.index}`;
            if (!state.tasks[key]) ids.push(key);
        });
        mock.forEach((item) => {
            const key = `${item.day}-${item.index}`;
            if (!state.mock[key]) ids.push(key);
        });
        return ids;
    };
    const unmasteredIds = collectUnmasteredItems();
    const unmasteredCount = unmasteredIds.length;

    // 检查某天所有 knowledge/mustKnow/mock 是否全部完成
    const isDayComplete = (dayNum: number): boolean => {
        const dayData = PLAN.days[dayNum];
        if (!dayData) return false;
        const kLen = dayData.knowledge?.length || 0;
        const mLen = dayData.mustKnow?.length || 0;
        const mockLen = dayData.mock?.length || 0;
        if (kLen + mLen + mockLen === 0) return false;
        for (let i = 0; i < kLen; i++) {
            if (!state.tasks[`${dayNum}-knowledge-${i}`]) return false;
        }
        for (let i = 0; i < mLen; i++) {
            if (!state.tasks[`${dayNum}-mustKnow-${i}`]) return false;
        }
        for (let i = 0; i < mockLen; i++) {
            if (!state.mock[`${dayNum}-${i}`]) return false;
        }
        return true;
    };

    // 技术栈级别的 key 前缀，复用 day 字段存储 techStack 前缀
    const techStackDay = `techStack-${stack.id}`;

    // 恢复某类型所有被隐藏的预置内容
    const restoreAll = (type: ContentType) => {
        const key = `${techStackDay}-${type}`;
        const hidden = state.hiddenContent[key] || [];
        hidden.forEach((idx) =>
            dispatch({ type: 'RESTORE_PRESET', day: techStackDay, contentType: type, index: idx }),
        );
    };

    // 添加自定义内容到技术栈级别
    const addContent = (type: ContentType, item: CustomItem) => {
        dispatch({ type: 'ADD_CONTENT', day: techStackDay, contentType: type, item });
    };

    // 渲染字符串数组类型区块（重点知识 / 必会题）
    // 预置内容（从 Day 聚合）可隐藏，自定义内容可删除，均支持勾选
    const renderStrSection = (
        title: string,
        type: ContentType,
        preset: Array<{ day: number; index: number; content: string }>,
        addLabel: string,
    ) => {
        const key = `${techStackDay}-${type}`;
        const hidden = state.hiddenContent[key] || [];
        const custom = state.customContent[key] || [];
        const visiblePreset = preset
            .map((item, idx) => ({ item, idx }))
            .filter(({ idx }) => !hidden.includes(idx));
        // 只看未掌握：过滤掉已勾选项
        const filteredPreset = onlyUnmastered
            ? visiblePreset.filter(({ item }) => !state.tasks[`${item.day}-${type}-${item.index}`])
            : visiblePreset;
        const filteredCustom = onlyUnmastered
            ? custom.filter((item) => !state.tasks[`custom-${item.id}`])
            : custom;
        const totalCount = filteredPreset.length + filteredCustom.length;
        const sectionNum = SECTION_NUMBERS[type] || '';

        // 未掌握筛选下，本区块已全部完成则隐藏
        if (onlyUnmastered && totalCount === 0) return null;

        // 合并预置与自定义为 OrderableItem[]
        const presetItems: OrderableItem[] = filteredPreset.map(({ item, idx }) => {
            const taskKey = `${item.day}-${type}-${item.index}`;
            return {
                id: taskKey,
                node: (
                    <>
                        <input
                            type="checkbox"
                            checked={state.tasks[taskKey] || false}
                            onChange={() => dispatch({ type: 'TOGGLE_TASK', key: taskKey })}
                        />
                        <span className="content-text">{item.content}</span>
                        <button
                            className="day-link"
                            onClick={() => jumpToDay(item.day)}
                            title={`跳转到 Day ${item.day}`}
                        >
                            Day {item.day}
                        </button>
                        <button
                            className="delete-btn"
                            onClick={() =>
                                dispatch({
                                    type: 'HIDE_PRESET',
                                    day: techStackDay,
                                    contentType: type,
                                    index: idx,
                                })
                            }
                            title="删除"
                        >
                            ×
                        </button>
                    </>
                ),
            };
        });
        const customItems: OrderableItem[] = filteredCustom.map((item) => {
            const taskKey = `custom-${item.id}`;
            return {
                id: taskKey,
                node: (
                    <>
                        <input
                            type="checkbox"
                            checked={state.tasks[taskKey] || false}
                            onChange={() => dispatch({ type: 'TOGGLE_TASK', key: taskKey })}
                        />
                        <span className="content-text">{item.content}</span>
                        <button
                            className="delete-btn"
                            onClick={() =>
                                dispatch({
                                    type: 'DELETE_CUSTOM',
                                    day: techStackDay,
                                    contentType: type,
                                    id: item.id,
                                })
                            }
                            title="删除"
                        >
                            ×
                        </button>
                    </>
                ),
            };
        });
        const mergedItems = mergeWithOrder(
            [...presetItems, ...customItems],
            state.contentOrder[key],
        );

        return (
            <section className="techstack-section" style={{ animationDelay: `${parseInt(sectionNum) * 60}ms` }}>
                <div className="techstack-section-header">
                    <span className="techstack-section-num">{sectionNum}</span>
                    <h3>{title}</h3>
                    <span className="techstack-section-count">{totalCount} 项</span>
                </div>
                <div className="techstack-section-body">
                    <SortableSection
                        items={mergedItems}
                        onReorder={(order) =>
                            dispatch({
                                type: 'REORDER_CONTENT',
                                day: techStackDay,
                                contentType: type,
                                order,
                            })
                        }
                    />
                    <AddRestoreControls
                        type={type}
                        addingType={addingType}
                        setAddingType={setAddingType}
                        onAdd={(item) => addContent(type, item)}
                        hiddenCount={hidden.length}
                        onRestore={() => restoreAll(type)}
                        label={addLabel}
                    />
                </div>
            </section>
        );
    };

    // 渲染模拟题区块（支持增删，自定义题含问题+要点）
    const renderMockSection = () => {
        const type: ContentType = 'mock';
        const key = `${techStackDay}-${type}`;
        const hidden = state.hiddenContent[key] || [];
        const custom = state.customContent[key] || [];
        const visiblePreset = mock
            .map((item, idx) => ({ item, idx }))
            .filter(({ idx }) => !hidden.includes(idx));
        // 只看未掌握：过滤掉已勾选项
        const filteredPreset = onlyUnmastered
            ? visiblePreset.filter(({ item }) => !state.mock[`${item.day}-${item.index}`])
            : visiblePreset;
        const filteredCustom = onlyUnmastered
            ? custom.filter((item) => !state.mock[`custom-${item.id}`])
            : custom;
        const totalCount = filteredPreset.length + filteredCustom.length;
        const sectionNum = SECTION_NUMBERS[type] || '';

        // 未掌握筛选下，本区块已全部完成则隐藏
        if (onlyUnmastered && totalCount === 0) return null;

        return (
            <section className="techstack-section" style={{ animationDelay: `${parseInt(sectionNum) * 60}ms` }}>
                <div className="techstack-section-header">
                    <span className="techstack-section-num">{sectionNum}</span>
                    <h3>模拟题</h3>
                    <span className="techstack-section-count">{totalCount} 题</span>
                </div>
                <div className="techstack-section-body">
                    {filteredPreset.map(({ item, idx }, i) => {
                        const mockKey = `${item.day}-${item.index}`;
                        return (
                            <div
                                className="content-item"
                                key={`p-${idx}`}
                                style={{ animationDelay: `${i * 30}ms` }}
                            >
                                <input
                                    type="checkbox"
                                    checked={state.mock[mockKey] || false}
                                    onChange={() => dispatch({ type: 'TOGGLE_MOCK', key: mockKey })}
                                />
                                <span className="content-text">{item.q}</span>
                                <button
                                    className="day-link"
                                    onClick={() => jumpToDay(item.day)}
                                    title={`跳转到 Day ${item.day}`}
                                >
                                    Day {item.day}
                                </button>
                                <button
                                    className="delete-btn"
                                    onClick={() =>
                                        dispatch({
                                            type: 'HIDE_PRESET',
                                            day: techStackDay,
                                            contentType: type,
                                            index: idx,
                                        })
                                    }
                                    title="删除"
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                    {filteredCustom.map((item, i) => {
                        const mockKey = `custom-${item.id}`;
                        return (
                            <div
                                className="content-item custom-item"
                                key={`c-${item.id}`}
                                style={{ animationDelay: `${(filteredPreset.length + i) * 30}ms` }}
                            >
                                <input
                                    type="checkbox"
                                    checked={state.mock[mockKey] || false}
                                    onChange={() => dispatch({ type: 'TOGGLE_MOCK', key: mockKey })}
                                />
                                <span className="content-text">{item.q}</span>
                                <button
                                    className="delete-btn"
                                    onClick={() =>
                                        dispatch({
                                            type: 'DELETE_CUSTOM',
                                            day: techStackDay,
                                            contentType: type,
                                            id: item.id,
                                        })
                                    }
                                    title="删除"
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                    <AddRestoreControls
                        type={type}
                        addingType={addingType}
                        setAddingType={setAddingType}
                        onAdd={(item) => addContent(type, item)}
                        hiddenCount={hidden.length}
                        onRestore={() => restoreAll(type)}
                        label="添加模拟题"
                    />
                </div>
            </section>
        );
    };

    // 渲染面试题库区块（支持增删，自定义题可调整优先级）
    const renderQuestionSection = () => {
        const type: ContentType = 'question';
        const key = `${techStackDay}-${type}`;
        const hidden = state.hiddenContent[key] || [];
        const custom = state.customContent[key] || [];
        const visiblePreset = questions
            .map((q, idx) => ({ q, idx }))
            .filter(({ idx }) => !hidden.includes(idx));
        // 只看未掌握：过滤掉已掌握的题目
        const filteredPreset = onlyUnmastered
            ? visiblePreset.filter(({ q }) => !(state.questionStatus[q.id]?.mastered))
            : visiblePreset;
        const filteredCustom = onlyUnmastered
            ? custom.filter((item) => !(state.questionStatus[`custom-${item.id}`]?.mastered))
            : custom;
        const totalCount = filteredPreset.length + filteredCustom.length;
        const sectionNum = SECTION_NUMBERS[type] || '';

        // 未掌握筛选下，本区块已全部掌握则隐藏
        if (onlyUnmastered && totalCount === 0) return null;

        return (
            <section className="techstack-section techstack-section-featured" style={{ animationDelay: `${parseInt(sectionNum) * 60}ms` }}>
                <div className="techstack-section-header">
                    <span className="techstack-section-num">{sectionNum}</span>
                    <h3>面试题库</h3>
                    <span className="techstack-section-count">{totalCount} 题</span>
                </div>
                <div className="techstack-section-body">
                    {filteredPreset.length > 0 && (
                        <div className="priority-filter">
                            {PRIORITIES.map((p) => {
                                const count = filteredPreset.filter(({ q }) => getPriority(q) === p).length;
                                return (
                                    <span key={p} className={`priority-badge priority-${p}`}>
                                        {priorityLabel(p)} {count}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                    {filteredPreset.map(({ q, idx }, i) => {
                        const status = state.questionStatus[q.id] || { mastered: false, priority: q.priority };
                        const isMastered = !!status.mastered;
                        const isReviewing = !!state.questionReview[q.id];
                        const statusClass = isMastered ? 'mastered' : isReviewing ? 'reviewing' : 'unmastered';
                        return (
                            <div
                                key={`p-${idx}`}
                                className={`ed-question ed-question--${statusClass}`}
                                style={{ animationDelay: `${i * 25}ms` }}
                            >
                                <input
                                    type="checkbox"
                                    checked={isMastered}
                                    onChange={() =>
                                        dispatch({ type: 'TOGGLE_QUESTION_MASTERED', questionId: q.id })
                                    }
                                />
                                <span className="ed-question-text">{q.question}</span>
                                <select
                                    className="priority-select"
                                    value={status.priority}
                                    onChange={(e) =>
                                        dispatch({
                                            type: 'SET_QUESTION_PRIORITY',
                                            questionId: q.id,
                                            priority: e.target.value as QuestionPriority,
                                        })
                                    }
                                >
                                    <option value="red">🔴 必考</option>
                                    <option value="yellow">🟡 常考</option>
                                    <option value="green">🟢 偶尔考</option>
                                    <option value="gray">⚪ 加分</option>
                                </select>
                                {q.source === 'both' && <span className="source-badge">双来源</span>}
                                <button
                                    className="ed-review-toggle"
                                    onClick={() => dispatch({ type: 'TOGGLE_QUESTION_REVIEW', questionId: q.id })}
                                    title={isReviewing ? '取消复习标记' : '标记复习'}
                                >
                                    🔖
                                </button>
                                <button
                                    className="delete-btn"
                                    onClick={() =>
                                        dispatch({
                                            type: 'HIDE_PRESET',
                                            day: techStackDay,
                                            contentType: type,
                                            index: idx,
                                        })
                                    }
                                    title="删除"
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                    {filteredCustom.map((item, i) => {
                        const qid = `custom-${item.id}`;
                        const status = state.questionStatus[qid] || {
                            mastered: false,
                            priority: 'yellow' as QuestionPriority,
                        };
                        const isMastered = !!status.mastered;
                        const isReviewing = !!state.questionReview[qid];
                        const statusClass = isMastered ? 'mastered' : isReviewing ? 'reviewing' : 'unmastered';
                        return (
                            <div
                                key={`c-${item.id}`}
                                className={`ed-question ed-question--${statusClass} custom-item`}
                                style={{ animationDelay: `${(filteredPreset.length + i) * 25}ms` }}
                            >
                                <input
                                    type="checkbox"
                                    checked={isMastered}
                                    onChange={() =>
                                        dispatch({ type: 'TOGGLE_QUESTION_MASTERED', questionId: qid })
                                    }
                                />
                                <span className="ed-question-text">{item.content}</span>
                                {state.weakReason[qid] && (
                                    <span className="ed-weak-marks">
                                        <span className="ed-weak-reason">
                                            {({ concept: '📖', memory: '🔄', articulate: '🗣', confuse: '🔀', apply: '✏️' } as const)[state.weakReason[qid]]}
                                        </span>
                                        {state.reviewUrgency[qid] && (
                                            <span className="ed-weak-urgency">
                                                {({ high: '🔴', mid: '🟡', low: '⚪' } as const)[state.reviewUrgency[qid]!]}
                                            </span>
                                        )}
                                    </span>
                                )}
                                <button
                                    className="ed-weak-btn"
                                    title="遇到不牢固"
                                    onClick={() =>
                                        dispatch({
                                            type: 'OPEN_WEAK_DIALOG',
                                            key: qid,
                                            text: item.content,
                                            priority: status.priority,
                                        })
                                    }
                                >
                                    💡
                                </button>
                                <select
                                    className="priority-select"
                                    value={status.priority}
                                    onChange={(e) =>
                                        dispatch({
                                            type: 'SET_QUESTION_PRIORITY',
                                            questionId: qid,
                                            priority: e.target.value as QuestionPriority,
                                        })
                                    }
                                >
                                    <option value="red">🔴 必考</option>
                                    <option value="yellow">🟡 常考</option>
                                    <option value="green">🟢 偶尔考</option>
                                    <option value="gray">⚪ 加分</option>
                                </select>
                                <button
                                    className="ed-review-toggle"
                                    onClick={() => dispatch({ type: 'TOGGLE_QUESTION_REVIEW', questionId: qid })}
                                    title={isReviewing ? '取消复习标记' : '标记复习'}
                                >
                                    🔖
                                </button>
                                <button
                                    className="delete-btn"
                                    onClick={() =>
                                        dispatch({
                                            type: 'DELETE_CUSTOM',
                                            day: techStackDay,
                                            contentType: type,
                                            id: item.id,
                                        })
                                    }
                                    title="删除"
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                    <AddRestoreControls
                        type={type}
                        addingType={addingType}
                        setAddingType={setAddingType}
                        onAdd={(item) => addContent(type, item)}
                        hiddenCount={hidden.length}
                        onRestore={() => restoreAll(type)}
                        label="添加面试题"
                    />
                </div>
            </section>
        );
    };

    // 判断是否有任何内容（预置 + 自定义）
    const hasCustomContent = Object.keys(state.customContent).some((k) =>
        k.startsWith(`${techStackDay}-`),
    );
    const isEmpty =
        knowledge.length === 0 &&
        mustKnow.length === 0 &&
        mock.length === 0 &&
        questions.length === 0 &&
        !hasCustomContent;

    const pointCount = getTechStackPointCount(stack);
    const dayRange = formatDayRange(stack.days);
    const completionPct = Math.round(completionStats.rate * 100);

    return (
        <div className="techstack-view">
            {/* 编辑风标题区：大号衬线 + 元信息栏 */}
            <header className="techstack-hero">
                <div className="techstack-hero-top">
                    <span className="techstack-hero-eyebrow">技术栈 · TECH STACK</span>
                </div>
                <h2 className="techstack-title">
                    <span className="techstack-title-icon">{stack.icon}</span>
                    <span className="techstack-title-text">{stack.name}</span>
                </h2>
                <div className="techstack-meta">
                    <div className="techstack-meta-item">
                        <span className="techstack-meta-label">覆盖范围</span>
                        <span className="techstack-meta-value">{dayRange}</span>
                    </div>
                    <div className="techstack-meta-divider" />
                    <div className="techstack-meta-item">
                        <span className="techstack-meta-label">知识点数</span>
                        <span className="techstack-meta-value">{pointCount}</span>
                    </div>
                    <div className="techstack-meta-divider" />
                    <div className="techstack-meta-item">
                        <span className="techstack-meta-label">已掌握</span>
                        <span className="techstack-meta-value">
                            {completionStats.done} / {completionStats.total}
                        </span>
                    </div>
                    <div className="techstack-meta-divider" />
                    <div className="techstack-meta-item techstack-meta-progress">
                        <span className="techstack-meta-label">完成率</span>
                        <div className="techstack-progress-ring">
                            <div
                                className="techstack-progress-bar"
                                style={{ width: `${completionPct}%` }}
                            />
                            <span className="techstack-progress-text">{completionPct}%</span>
                        </div>
                    </div>
                    {/* 加入复习清单：一键收集未掌握项 */}
                    <button
                        className="ed-review-btn"
                        onClick={() => {
                            if (unmasteredIds.length > 0) {
                                dispatch({ type: 'ADD_TO_REVIEW', items: unmasteredIds });
                            }
                        }}
                    >
                        🔁 加入复习清单
                        <span className="ed-review-badge">{unmasteredCount} 项未完成</span>
                    </button>
                </div>
                {/* Day 胶囊：点击跳转到对应 Day 卡片视图 */}
                {stack.days.length > 0 && (
                    <div className="ed-day-pills">
                        {stack.days.map((dayNum) => (
                            <a
                                key={dayNum}
                                className={`ed-day-pill ${isDayComplete(dayNum) ? 'done' : ''}`}
                                onClick={() => jumpToDay(dayNum)}
                            >
                                Day {dayNum}
                                {isDayComplete(dayNum) && ' ✓'}
                            </a>
                        ))}
                    </div>
                )}
            </header>

            {/* 全局控制栏：显示全部 / 只看未掌握 / 只看面试题 */}
            <div className="ed-controls">
                <button
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => dispatch({ type: 'SET_TECHSTACK_FILTER', filter: 'all' })}
                >
                    显示全部
                </button>
                <button
                    className={filter === 'unmastered' ? 'active' : ''}
                    onClick={() => dispatch({ type: 'SET_TECHSTACK_FILTER', filter: 'unmastered' })}
                >
                    只看未掌握
                </button>
                <button
                    className={filter === 'interview' ? 'active' : ''}
                    onClick={() => dispatch({ type: 'SET_TECHSTACK_FILTER', filter: 'interview' })}
                >
                    只看面试题
                </button>
            </div>

            {/* 区块渲染：面试优先（面试题库 → 必会题 → 重点知识 → 模拟题）
                interview 筛选下仅渲染面试题库；unmastered 筛选下各区块内部过滤已掌握项 */}
            {filter === 'interview'
                ? renderQuestionSection()
                : (
                    <>
                        {renderQuestionSection()}
                        {renderStrSection('必会题', 'mustKnow', mustKnow, '添加必会题')}
                        {renderStrSection('重点知识', 'knowledge', knowledge, '添加重点知识')}
                        {renderMockSection()}
                    </>
                )}

            {isEmpty && (
                <p className="empty-hint">该技术栈暂无预置内容，可点击上方"添加"按钮添加自定义内容</p>
            )}
        </div>
    );
}

export default TechStackView;
