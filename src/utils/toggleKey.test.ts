import { describe, it, expect } from 'vitest';
import { toggleKey } from './toggleKey';

describe('toggleKey', () => {
    it('未指定 value 时，缺失的 key 被置为 true', () => {
        expect(toggleKey({}, 'a')).toEqual({ a: true });
    });

    it('未指定 value 时，已存在的 key 被移除（toggle 语义）', () => {
        expect(toggleKey({ a: true }, 'a')).toEqual({});
    });

    it('value=true 时强制写入 true', () => {
        expect(toggleKey({}, 'a', true)).toEqual({ a: true });
        expect(toggleKey({ a: true }, 'a', true)).toEqual({ a: true });
    });

    it('value=false 时强制删除 key', () => {
        expect(toggleKey({ a: true, b: true }, 'a', false)).toEqual({ b: true });
        expect(toggleKey({}, 'a', false)).toEqual({});
    });

    it('不修改原对象（返回新对象）', () => {
        const original = { a: true };
        const next = toggleKey(original, 'a', false);
        expect(original).toEqual({ a: true });
        expect(next).toEqual({});
    });

    it('保留其他 key', () => {
        expect(toggleKey({ a: true, b: true, c: true }, 'b')).toEqual({ a: true, c: true });
    });

    it('连续切换最终状态稳定', () => {
        let state = {};
        state = toggleKey(state, 'x'); // -> { x: true }
        expect(state).toEqual({ x: true });
        state = toggleKey(state, 'x'); // -> {}
        expect(state).toEqual({});
        state = toggleKey(state, 'x', true); // -> { x: true }
        expect(state).toEqual({ x: true });
    });
});
