import { useAppState } from '../../hooks/useAppState';
import { PLAN } from '../../data/plan';
import { Block } from './Block';

// "复习昨日"区块：原 DayCard.tsx 中内联 IIFE（100+ 行）抽出为独立组件
//
// 职责：
// 1. 收集昨日标记为不牢固且未掌握的项
// 2. 收集昨日未完成的任务
// 3. 渲染空状态 / 列表 + 跳转按钮
export function YesterdayReview({ prevDay }: { prevDay: number }) {
    const { state, dispatch } = useAppState();

    // 收集昨日标记为不牢固且未掌握的项
    const yesterdayWeakItems = Object.entries(state.questionReview)
        .filter(([, inReview]) => inReview)
        .filter(([key]) => state.masteryLevel[key] !== 'mastered')
        .filter(([key]) => state.weakMeta[key]?.day === prevDay)
        .map(([key]) => ({
            key,
            text: state.weakMeta[key]?.text ?? key,
            reason: state.weakReason[key],
            urgency: state.reviewUrgency[key],
        }));

    // 收集昨日未完成任务
    const prevDayData = PLAN.days[prevDay];
    const yesterdayPending: string[] = [];
    if (prevDayData) {
        const checkArr = (arr: string[] | undefined, type: string) => {
            if (!arr) return;
            arr.forEach((text, idx) => {
                if (!state.tasks[`${prevDay}-${type}-${idx}`]) {
                    yesterdayPending.push(text);
                }
            });
        };
        checkArr(prevDayData.knowledge, 'knowledge');
        checkArr(prevDayData.mustKnow, 'mustKnow');
        if (prevDayData.mock) {
            prevDayData.mock.forEach((_, idx) => {
                if (!state.mock[`${prevDay}-${idx}`]) {
                    yesterdayPending.push(prevDayData.mock![idx].q);
                }
            });
        }
    }

    const hasItems = yesterdayWeakItems.length > 0 || yesterdayPending.length > 0;
    const gotoPrev = () => dispatch({ type: 'SET_CURRENT_DAY', day: prevDay });

    return (
        <Block variant="review" num="00" title="复习昨日" count="20min">
            <div className="ed-review-yesterday">
                {hasItems ? (
                    <>
                        {yesterdayWeakItems.length > 0 && (
                            <div className="ed-review-yesterday-group">
                                <div className="ed-review-yesterday-label">
                                    🔴 不牢固项（{yesterdayWeakItems.length}）
                                </div>
                                {yesterdayWeakItems.map((item) => (
                                    <div
                                        key={item.key}
                                        className="ed-review-yesterday-item"
                                        onClick={gotoPrev}
                                    >
                                        <span className="ed-review-yesterday-text">{item.text}</span>
                                        {item.urgency && (
                                            <span className={`ed-review-yesterday-urgency ${item.urgency}`}>
                                                {item.urgency === 'high' ? '🔴' : item.urgency === 'mid' ? '🟡' : '⚪'}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {yesterdayPending.length > 0 && (
                            <div className="ed-review-yesterday-group">
                                <div className="ed-review-yesterday-label">
                                    📋 未完成任务（{yesterdayPending.length}）
                                </div>
                                {yesterdayPending.slice(0, 5).map((text, idx) => (
                                    <div
                                        key={`pending-${idx}`}
                                        className="ed-review-yesterday-item"
                                        onClick={gotoPrev}
                                    >
                                        <span className="ed-review-yesterday-text">{text}</span>
                                    </div>
                                ))}
                                {yesterdayPending.length > 5 && (
                                    <div className="ed-review-yesterday-more">
                                        还有 {yesterdayPending.length - 5} 项…
                                        <span className="ed-review-yesterday-link" onClick={gotoPrev}>
                                            查看全部
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="ed-review-yesterday-action">
                            <button className="ed-review-yesterday-btn" onClick={gotoPrev}>
                                前往 Day {prevDay} →
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="ed-empty-state">
                        <div className="ed-empty-state-icon">✨</div>
                        <div className="ed-empty-state-title">昨日全部掌握</div>
                        <div className="ed-empty-state-desc">
                            Day {prevDay} 没有遗留的不牢固项和未完成任务，直接开始今天的学习吧。
                        </div>
                    </div>
                )}
            </div>
        </Block>
    );
}
