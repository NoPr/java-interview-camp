import { describe, it, expect } from 'vitest';
import { mergeWithOrder } from './mergeWithOrder';

describe('mergeWithOrder', () => {
    it('order 为空时返回原顺序', () => {
        const items = [
            { id: 'a', node: null },
            { id: 'b', node: null },
        ];
        expect(mergeWithOrder(items, undefined)).toEqual(items);
        expect(mergeWithOrder(items, [])).toEqual(items);
    });

    it('order 含全量时按 order 排序', () => {
        const items = [
            { id: 'a', node: 'A' },
            { id: 'b', node: 'B' },
            { id: 'c', node: 'C' },
        ];
        const order = ['c', 'a', 'b'];
        const result = mergeWithOrder(items, order);
        expect(result.map((i) => i.id)).toEqual(['c', 'a', 'b']);
    });

    it('order 含部分时，在 order 中的按 order 排序，其余追加末尾', () => {
        const items = [
            { id: 'a', node: 'A' },
            { id: 'b', node: 'B' },
            { id: 'c', node: 'C' },
            { id: 'd', node: 'D' },
        ];
        const order = ['c', 'a'];
        const result = mergeWithOrder(items, order);
        // c, a 按 order；b, d 不在 order 中，按原相对顺序追加
        expect(result.map((i) => i.id)).toEqual(['c', 'a', 'b', 'd']);
    });

    it('order 含失效 id 时被自然忽略', () => {
        const items = [
            { id: 'a', node: 'A' },
            { id: 'b', node: 'B' },
        ];
        const order = ['x', 'a', 'y', 'b'];
        const result = mergeWithOrder(items, order);
        expect(result.map((i) => i.id)).toEqual(['a', 'b']);
    });

    it('order 含非字符串元素时容错跳过', () => {
        const items = [
            { id: 'a', node: 'A' },
            { id: 'b', node: 'B' },
        ];
        const order = ['b', 123, null, 'a'];
        // @ts-expect-error 测试容错：order 含非字符串元素，类型与 string[] 不兼容
        const result = mergeWithOrder(items, order);
        expect(result.map((i) => i.id)).toEqual(['b', 'a']);
    });

    it('items 为空时返回空数组', () => {
        expect(mergeWithOrder([], ['a', 'b'])).toEqual([]);
    });
});
