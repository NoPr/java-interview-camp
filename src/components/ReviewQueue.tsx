import { useAppState } from '../hooks/useAppState';
import { urgencyWeight } from '../utils/reviewUrgency';
import type { ReviewUrgency, MasteryLevel, WeakReason } from '../types';

const URGENCY_META: Record<ReviewUrgency, { icon: string; label: string; color: string }> = {
    high: { icon: '🔴', label: '高紧迫', color: 'high' },
    mid: { icon: '🟡', label: '中紧迫', color: 'mid' },
    low: { icon: '⚪', label: '低紧迫', color: 'low' },
};

const REASON_META: Record<WeakReason, { icon: string; label: string; advice: string }> = {
    concept: { icon: '📖', label: '概念不清', advice: '重学理论：展开答案/查文档' },
    memory: { icon: '🔄', label: '记忆模糊', advice: '闪卡重复：快速过一遍关键词' },
    articulate: { icon: '🗣', label: '讲不出来', advice: '口述练习：闭眼讲一遍' },
    confuse: { icon: '🔀', label: '易混淆', advice: '对比辨析：找相似概念对比' },
    apply: { icon: '✏️', label: '不会应用', advice: '实战做题：找相关题练习' },
};

const MASTERY_OPTIONS: Array<{ value: MasteryLevel; label: string }> = [
    { value: 'clueless', label: '完全没思路' },
    { value: 'vague', label: '能讲个大概' },
    { value: 'mastered', label: '已掌握' },
];

interface ReviewItem {
    key: string;
    text: string;
    day: number;
    reason: WeakReason | undefined;
    urgency: ReviewUrgency | undefined;
    mastery: MasteryLevel;
}

export function ReviewQueue() {
    const { state, dispatch } = useAppState();

    // 收集所有待复习项：questionReview[key] === true（含已掌握，归入已掌握分组置底）
    const items: ReviewItem[] = Object.entries(state.questionReview)
        .filter(([_, inReview]) => inReview)
        .map(([key]) => {
            const meta = state.weakMeta[key];
            return {
                key,
                text: meta?.text ?? key,
                day: meta?.day ?? 0,
                reason: state.weakReason[key],
                urgency: state.reviewUrgency[key],
                mastery: state.masteryLevel[key] ?? 'unknown',
            };
        })
        .sort((a, b) => urgencyWeight(a.urgency) - urgencyWeight(b.urgency));

    // 按紧迫度分组（已掌握单独分组置底）
    const groups: Record<string, ReviewItem[]> = {
        high: items.filter((i) => i.urgency === 'high' && i.mastery !== 'mastered'),
        mid: items.filter((i) => i.urgency === 'mid' && i.mastery !== 'mastered'),
        low: items.filter((i) => i.urgency === 'low' && i.mastery !== 'mastered'),
        mastered: items.filter((i) => i.mastery === 'mastered'),
    };

    const total = items.length;
    const unmasteredCount = items.filter((i) => i.mastery !== 'mastered').length;
    const masteredCount = total - unmasteredCount;

    const handleMasteryChange = (key: string, level: MasteryLevel) => {
        dispatch({ type: 'SET_MASTERY_LEVEL', key, level });
    };

    const handleJumpToDay = (day: number) => {
        if (day > 0) {
            dispatch({ type: 'SET_CURRENT_DAY', day });
        }
    };

    const handleMarkAllMastered = () => {
        items
            .filter((item) => item.mastery !== 'mastered')
            .forEach((item) => {
                dispatch({ type: 'SET_MASTERY_LEVEL', key: item.key, level: 'mastered' });
            });
    };

    if (total === 0) {
        // 保留现有空状态（total 含已掌握，若 total===0 说明真没有项）
        return (
            <div className="ed-review-queue ed-review-queue-empty">
                <p className="ed-review-hint">🎉 复习队列为空，没有待复习的不牢固项！</p>
            </div>
        );
    }

    return (
        <div className="ed-review-queue">
            <div className="ed-review-queue-header">
                <h3 className="ed-review-queue-title">
                    🔄 复习队列（未掌握 {unmasteredCount} / 已掌握 {masteredCount}）
                </h3>
                <button className="ed-review-queue-btn" onClick={handleMarkAllMastered}>
                    将未掌握项全部标已掌握
                </button>
            </div>

            {(['high', 'mid', 'low', 'mastered'] as const).map((urgency) => {
                const groupItems = groups[urgency];
                if (groupItems.length === 0) return null;
                // 已掌握组用固定 meta，其余用 URGENCY_META
                const meta = urgency === 'mastered'
                    ? { icon: '✅', label: '已掌握', color: 'mastered' }
                    : URGENCY_META[urgency as ReviewUrgency];
                return (
                    <div key={urgency} className={`ed-review-group ed-review-group--${meta.color}`}>
                        <div className="ed-review-group-header">
                            {meta.icon} {meta.label}（{groupItems.length} 项）
                        </div>
                        {groupItems.map((item) => {
                            const reasonMeta = item.reason ? REASON_META[item.reason] : null;
                            return (
                                <div key={item.key} className="ed-review-item">
                                    <div className="ed-review-item-main">
                                        {reasonMeta && <span className="ed-review-reason-icon">{reasonMeta.icon}</span>}
                                        <span className="ed-review-item-text">{item.text}</span>
                                        {item.day > 0 && (
                                            <button
                                                className="ed-review-day-tag"
                                                onClick={() => handleJumpToDay(item.day)}
                                                title={`跳转到 Day ${item.day}`}
                                            >
                                                Day {item.day}
                                            </button>
                                        )}
                                    </div>
                                    {reasonMeta && (
                                        <div className="ed-review-advice">
                                            原因：{reasonMeta.label} → {reasonMeta.advice}
                                        </div>
                                    )}
                                    <div className="ed-review-item-actions">
                                        <label className="ed-review-mastery">
                                            程度：
                                            <select
                                                value={item.mastery}
                                                onChange={(e) =>
                                                    handleMasteryChange(item.key, e.target.value as MasteryLevel)
                                                }
                                            >
                                                {MASTERY_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
