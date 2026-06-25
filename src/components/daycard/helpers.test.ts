import { describe, it, expect } from 'vitest';
import { resolvePresetMock, resolvePresetCard } from './helpers';
import type { AppState } from '../../types';
import { initialState } from '../../hooks/useAppState';

function makeState(overrides: Partial<AppState> = {}): AppState {
    return { ...initialState, ...overrides, loaded: true };
}

describe('resolvePresetMock', () => {
    it('无 override 时返回原值', () => {
        const state = makeState();
        const original = { q: '原问题', tips: '原要点' };
        expect(resolvePresetMock(state, 5, 0, original)).toEqual({ q: '原问题', tips: '原要点' });
    });

    it('有 override 部分字段，未覆盖字段用原值', () => {
        const state = makeState({ presetOverrides: { '5-mock-0': { q: '新问题' } } });
        const original = { q: '原问题', tips: '原要点' };
        expect(resolvePresetMock(state, 5, 0, original)).toEqual({ q: '新问题', tips: '原要点' });
    });

    it('有 override 全字段，全部用 override', () => {
        const state = makeState({ presetOverrides: { '5-mock-0': { q: '新问题', tips: '新要点' } } });
        const original = { q: '原问题', tips: '原要点' };
        expect(resolvePresetMock(state, 5, 0, original)).toEqual({ q: '新问题', tips: '新要点' });
    });

    it('不同 day/index 的 override 互不干扰', () => {
        const state = makeState({ presetOverrides: { '5-mock-0': { q: 'A' }, '6-mock-1': { q: 'B' } } });
        expect(resolvePresetMock(state, 5, 0, { q: 'x', tips: '' }).q).toBe('A');
        expect(resolvePresetMock(state, 6, 1, { q: 'x', tips: '' }).q).toBe('B');
    });
});

describe('resolvePresetCard', () => {
    it('无 override 时返回原值', () => {
        const state = makeState();
        const original = { title: '原标题', keywords: '原关键词' };
        expect(resolvePresetCard(state, 5, 0, original)).toEqual({ title: '原标题', keywords: '原关键词' });
    });

    it('有 override 部分字段，未覆盖字段用原值', () => {
        const state = makeState({ presetOverrides: { '5-card-0': { title: '新标题' } } });
        const original = { title: '原标题', keywords: '原关键词' };
        expect(resolvePresetCard(state, 5, 0, original)).toEqual({ title: '新标题', keywords: '原关键词' });
    });
});
