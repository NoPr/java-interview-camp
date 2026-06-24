# 技术栈详情页拖拽排序实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 TechStackView 的「必会题」「重点知识」区块内支持上下拖拽排序（预置+自定义混合），顺序持久化到 IndexedDB。

**Architecture:** 新增 `contentOrder` 状态字段存全量顺序，引入 dnd-kit 提供拖拽能力，新增 `SortableSection` 组件封装排序逻辑，改造 `renderStrSection` 集成拖拽。条目 id 复用现有 task key，与勾选/隐藏/恢复/删除逻辑完全兼容。

**Tech Stack:** React 18 + TypeScript + @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities + vitest + @testing-library/react

**Spec:** [docs/superpowers/specs/2026-06-24-techstack-drag-sort-design.md](file:///c:/Users/18991/Desktop/30days/docs/superpowers/specs/2026-06-24-techstack-drag-sort-design.md)

---

## 文件结构

| 文件 | 职责 | 操作 |
|------|------|------|
| `package.json` | 依赖声明 | 修改：新增 dnd-kit 三包 + vitest 测试栈 |
| `vitest.config.ts` | 测试配置 | 新建 |
| `src/types/index.ts` | 类型定义 | 修改：`AppState` 加 `contentOrder` 字段 |
| `src/hooks/useAppState.tsx` | 状态管理 | 修改：加 `REORDER_CONTENT` action、initialState、迁移、删除自定义时清理 order |
| `src/utils/mergeWithOrder.ts` | 排序合并纯函数 | 新建 |
| `src/utils/mergeWithOrder.test.ts` | 排序合并单测 | 新建 |
| `src/components/SortableSection.tsx` | dnd-kit 排序组件 | 新建 |
| `src/components/SortableSection.test.tsx` | 排序组件测试 | 新建 |
| `src/components/TechStackView.tsx` | 技术栈详情页 | 修改：`renderStrSection` 集成拖拽 |
| `src/styles.css` | 样式 | 修改：手柄与拖拽态样式 |

---

## Task 1: 安装依赖与测试框架配置

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: 安装 dnd-kit 运行时依赖**

Run:
```bash
npm install @dnd-kit/core@^6 @dnd-kit/sortable@^8 @dnd-kit/utilities@^3
```
Expected: `package.json` 的 `dependencies` 出现三个包，`package-lock.json` 更新。

- [ ] **Step 2: 安装测试框架**

Run:
```bash
npm install -D vitest@^1 @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14 jsdom@^24
```
Expected: `package.json` 的 `devDependencies` 出现测试相关包。

- [ ] **Step 3: 在 `package.json` 的 `scripts` 中加 `test` 与 `test:run`**

修改 `package.json` 的 `scripts` 字段为：

```json
"scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run"
}
```

- [ ] **Step 4: 新建 `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test-setup.ts'],
    },
});
```

- [ ] **Step 5: 新建 `src/test-setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: 验证测试框架可运行**

Run:
```bash
npm run test:run
```
Expected: vitest 启动，无测试用例时输出 "No test files found" 并以 exit code 0 退出。

- [ ] **Step 7: 提交**

```bash
git add package.json package-lock.json vitest.config.ts src/test-setup.ts
git commit -m "chore: 引入 dnd-kit 与 vitest 测试框架"
```

---

## Task 2: 扩展 AppState 类型与 contentOrder 字段

**Files:**
- Modify: `src/types/index.ts:75-109`
- Modify: `src/hooks/useAppState.tsx:13-63, 66-86, 141-159, 270-291`

- [ ] **Step 1: 在 `AppState` 接口末尾追加 `contentOrder` 字段**

修改 [src/types/index.ts](file:///c:/Users/18991/Desktop/30days/src/types/index.ts) 的 `AppState` 接口，在 `sidebarOpen: boolean;` 之后追加：

```ts
  // 侧边栏是否展开（移动端）
  sidebarOpen: boolean;
  // 内容排序：key 为 `${day}-${contentType}`
  // 技术栈级用 `techStack-${stackId}-${type}`
  // value 为排序后的条目 id 数组（存全量顺序，含被隐藏/被过滤的条目）
  contentOrder: Record<string, string[]>;
}
```

- [ ] **Step 2: 在 `Action` 联合类型中新增 `REORDER_CONTENT`**

修改 [src/hooks/useAppState.tsx](file:///c:/Users/18991/Desktop/30days/src/hooks/useAppState.tsx) 的 `Action` 类型，在 `| { type: 'LOAD_STATE'; state: AppState }` 之前追加：

```ts
    // 调整内容排序，payload: { day, contentType, order }
    // order 为新的全量条目 id 顺序
    | { type: 'REORDER_CONTENT'; day: number | string; contentType: ContentType; order: string[] }
    // 从 IndexedDB 加载状态
    | { type: 'LOAD_STATE'; state: AppState };
```

- [ ] **Step 3: 在 `initialState` 中初始化 `contentOrder`**

修改 `initialState`，在 `sidebarOpen: false,` 之后追加：

```ts
    sidebarOpen: false,
    contentOrder: {},
};
```

- [ ] **Step 4: 新增 `REORDER_CONTENT` reducer 分支**

在 `reducer` 函数的 `case 'ADD_TO_REVIEW':` 分支之前插入：

```ts
        case 'REORDER_CONTENT': {
            // 防御性校验：order 必须为数组
            if (!Array.isArray(action.order)) return state;
            const key = `${action.day}-${action.contentType}`;
            return {
                ...state,
                contentOrder: { ...state.contentOrder, [key]: action.order },
            };
        }
```

- [ ] **Step 5: 在 `DELETE_CUSTOM` 分支中清理 order 中的无效 id**

将 `DELETE_CUSTOM` 分支改为（在删除后同步清理 order）：

```ts
        case 'DELETE_CUSTOM': {
            const key = `${action.day}-${action.contentType}`;
            const arr = state.customContent[key] || [];
            const deletedId = `custom-${action.id}`;
            const order = state.contentOrder[key];
            return {
                ...state,
                customContent: {
                    ...state.customContent,
                    [key]: arr.filter((i) => i.id !== action.id),
                },
                contentOrder: order
                    ? { ...state.contentOrder, [key]: order.filter((id) => id !== deletedId) }
                    : state.contentOrder,
            };
        }
```

- [ ] **Step 6: 在 `AppStateProvider` 的加载迁移逻辑中补齐 `contentOrder`**

修改 `AppStateProvider` 中的迁移块，在 `if (migratedState.sidebarOpen === undefined) migratedState.sidebarOpen = false;` 之后追加：

```ts
                if (migratedState.sidebarOpen === undefined) migratedState.sidebarOpen = false;
                if (!migratedState.contentOrder) migratedState.contentOrder = {};
```

- [ ] **Step 7: 验证类型检查通过**

Run:
```bash
npx tsc -b
```
Expected: 无类型错误，exit code 0。

- [ ] **Step 8: 提交**

```bash
git add src/types/index.ts src/hooks/useAppState.tsx
git commit -m "feat(state): 新增 contentOrder 字段与 REORDER_CONTENT action"
```

---

## Task 3: 编写 mergeWithOrder 纯函数（TDD）

**Files:**
- Create: `src/utils/mergeWithOrder.ts`
- Create: `src/utils/mergeWithOrder.test.ts`

- [ ] **Step 1: 编写失败测试**

新建 `src/utils/mergeWithOrder.test.ts`：

```ts
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
        // @ts-expect-error 测试容错
        const order = ['b', 123, null, 'a'];
        const result = mergeWithOrder(items, order);
        expect(result.map((i) => i.id)).toEqual(['b', 'a']);
    });

    it('items 为空时返回空数组', () => {
        expect(mergeWithOrder([], ['a', 'b'])).toEqual([]);
    });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm run test:run -- src/utils/mergeWithOrder.test.ts
```
Expected: FAIL，错误信息包含 "Failed to resolve import './mergeWithOrder'" 或 "mergeWithOrder is not defined"。

- [ ] **Step 3: 实现 `mergeWithOrder`**

新建 `src/utils/mergeWithOrder.ts`：

```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
npm run test:run -- src/utils/mergeWithOrder.test.ts
```
Expected: PASS，6 个用例全部通过。

- [ ] **Step 5: 提交**

```bash
git add src/utils/mergeWithOrder.ts src/utils/mergeWithOrder.test.ts
git commit -m "feat(utils): 新增 mergeWithOrder 排序合并纯函数及单测"
```

---

## Task 4: 编写 SortableSection 组件（TDD）

**Files:**
- Create: `src/components/SortableSection.tsx`
- Create: `src/components/SortableSection.test.tsx`

- [ ] **Step 1: 编写失败测试**

新建 `src/components/SortableSection.test.tsx`：

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SortableSection } from './SortableSection';

// 简单条目渲染
const renderItem = (id: string) => <div data-testid={`item-${id}`}>条目 {id}</div>;

describe('SortableSection', () => {
    it('渲染所有条目且包含拖拽手柄', () => {
        const items = [
            { id: 'a', node: renderItem('a') },
            { id: 'b', node: renderItem('b') },
        ];
        render(<SortableSection items={items} onReorder={() => {}} />);
        expect(screen.getByTestId('item-a')).toBeInTheDocument();
        expect(screen.getByTestId('item-b')).toBeInTheDocument();
        // 每个条目有一个 aria-label="拖动排序" 的手柄按钮
        expect(screen.getAllByLabelText('拖动排序')).toHaveLength(2);
    });

    it('手柄为 button 元素，可聚焦', () => {
        const items = [{ id: 'a', node: renderItem('a') }];
        render(<SortableSection items={items} onReorder={() => {}} />);
        const handle = screen.getByLabelText('拖动排序');
        expect(handle.tagName).toBe('BUTTON');
    });

    it('空列表时不报错', () => {
        const { container } = render(<SortableSection items={[]} onReorder={() => {}} />);
        expect(container).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
npm run test:run -- src/components/SortableSection.test.tsx
```
Expected: FAIL，错误信息 "Failed to resolve import './SortableSection'"。

- [ ] **Step 3: 实现 `SortableSection` 组件**

新建 `src/components/SortableSection.tsx`：

```tsx
import { type ReactNode, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    arrayMove,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OrderableItem } from '../utils/mergeWithOrder';

// 单个可拖拽条目：包裹内容，左侧加拖拽手柄
function SortableItem({ id, children }: { id: string; children: ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className={`content-item sortable-item ${isDragging ? 'dragging' : ''}`}>
            <button
                type="button"
                className="drag-handle"
                aria-label="拖动排序"
                {...attributes}
                {...listeners}
            >
                ⋮⋮
            </button>
            {children}
        </div>
    );
}

interface SortableSectionProps {
    // 已按 order 排好序的条目列表
    items: OrderableItem[];
    // 拖拽完成回调，参数为新的 id 顺序
    onReorder: (newOrder: string[]) => void;
}

// 可排序区块：提供 DndContext + SortableContext
export function SortableSection({ items, onReorder }: SortableSectionProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const ids = useMemo(() => items.map((i) => i.id), [items]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = ids.indexOf(String(active.id));
        const newIndex = ids.indexOf(String(over.id));
        // 边界校验
        if (oldIndex < 0 || newIndex < 0) return;
        if (oldIndex >= items.length || newIndex >= items.length) return;
        const newOrder = arrayMove(ids, oldIndex, newIndex);
        onReorder(newOrder);
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                    <SortableItem key={item.id} id={item.id}>
                        {item.node}
                    </SortableItem>
                ))}
            </SortableContext>
        </DndContext>
    );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
npm run test:run -- src/components/SortableSection.test.tsx
```
Expected: PASS，3 个用例全部通过。

- [ ] **Step 5: 提交**

```bash
git add src/components/SortableSection.tsx src/components/SortableSection.test.tsx
git commit -m "feat(components): 新增 SortableSection 拖拽排序组件及测试"
```

---

## Task 5: 改造 renderStrSection 集成拖拽

**Files:**
- Modify: `src/components/TechStackView.tsx:1-9, 162-276`

- [ ] **Step 1: 在 TechStackView 顶部导入 SortableSection 与 mergeWithOrder**

修改 [src/components/TechStackView.tsx](file:///c:/Users/18991/Desktop/30days/src/components/TechStackView.tsx) 第 1-9 行的 import 区，在 `import { AddRestoreControls } from './DayCard';` 之后追加：

```ts
import { AddRestoreControls } from './DayCard';
import { SortableSection } from './SortableSection';
import { mergeWithOrder, type OrderableItem } from '../utils/mergeWithOrder';
```

- [ ] **Step 2: 改造 `renderStrSection` 的渲染部分**

定位 `renderStrSection` 函数（约 162-276 行）。将其中的渲染部分（`return (` 到对应 `);` 之间的 JSX）整体替换。

原代码中需替换的部分（关键标识：从 `return (` 开始到 `);` 结束，包含 `<section className="techstack-section"` 与两段 `.map` 渲染）：

替换为：

```tsx
        // 合并预置与自定义为 OrderableItem[]
        const presetItems: OrderableItem[] = filteredPreset.map(({ item, idx }) => {
            const taskKey = `${item.day}-${type}-${item.index}`;
            return {
                id: taskKey,
                node: (
                    <>
                        <input
                            type="checkbox"
                            checked={state.tasks[taskKey] || false}
                            onChange={() => dispatch({ type: 'TOGGLE_TASK', key: taskKey })}
                        />
                        <span className="content-text">{item.content}</span>
                        <button
                            className="day-link"
                            onClick={() => jumpToDay(item.day)}
                            title={`跳转到 Day ${item.day}`}
                        >
                            Day {item.day}
                        </button>
                        <button
                            className="delete-btn"
                            onClick={() =>
                                dispatch({
                                    type: 'HIDE_PRESET',
                                    day: techStackDay,
                                    contentType: type,
                                    index: idx,
                                })
                            }
                            title="删除"
                        >
                            ×
                        </button>
                    </>
                ),
            };
        });
        const customItems: OrderableItem[] = filteredCustom.map((item) => {
            const taskKey = `custom-${item.id}`;
            return {
                id: taskKey,
                node: (
                    <>
                        <input
                            type="checkbox"
                            checked={state.tasks[taskKey] || false}
                            onChange={() => dispatch({ type: 'TOGGLE_TASK', key: taskKey })}
                        />
                        <span className="content-text">{item.content}</span>
                        <button
                            className="delete-btn"
                            onClick={() =>
                                dispatch({
                                    type: 'DELETE_CUSTOM',
                                    day: techStackDay,
                                    contentType: type,
                                    id: item.id,
                                })
                            }
                            title="删除"
                        >
                            ×
                        </button>
                    </>
                ),
            };
        });
        const mergedItems = mergeWithOrder(
            [...presetItems, ...customItems],
            state.contentOrder[key],
        );

        return (
            <section className="techstack-section" style={{ animationDelay: `${parseInt(sectionNum) * 60}ms` }}>
                <div className="techstack-section-header">
                    <span className="techstack-section-num">{sectionNum}</span>
                    <h3>{title}</h3>
                    <span className="techstack-section-count">{totalCount} 项</span>
                </div>
                <div className="techstack-section-body">
                    <SortableSection
                        items={mergedItems}
                        onReorder={(order) =>
                            dispatch({
                                type: 'REORDER_CONTENT',
                                day: techStackDay,
                                contentType: type,
                                order,
                            })
                        }
                    />
                    <AddRestoreControls
                        type={type}
                        addingType={addingType}
                        setAddingType={setAddingType}
                        onAdd={(item) => addContent(type, item)}
                        hiddenCount={hidden.length}
                        onRestore={() => restoreAll(type)}
                        label={addLabel}
                    />
                </div>
            </section>
        );
```

注意：`key`、`type`、`filteredPreset`、`filteredCustom`、`totalCount`、`sectionNum`、`hidden`、`techStackDay` 等变量均在原函数作用域内已定义，无需新增。

- [ ] **Step 3: 验证类型检查通过**

Run:
```bash
npx tsc -b
```
Expected: 无类型错误，exit code 0。

- [ ] **Step 4: 验证构建通过**

Run:
```bash
npm run build
```
Expected: 构建成功，`dist/` 目录更新，无错误。

- [ ] **Step 5: 提交**

```bash
git add src/components/TechStackView.tsx
git commit -m "feat(techstack): renderStrSection 集成 SortableSection 支持拖拽排序"
```

---

## Task 6: 添加拖拽手柄与拖拽态样式

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: 在 `src/styles.css` 末尾追加拖拽相关样式**

```css
/* ===== 拖拽排序样式 ===== */
/* 注：.content-item 的 flex 布局已由 .techstack-section .content-item 提供，
   此处仅补充手柄与拖拽态，避免特异性冲突 */

.drag-handle {
    flex: 0 0 20px;
    width: 20px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-muted, #888);
    font-size: 14px;
    line-height: 1;
    cursor: grab;
    user-select: none;
    text-align: center;
}

.drag-handle:hover {
    color: var(--text-color, #333);
}

.drag-handle:active {
    cursor: grabbing;
}

.drag-handle:focus-visible {
    outline: 2px solid #4a90d9;
    outline-offset: 2px;
    border-radius: 3px;
}

.sortable-item.dragging {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    background: var(--bg-elevated, #fff);
}
```

- [ ] **Step 2: 验证构建通过**

Run:
```bash
npm run build
```
Expected: 构建成功，CSS 已打包进 `dist/assets/`。

- [ ] **Step 3: 提交**

```bash
git add src/styles.css
git commit -m "style: 新增拖拽手柄与拖拽态样式"
```

---

## Task 7: 回归测试与端到端验证

**Files:**
- 无新增文件，验证现有测试与功能

- [ ] **Step 1: 运行全部测试**

Run:
```bash
npm run test:run
```
Expected: 所有测试通过（mergeWithOrder 6 个 + SortableSection 3 个）。

- [ ] **Step 2: 类型检查**

Run:
```bash
npx tsc -b
```
Expected: 无错误。

- [ ] **Step 3: 完整构建**

Run:
```bash
npm run build
```
Expected: 构建成功。

- [ ] **Step 4: 启动开发服务器进行手动验证**

Run:
```bash
npm run dev
```
Expected: vite 启动，浏览器打开后逐项验证：

1. 进入任一技术栈详情页，必会题/重点知识区块每条左侧出现 `⋮⋮` 手柄
2. 鼠标按住手柄上下拖动，条目顺序变化，松开后顺序保持
3. 刷新页面，顺序保留
4. 勾选/取消勾选仍正常工作
5. 隐藏预置条目（点 ×）后，剩余条目顺序不变
6. 点"恢复"恢复预置条目，其归位到原顺序位置
7. 添加自定义条目，新条目出现在末尾
8. 删除自定义条目，剩余条目顺序不变
9. 切换"只看未掌握"再切回"显示全部"，顺序不变
10. 键盘聚焦手柄，按方向键可移动，空格确认

- [ ] **Step 5: 停止开发服务器**

手动 Ctrl+C 停止 vite。

- [ ] **Step 6: 最终提交（如有未提交的改动）**

Run:
```bash
git status
```
Expected: 无未提交改动（前面各任务已分别提交）。

---

## 完成标准

- [ ] 所有 7 个任务完成
- [ ] 全部测试通过（9 个用例）
- [ ] `npx tsc -b` 无错误
- [ ] `npm run build` 成功
- [ ] 手动验证 10 项交互全部符合预期
- [ ] 与 spec 第 11 节"影响范围"完全对应
