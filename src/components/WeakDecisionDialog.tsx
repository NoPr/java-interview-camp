import { useState, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { suggestDecision, computeUrgency } from '../utils/reviewUrgency';
import type { WeakReason, QuestionPriority } from '../types';

const REASON_OPTIONS: Array<{ value: WeakReason; label: string; icon: string }> = [
    { value: 'concept', label: '概念不清', icon: '📖' },
    { value: 'memory', label: '记忆模糊', icon: '🔄' },
    { value: 'articulate', label: '讲不出来', icon: '🗣' },
    { value: 'confuse', label: '易混淆', icon: '🔀' },
    { value: 'apply', label: '不会应用', icon: '✏️' },
];

const URGENCY_LABEL: Record<string, string> = {
    high: '高紧迫（下次复习日必看）',
    mid: '中紧迫（本周内）',
    low: '低紧迫（面试前冲刺）',
};

const MASTERY_LABEL: Record<string, string> = {
    mastered: '已掌握',
    vague: '能讲个大概',
    clueless: '完全没思路',
    unknown: '未评估',
};

const REASON_META: Record<WeakReason, { icon: string; label: string; advice: string }> = {
    concept: { icon: '📖', label: '概念不清', advice: '重学理论：展开答案/查文档' },
    memory: { icon: '🔄', label: '记忆模糊', advice: '闪卡重复：快速过一遍关键词' },
    articulate: { icon: '🗣', label: '讲不出来', advice: '口述练习：闭眼讲一遍' },
    confuse: { icon: '🔀', label: '易混淆', advice: '对比辨析：找相似概念对比' },
    apply: { icon: '✏️', label: '不会应用', advice: '实战做题：找相关题练习' },
};

export function WeakDecisionDialog() {
    const { state, dispatch } = useAppState();
    const dialog = state.dialogState;

    const [isPrerequisite, setIsPrerequisite] = useState<'yes' | 'no' | 'uncertain'>('no');
    const [mastery, setMastery] = useState<'clueless' | 'vague'>('vague');
    const [reason, setReason] = useState<WeakReason | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);

    // 弹窗打开时重置内部状态
    useEffect(() => {
        if (dialog?.open) {
            setIsPrerequisite('no');
            setMastery('vague');
            setReason(null);
            setShowAnswer(false);
            setConfirmClear(false);
        }
    }, [dialog?.open, dialog?.key]);

    if (!dialog?.open) return null;

    // 撤销标记：清除该题所有不牢固标记并关闭弹窗（详情视图与确认弹窗均会调用）
    const handleClear = () => {
        dispatch({ type: 'CLEAR_WEAK_MARK', key: dialog.key });
        dispatch({ type: 'CLOSE_WEAK_DIALOG' });
    };

    // 已标记：显示标记详情视图（含撤销入口）
    const existingReason = state.weakReason[dialog.key];
    if (existingReason && !showAnswer) {
        const reasonMeta = REASON_META[existingReason];
        const existingMastery = state.masteryLevel[dialog.key] ?? 'unknown';
        const existingUrgency = state.reviewUrgency[dialog.key];
        const inReview = !!state.questionReview[dialog.key];

        // 撤销确认弹窗
        if (confirmClear) {
            return (
                <div className="ed-dialog-overlay" onClick={() => setConfirmClear(false)}>
                    <div className="ed-dialog" onClick={(e) => e.stopPropagation()}>
                        <h3 className="ed-dialog-title">确认撤销标记？</h3>
                        <p className="ed-dialog-text">
                            将清除该题所有不牢固标记并移出复习队列，此操作不可恢复。
                        </p>
                        <div className="ed-dialog-actions">
                            <button
                                className="ed-dialog-btn ed-dialog-btn-secondary"
                                onClick={() => setConfirmClear(false)}
                            >
                                取消
                            </button>
                            <button
                                className="ed-dialog-btn ed-dialog-btn-primary"
                                onClick={handleClear}
                            >
                                确认撤销
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // 标记详情视图
        return (
            <div className="ed-dialog-overlay" onClick={() => dispatch({ type: 'CLOSE_WEAK_DIALOG' })}>
                <div className="ed-dialog" onClick={(e) => e.stopPropagation()}>
                    <h3 className="ed-dialog-title">这道题已标记不牢固</h3>
                    <p className="ed-dialog-text">{dialog.text}</p>

                    <div className="ed-dialog-section">
                        <div className="ed-dialog-detail-row">
                            <span className="ed-dialog-detail-label">不掌握原因：</span>
                            <span>{reasonMeta.icon} {reasonMeta.label}</span>
                        </div>
                        <div className="ed-dialog-detail-advice">
                            → 复习方式：{reasonMeta.advice}
                        </div>
                    </div>

                    <div className="ed-dialog-section">
                        <div className="ed-dialog-detail-row">
                            <span className="ed-dialog-detail-label">掌握程度：</span>
                            <span>{MASTERY_LABEL[existingMastery]}</span>
                        </div>
                        <div className="ed-dialog-detail-row">
                            <span className="ed-dialog-detail-label">复习紧迫度：</span>
                            <span>
                                {existingUrgency
                                    ? `${URGENCY_LABEL[existingUrgency]?.split('（')[0] ?? existingUrgency}`
                                    : '—（死磕，未进队列）'}
                            </span>
                        </div>
                        <div className="ed-dialog-detail-row">
                            <span className="ed-dialog-detail-label">在复习队列：</span>
                            <span>{inReview ? '是' : '否'}</span>
                        </div>
                    </div>

                    <button
                        className="ed-dialog-btn ed-dialog-btn-danger"
                        onClick={() => setConfirmClear(true)}
                    >
                        撤销标记
                    </button>
                </div>
            </div>
        );
    }

    const priority: QuestionPriority = dialog.priority;
    const suggestion = suggestDecision(isPrerequisite, mastery, priority);
    const skipUrgency = computeUrgency(isPrerequisite, mastery, priority);

    const handleSubmit = (decision: 'grind' | 'skip') => {
        if (!reason) {
            alert('请先选择"不掌握的原因"');
            return;
        }
        dispatch({
            type: 'WEAK_DECISION',
            key: dialog.key,
            payload: {
                isPrerequisite,
                mastery,
                reason,
                priority,
                decision,
                day: state.currentDay,
                text: dialog.text,
            },
        });
        if (decision === 'grind') {
            // 死磕：切换为答案展示模式
            setShowAnswer(true);
        } else {
            // 跳过：关闭弹窗
            dispatch({ type: 'CLOSE_WEAK_DIALOG' });
        }
    };

    // 答案展示模式（死磕后）
    if (showAnswer) {
        return (
            <div className="ed-dialog-overlay" onClick={() => dispatch({ type: 'CLOSE_WEAK_DIALOG' })}>
                <div className="ed-dialog" onClick={(e) => e.stopPropagation()}>
                    <h3 className="ed-dialog-title">📖 深入学习</h3>
                    <p className="ed-dialog-text">{dialog.text}</p>
                    <div className="ed-dialog-answer">
                        <p className="ed-dialog-hint">
                            请展开答案/要点仔细学习。学完后关闭弹窗继续。
                        </p>
                        <p className="ed-dialog-hint">
                            若该题有答案，请在原位置展开查看（面试题点题目展开 answer，模拟题展开 tips）。
                        </p>
                    </div>
                    <button
                        className="ed-dialog-btn ed-dialog-btn-primary"
                        onClick={() => dispatch({ type: 'CLOSE_WEAK_DIALOG' })}
                    >
                        学完了，关闭
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="ed-dialog-overlay" onClick={() => dispatch({ type: 'CLOSE_WEAK_DIALOG' })}>
            <div className="ed-dialog" onClick={(e) => e.stopPropagation()}>
                <h3 className="ed-dialog-title">💡 这道题不牢固，怎么处理？</h3>
                <p className="ed-dialog-text">{dialog.text}</p>

                {/* ① 前置依赖 */}
                <div className="ed-dialog-section">
                    <label className="ed-dialog-label">① 它是后续知识的前置依赖吗？</label>
                    <div className="ed-dialog-options">
                        {(['yes', 'no', 'uncertain'] as const).map((opt) => (
                            <label key={opt} className={`ed-dialog-radio ${isPrerequisite === opt ? 'checked' : ''}`}>
                                <input
                                    type="radio"
                                    name="prerequisite"
                                    checked={isPrerequisite === opt}
                                    onChange={() => setIsPrerequisite(opt)}
                                />
                                {opt === 'yes' ? '是' : opt === 'no' ? '否' : '不确定'}
                            </label>
                        ))}
                    </div>
                </div>

                {/* ② 掌握程度 */}
                <div className="ed-dialog-section">
                    <label className="ed-dialog-label">② 现在的状态是？</label>
                    <div className="ed-dialog-options">
                        {(['clueless', 'vague'] as const).map((opt) => (
                            <label key={opt} className={`ed-dialog-radio ${mastery === opt ? 'checked' : ''}`}>
                                <input
                                    type="radio"
                                    name="mastery"
                                    checked={mastery === opt}
                                    onChange={() => setMastery(opt)}
                                />
                                {opt === 'clueless' ? '完全没思路' : '能讲个大概'}
                            </label>
                        ))}
                    </div>
                </div>

                {/* ③ 不掌握原因 */}
                <div className="ed-dialog-section">
                    <label className="ed-dialog-label">③ 不掌握的原因是？（决定复习方式）</label>
                    <div className="ed-dialog-reasons">
                        {REASON_OPTIONS.map((opt) => (
                            <label key={opt.value} className={`ed-dialog-radio ${reason === opt.value ? 'checked' : ''}`}>
                                <input
                                    type="radio"
                                    name="reason"
                                    checked={reason === opt.value}
                                    onChange={() => setReason(opt.value)}
                                />
                                {opt.icon} {opt.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* 系统建议 */}
                <div className="ed-dialog-suggestion">
                    {suggestion === 'grind' ? (
                        <span>─ 系统建议：死磕（当场解决）─</span>
                    ) : (
                        <span>─ 系统建议：跳过+加入复习（{URGENCY_LABEL[skipUrgency]}）─</span>
                    )}
                </div>

                {/* 底部按钮 */}
                <div className="ed-dialog-actions">
                    <button
                        className={`ed-dialog-btn ${suggestion === 'grind' ? 'ed-dialog-btn-primary' : 'ed-dialog-btn-secondary'}`}
                        onClick={() => handleSubmit('grind')}
                    >
                        确认死磕
                    </button>
                    <button
                        className={`ed-dialog-btn ${suggestion === 'skip' ? 'ed-dialog-btn-primary' : 'ed-dialog-btn-secondary'}`}
                        onClick={() => handleSubmit('skip')}
                    >
                        跳过+加入复习
                    </button>
                </div>
                <button
                    className="ed-dialog-btn ed-dialog-btn-tertiary"
                    onClick={() => handleSubmit('skip')}
                >
                    时间不够？直接跳过+加入复习
                </button>
            </div>
        </div>
    );
}
