import { useAppState } from '../hooks/useAppState';
import { PLAN } from '../data/plan';
import type { CustomItem } from '../types';
import { ReviewQueue } from './ReviewQueue';
import { Block } from './daycard/Block';
import { TaskItem } from './daycard/TaskItem';
import { StrBlock } from './daycard/StrBlock';
import { MockBlock } from './daycard/MockBlock';
import { CardBlock } from './daycard/CardBlock';
import { YesterdayReview } from './daycard/YesterdayReview';
import { getDayStats } from './daycard/helpers';

export default function DayCard() {
    const { state, dispatch } = useAppState();
    const { currentDay, tier } = state;
    const day = PLAN.days[currentDay];

    if (!day) {
        return <div className="content">未找到 Day {currentDay} 的数据</div>;
    }

    const stats = getDayStats(currentDay, day, state);
    const progressPercent = Math.round(stats.progress * 100);

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

            {day.isReview ? (
                <>
                    <Block variant="review" num="00" title="复习队列" count="按紧迫度">
                        <ReviewQueue />
                    </Block>
                    <Block variant="algo" num="03" title="复盘任务" count={`${stats.done}/${stats.total}`}>
                        <div className="task-list">
                            {day.tasks?.map((task, idx) => (
                                <TaskItem
                                    checked={!!state.tasks[`${currentDay}-tasks-${idx}`]}
                                    key={`task-${currentDay}-${idx}`}
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
                </>
            ) : (
                <>
                    {/* 复习昨日（Day 2+）：列出昨日不牢固项或显示正向空状态 */}
                    {currentDay > 1 && <YesterdayReview prevDay={currentDay - 1} />}

                    {/* 重点知识 */}
                    <StrBlock variant="knowledge" title="重点知识" type="knowledge" presetArr={day.knowledge} currentDay={currentDay} />

                    {/* 必会题 */}
                    <StrBlock variant="mustknow" title="必会题" type="mustKnow" presetArr={day.mustKnow} currentDay={currentDay} />
                </>
            )}

            {/* 模拟题 */}
            <MockBlock currentDay={currentDay} />

            {/* 算法题 */}
            {day.algo && (
                <Block variant="algo" num="03" title="算法练习" count="20min">
                    <div className="algo-item">
                        <div className="algo-left">
                            <div
                                className={`checkbox ${state.algo[`${currentDay}`] ? 'checked' : ''}`}
                                onClick={() => dispatch({ type: 'TOGGLE_ALGO', key: `${currentDay}` })}
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
            <CardBlock currentDay={currentDay} />

            {/* tier5 内容：5h / 6h 档显示 */}
            {tier !== '3h' && (
                <StrBlock variant="interview" title="深度拓展（5h+）" type="tier5" presetArr={day.tier5} currentDay={currentDay} />
            )}

            {/* tier6 内容：6h 档显示 */}
            {tier === '6h' && (
                <StrBlock variant="interview" title="扩展专题（6h）" type="tier6" presetArr={day.tier6} currentDay={currentDay} />
            )}
        </div>
    );
}
