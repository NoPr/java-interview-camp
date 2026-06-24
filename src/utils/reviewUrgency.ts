import type { QuestionPriority, ReviewUrgency } from '../types';

// 紧迫度计算：根据前置依赖、掌握程度、优先级推导复习紧迫度
// 仅处理"跳过+加入复习"的场景（死磕的不进队列）
export function computeUrgency(
    isPrerequisite: 'yes' | 'no' | 'uncertain',
    mastery: 'clueless' | 'vague',
    priority: QuestionPriority
): ReviewUrgency {
    // 前置依赖（含不确定保守处理）→ 高紧迫
    if (isPrerequisite === 'yes' || isPrerequisite === 'uncertain') {
        return 'high';
    }
    // 非前置 + 完全没思路 + 🟢⚪ → 中
    if (mastery === 'clueless' && (priority === 'green' || priority === 'gray')) {
        return 'mid';
    }
    // 非前置 + 能讲个大概 → 低
    // 注：非前置+完全没思路+🔴🟡 走死磕，不进队列，不会到这里
    return 'low';
}

// 紧迫度排序权重（high=0, mid=1, low=2，用于 sort）
export function urgencyWeight(urgency: ReviewUrgency | undefined): number {
    if (urgency === 'high') return 0;
    if (urgency === 'mid') return 1;
    return 2;
}

// 根据弹窗输入推导系统建议（死磕/跳过）
export function suggestDecision(
    isPrerequisite: 'yes' | 'no' | 'uncertain',
    mastery: 'clueless' | 'vague',
    priority: QuestionPriority
): 'grind' | 'skip' {
    // 前置依赖 + 完全没思路 → 死磕
    if ((isPrerequisite === 'yes' || isPrerequisite === 'uncertain') && mastery === 'clueless') {
        return 'grind';
    }
    // 非前置 + 完全没思路 + 🔴🟡 → 死磕
    if (isPrerequisite === 'no' && mastery === 'clueless' && (priority === 'red' || priority === 'yellow')) {
        return 'grind';
    }
    // 其余 → 跳过
    return 'skip';
}
