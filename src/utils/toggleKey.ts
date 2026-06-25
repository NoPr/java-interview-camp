/**
 * 通用 toggle 工具：在 Record<string, boolean> 中切换某 key
 *
 * - 设为 true 时写入 true
 * - 设为 false 时删除 key（保持对象干净，与原 Reducer 行为一致）
 * - value 未传时按 toggle 语义：当前 true/存在则删除，否则置 true
 *
 * 用于消除 Reducer 中 TOGGLE_TASK / TOGGLE_MOCK / TOGGLE_ALGO 三个 case 的重复逻辑。
 */
export function toggleKey(
    map: Record<string, boolean>,
    key: string,
    value?: boolean,
): Record<string, boolean> {
    const next = { ...map };
    const nextValue = value ?? !next[key];
    if (nextValue) {
        next[key] = true;
    } else {
        delete next[key];
    }
    return next;
}
