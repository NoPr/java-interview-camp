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

export default function Overview() {
    const { state, dispatch } = useAppState();

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

            {PLAN.weeks.map((week) => {
                // 计算本周完成率
                let totalProgress = 0;
                let dayCount = 0;
                week.days.forEach((dayNum) => {
                    const day = PLAN.days[dayNum];
                    if (day) {
                        totalProgress += getDayProgress(dayNum, day, state);
                        dayCount++;
                    }
                });
                const weekProgress = dayCount > 0 ? totalProgress / dayCount : 0;
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
