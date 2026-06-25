import type { WeakReason, MasteryLevel, ReviewUrgency, QuestionPriority } from '../../types';
import type { AppStateRef, AppDispatch } from './helpers';

// 不掌握原因 → 图标
const REASON_ICONS: Record<WeakReason, string> = {
    concept: '📖',
    memory: '🔄',
    articulate: '🗣',
    confuse: '🔀',
    apply: '✏️',
};

// 紧迫度 → 图标
const URGENCY_ICONS: Record<ReviewUrgency, string> = {
    high: '🔴',
    mid: '🟡',
    low: '⚪',
};

// 渲染"💡遇到不牢固"按钮
export function renderWeakButton(
    dispatch: AppDispatch,
    key: string,
    text: string,
    priority: QuestionPriority = 'yellow',
) {
    return (
        <button
            key={`weak-btn-${key}`}
            className="ed-weak-btn"
            title="遇到不牢固"
            onClick={() => dispatch({ type: 'OPEN_WEAK_DIALOG', key, text, priority })}
        >
            💡
        </button>
    );
}

// 渲染标记展示（原因图标 + 程度边框 + 紧迫角标）
export function renderWeakMarks(state: AppStateRef, key: string) {
    const reason: WeakReason | undefined = state.weakReason[key];
    const mastery: MasteryLevel | undefined = state.masteryLevel[key];
    const urgency = state.reviewUrgency[key];
    if (!reason && !mastery && !urgency) return null;
    return (
        <span className="ed-weak-marks" key={`weak-marks-${key}`}>
            {reason && <span className="ed-weak-reason">{REASON_ICONS[reason]}</span>}
            {urgency && <span className="ed-weak-urgency">{URGENCY_ICONS[urgency]}</span>}
        </span>
    );
}
