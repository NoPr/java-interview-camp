import { describe, it, expect } from 'vitest';
import { reducer, initialState, type Action } from './useAppState';
import type { AppState, CustomItem } from '../types';

// 测试用基线 state：从 initialState 派生，避免每个 case 重新构造
function makeState(overrides: Partial<AppState> = {}): AppState {
    return { ...initialState, ...overrides, loaded: true };
}

// 构造自定义条目工厂
function makeCustomItem(overrides: Partial<CustomItem> = {}): CustomItem {
    return { id: 'c1', content: 'demo', ...overrides };
}

describe('reducer — TOGGLE_TASK / TOGGLE_MOCK / TOGGLE_ALGO', () => {
    it('TOGGLE_TASK 未指定 value 时为 toggle 语义', () => {
        let s = reducer(makeState(), { type: 'TOGGLE_TASK', key: '1-knowledge-0' });
        expect(s.tasks['1-knowledge-0']).toBe(true);
        s = reducer(s, { type: 'TOGGLE_TASK', key: '1-knowledge-0' });
        expect(s.tasks['1-knowledge-0']).toBeUndefined();
    });

    it('TOGGLE_TASK value=true 强制置 true', () => {
        const s = reducer(makeState(), { type: 'TOGGLE_TASK', key: 'k', value: true });
        expect(s.tasks.k).toBe(true);
    });

    it('TOGGLE_TASK value=false 删除 key（保持对象干净）', () => {
        const s = reducer(makeState({ tasks: { k: true, b: true } }), { type: 'TOGGLE_TASK', key: 'k', value: false });
        expect(s.tasks).toEqual({ b: true });
    });

    it('TOGGLE_TASK 不修改原 state（不可变）', () => {
        const original = makeState({ tasks: { a: true } });
        reducer(original, { type: 'TOGGLE_TASK', key: 'a', value: false });
        expect(original.tasks).toEqual({ a: true });
    });

    it('TOGGLE_MOCK 与 TOGGLE_ALGO 走同一 toggle 逻辑', () => {
        let s = reducer(makeState(), { type: 'TOGGLE_MOCK', key: 'm1' });
        expect(s.mock.m1).toBe(true);
        s = reducer(s, { type: 'TOGGLE_ALGO', key: 'a1' });
        expect(s.algo.a1).toBe(true);
        s = reducer(s, { type: 'TOGGLE_MOCK', key: 'm1' });
        expect(s.mock.m1).toBeUndefined();
    });
});

describe('reducer — 视图与档位', () => {
    it('SET_TIER 设置档位', () => {
        expect(reducer(makeState({ tier: '5h' }), { type: 'SET_TIER', tier: '6h' }).tier).toBe('6h');
    });

    it('SET_CURRENT_DAY 同时切回 day 视图', () => {
        const s = reducer(makeState({ currentView: 'overview', currentDay: 1 }), { type: 'SET_CURRENT_DAY', day: 5 });
        expect(s.currentDay).toBe(5);
        expect(s.currentView).toBe('day');
    });

    it('SET_CURRENT_VIEW 切换视图', () => {
        expect(reducer(makeState(), { type: 'SET_CURRENT_VIEW', view: 'overview' }).currentView).toBe('overview');
    });

    it('TOGGLE_WEEK 切换周展开', () => {
        let s = reducer(makeState({ expandedWeeks: [1] }), { type: 'TOGGLE_WEEK', week: 2 });
        expect(s.expandedWeeks).toEqual([1, 2]);
        s = reducer(s, { type: 'TOGGLE_WEEK', week: 1 });
        expect(s.expandedWeeks).toEqual([2]);
    });

    it('TOGGLE_SIDEBAR 切换侧边栏开合', () => {
        expect(reducer(makeState({ sidebarOpen: false }), { type: 'TOGGLE_SIDEBAR' }).sidebarOpen).toBe(true);
    });
});

describe('reducer — CHECKIN', () => {
    it('未打卡日期 → 加入并排序', () => {
        const s = reducer(makeState({ checkins: ['2026-06-24'] }), { type: 'CHECKIN', date: '2026-06-23' });
        expect(s.checkins).toEqual(['2026-06-23', '2026-06-24']);
    });

    it('已打卡日期 → 取消', () => {
        const s = reducer(makeState({ checkins: ['2026-06-23', '2026-06-24'] }), { type: 'CHECKIN', date: '2026-06-23' });
        expect(s.checkins).toEqual(['2026-06-24']);
    });
});

describe('reducer — 自定义内容增删', () => {
    it('ADD_CONTENT 在空数组上追加', () => {
        const item = makeCustomItem({ id: 'x1', content: 'foo' });
        const s = reducer(makeState(), { type: 'ADD_CONTENT', day: 1, contentType: 'knowledge', item });
        expect(s.customContent['1-knowledge']).toEqual([item]);
    });

    it('ADD_CONTENT 在已有数组上追加', () => {
        const existed = makeCustomItem({ id: 'old', content: 'old' });
        const item = makeCustomItem({ id: 'new', content: 'new' });
        const s = reducer(makeState({ customContent: { '1-knowledge': [existed] } }), { type: 'ADD_CONTENT', day: 1, contentType: 'knowledge', item });
        expect(s.customContent['1-knowledge']).toEqual([existed, item]);
    });

    it('DELETE_CUSTOM 删除条目并同步清理 contentOrder', () => {
        const a = makeCustomItem({ id: 'a', content: 'A' });
        const b = makeCustomItem({ id: 'b', content: 'B' });
        const s0 = makeState({
            customContent: { '1-knowledge': [a, b] },
            contentOrder: { '1-knowledge': ['custom-a', 'custom-b'] },
        });
        const s = reducer(s0, { type: 'DELETE_CUSTOM', day: 1, contentType: 'knowledge', id: 'a' });
        expect(s.customContent['1-knowledge']).toEqual([b]);
        expect(s.contentOrder['1-knowledge']).toEqual(['custom-b']);
    });

    it('DELETE_CUSTOM 无 contentOrder 时不报错', () => {
        const a = makeCustomItem({ id: 'a', content: 'A' });
        const s = reducer(makeState({ customContent: { '1-knowledge': [a] } }), { type: 'DELETE_CUSTOM', day: 1, contentType: 'knowledge', id: 'a' });
        expect(s.customContent['1-knowledge']).toEqual([]);
    });
});

describe('reducer — 预置内容隐藏/恢复', () => {
    it('HIDE_PRESET 加入隐藏索引', () => {
        const s = reducer(makeState(), { type: 'HIDE_PRESET', day: 1, contentType: 'knowledge', index: 0 });
        expect(s.hiddenContent['1-knowledge']).toEqual([0]);
    });

    it('HIDE_PRESET 重复 index 不重复加入', () => {
        const s0 = makeState({ hiddenContent: { '1-knowledge': [0] } });
        const s = reducer(s0, { type: 'HIDE_PRESET', day: 1, contentType: 'knowledge', index: 0 });
        expect(s.hiddenContent['1-knowledge']).toEqual([0]);
        expect(s).toBe(s0); // 返回原 state（早退优化）
    });

    it('RESTORE_PRESET 从隐藏列表移除', () => {
        const s = reducer(makeState({ hiddenContent: { '1-knowledge': [0, 1] } }), { type: 'RESTORE_PRESET', day: 1, contentType: 'knowledge', index: 0 });
        expect(s.hiddenContent['1-knowledge']).toEqual([1]);
    });
});

describe('reducer — 面试题状态', () => {
    it('TOGGLE_QUESTION_MASTERED 缺省时按 true 处理', () => {
        const s = reducer(makeState(), { type: 'TOGGLE_QUESTION_MASTERED', questionId: 'q1' });
        expect(s.questionStatus.q1.mastered).toBe(true);
        expect(s.questionStatus.q1.priority).toBe('yellow');
    });

    it('TOGGLE_QUESTION_MASTERED 已存在时 toggle', () => {
        const s0 = makeState({ questionStatus: { q1: { mastered: true, priority: 'red' } } });
        const s = reducer(s0, { type: 'TOGGLE_QUESTION_MASTERED', questionId: 'q1' });
        expect(s.questionStatus.q1.mastered).toBe(false);
        expect(s.questionStatus.q1.priority).toBe('red'); // priority 不变
    });

    it('SET_QUESTION_PRIORITY 设置优先级', () => {
        const s = reducer(makeState(), { type: 'SET_QUESTION_PRIORITY', questionId: 'q1', priority: 'green' });
        expect(s.questionStatus.q1.priority).toBe('green');
    });
});

describe('reducer — 卡片/模拟题/复习标记', () => {
    it('TOGGLE_CARD_EVAL 写入评估结果', () => {
        const s = reducer(makeState(), { type: 'TOGGLE_CARD_EVAL', day: 1, cardIndex: 0, result: 'pass' });
        expect(s.cardEval['1-0']).toBe('pass');
    });

    it('TOGGLE_QUESTION_REVIEW 切换复习标记', () => {
        let s = reducer(makeState(), { type: 'TOGGLE_QUESTION_REVIEW', questionId: 'q1' });
        expect(s.questionReview.q1).toBe(true);
        s = reducer(s, { type: 'TOGGLE_QUESTION_REVIEW', questionId: 'q1' });
        expect(s.questionReview.q1).toBe(false);
    });

    it('SET_MOCK_TIPS 设置要点展开状态', () => {
        let s = reducer(makeState(), { type: 'SET_MOCK_TIPS', day: 1, index: 0, value: true });
        expect(s.mockTipsExpanded['1-0']).toBe(true);
        s = reducer(s, { type: 'SET_MOCK_TIPS', day: 1, index: 0, value: false });
        expect(s.mockTipsExpanded['1-0']).toBe(false);
    });

    it('ADD_TO_REVIEW 批量加入复习', () => {
        const s = reducer(makeState(), { type: 'ADD_TO_REVIEW', items: ['q1', 'q2', 'q3'] });
        expect(s.questionReview).toEqual({ q1: true, q2: true, q3: true });
    });
});

describe('reducer — 排序', () => {
    it('REORDER_CONTENT 写入 order 数组', () => {
        const s = reducer(makeState(), { type: 'REORDER_CONTENT', day: 1, contentType: 'knowledge', order: ['a', 'b', 'c'] });
        expect(s.contentOrder['1-knowledge']).toEqual(['a', 'b', 'c']);
    });

    it('REORDER_CONTENT order 非数组时早退返回原 state', () => {
        const s0 = makeState();
        // @ts-expect-error 测试防御性校验：传入非法 order 类型
        const s = reducer(s0, { type: 'REORDER_CONTENT', day: 1, contentType: 'knowledge', order: 'not-an-array' });
        expect(s).toBe(s0);
    });
});

describe('reducer — 不牢固决策（WEAK_DECISION）', () => {
    it('skip 决策：写入 weakReason / masteryLevel / weakMeta + 加入复习 + 计算紧迫度', () => {
        const s = reducer(
            makeState(),
            {
                type: 'WEAK_DECISION',
                key: '1-knowledge-0',
                payload: {
                    isPrerequisite: 'no',
                    mastery: 'clueless',
                    reason: 'memory',
                    priority: 'green',
                    decision: 'skip',
                    day: 1,
                    text: 'JVM 内存模型',
                },
            },
        );
        expect(s.weakReason['1-knowledge-0']).toBe('memory');
        expect(s.masteryLevel['1-knowledge-0']).toBe('clueless');
        expect(s.weakMeta['1-knowledge-0']).toEqual({ day: 1, text: 'JVM 内存模型' });
        expect(s.questionReview['1-knowledge-0']).toBe(true);
        // 非前置 + clueless + green → mid
        expect(s.reviewUrgency['1-knowledge-0']).toBe('mid');
    });

    it('grind 决策：不加入复习队列，不计算紧迫度', () => {
        const s = reducer(
            makeState(),
            {
                type: 'WEAK_DECISION',
                key: 'k1',
                payload: {
                    isPrerequisite: 'yes',
                    mastery: 'clueless',
                    reason: 'concept',
                    priority: 'red',
                    decision: 'grind',
                    day: 1,
                    text: '类加载机制',
                },
            },
        );
        expect(s.weakReason.k1).toBe('concept');
        expect(s.questionReview.k1).toBeUndefined();
        expect(s.reviewUrgency.k1).toBeUndefined();
    });
});

describe('reducer — SET_MASTERY_LEVEL', () => {
    it('标记 mastered 时同步 questionStatus.mastered 并从复习队列移除', () => {
        const s0 = makeState({
            questionStatus: { q1: { mastered: false, priority: 'yellow' } },
            questionReview: { q1: true },
        });
        const s = reducer(s0, { type: 'SET_MASTERY_LEVEL', key: 'q1', level: 'mastered' });
        expect(s.masteryLevel.q1).toBe('mastered');
        expect(s.questionStatus.q1.mastered).toBe(true);
        expect(s.questionReview.q1).toBeUndefined(); // 已 delete
    });

    it('标记非 mastered 时保留在复习队列', () => {
        const s0 = makeState({
            questionStatus: { q1: { mastered: true, priority: 'yellow' } },
            questionReview: { q1: true },
        });
        const s = reducer(s0, { type: 'SET_MASTERY_LEVEL', key: 'q1', level: 'vague' });
        expect(s.questionStatus.q1.mastered).toBe(false);
        expect(s.questionReview.q1).toBe(true);
    });

    it('questionStatus 不存在时不报错', () => {
        const s = reducer(makeState(), { type: 'SET_MASTERY_LEVEL', key: 'q1', level: 'mastered' });
        expect(s.masteryLevel.q1).toBe('mastered');
        expect(s.questionStatus.q1).toBeUndefined();
    });
});

describe('reducer — 决策弹窗', () => {
    it('OPEN_WEAK_DIALOG 写入弹窗状态', () => {
        const s = reducer(makeState(), { type: 'OPEN_WEAK_DIALOG', key: 'k1', text: 't', priority: 'red' });
        expect(s.dialogState).toEqual({ open: true, key: 'k1', text: 't', priority: 'red' });
    });

    it('CLOSE_WEAK_DIALOG 清空弹窗', () => {
        const s0 = makeState({ dialogState: { open: true, key: 'k1', text: 't', priority: 'red' } });
        expect(reducer(s0, { type: 'CLOSE_WEAK_DIALOG' }).dialogState).toBeNull();
    });
});

describe('reducer — LOAD_STATE / IMPORT_STATE', () => {
    it('LOAD_STATE 与 initialState 合并并标记 loaded', () => {
        const s = reducer(makeState({ loaded: false }), { type: 'LOAD_STATE', state: { ...initialState, currentDay: 9, tier: '6h' } });
        expect(s.loaded).toBe(true);
        expect(s.currentDay).toBe(9);
        expect(s.tier).toBe('6h');
    });

    it('IMPORT_STATE 浅合并部分字段', () => {
        const s = reducer(makeState({ currentDay: 1, tier: '3h' }), { type: 'IMPORT_STATE', state: { currentDay: 7 } });
        expect(s.currentDay).toBe(7);
        expect(s.tier).toBe('3h'); // 未被覆盖
    });
});

describe('reducer — 未知 action', () => {
    it('未知 action 返回原 state', () => {
        const s0 = makeState();
        // @ts-expect-error 故意传入未知 action 测试 default 分支
        const s = reducer(s0, { type: 'UNKNOWN' } as Action);
        expect(s).toBe(s0);
    });
});
