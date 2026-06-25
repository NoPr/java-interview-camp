# 撤销标记与已掌握归组设计

> 日期：2026-06-24
> 状态：设计确认，待生成执行计划
> 作者：蔡光耀
> 关联：`2026-06-24-weak-decision-review-design.md`（基于此扩展）

## 一、背景与问题

不牢固决策与复习队列功能上线后，发现两个问题：

### 1.1 问题一：无法撤销标记

在 DayCard 板块（重点知识模块等）和 TechStackView 面试题列表项旁，点 💡 标记不牢固后，列表项显示原因图标/紧迫角标，但**没有撤销入口**。标记错了无法回退。

### 1.2 问题二：已掌握后从复习队列消失（bug）

在 ReviewQueue 里把程度下拉改成"已掌握"后，`SET_MASTERY_LEVEL` 会把 `questionReview[key]` 设为 false，ReviewQueue 的 filter（`questionReview[key] === true`）把它过滤掉，**题从队列消失**，无法看到复习进度。

### 1.3 目标

- **撤销标记**：弹窗标记详情视图 + 撤销按钮（带确认防误操作）
- **已掌握归组**：已掌握的题留在复习队列，归入"已掌握"分组置底展示

## 二、撤销标记设计

### 2.1 弹窗双模式

WeakDecisionDialog 根据该题是否已标记（`state.weakReason[key]` 是否存在）显示两种模式：

**未标记**（现有逻辑不变）：决策引导表单（3 个选择 + 死磕/跳过）

**已标记**（新增）：标记详情视图

```
┌─ 这道题已标记不牢固 ───────────────────┐
│                                         │
│ 📖 volatile 可见性                      │
│                                         │
│ 不掌握原因：📖 概念不清                  │
│   → 复习方式：重学理论：展开答案/查文档   │
│                                         │
│ 掌握程度：能讲个大概                     │
│ 复习紧迫度：🔴 高紧迫                    │
│ 在复习队列：是                          │
│                                         │
│              [撤销标记]                 │
└─────────────────────────────────────────┘
```

### 2.2 新增 Action：CLEAR_WEAK_MARK

清除该题所有不牢固标记，回到"从未标记"状态：
- 删除 `weakReason[key]`、`masteryLevel[key]`、`reviewUrgency[key]`、`weakMeta[key]`
- `questionReview[key]` 设为 false（移出复习队列）
- 同步 `questionStatus[key].mastered = false`（若存在）

### 2.3 撤销流程（带确认防误操作）

1. 已标记的题，点 💡 → 弹窗显示标记详情视图
2. 点"撤销标记" → 弹轻量确认："确定撤销？将清除该题所有不牢固标记并移出复习队列" + [取消] [确认撤销]
3. 确认 → dispatch CLEAR_WEAK_MARK → 关闭弹窗
4. 列表项的标记图标消失，题从复习队列移除

### 2.4 不做的事（YAGNI）

- ❌ 不做"重新标记"按钮（撤销后再点 💡 即是新标记流程）
- ❌ 不做撤销后的恢复入口（确认弹窗已防误操作，撤销即最终）
- ❌ 撤销时清除 questionReview（最干净的"回到未标记"语义；用户若想保留复习标记可重新点 🔖）

## 三、已掌握归组置底设计

### 3.1 当前 bug

`SET_MASTERY_LEVEL` reducer 在 `level === 'mastered'` 时自动把 `questionReview[key]` 设为 false，导致题从 ReviewQueue 消失。

### 3.2 修复方案

**1. 修改 `SET_MASTERY_LEVEL` reducer：不再自动移出复习队列**

```typescript
case 'SET_MASTERY_LEVEL': {
    const masteryLevel = { ...state.masteryLevel, [action.key]: action.level };
    const questionStatus = { ...state.questionStatus };
    if (questionStatus[action.key]) {
        questionStatus[action.key] = {
            ...questionStatus[action.key],
            mastered: action.level === 'mastered',
        };
    }
    // 移除：若标记为已掌握，自动从复习队列移除
    // 已掌握的题留在复习队列，归入"已掌握"分组置底展示
    return { ...state, masteryLevel, questionStatus };
}
```

**2. 修改 ReviewQueue 数据收集：不再过滤已掌握**

```typescript
const items: ReviewItem[] = Object.entries(state.questionReview)
    .filter(([_, inReview]) => inReview)
    // 移除：.filter(([key]) => state.masteryLevel[key] !== 'mastered')
    .map(...)  // 保留所有 questionReview[key] === true 的项，含已掌握
```

**3. ReviewQueue 新增"已掌握"分组（置底）**

```typescript
const groups: Record<string, ReviewItem[]> = {
    high: items.filter((i) => i.urgency === 'high' && i.mastery !== 'mastered'),
    mid: items.filter((i) => i.urgency === 'mid' && i.mastery !== 'mastered'),
    low: items.filter((i) => i.urgency === 'low' && i.mastery !== 'mastered'),
    mastered: items.filter((i) => i.mastery === 'mastered'),  // 新增
};
```

渲染顺序：high → mid → low → mastered（置底）。

**4. "已掌握"分组样式**

```
✅ 已掌握（3 项）
  ┌─────────────────────────────────────┐
  │ 📖 volatile 可见性          [Day 4] │
  │ 原因：概念不清 → 重学理论            │
  │ 程度：已掌握                         │
  └─────────────────────────────────────┘
```

- 分组标题色用绿色（`--ed-brand-deep`）
- 项内程度下拉保留（可改回 vague/clueless 重新进入紧迫度分组）
- "全部标记已掌握"按钮改为"将未掌握项全部标已掌握"（只作用于未掌握的）

**5. 计数调整**

ReviewQueue 标题："复习队列（12 项）"改为"复习队列（未掌握 9 / 已掌握 3）"。

### 3.3 边界情况

| 场景 | 处理 |
|------|------|
| 死磕的题（未进 questionReview） | 不出现在 ReviewQueue（不受影响） |
| 跳过后改成已掌握 | 留在队列，归入已掌握组 |
| 已掌握改回 vague/clueless | 回到原紧迫度分组 |
| 撤销标记（CLEAR_WEAK_MARK） | questionReview 设 false，从队列消失（符合预期） |
| 空队列（全未掌握且无项） | 显示"🎉 复习队列为空"（现有逻辑不变） |

### 3.4 与撤销标记的联动

撤销标记会清除 `questionReview[key]`，题从 ReviewQueue 完全消失（含已掌握组）——符合"回到从未标记"语义。已掌握组只展示"标记仍在但已掌握"的题。

## 四、数据结构扩展

### 4.1 新增 Action

```typescript
// 清除某题所有不牢固标记，回到从未标记状态
| { type: 'CLEAR_WEAK_MARK'; key: string }
```

### 4.2 CLEAR_WEAK_MARK reducer 逻辑

```typescript
case 'CLEAR_WEAK_MARK': {
    const key = action.key;
    const weakReason = { ...state.weakReason };
    const masteryLevel = { ...state.masteryLevel };
    const reviewUrgency = { ...state.reviewUrgency };
    const weakMeta = { ...state.weakMeta };
    const questionReview = { ...state.questionReview };
    delete weakReason[key];
    delete masteryLevel[key];
    delete reviewUrgency[key];
    delete weakMeta[key];
    questionReview[key] = false;
    // 同步 questionStatus.mastered
    const questionStatus = { ...state.questionStatus };
    if (questionStatus[key]) {
        questionStatus[key] = { ...questionStatus[key], mastered: false };
    }
    return { ...state, weakReason, masteryLevel, reviewUrgency, weakMeta, questionReview, questionStatus };
}
```

## 五、组件改动

### 5.1 WeakDecisionDialog.tsx

- 新增"标记详情视图"模式：当 `state.weakReason[dialog.key]` 存在时显示详情而非决策表单
- 详情视图展示：原因+复习方式建议、程度、紧迫度、是否在复习队列
- 底部"撤销标记"按钮 → 触发确认弹窗 → 确认后 dispatch CLEAR_WEAK_MARK 并关闭

### 5.2 ReviewQueue.tsx

- 数据收集：移除 `masteryLevel !== 'mastered'` 过滤
- 分组：新增 `mastered` 组（置底）
- 渲染：high → mid → low → mastered
- 标题计数：改为"未掌握 X / 已掌握 Y"
- "全部标记已掌握"按钮改为"将未掌握项全部标已掌握"
- 已掌握组样式：绿色标题

### 5.3 useAppState.tsx

- 新增 `CLEAR_WEAK_MARK` Action + reducer
- 修改 `SET_MASTERY_LEVEL` reducer：移除自动移出复习队列逻辑

## 六、验证标准

| 类别 | 验证项 | 命令/方式 |
|------|--------|----------|
| 类型 | TypeScript 零错误 | `npx tsc --noEmit` |
| 构建 | Vite 构建通过 | `npm run build` |
| 单测 | 现有测试无回归 | `npx vitest run` |
| 功能-撤销 | 已标记题点💡→显示详情视图→点撤销→确认→标记清除 | 手动测试 |
| 功能-撤销取消 | 点撤销→点取消→标记保留 | 手动测试 |
| 功能-已掌握归组 | ReviewQueue 改程度为已掌握→归入已掌握组置底，不消失 | 手动测试 |
| 功能-已掌握改回 | 已掌握组改回 vague→回到原紧迫度分组 | 手动测试 |
| 功能-计数 | 标题显示"未掌握 X / 已掌握 Y" | 手动测试 |
| 持久化 | 撤销后刷新，标记确实清除 | IndexedDB 检查 |

## 七、文件清单

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/hooks/useAppState.tsx` | 新增 CLEAR_WEAK_MARK Action + reducer；修改 SET_MASTERY_LEVEL 移除自动移出队列 |
| `src/components/WeakDecisionDialog.tsx` | 新增标记详情视图模式 + 撤销确认弹窗 |
| `src/components/ReviewQueue.tsx` | 新增已掌握分组置底 + 计数调整 + 按钮文案调整 |
| `src/styles.css` | 新增已掌握分组样式 + 撤销确认弹窗样式 |

## 八、实施顺序

1. **状态层**：useAppState 新增 CLEAR_WEAK_MARK + 修改 SET_MASTERY_LEVEL
2. **弹窗**：WeakDecisionDialog 新增标记详情视图 + 撤销确认
3. **复习队列**：ReviewQueue 新增已掌握分组 + 计数调整
4. **样式**：styles.css 补全
5. **验证**：tsc + build + 单测 + 手动测试
