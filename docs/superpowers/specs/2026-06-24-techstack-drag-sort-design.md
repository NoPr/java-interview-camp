# 技术栈详情页必会题/重点知识拖拽排序设计

- **日期**：2026-06-24
- **范围**：`TechStackView` 组件的「必会题」「重点知识」两个区块
- **状态**：待评审

## 1. 背景与目标

### 1.1 现状

[TechStackView.tsx](file:///c:/Users/18991/Desktop/30days/src/components/TechStackView.tsx) 通过 `renderStrSection` 渲染必会题、重点知识两个区块。每个区块的内容由两部分组成：

- **预置内容**：从该技术栈涉及的多个 Day 聚合而来（`knowledge` / `mustKnow`）
- **自定义内容**：用户通过 `AddRestoreControls` 新增的条目，存于 `state.customContent`

两类内容目前按数组顺序静态展示，用户无法调整顺序。当用户添加了与预置内容同类的自定义条目时，无法把它们聚拢到一起学习。

### 1.2 目标

- 用户可在「必会题」「重点知识」区块内上下拖拽条目，自由调整顺序
- 预置内容与自定义内容混合排序，支持把同类项聚拢
- 顺序持久化到 IndexedDB，刷新页面后保留
- 不破坏现有勾选/隐藏/恢复/删除等功能

### 1.3 非目标

- DayCard 单日视图的拖拽（单日条目少，收益低）
- 面试题库区块的拖拽（已有优先级筛选机制，结构不同）
- 模拟题区块的拖拽（结构不同，q+tips）
- 必会题与重点知识之间的跨区块拖拽（不改变条目类型，保持与原 Day 关联）

## 2. 方案选型

| 方案 | 触摸 | 无障碍 | 体积 | 维护 | 成本 | 结论 |
|------|------|--------|------|------|------|------|
| A. dnd-kit | 原生 | 内置键盘 | +15KB gzip | 活跃 | 中 | **采用** |
| B. 原生 HTML5 DnD | 差 | 无 | 0 | 自维护 | 高 | 否决 |
| C. react-beautiful-dnd | 支持 | 内置 | +30KB | 已归档 | 低 | 否决 |

**采用方案 A**：触摸与无障碍开箱即用，体积适中，是 React 18 拖拽生态事实标准。

新增依赖：

```json
"@dnd-kit/core": "^6.x",
"@dnd-kit/sortable": "^8.x",
"@dnd-kit/utilities": "^3.x"
```

## 3. 数据模型

### 3.1 AppState 新增字段

[types/index.ts](file:///c:/Users/18991/Desktop/30days/src/types/index.ts) 中 `AppState` 追加：

```ts
// 内容排序：key 为 `${day}-${contentType}`
// 技术栈级用 `techStack-${stackId}-${type}`
// value 为排序后的条目 id 数组
contentOrder: Record<string, string[]>;
```

### 3.2 条目 id 规则

复用现有 `state.tasks` 的 key，避免维护两套身份体系：

| 类型 | id 格式 | 示例 |
|------|---------|------|
| 预置项 | `${day}-${type}-${index}` | `3-mustKnow-1` |
| 自定义项 | `custom-${item.id}` | `custom-lh7a3b` |

**唯一性保证**：预置项 id 由 `{day}-{type}-{index}` 组成。同一技术栈聚合多个 Day，day 不同则 id 唯一；同一 Day 内 index 唯一。故全局唯一，可安全作为排序 key。

### 3.3 Reducer 扩展

[useAppState.tsx](file:///c:/Users/18991/Desktop/30days/src/hooks/useAppState.tsx) 新增 Action：

```ts
| { type: 'REORDER_CONTENT'; day: number | string; contentType: ContentType; order: string[] }
```

```ts
case 'REORDER_CONTENT': {
    const key = `${action.day}-${action.contentType}`;
    // 防御性校验：order 必须为数组
    if (!Array.isArray(action.order)) return state;
    return {
        ...state,
        contentOrder: { ...state.contentOrder, [key]: action.order },
    };
}
```

- `initialState` 新增 `contentOrder: {}`
- IndexedDB 加载时按现有迁移模式补齐：`if (!migratedState.contentOrder) migratedState.contentOrder = {}`，与 `cardEval` 等字段一致，保证旧数据兼容

## 4. 组件结构

### 4.1 新增 SortableSection 组件

路径：`src/components/SortableSection.tsx`，封装 dnd-kit 排序逻辑，独立于 TechStackView。

**内部子组件**：

1. **SortableItem**：包裹单个 `content-item`，赋予拖拽能力
   - 拖拽手柄：左侧 `⋮⋮` 字符，避免误触勾选框/删除按钮
   - `useSortable` 拿到 `transform/transition/listeners/setAttributes`，套在根元素 `style`
   - `isDragging` 时降低透明度并提升阴影

2. **SortableSection**：包裹整个区块，提供 `DndContext` + `SortableContext`
   - sensors：`PointerSensor`（桌面）+ `KeyboardSensor`（无障碍），均设 8px 激活距离防误触
   - `onDragEnd` 调用 `arrayMove` 得到新顺序，回调给父组件

```tsx
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors,
} from '@dnd-kit/core';
import {
    SortableContext, sortableKeyboardCoordinates,
    arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
```

### 4.2 renderStrSection 集成

[TechStackView.tsx](file:///c:/Users/18991/Desktop/30days/src/components/TechStackView.tsx#L162-L276) 的 `renderStrSection` 改造：

1. 合并 `filteredPreset` 和 `filteredCustom` 为 `{ id, node }[]`，id 沿第 3.2 节规则
2. 读取 `state.contentOrder[key]`，调用 `mergeWithOrder` 重排
3. 用 `SortableSection` 替换原两段 `map` 渲染
4. `onReorder` 回调内 dispatch `REORDER_CONTENT`

**关键约束**：
- 拖拽只改顺序，勾选/删除/隐藏按钮保留在 `SortableItem` 内
- `onlyUnmastered` 筛选下仍可拖拽，但 order 存全量顺序（含被过滤项），切回"显示全部"顺序不丢
- `key` 筛选前后一致：`techStack-${stackId}-${type}`

## 5. 排序与增删的交互边界

**核心原则**：`contentOrder` 存"全量顺序"（含被隐藏、被过滤的条目），渲染时按 order 过滤。

### 5.1 各操作的 order 维护

| 操作 | order 处理 |
|------|-----------|
| 拖拽排序 | dispatch `REORDER_CONTENT`，写入新全量顺序 |
| 新增自定义 | **不写 order**，渲染时新 id 追加到末尾 |
| 隐藏预置 | **不改 order**，仅 `hiddenContent` 记录，渲染时跳过 |
| 恢复预置 | **不改 order**，id 仍在 order 中，渲染时归位 |
| 删除自定义 | **从 order 中移除该 id**，避免残留无效 id |

### 5.2 渲染时合并算法

```ts
function mergeWithOrder(items: { id: string; node: ReactNode }[], order: string[] | undefined): { id: string; node: ReactNode }[] {
    if (!order || order.length === 0) return items; // 首次：用数据源默认顺序
    const orderMap = new Map(order.map((id, i) => [id, i]));
    return items
        .map(it => ({ it, idx: orderMap.has(it.id) ? orderMap.get(it.id)! : Infinity }))
        .sort((a, b) => a.idx - b.idx)
        .map(x => x.it);
}
```

- 在 order 中的条目按 order 排序
- 不在 order 中的新条目 `idx = Infinity`，沉到底部
- order 中已失效的 id（删除的预置、删过的自定义）在 `items` 中不存在，被自然忽略

### 5.3 特殊情况

1. **首次加载**：order 为空，用数据源顺序（预置在前 + 自定义在后，与现状一致），首次拖拽后才生成 order
2. **筛选切换**：order 是全量，筛选只过滤可见集合，不动 order
3. **刷新页面**：order 已持久化到 IndexedDB，加载后直接应用
4. **不主动清理失效 id**：order 中残留无效 id 不影响渲染；用户"恢复预置"时原 id 重新生效并按原顺序归位，主动清理反而破坏顺序记忆

## 6. 无障碍

- `KeyboardSensor` + `sortableKeyboardCoordinates`：聚焦手柄后 ↑↓ 移动，空格确认
- 手柄为 `button` 元素，`aria-label="拖动排序"`
- dnd-kit 内置 `aria-announcer` 播报位置变化

## 7. 错误处理与边界

- `onDragEnd` 校验 `active.id` 与 `over.id` 都存在于当前列表，否则 no-op
- `arrayMove` 前确认 `0 <= oldIndex, newIndex < items.length`
- 旧数据兼容由 `AppStateProvider` 的现有迁移逻辑负责（`if (!migratedState.contentOrder) migratedState.contentOrder = {}`），与 `cardEval` 等字段一致
- reducer 内 `action.order` 非数组则忽略（防御性校验）
- `mergeWithOrder` 对 `order` 含非字符串元素容错：`orderMap` 构建时跳过非字符串 id

## 8. 视觉细节

[styles.css](file:///c:/Users/18991/Desktop/30days/src/styles.css) 追加：

- 拖拽手柄：`⋮⋮` 字符，灰色 `var(--text-muted)`，hover 变深，`cursor: grab`；拖拽中 `cursor: grabbing`
- `isDragging` 状态：`opacity: 0.5` + `box-shadow` 提升层级 + `z-index: 10`
- 占位空间由 dnd-kit `transform` 自动撑开，无需手写 placeholder
- 手柄宽度固定 `20px`，与勾选框/删除按钮保持 8px 间距，对齐现有 `content-item` 内边距

## 9. 性能

- `SortableContext` items 传 id 数组，必会题/重点知识通常 < 30 条，无需虚拟化
- `useMemo` 缓存 `mergeWithOrder` 结果，依赖 `[items, order]`

## 10. 测试策略

项目当前无测试框架，新增 `vitest` + `@testing-library/react` + `@dnd-kit/test-utils`（如可用，否则用 fireEvent 模拟）。

| 类型 | 覆盖点 |
|------|--------|
| 单元 | `mergeWithOrder`：order 为空、含全量、含部分、含失效 id |
| 单元 | reducer `REORDER_CONTENT`：写入新 order、非数组忽略、不影响其他 key |
| 单元 | 新增自定义条目不在 order 中时追加末尾 |
| 单元 | 删除自定义条目时从 order 中移除 |
| 组件 | `SortableSection` 渲染：手柄存在、按 order 顺序渲染、order 空时按默认顺序 |
| 交互 | dnd-kit `onDragEnd` 触发后回调新顺序 |
| 集成 | 拖拽 → dispatch → state 更新 → 重渲染顺序正确 |
| 回归 | 隐藏/恢复预置后 order 不变；切换"只看未掌握"后 order 不变 |
| 回归 | 旧数据（无 contentOrder 字段）加载不报错，按默认顺序渲染 |

## 11. 影响范围

| 文件 | 改动 |
|------|------|
| `package.json` | 新增 dnd-kit 三包 |
| [src/types/index.ts](file:///c:/Users/18991/Desktop/30days/src/types/index.ts) | `AppState` 加 `contentOrder` 字段 |
| [src/hooks/useAppState.tsx](file:///c:/Users/18991/Desktop/30days/src/hooks/useAppState.tsx) | 加 `REORDER_CONTENT` action、initialState、迁移 |
| `src/components/SortableSection.tsx` | 新增组件 |
| [src/components/TechStackView.tsx](file:///c:/Users/18991/Desktop/30days/src/components/TechStackView.tsx) | `renderStrSection` 集成拖拽 |
| [src/styles.css](file:///c:/Users/18991/Desktop/30days/src/styles.css) | 手柄与拖拽态样式 |

不改动 DayCard、面试题库、模拟题区块，与现有勾选/隐藏/恢复/删除逻辑完全兼容。
