# 拖拽排序无响应修复设计

- **日期**：2026-06-24
- **问题**：TechStackView 必会题/重点知识区块拖拽手柄完全无响应（桌面鼠标）
- **方案**：组合修复（CSS + 组件）

## 1. 问题分析

### 1.1 表现

桌面鼠标按住 `⋮⋮` 手柄拖动，条目位置无任何变化，完全无响应。

### 1.2 根因

经代码分析，发现 3 个叠加问题：

1. **CSS `touch-action: none` 未设置**：dnd-kit 官方要求在可拖拽元素上设置此属性，否则浏览器默认行为（文本选择、滚动）会拦截 pointer events
2. **CSS `transform` 冲突**：`.techstack-section .content-item:hover` 的 `transform: translateX(2px)` 与 dnd-kit 的 inline transform 冲突，导致位置计算异常
3. **缺少 `setActivatorNodeRef`**：使用拖拽手柄时 dnd-kit 最佳实践要求将 `setActivatorNodeRef` 绑定到手柄元素，缺失可能导致 sensor 无法定位激活点

## 2. 修复方案

### 2.1 CSS 修复

**追加 `.sortable-item` 属性**：

```css
.sortable-item {
    touch-action: none;
    user-select: none;
}
```

**修改 hover transform 冲突**（styles.css 第 1568-1571 行）：

```css
/* 拖拽条目移除 hover transform，避免与 dnd-kit transform 冲突 */
.techstack-section .content-item:hover {
    background: var(--ed-bg-elevated);
}

.techstack-section .content-item:not(.sortable-item):hover {
    transform: translateX(2px);
}
```

### 2.2 组件修复

**SortableItem 加 `setActivatorNodeRef`**：

```tsx
const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,  // 新增
    transform,
    transition,
    isDragging,
} = useSortable({ id });

// button 上加 ref={setActivatorNodeRef}
```

**降低 activationConstraint distance**：从 8 降到 5，更容易触发拖拽。

### 2.3 不改动的部分

- `mergeWithOrder` 逻辑不变
- `REORDER_CONTENT` action 不变
- `renderStrSection` 集成方式不变
- 测试用例不需要修改

## 3. 影响范围

| 文件 | 改动 |
|------|------|
| [src/styles.css](file:///c:/Users/18991/Desktop/30days/src/styles.css) | `.sortable-item` 加 `touch-action`/`user-select`；hover transform 拆分 |
| [src/components/SortableSection.tsx](file:///c:/Users/18991/Desktop/30days/src/components/SortableSection.tsx) | `SortableItem` 加 `setActivatorNodeRef`；distance 8→5 |
