import { PLAN } from '../data/plan';
import { useAppState } from '../hooks/useAppState';
import type { DayData } from '../types';
import { ReviewQueue } from './ReviewQueue';

// 计算某一天的任务完成率（与 Overview 中逻辑一致）
function getDayProgress(
    dayNum: number,
    day: DayData,
    state: ReturnType<typeof useAppState>['state'],
): number {
    const { tasks, mock, algo } = state;
    let total = 0;
    let done = 0;

    const countArr = (arr: string[] | undefined, type: string) => {
        if (!arr) return;
        total += arr.length;
        arr.forEach((_, idx) => {
            if (tasks[`${dayNum}-${type}-${idx}`]) done++;
        });
    };

    countArr(day.knowledge, 'knowledge');
    countArr(day.mustKnow, 'mustKnow');
    countArr(day.tier5, 'tier5');
    countArr(day.tier6, 'tier6');
    countArr(day.tasks, 'tasks');

    if (day.mock) {
        total += day.mock.length;
        day.mock.forEach((_, idx) => {
            if (mock[`${dayNum}-${idx}`]) done++;
        });
    }

    if (day.algo) {
        total += 1;
        if (algo[`${dayNum}`]) done++;
    }

    return total === 0 ? 0 : done / total;
}

// 连续打卡天数
function calcStreak(checkins: string[]): number {
    if (checkins.length === 0) return 0;
    const set = new Set(checkins);
    let streak = 0;
    const cursor = new Date();
    while (true) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, '0');
        const d = String(cursor.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        if (set.has(dateStr)) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

// 统计待复习项数量
function countReviewItems(state: ReturnType<typeof useAppState>['state']): number {
    return Object.entries(state.questionReview)
        .filter(([_, inReview]) => inReview)
        .filter(([key]) => state.masteryLevel[key] !== 'mastered')
        .length;
}

// 统计总体进度
function getOverallProgress(state: ReturnType<typeof useAppState>['state']): { done: number; total: number; percent: number } {
    let totalDone = 0;
    let totalTasks = 0;
    Object.keys(PLAN.days).forEach((dayNumStr) => {
        const dayNum = parseInt(dayNumStr, 10);
        const day = PLAN.days[dayNum];
        if (!day) return;
        const { tasks, mock, algo } = state;
        const countArr = (arr: string[] | undefined, type: string) => {
            if (!arr) return;
            totalTasks += arr.length;
            arr.forEach((_, idx) => {
                if (tasks[`${dayNum}-${type}-${idx}`]) totalDone++;
            });
        };
        countArr(day.knowledge, 'knowledge');
        countArr(day.mustKnow, 'mustKnow');
        countArr(day.tier5, 'tier5');
        countArr(day.tier6, 'tier6');
        countArr(day.tasks, 'tasks');
        if (day.mock) {
            totalTasks += day.mock.length;
            day.mock.forEach((_, idx) => {
                if (mock[`${dayNum}-${idx}`]) totalDone++;
            });
        }
        if (day.algo) {
            totalTasks += 1;
            if (algo[`${dayNum}`]) totalDone++;
        }
    });
    return {
        done: totalDone,
        total: totalTasks,
        percent: totalTasks === 0 ? 0 : Math.round((totalDone / totalTasks) * 100),
    };
}

export function AsidePanel() {
    const { state, dispatch } = useAppState();
    const { currentDay, checkins } = state;
    const day = PLAN.days[currentDay];
    const dayProgress = day ? getDayProgress(currentDay, day, state) : 0;
    const dayPercent = Math.round(dayProgress * 100);
    const streak = calcStreak(checkins);
    const reviewCount = countReviewItems(state);
    const overall = getOverallProgress(state);

    // 快捷导航：前一天 / 后一天
    const prevDay = currentDay > 1 ? currentDay - 1 : null;
    const nextDay = currentDay < 30 ? currentDay + 1 : null;

    return (
        <aside className="aside-panel">
            {/* 今日统计 */}
            <div className="aside-section">
                <div className="aside-section-title">今日进度</div>
                <div className="aside-stat-card">
                    <div className="aside-stat-ring">
                        <svg viewBox="0 0 56 56" className="aside-ring-svg">
                            <circle cx="28" cy="28" r="24" className="aside-ring-bg" />
                            <circle
                                cx="28"
                                cy="28"
                                r="24"
                                className="aside-ring-fill"
                                style={{
                                    strokeDasharray: `${2 * Math.PI * 24}`,
                                    strokeDashoffset: `${2 * Math.PI * 24 * (1 - dayProgress)}`,
                                }}
                            />
                        </svg>
                        <span className="aside-ring-num">{dayPercent}%</span>
                    </div>
                    <div className="aside-stat-meta">
                        <div className="aside-stat-label">Day {currentDay}</div>
                        <div className="aside-stat-sub">{day?.title ?? '—'}</div>
                    </div>
                </div>
            </div>

            {/* 打卡 & 连续天数 */}
            <div className="aside-section">
                <div className="aside-section-title">打卡记录</div>
                <div className="aside-streak-row">
                    <div className="aside-streak-num">{streak}</div>
                    <div className="aside-streak-label">连续天数</div>
                </div>
                <div className="aside-streak-row">
                    <div className="aside-streak-num">{checkins.length}</div>
                    <div className="aside-streak-label">累计打卡</div>
                </div>
            </div>

            {/* 总体进度 */}
            <div className="aside-section">
                <div className="aside-section-title">30天总进度</div>
                <div className="aside-overall-bar">
                    <div
                        className="aside-overall-fill"
                        style={{ width: `${overall.percent}%` }}
                    />
                </div>
                <div className="aside-overall-text">
                    {overall.done} / {overall.total}（{overall.percent}%）
                </div>
            </div>

            {/* 快捷导航 */}
            <div className="aside-section">
                <div className="aside-section-title">快捷导航</div>
                <div className="aside-nav-row">
                    <button
                        className="aside-nav-btn"
                        disabled={!prevDay}
                        onClick={() => prevDay && dispatch({ type: 'SET_CURRENT_DAY', day: prevDay })}
                    >
                        ← Day {prevDay ?? '—'}
                    </button>
                    <button
                        className="aside-nav-btn"
                        disabled={!nextDay}
                        onClick={() => nextDay && dispatch({ type: 'SET_CURRENT_DAY', day: nextDay })}
                    >
                        Day {nextDay ?? '—'} →
                    </button>
                </div>
                <button
                    className="aside-nav-btn aside-nav-btn--full"
                    onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', view: 'overview' })}
                >
                    🗺️ 路线图总览
                </button>
            </div>

            {/* 复习队列（仅在有待复习项时显示） */}
            {reviewCount > 0 && (
                <div className="aside-section aside-section--review">
                    <div className="aside-section-title">
                        🔄 复习队列
                        <span className="aside-section-badge">{reviewCount}</span>
                    </div>
                    <div className="aside-review-compact">
                        <ReviewQueue />
                    </div>
                </div>
            )}
        </aside>
    );
}
