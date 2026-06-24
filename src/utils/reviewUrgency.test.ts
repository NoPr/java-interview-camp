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
