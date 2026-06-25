import { describe, it, expect } from 'vitest';
import { computeUrgency, urgencyWeight, suggestDecision } from './reviewUrgency';
import type { QuestionPriority } from '../types';

describe('computeUrgency', () => {
    it('前置依赖 + 能讲个大概 → high', () => {
        expect(computeUrgency('yes', 'vague', 'red')).toBe('high');
        expect(computeUrgency('yes', 'vague', 'green')).toBe('high');
    });

    it('前置依赖 + 完全没思路 → high（但此场景走死磕不进队列）', () => {
        expect(computeUrgency('yes', 'clueless', 'red')).toBe('high');
    });

    it('不确定 → 保守按 high 处理', () => {
        expect(computeUrgency('uncertain', 'vague', 'gray')).toBe('high');
        expect(computeUrgency('uncertain', 'clueless', 'green')).toBe('high');
    });

    it('非前置 + 完全没思路 + 🟢 → mid', () => {
        expect(computeUrgency('no', 'clueless', 'green')).toBe('mid');
    });

    it('非前置 + 完全没思路 + ⚪ → mid', () => {
        expect(computeUrgency('no', 'clueless', 'gray')).toBe('mid');
    });

    it('非前置 + 能讲个大概 → low', () => {
        expect(computeUrgency('no', 'vague', 'red')).toBe('low');
        expect(computeUrgency('no', 'vague', 'green')).toBe('low');
    });

    // 补充：全优先级表驱动覆盖
    it('前置依赖 yes + vague → high（任意优先级）', () => {
        const priorities: QuestionPriority[] = ['red', 'yellow', 'green', 'gray'];
        priorities.forEach((p) => {
            expect(computeUrgency('yes', 'vague', p)).toBe('high');
        });
    });

    it('前置依赖 yes + clueless → high（任意优先级）', () => {
        const priorities: QuestionPriority[] = ['red', 'yellow', 'green', 'gray'];
        priorities.forEach((p) => {
            expect(computeUrgency('yes', 'clueless', p)).toBe('high');
        });
    });

    it('uncertain + clueless + red/yellow → high（保守处理）', () => {
        // 此组合在 suggestDecision 中走 grind，但 computeUrgency 仍按 high 返回
        // 此处验证函数本身行为，不依赖业务是否进队列
        expect(computeUrgency('uncertain', 'clueless', 'red')).toBe('high');
        expect(computeUrgency('uncertain', 'clueless', 'yellow')).toBe('high');
    });

    it('uncertain + vague → high（任意优先级）', () => {
        const priorities: QuestionPriority[] = ['red', 'yellow', 'green', 'gray'];
        priorities.forEach((p) => {
            expect(computeUrgency('uncertain', 'vague', p)).toBe('high');
        });
    });

    it('非前置 + clueless + red/yellow → low（此组合走 grind 不进队列，但函数仍返回 low）', () => {
        // 业务上 suggestDecision('no','clueless','red')='grind'，不调用 computeUrgency
        // 此处独立验证函数行为：返回 low（fallback）
        expect(computeUrgency('no', 'clueless', 'red')).toBe('low');
        expect(computeUrgency('no', 'clueless', 'yellow')).toBe('low');
    });

    it('非前置 + vague → low（任意优先级）', () => {
        const priorities: QuestionPriority[] = ['red', 'yellow', 'green', 'gray'];
        priorities.forEach((p) => {
            expect(computeUrgency('no', 'vague', p)).toBe('low');
        });
    });
});

describe('urgencyWeight', () => {
    it('high < mid < low', () => {
        expect(urgencyWeight('high')).toBe(0);
        expect(urgencyWeight('mid')).toBe(1);
        expect(urgencyWeight('low')).toBe(2);
        expect(urgencyWeight(undefined)).toBe(2);
    });
});

describe('suggestDecision', () => {
    const priorities: QuestionPriority[] = ['red', 'yellow', 'green', 'gray'];

    it('前置依赖 + 完全没思路 → grind（任意优先级）', () => {
        priorities.forEach((p) => {
            expect(suggestDecision('yes', 'clueless', p)).toBe('grind');
        });
    });

    it('不确定 + 完全没思路 → grind（保守）', () => {
        priorities.forEach((p) => {
            expect(suggestDecision('uncertain', 'clueless', p)).toBe('grind');
        });
    });

    it('前置依赖 + 能讲个大概 → skip', () => {
        priorities.forEach((p) => {
            expect(suggestDecision('yes', 'vague', p)).toBe('skip');
        });
    });

    it('非前置 + 完全没思路 + 🔴🟡 → grind', () => {
        expect(suggestDecision('no', 'clueless', 'red')).toBe('grind');
        expect(suggestDecision('no', 'clueless', 'yellow')).toBe('grind');
    });

    it('非前置 + 完全没思路 + 🟢⚪ → skip', () => {
        expect(suggestDecision('no', 'clueless', 'green')).toBe('skip');
        expect(suggestDecision('no', 'clueless', 'gray')).toBe('skip');
    });

    it('非前置 + 能讲个大概 → skip（任意优先级）', () => {
        priorities.forEach((p) => {
            expect(suggestDecision('no', 'vague', p)).toBe('skip');
        });
    });
});
