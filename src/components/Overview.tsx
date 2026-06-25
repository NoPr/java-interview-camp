import { PLAN } from '../data/plan';
import { useAppState } from '../hooks/useAppState';
import type { DayData } from '../types';

// 计算某一天的任务完成率
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

// 热力日历颜色等级：0-4
function heatLevel(progress: number): number {
    if (progress >= 1) return 4;
    if (progress >= 0.75) return 3;
    if (progress >= 0.5) return 2;
    if (progress > 0) return 1;
    return 0;
}

// 周环形图组件
function WeekRing({
    weekIndex,
    progress,
    onClick,
}: {
    weekIndex: number;
    progress: number;
    onClick: () => void;
}) {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);
    const percent = Math.round(progress * 100);

    return (
        <div className="overview-ring-card" onClick={onClick}>
            <svg viewBox="0 0 72 72" className="overview-ring-svg">
                <circle
                    cx="36"
                    cy="36"
                    r={radius}
                    className="overview-ring-bg-circle"
                />
                <circle
                    cx="36"
                    cy="36"
                    r={radius}
                    className="overview-ring-fill-circle"
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                    }}
                />
            </svg>
            <div className="overview-ring-center">
                <span className="overview-ring-percent">{percent}%</span>
            </div>
            <div className="overview-ring-label">W{weekIndex + 1}</div>
        </div>
    );
}

export default function Overview() {
    const { state, dispatch } = useAppState();

    // 计算每周完成率
    const weekData = PLAN.weeks.map((week, idx) => {
        let totalProgress = 0;
        let dayCount = 0;
        week.days.forEach((dayNum) => {
            const day = PLAN.days[dayNum];
            if (day) {
                totalProgress += getDayProgress(dayNum, day, state);
                dayCount++;
            }
        });
        return {
            week,
            index: idx,
            progress: dayCount > 0 ? totalProgress / dayCount : 0,
        };
    });

    // 构建 30 天热力日历数据
    const allDayNums = Array.from({ length: 30 }, (_, i) => i + 1);
    const heatData = allDayNums.map((dayNum) => {
        const day = PLAN.days[dayNum];
        if (!day) return { dayNum, level: 0, progress: 0 };
        const p = getDayProgress(dayNum, day, state);
        return { dayNum, level: heatLevel(p), progress: p };
    });

    // 按周分组（每行 7 天，最后一行 2 天）
    const heatRows: typeof heatData[] = [];
    for (let i = 0; i < heatData.length; i += 7) {
        heatRows.push(heatData.slice(i, i + 7));
    }

    return (
        <div className="content">
            <div className="content-header">
                <div className="day-title">🗺️ 路线图总览</div>
            </div>

            <div className="overview-summary">
                <div className="overview-stat">
                    <div className="overview-stat-num">{PLAN.weeks.length}</div>
                    <div className="overview-stat-label">周</div>
                </div>
                <div className="overview-stat">
                    <div className="overview-stat-num">30</div>
                    <div className="overview-stat-label">天</div>
                </div>
                <div className="overview-stat">
                    <div className="overview-stat-num">{state.checkins.length}</div>
                    <div className="overview-stat-label">已打卡</div>
                </div>
            </div>

            {/* 周维度环形完成率 */}
            <div className="overview-rings">
                <div className="overview-rings-title">周完成率</div>
                <div className="overview-rings-row">
                    {weekData.map(({ week, index, progress }) => (
                        <WeekRing
                            key={week.name}
                            weekIndex={index}
                            progress={progress}
                            onClick={() =>
                                dispatch({ type: 'SET_CURRENT_DAY', day: week.days[0] })
                            }
                        />
                    ))}
                </div>
            </div>

            {/* 30 天热力日历 */}
            <div className="overview-heatmap">
                <div className="overview-heatmap-title">30 天完成度</div>
                <div className="overview-heatmap-grid">
                    {heatRows.map((row, rowIdx) => (
                        <div className="overview-heatmap-row" key={rowIdx}>
                            {row.map(({ dayNum, level }) => {
                                const day = PLAN.days[dayNum];
                                const isReview = day?.isReview;
                                return (
                                    <div
                                        key={dayNum}
                                        className={`overview-heat-cell level-${level} ${
                                            isReview ? 'review' : ''
                                        } ${state.currentDay === dayNum ? 'current' : ''}`}
                                        onClick={() =>
                                            dispatch({ type: 'SET_CURRENT_DAY', day: dayNum })
                                        }
                                        title={`Day ${dayNum}${day ? ' · ' + day.title : ''}`}
                                    >
                                        <span className="overview-heat-num">{dayNum}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
                <div className="overview-heatmap-legend">
                    <span className="overview-heatmap-legend-label">少</span>
                    <div className="overview-heat-cell level-0 mini" />
                    <div className="overview-heat-cell level-1 mini" />
                    <div className="overview-heat-cell level-2 mini" />
                    <div className="overview-heat-cell level-3 mini" />
                    <div className="overview-heat-cell level-4 mini" />
                    <span className="overview-heatmap-legend-label">多</span>
                </div>
            </div>

            {state.checkins.length === 0 && (
                <div className="ed-empty-state ed-empty-state--overview">
                    <div className="ed-empty-state-icon">📍</div>
                    <div className="ed-empty-state-title">尚未开始打卡</div>
                    <div className="ed-empty-state-desc">
                        点击右上角「打卡」按钮记录今天的学习，开始你的 30 天冲刺之旅。
                    </div>
                </div>
            )}

            {PLAN.weeks.map((week) => {
                const wd = weekData.find((w) => w.week.name === week.name);
                const weekProgress = wd?.progress ?? 0;
                const weekPercent = Math.round(weekProgress * 100);

                return (
                    <div
                        className="overview-week"
                        key={week.name}
                        onClick={() => dispatch({ type: 'SET_CURRENT_DAY', day: week.days[0] })}
                    >
                        <div className="overview-week-header">
                            <div className="overview-week-title">{week.name}</div>
                            <div className="overview-week-subtitle">{week.subtitle}</div>
                            <div className="overview-week-progress">{weekPercent}%</div>
                        </div>
                        <div className="overview-week-bar">
                            <div
                                className="overview-week-bar-fill"
                                style={{ width: `${weekPercent}%` }}
                            />
                        </div>
                        <div className="overview-week-days">
                            {week.days.map((dayNum) => {
                                const day = PLAN.days[dayNum];
                                if (!day) return null;
                                const p = getDayProgress(dayNum, day, state);
                                const dotClass = day.isReview
                                    ? 'overview-dot review'
                                    : p >= 1
                                        ? 'overview-dot done'
                                        : p > 0
                                            ? 'overview-dot partial'
                                            : 'overview-dot';
                                return (
                                    <div className="overview-day" key={dayNum}>
                                        <div className={dotClass} />
                                        <span className="overview-day-num">D{dayNum}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
