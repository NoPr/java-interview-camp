import type { DayData, MockQuestion } from '../../types';
import type { useAppState } from '../../hooks/useAppState';

// 区块变体类型（Editorial Hybrid 单色系）
export type BlockVariant = 'review' | 'knowledge' | 'mustknow' | 'card' | 'algo' | 'interview' | 'mock';

// 暴露给子组件的 app state 引用类型，避免在每个文件中重复 ReturnType<typeof useAppState>
export type AppStateRef = ReturnType<typeof useAppState>['state'];
export type AppDispatch = ReturnType<typeof useAppState>['dispatch'];

// 生成唯一 ID，用于自定义内容条目
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// 计算某一天的任务完成情况（考虑隐藏的预置内容和自定义内容）
export function getDayStats(dayNum: number, day: DayData, state: AppStateRef) {
    const { tasks, mock, algo, customContent, hiddenContent } = state;
    let total = 0;
    let done = 0;

    // 统计字符串数组类型（knowledge/mustKnow/tier5/tier6）
    // 支持 hidden 隐藏预置内容和 custom 自定义内容
    const countStrArr = (arr: string[] | undefined, type: string) => {
        if (!arr) return;
        const hidden = hiddenContent[`${dayNum}-${type}`] || [];
        total += arr.length - hidden.length;
        arr.forEach((_, idx) => {
            if (hidden.includes(idx)) return;
            if (tasks[`${dayNum}-${type}-${idx}`]) done++;
        });
        const custom = customContent[`${dayNum}-${type}`] || [];
        total += custom.length;
        custom.forEach((item) => {
            if (tasks[`custom-${item.id}`]) done++;
        });
    };

    countStrArr(day.knowledge, 'knowledge');
    countStrArr(day.mustKnow, 'mustKnow');
    countStrArr(day.tier5, 'tier5');
    countStrArr(day.tier6, 'tier6');

    // tasks（复盘日）不支持增删，保持原逻辑
    const countArr = (arr: string[] | undefined, type: string) => {
        if (!arr) return;
        total += arr.length;
        arr.forEach((_, idx) => {
            if (tasks[`${dayNum}-${type}-${idx}`]) done++;
        });
    };
    countArr(day.tasks, 'tasks');

    // mock：支持 hidden 和 custom
    if (day.mock) {
        const hidden = hiddenContent[`${dayNum}-mock`] || [];
        total += day.mock.length - hidden.length;
        day.mock.forEach((_, idx) => {
            if (hidden.includes(idx)) return;
            if (mock[`${dayNum}-${idx}`]) done++;
        });
        const customMock = customContent[`${dayNum}-mock`] || [];
        total += customMock.length;
        customMock.forEach((item) => {
            if (mock[`custom-${item.id}`]) done++;
        });
    }

    // card：预置卡片不计入统计（保持现有行为），自定义卡片可勾选计入统计
    const customCard = customContent[`${dayNum}-card`] || [];
    total += customCard.length;
    customCard.forEach((item) => {
        if (tasks[`custom-${item.id}`]) done++;
    });

    if (day.algo) {
        total += 1;
        if (algo[`${dayNum}`]) done++;
    }

    return { total, done, progress: total === 0 ? 0 : done / total };
}

// 读取预置模拟题的有效值：有 override 用 override，否则用原值
export function resolvePresetMock(
    state: AppStateRef,
    day: number,
    index: number,
    original: MockQuestion,
): MockQuestion {
    const ov = state.presetOverrides[`${day}-mock-${index}`];
    if (!ov) return original;
    return { q: ov.q ?? original.q, tips: ov.tips ?? original.tips };
}

// 读取预置关键词卡片的有效值：有 override 用 override，否则用原值
export function resolvePresetCard(
    state: AppStateRef,
    day: number,
    index: number,
    original: { title: string; keywords: string },
): { title: string; keywords: string } {
    const ov = state.presetOverrides[`${day}-card-${index}`];
    if (!ov) return original;
    return { title: ov.title ?? original.title, keywords: ov.keywords ?? original.keywords };
}
