# 不牢固知识点决策与复习队列设计

> 日期：2026-06-24
> 状态：设计确认，待生成执行计划
> 作者：蔡光耀
> 关联：`2026-06-23-tech-stack-index-design.md`、`2026-06-24-editorial-hybrid-implementation-design.md`

## 一、背景与目标

### 1.1 问题

在按既定进度（Day 1-30）复习面试题时，遇到掌握程度不确定、记忆不牢固的题目，存在纠结：

- **原地死磕**弄懂这道题，还是**继续按原定进度往后学**，靠后续多次重复复习慢慢吃透？
- 记忆不牢固的知识点，是否应该依靠后续反复复习解决？
- 用什么规则对知识点、面试题做系统化分类与标记，方便针对性复习？

### 1.2 目标

- **策略规则**：定义"死磕 vs 跳过"的决策规则，把模糊纠结转化为可执行判断
- **分类标记体系**：三维标记（不掌握原因 × 掌握程度 × 复习紧迫度），支撑针对性复习
- **产品化**：将规则与标记落地到 Dashboard，通过决策引导弹窗降低用户决策成本，通过复习队列视图在复习日提供明确抓手

### 1.3 关键决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 产出形态 | 策略规则 + 产品化 | 规则指导产品，产品固化规则 |
| 决策判据 | 前置依赖 × 优先级 × 不掌握程度 × 剩余时间 | 四维综合判断 |
| 标记维度 | 不掌握原因 × 掌握程度 × 复习紧迫度 | 分别决定复习方式/强度/优先级 |
| 标记成本 | 用户标 1.5 维 + 系统算 1 维 | 弹窗副产品收集程度，系统自动算紧迫度 |
| 剩余时间 | 手动覆盖兜底 | 不自动估算耗时，通过"时间不够直接跳过"按钮实现 |

## 二、决策规则（"死磕 vs 跳过"的产品化）

### 2.1 触发入口

在面试题、知识点、模拟题上新增 **"💡 遇到不牢固"** 按钮（hover 显示）。点击后弹出**决策引导弹窗**。

### 2.2 弹窗收集 3 个选择

```
┌─ 这道题不牢固，怎么处理？─────────────┐
│                                         │
│ ① 它是后续知识的前置依赖吗？            │
│   ○ 是   ○ 否   ○ 不确定                │
│                                         │
│ ② 现在的状态是？        → masteryLevel  │
│   ○ 完全没思路   ○ 能讲个大概           │
│                                         │
│ ③ 不掌握的原因是？      → weakReason    │
│   ○ 概念不清  ○ 记忆模糊  ○ 讲不出来    │
│   ○ 易混淆    ○ 不会应用                │
│                                         │
│  ─ 系统建议：跳过+加入复习（高紧迫）─    │
│                                         │
│  [确认死磕]  [跳过+加入复习]            │
│  [时间不够？直接跳过+加入复习]          │
└─────────────────────────────────────────┘
```

### 2.3 决策表

系统综合"前置依赖 × 不掌握程度 × 已有 priority"给出建议：

| 前置依赖 | 不掌握程度 | priority | 系统建议 | 复习紧迫度 |
|---------|-----------|----------|---------|-----------|
| 是 | 完全没思路 | 任意 | **死磕** | —（当场解决） |
| 是 | 能讲个大概 | 任意 | 跳过+加入复习 | 高（下次复习日必看） |
| 否 | 完全没思路 | 🔴🟡 | **死磕** | —（当场解决） |
| 否 | 完全没思路 | 🟢⚪ | 跳过+加入复习 | 中（本周内） |
| 否 | 能讲个大概 | 任意 | 跳过+加入复习 | 低（面试前冲刺） |
| 不确定 | 任意 | 任意 | 按"是"处理（保守策略） | — |

### 2.4 "剩余时间"维度

不自动估算时间（项目无耗时统计），改为**手动覆盖兜底**：
- 弹窗底部常驻"时间不够？直接跳过+加入复习"次级按钮
- 用户可无视系统建议，强制跳过（紧迫度按"能讲个大概"档处理）

### 2.5 "死磕"的产品化

点"确认死磕"后：
- 弹窗关闭，答案/要点自动展开（面试题展开 answer，模拟题展开 tips）
- 不加入复习队列（当场解决）
- 标记 `weakReason` + `masteryLevel`

### 2.6 "跳过"的产品化

点"跳过+加入复习"后：
- 自动加入复习队列（`questionReview[key] = true`）
- 自动标记复习紧迫度（系统按决策表算）
- 标记 `weakReason` + `masteryLevel`
- 继续往后学

## 三、标记体系（三维）

### 3.1 三维总览

| 维度 | 字段 | 谁标 | 取值 | 用途 |
|------|------|------|------|------|
| 不掌握原因 | `weakReason` | 用户标 | 5 选 1 | 决定**复习方式** |
| 掌握程度 | `masteryLevel` | 弹窗副产品 | 4 档 | 决定**复习强度** |
| 复习紧迫度 | `reviewUrgency` | 系统算 | 3 档 | 决定**展示优先级** |

用户只需在决策弹窗里填 3 个选择题，就同时完成"决策 + 全部标记"，无额外标记成本。

### 3.2 维度 1：不掌握原因（weakReason）

| 值 | 含义 | 复习方式建议（复习日展示） |
|----|------|--------------------------|
| `concept` | 概念不清 | 重学理论：展开答案/查文档 |
| `memory` | 记忆模糊 | 闪卡重复：快速过一遍关键词 |
| `articulate` | 讲不出来 | 口述练习：闭眼讲一遍 |
| `confuse` | 易混淆 | 对比辨析：找相似概念对比 |
| `apply` | 不会应用 | 实战做题：找相关题练习 |

### 3.3 维度 2：掌握程度（masteryLevel）

| 值 | 含义 | 来源 | 复习强度 |
|----|------|------|---------|
| `mastered` | 已掌握 | 用户标 mastered | 不复习 |
| `vague` | 能讲个大概 | 弹窗②选"能讲个大概" | 轻度回顾 |
| `clueless` | 完全没思路 | 弹窗②选"完全没思路" | 深度重学 |
| `unknown` | 未评估 | 默认 | — |

### 3.4 维度 3：复习紧迫度（reviewUrgency）

直接复用决策表的"复习紧迫度"列，自动映射：

| 值 | 含义 | 触发条件 | 复习日展示 |
|----|------|---------|-----------|
| `high` | 高紧迫 | 前置依赖+能讲个大概；或"不确定" | 🔴 置顶 |
| `mid` | 中紧迫 | 非前置+完全没思路+🟢⚪ | 🟡 中间 |
| `low` | 低紧迫 | 非前置+能讲个大概 | ⚪ 靠后 |

### 3.5 与现有字段的关系

| 现有字段 | 处理 |
|---------|------|
| `questionStatus.mastered` | 保留，与 `masteryLevel === 'mastered'` 双向同步 |
| `questionReview` | 保留，"跳过+加入复习"时设为 `true` |
| `questionStatus.priority` | 保留，参与紧迫度计算 |
| `cardEval` | 不变（关键词卡片自评，独立体系） |

## 四、数据结构扩展

### 4.1 新增类型（types/index.ts）

```typescript
// 不掌握原因（决定复习方式）
export type WeakReason = 'concept' | 'memory' | 'articulate' | 'confuse' | 'apply';

// 掌握程度（决定复习强度）
export type MasteryLevel = 'mastered' | 'vague' | 'clueless' | 'unknown';

// 复习紧迫度（系统算，决定展示优先级）
export type ReviewUrgency = 'high' | 'mid' | 'low';

// 决策弹窗的输入
export interface WeakDecisionInput {
  isPrerequisite: 'yes' | 'no' | 'uncertain';
  mastery: 'clueless' | 'vague';
  reason: WeakReason;
  priority: QuestionPriority;
  decision: 'grind' | 'skip';
}
```

### 4.2 标记对象的 key 规则

| 对象 | key 格式 | 示例 |
|------|---------|------|
| 面试题 | `questionId` | `q-java-basic-equals-1` |
| 知识点/必会题/tier5/tier6 | `${day}-${type}-${index}` | `4-knowledge-2` |
| 模拟题 | `${day}-mock-${index}` | `4-mock-0` |

面试题 id 是 UUID，不会与 `${day}-...` 格式冲突，无需加前缀。

### 4.3 AppState 新增字段

```typescript
interface AppState {
  // ... 现有字段保留

  // 不掌握原因：key 为 contentKey/questionId
  weakReason: Record<string, WeakReason>;

  // 掌握程度：key 同上
  masteryLevel: Record<string, MasteryLevel>;

  // 复习紧迫度：key 同上（仅"跳过+加入复习"的题有值）
  reviewUrgency: Record<string, ReviewUrgency>;

  // 决策弹窗状态（全局挂载，避免 prop drilling）
  dialogState: { open: boolean; key: string; text: string; priority: QuestionPriority } | null;
}
```

### 4.4 新增 Action

**核心 Action：一次性提交弹窗决策**

```typescript
| {
    type: 'WEAK_DECISION';
    key: string;
    payload: WeakDecisionInput;
  }
```

Reducer 处理：
```typescript
case 'WEAK_DECISION': {
  const { reason, mastery, decision, isPrerequisite, priority } = action.payload;
  const key = action.key;

  // 1. 设置原因和程度
  const weakReason = { ...state.weakReason, [key]: reason };
  const masteryLevel = { ...state.masteryLevel, [key]: mastery };

  // 2. 跳过时：加入复习 + 算紧迫度
  let questionReview = state.questionReview;
  let reviewUrgency = state.reviewUrgency;
  if (decision === 'skip') {
    questionReview = { ...questionReview, [key]: true };
    reviewUrgency = {
      ...reviewUrgency,
      [key]: computeUrgency(isPrerequisite, mastery, priority),
    };
  }
  // 死磕时不设 reviewUrgency（当场解决）

  return { ...state, weakReason, masteryLevel, questionReview, reviewUrgency };
}
```

**辅助 Action：手动更新单个维度**

```typescript
| { type: 'SET_WEAK_REASON'; key: string; reason: WeakReason }
| { type: 'SET_MASTERY_LEVEL'; key: string; level: MasteryLevel }
| { type: 'SET_REVIEW_URGENCY'; key: string; urgency: ReviewUrgency }
```

**`SET_MASTERY_LEVEL` 与 `mastered` 同步**：

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
  return { ...state, masteryLevel, questionStatus };
}
```

**弹窗控制 Action**：

```typescript
| { type: 'OPEN_WEAK_DIALOG'; key: string; text: string; priority: QuestionPriority }
| { type: 'CLOSE_WEAK_DIALOG' }
```

### 4.5 紧迫度计算函数（纯函数，可单测）

```typescript
// src/utils/reviewUrgency.ts
export function computeUrgency(
  isPrerequisite: 'yes' | 'no' | 'uncertain',
  mastery: 'clueless' | 'vague',
  priority: QuestionPriority
): ReviewUrgency {
  // 前置依赖（含不确定保守处理）→ 高紧迫
  if (isPrerequisite === 'yes' || isPrerequisite === 'uncertain') {
    return 'high';
  }
  // 非前置 + 完全没思路 + 🟢⚪ → 中
  if (mastery === 'clueless' && (priority === 'green' || priority === 'gray')) {
    return 'mid';
  }
  // 非前置 + 能讲个大概 → 低
  // 注：非前置+完全没思路+🔴🟡 走死磕，不进队列，不会到这里
  return 'low';
}
```

### 4.6 IndexedDB 兼容

```typescript
const migratedState: AppState = { ...initialState, ...loaded };
// ... 现有迁移
if (!migratedState.weakReason) migratedState.weakReason = {};
if (!migratedState.masteryLevel) migratedState.masteryLevel = {};
if (!migratedState.reviewUrgency) migratedState.reviewUrgency = {};
if (!migratedState.dialogState) migratedState.dialogState = null;
```

### 4.7 initialState 新增

```typescript
export const initialState: AppState = {
  // ... 现有
  weakReason: {},
  masteryLevel: {},
  reviewUrgency: {},
  dialogState: null,
};
```

## 五、组件设计

### 5.1 新增组件

| 组件 | 职责 | 位置 |
|------|------|------|
| `WeakDecisionDialog.tsx` | 决策引导弹窗，收集 3 个选择 + 提交 WEAK_DECISION | 全局挂载（App.tsx） |
| `ReviewQueue.tsx` | 复习队列视图，复习日展示按紧迫度排序的待复习项 | DayCard 复习日区块 |

### 5.2 修改组件

| 组件 | 改动 |
|------|------|
| `DayCard.tsx` | 面试题/模拟题/知识点旁加"💡遇到不牢固"按钮；复习日的"复习昨日"区块改为 `<ReviewQueue>` |
| `TechStackView.tsx` | 面试题旁加"💡"按钮；列表项展示 weakReason 图标 + masteryLevel 边框色 |
| `App.tsx` | 全局挂载 `<WeakDecisionDialog>`，响应 `dialogState` |

### 5.3 WeakDecisionDialog 组件

```typescript
interface WeakDecisionDialogProps {
  open: boolean;
  contentKey: string;
  contentText: string;
  priority: QuestionPriority;
  onClose: () => void;
}
```

- 内部状态：3 个选择（isPrerequisite / mastery / reason）
- 实时建议：根据前 2 个选择 + priority，用 `computeUrgency` 的逆逻辑算出建议（死磕/跳过+紧迫度），实时显示在底部
- 底部 3 按钮：
  - `[确认死磕]`（系统建议死磕时高亮）→ `decision: 'grind'`
  - `[跳过+加入复习]`（系统建议跳过时高亮）→ `decision: 'skip'`
  - `[时间不够？直接跳过]`（次级按钮，始终可用）→ `decision: 'skip'`，强制跳过
- 提交时 `dispatch({ type: 'WEAK_DECISION', key, payload })`
- 死磕时的答案展开：弹窗不关闭，切换为"答案展示"模式（若该题有 answer/tips 则展示，无则显示"该题无答案，请查阅 Day X 内容"），用户看完后手动关闭。避免跨组件通信。
- 跳过时：`dispatch` 后直接 `onClose()`

### 5.4 ReviewQueue 组件（复习日核心）

**触发位置**：DayCard 中 `day.isReview === true` 时，"复习昨日"区块改为 `<ReviewQueue>`。

**数据来源**：

```typescript
const reviewItems = Object.entries(state.questionReview)
  .filter(([_, inReview]) => inReview)
  .map(([key]) => ({
    key,
    text: resolveContentText(key),
    day: resolveDay(key),
    reason: state.weakReason[key],
    urgency: state.reviewUrgency[key],
    mastery: state.masteryLevel[key] || 'unknown',
  }))
  .sort(byUrgency);  // high → mid → low
```

**展示结构**：

```
┌─ 🔄 复习队列（12 项）──────────────────────┐
│                                             │
│ 🔴 高紧迫（4 项）                           │
│   ┌─────────────────────────────────────┐  │
│   │ 📖 volatile 可见性          [Day 4] │  │
│   │ 原因：概念不清 → 重学理论            │  │
│   │ 程度：[完全没思路 ▾]                 │  │
│   └─────────────────────────────────────┘  │
│   ...                                       │
│                                             │
│ 🟡 中紧迫（5 项）                           │
│   ┌─────────────────────────────────────┐  │
│   │ 🗣 synchronized 锁升级      [Day 5] │  │
│   │ 原因：讲不出来 → 口述练习            │  │
│   │ 程度：[能讲个大概 ▾]                 │  │
│   └─────────────────────────────────────┘  │
│   ...                                       │
│                                             │
│ ⚪ 低紧迫（3 项）                           │
│   ...                                       │
│                                             │
│ [全部标记已掌握]  [导出复习清单]            │
└─────────────────────────────────────────────┘
```

**每项交互**：
- `[Day X]` 点击 → 跳转到对应 Day（`SET_CURRENT_DAY`）
- `程度：[▾]` 下拉 → 复习后更新 `masteryLevel`（`SET_MASTERY_LEVEL`）
- 程度选"已掌握" → 自动从复习队列移除（`questionReview[key] = false`）
- `weakReason` 对应的复习方式建议作为行动指引

**复习日展示范围**：

ReviewQueue 展示**所有** `questionReview[key] === true` 且 `masteryLevel[key] !== 'mastered'` 的项，不按复习区间过滤。理由：复习日就是要把所有待复习的未掌握项过一遍，避免遗漏。每项显示 `[Day X]` 来源标签，用户可判断是哪个 Day 产生的。

- Day 7 复习日：展示 Day 1-6 产生的未掌握项
- Day 15 复习日：展示 Day 1-14 产生的所有未掌握项（含 Day 7 未消化的）
- Day 22 复习日：展示 Day 1-21 产生的所有未掌握项
- Day 30 总复习：展示全部未掌握项

### 5.5 标记展示（DayCard / TechStackView 列表项）

已标记的项在列表中显示：

| 标记 | 展示 |
|------|------|
| `weakReason` | 图标前缀：📖概念不清 / 🔄记忆模糊 / 🗣讲不出 / 🔀易混淆 / ✏️不会应用 |
| `masteryLevel` | 左边框色：🟢mastered / 🟡vague / 🔴clueless |
| `reviewUrgency` | 右侧角标：🔴high / 🟡mid / ⚪low |
| 已加入复习 | 🔖 图标（复用现有 questionReview 展示） |

### 5.6 弹窗触发机制

在 `useAppState` 的 context 中新增弹窗控制状态（`dialogState`），任何组件点击"💡遇到不牢固"→ `dispatch(OPEN_WEAK_DIALOG)`，App.tsx 顶层挂载的 `<WeakDecisionDialog>` 响应。避免在 DayCard/TechStackView 每个列表项里嵌套弹窗。

## 六、与现有功能的兼容性

| 现有功能 | 兼容性 | 说明 |
|---------|--------|------|
| `questionStatus.mastered` | ✅ 双向同步 | `SET_MASTERY_LEVEL` 时同步 `mastered`；用户标 mastered 时同步 `masteryLevel='mastered'` |
| `questionReview` | ✅ 复用 | "跳过+加入复习"时设为 `true`；ReviewQueue 从中读取 |
| `questionStatus.priority` | ✅ 只读使用 | 参与 `computeUrgency` 计算，不修改 |
| `cardEval`（卡片自评） | ✅ 独立 | 关键词卡片体系不变，不与 masteryLevel 混淆 |
| 复习日机制（Day 7/15/22/30） | ✅ 复用 | ReviewQueue 复用 `isReview` 判断，替换"复习昨日"区块 |
| 技术栈筛选（`techStackFilter`） | ✅ 不影响 | 新标记独立于筛选逻辑 |
| IndexedDB 持久化 | ✅ 自动 | 新字段自动持久化，迁移逻辑补全空对象 |
| 增删/排序（`customContent`/`contentOrder`） | ✅ 不影响 | 标记基于 key，与内容增删独立 |

## 七、不实现的功能（YAGNI）

- ❌ **知识点依赖图**：不预设"哪些是前置依赖"，由用户在弹窗里判断
- ❌ **自动估算剩余时间**：不追踪每日学习耗时，"剩余时间"维度通过手动覆盖按钮实现
- ❌ **间隔重复算法（SRS）**：不引入 Anki 式的遗忘曲线算法，紧迫度只用 3 档，复习日固定为 Day 7/15/22/30
- ❌ **跨技术栈的复习队列聚合**：ReviewQueue 只在复习日的 DayCard 展示，不做全局复习队列页
- ❌ **复习历史记录**：不记录"复习了几次"，只记录当前状态（程度/原因/紧迫度）
- ❌ **weakReason 自动推断**：原因由用户手动选，不用 AI 猜测

## 八、验证标准

| 类别 | 验证项 | 命令/方式 |
|------|--------|----------|
| 类型 | TypeScript 零错误 | `npx tsc --noEmit` |
| 构建 | Vite 构建通过 | `npm run build` |
| 单测 | `computeUrgency` 纯函数覆盖所有分支 | `npx vitest run reviewUrgency` |
| 功能-弹窗 | 点"💡遇到不牢固"→弹窗显示→填 3 项→建议正确 | 手动测试 |
| 功能-死磕 | 点"确认死磕"→答案展开 + 不进复习队列 | 手动测试 |
| 功能-跳过 | 点"跳过+加入复习"→加入队列 + 紧迫度正确 | 手动测试 |
| 功能-覆盖 | "时间不够直接跳过"→强制跳过 | 手动测试 |
| 功能-复习日 | Day 7 显示 ReviewQueue，按紧迫度排序 | 切到 Day 7 |
| 功能-程度更新 | 复习后下拉改程度→"已掌握"自动移出队列 | 手动测试 |
| 持久化 | 刷新后 weakReason/masteryLevel/reviewUrgency 保留 | IndexedDB 检查 |
| 兼容性 | 旧数据加载不报错，新字段为空对象 | 清空 DB 重载 |
| 标记展示 | 列表项显示原因图标 + 程度边框 + 紧迫角标 | 手动测试 |

## 九、文件清单

### 新增文件

| 文件 | 职责 |
|------|------|
| `src/components/WeakDecisionDialog.tsx` | 决策引导弹窗 |
| `src/components/ReviewQueue.tsx` | 复习队列视图 |
| `src/utils/reviewUrgency.ts` | 紧迫度计算纯函数 |
| `src/utils/reviewUrgency.test.ts` | 紧迫度计算单测 |
| `src/utils/contentKey.ts` | key 解析工具（resolveContentText/resolveDay） |

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/types/index.ts` | 新增 WeakReason/MasteryLevel/ReviewUrgency 类型 + 4 个字段 + dialogState |
| `src/hooks/useAppState.tsx` | 新增 6 个 Action + reducer 逻辑 + 迁移补全 |
| `src/components/DayCard.tsx` | 列表项加"💡"按钮 + 标记展示 + 复习日替换为 ReviewQueue |
| `src/components/TechStackView.tsx` | 面试题加"💡"按钮 + 标记展示 |
| `src/App.tsx` | 全局挂载 WeakDecisionDialog |

## 十、实施顺序

1. **类型 + 工具**：types/index.ts + reviewUrgency.ts + contentKey.ts + 单测
2. **状态层**：useAppState.tsx 新增 Action + reducer + 迁移
3. **弹窗组件**：WeakDecisionDialog.tsx
4. **复习队列**：ReviewQueue.tsx
5. **接入**：DayCard + TechStackView 加按钮 + 标记展示
6. **全局挂载**：App.tsx
7. **验证**：tsc + build + 单测 + 手动测试
