import { PLAN } from '../data/plan';
import { TECH_STACKS, TECH_STACK_GROUPS, getTechStackPointCount, formatDayRange } from '../data/techStacks';
import { INTERVIEW_QUESTIONS } from '../data/interviewQuestions';
import { useAppState } from '../hooks/useAppState';
import type { DayData, TechStack, AppState } from '../types';

// 计算某一天的任务完成率（0-1）
// 统计范围：knowledge / mustKnow / mock / algo / tier5 / tier6 / tasks
// 考虑隐藏的预置内容和自定义内容，与 DayCard 的 getDayStats 保持一致
function getDayProgress(dayNum: number, day: DayData, state: ReturnType<typeof useAppState>['state']): number {
    const { tasks, mock, algo, customContent, hiddenContent } = state;
    let total = 0;
    let done = 0;

    // 统计字符串数组类型（knowledge/mustKnow/tier5/tier6）
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

    // card：预置卡片不计入统计，自定义卡片可勾选计入统计
    const customCard = customContent[`${dayNum}-card`] || [];
    total += customCard.length;
    customCard.forEach((item) => {
        if (tasks[`custom-${item.id}`]) done++;
    });

    if (day.algo) {
        total += 1;
        if (algo[`${dayNum}`]) done++;
    }

    return total === 0 ? 0 : done / total;
}

// 计算技术栈已掌握的知识点数
// 统计口径与 getTechStackPointCount 对齐：knowledge / mustKnow / mock + 面试题库掌握数
// 保证 masteredCount <= pointCount，避免出现完成率 > 100% 的异常
function getTechStackMasteredCount(stack: TechStack, state: AppState): number {
    let count = 0;
    stack.days.forEach((dayNum) => {
        const day = PLAN.days[dayNum];
        if (!day) return;
        (day.knowledge || []).forEach((_, idx) => {
            if (state.tasks[`${dayNum}-knowledge-${idx}`]) count++;
        });
        (day.mustKnow || []).forEach((_, idx) => {
            if (state.tasks[`${dayNum}-mustKnow-${idx}`]) count++;
        });
        if (day.mock) {
            day.mock.forEach((_, idx) => {
                if (state.mock[`${dayNum}-${idx}`]) count++;
            });
        }
    });
    const questions = INTERVIEW_QUESTIONS[stack.id] || [];
    questions.forEach((q) => {
        if (state.questionStatus[q.id]?.mastered) count++;
    });
    return count;
}

export default function Sidebar() {
    const { state, dispatch } = useAppState();
    const { expandedWeeks, currentDay, currentView, sidebarView, currentTechStack } = state;

    return (
        <aside className={`sidebar ${state.sidebarOpen ? 'open' : ''}`}>
            {/* 侧边栏 tab 切换：按时间 / 按技术栈 */}
            <div className="sidebar-tabs">
                <button
                    className={`sidebar-tab ${sidebarView === 'time' ? 'active' : ''}`}
                    onClick={() => dispatch({ type: 'SET_SIDEBAR_VIEW', view: 'time' })}
                >
                    按时间
                </button>
                <button
                    className={`sidebar-tab ${sidebarView === 'techstack' ? 'active' : ''}`}
                    onClick={() => dispatch({ type: 'SET_SIDEBAR_VIEW', view: 'techstack' })}
                >
                    按技术栈
                </button>
            </div>

            {sidebarView === 'time' ? (
                <>
                    <div className="sidebar-section">
                        <div
                            className={`sidebar-label ${currentView === 'overview' ? 'active' : ''}`}
                            onClick={() => {
                                dispatch({ type: 'SET_CURRENT_VIEW', view: 'overview' });
                                if (state.sidebarOpen) dispatch({ type: 'TOGGLE_SIDEBAR' });
                            }}
                        >
                            <span>🗺️ 路线图总览</span>
                        </div>
                    </div>

                    <div className="sidebar-divider" />

                    {PLAN.weeks.map((week) => {
                        const expanded = expandedWeeks.includes(week.days[0]);
                        return (
                            <div className="sidebar-section" key={week.name}>
                                <div
                                    className="sidebar-label"
                                    onClick={() => dispatch({ type: 'TOGGLE_WEEK', week: week.days[0] })}
                                >
                                    <span>{expanded ? '▾' : '▸'}</span>
                                    <span>{week.name}</span>
                                    <span className="week-progress">{week.subtitle}</span>
                                </div>
                                {expanded &&
                                    week.days.map((dayNum) => {
                                        const day = PLAN.days[dayNum];
                                        if (!day) return null;
                                        const progress = getDayProgress(dayNum, day, state);
                                        const isActive = currentDay === dayNum && currentView === 'day';
                                        const dotClass = day.isReview
                                            ? 'nav-dot review'
                                            : progress >= 1
                                                ? 'nav-dot done'
                                                : 'nav-dot';
                                        return (
                                            <div
                                                className={`nav-item ${isActive ? 'active' : ''}`}
                                                key={dayNum}
                                                onClick={() => {
                                                    dispatch({ type: 'SET_CURRENT_DAY', day: dayNum });
                                                    if (state.sidebarOpen) dispatch({ type: 'TOGGLE_SIDEBAR' });
                                                }}
                                            >
                                                <span className={dotClass} />
                                                <span className="nav-item-text">
                                                    Day {dayNum} · {day.title}
                                                </span>
                                                <span className="nav-progress">
                                                    {Math.round(progress * 100)}%
                                                </span>
                                            </div>
                                        );
                                    })}
                            </div>
                        );
                    })}
                </>
            ) : (
                <div className="sidebar-techstacks">
                    {TECH_STACK_GROUPS.map((group) => (
                        <div className="techstack-group" key={group.id}>
                            <div className="techstack-group-header">
                                <span className="techstack-group-name">{group.name}</span>
                                <span className="techstack-group-subtitle">{group.subtitle}</span>
                            </div>
                            {group.stackIds.map((stackId) => {
                                const stack = TECH_STACKS.find((s) => s.id === stackId);
                                if (!stack) return null;
                                const pointCount = getTechStackPointCount(stack);
                                const masteredCount = getTechStackMasteredCount(stack, state);
                                const isComplete = pointCount > 0 && masteredCount === pointCount;
                                const dayRange = formatDayRange(stack.days);
                                const isActive = currentTechStack === stack.id;
                                const isEmpty = stack.days.length === 0;
                                const countText = pointCount === 0
                                    ? '待补充'
                                    : isComplete
                                        ? `✓ ${masteredCount}/${pointCount}`
                                        : `${masteredCount}/${pointCount}`;
                                return (
                                    <div
                                        key={stack.id}
                                        className={`techstack-item ${isActive ? 'active' : ''} ${isEmpty ? 'empty' : ''}`}
                                        onClick={() => {
                                            dispatch({ type: 'SET_TECH_STACK', stackId: stack.id });
                                            if (state.sidebarOpen) dispatch({ type: 'TOGGLE_SIDEBAR' });
                                        }}
                                    >
                                        <span className="techstack-icon">{stack.icon}</span>
                                        <div className="techstack-info">
                                            <span className="techstack-name">{stack.name}</span>
                                            <span className="techstack-day-range">{dayRange}</span>
                                        </div>
                                        <span className={`techstack-count ${isComplete ? 'complete' : ''}`}>{countText}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </aside>
    );
}
