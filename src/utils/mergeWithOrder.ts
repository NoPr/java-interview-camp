import type { ReactNode } from 'react';

// 排序条目：id 为条目身份，node 为渲染内容
export interface OrderableItem {
    id: string;
    node: ReactNode;
}

// 按 order 数组对 items 重排
// - 在 order 中的条目按 order 顺序排
// - 不在 order 中的条目（新添加）按原相对顺序追加到末尾
// - order 中的失效 id（已删除）在 items 中不存在，被自然忽略
// - order 中非字符串元素被跳过
export function mergeWithOrder(
    items: OrderableItem[],
    order: string[] | undefined,
): OrderableItem[] {
    if (!order || order.length === 0) return items;

    // 构建 id → 位置映射，跳过非字符串元素
    const orderMap = new Map<string, number>();
    order.forEach((id, i) => {
        if (typeof id === 'string') orderMap.set(id, i);
    });

    // 按 order 位置稳定排序；不在 order 中的条目位置为 Infinity，保持原顺序
    return items
        .map((it) => ({ it, idx: orderMap.has(it.id) ? orderMap.get(it.id)! : Infinity }))
        .sort((a, b) => a.idx - b.idx)
        .map((x) => x.it);
}
