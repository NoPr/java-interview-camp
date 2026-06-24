# Editorial Hybrid 设计落地方案

> 日期：2026-06-24
> 状态：已批准，待写实施计划
> 关联演示：`docs/design-prototypes/design-techstack-v2.html`、`docs/design-prototypes/design-hybrid-v3.html`

## 一、背景与目标

### 1.1 项目现状

Java 面试冲刺 30 天仪表盘（React 18 + TypeScript + Vite），纯原生 CSS，无 UI 框架、无动画库。现有 UI 功能完整但视觉缺乏辨识度——典型 Tailwind 后台模板风格，通用蓝主色 + 6 色区块 + Noto Sans SC 字体。

### 1.2 设计目标

将经过多轮迭代确认的 **Editorial Hybrid** 设计方案落地到项目代码，实现：

- **字体三体协作**：Noto Serif SC（衬线标题）+ Noto Sans SC（黑体正文）+ JetBrains Mono（等宽数字/代码）
- **单色系明度层次**：用同一色系（绿）的不同明度区分内容类型，琥珀色突出面试题库
- **面试优先的技术栈视图**：区块顺序按面试优先级排列，而非学习流程
- **完整功能覆盖**：卡片翻转自测、模拟题折叠要点、标记复习、全局筛选、响应式抽屉

### 1.3 关键决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 落地范围 | 全套落地 | 一次性完成，避免半成品 |
| CSS 策略 | 完全重写 | 用 `--ed-*` 替换所有旧变量，结果干净 |
| 实施方案 | 方案 C（并行推进） | CSS 与组件同步改，无返工 |
| 演示文件 | 移到 `docs/design-prototypes/` | 保留作参考，不污染根目录 |

## 二、CSS 变量体系（完全重写）

### 2.1 字体加载（index.html）

```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&family=Noto+Serif+SC:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

修复现有问题：HTML 加载了 Noto Serif SC，但 CSS 用 Noto Sans SC（未加载）——字体断裂。

### 2.2 变量重写（styles.css `:root`）

旧变量全部删除，替换为 `--ed-*` 体系：

| 旧变量 | 新变量 | 值 |
|--------|--------|-----|
| `--bg` | `--ed-canvas` | `#faf9f6` |
| `--bg-sidebar` | `--ed-sidebar` | `#f6f4ee` |
| `--bg-hover` | `--ed-mist` | `#f4f2ec` |
| `--text-primary` | `--ed-ink` | `#1c1c1a` |
| `--text-body` | `--ed-ink-soft` | `#4a4a45` |
| `--text-muted` | `--ed-ink-muted` | `#8a8a82` |
| `--text-faint` | `--ed-ink-faint` | `#b8b8b0` |
| `--blue` / `--blue-dark` | `--ed-brand-deep` | `#14532d` |
| `--purple` / `--purple-dark` | `--ed-brand-mid` | `#166534` |
| `--green` / `--green-dark` | `--ed-green` | `#16a34a` |
| `--orange` / `--orange-dark` | `--ed-orange` | `#f97316` |
| `--yellow` / `--yellow-dark` | `--ed-brand-olive` | `#65a30d` |
| `--amber` | `--ed-amber` | `#d97706` |
| `--red` | `--ed-red` | `#dc2626` |
| `--border` / `--border-light` | `--ed-border` / `--ed-border-soft` | `#e6e3da` / `#f0ede4` |
| `--font-sans` | `--ed-sans` | `'Noto Sans SC', system-ui, sans-serif` |
| `--font-mono` | `--ed-mono` | `'JetBrains Mono', monospace` |
| —（新增） | `--ed-serif` | `'Noto Serif SC', serif` |
| `--radius-*` | `--ed-r-*` | `4/8/12/20px` |
| `--shadow-*` | `--ed-shadow-*` | sm/md/lg |
| `--transition` | `--ed-transition` | `150ms ease` |

### 2.3 章节色系映射

旧 6 色区块 → 新单色系明度层次：

| 旧 Block color | 新 variant | 色条色 | 语义 |
|----------------|-----------|--------|------|
| `blue` | `knowledge` | `--ed-brand-deep` 墨绿 | 重点知识 |
| `purple` | `mustknow` | `--ed-brand-mid` 深翠 | 必会题 |
| `yellow` | `mock` | `--ed-brand-olive` 橄榄 | 模拟题 |
| `gray`（featured） | `interview` | `--ed-amber` 琥珀 | 面试题库（突出） |
| `green` | `card` | `--ed-green` 翠绿 | 关键词卡片 |
| `orange` | `algo` | `--ed-orange` 橙 | 算法练习 |
| —（新增） | `review` | `--ed-purple` 紫 | 复习昨日 |

### 2.4 动画

纯 CSS，不引入动画库：

```css
@keyframes ed-fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```

卡片翻转用 CSS 3D `transform-style: preserve-3d` + `rotateY(180deg)`。

### 2.5 影响范围

所有组件中引用旧变量的地方需同步替换。涉及文件：
- `styles.css`（全局样式，约 50+ 处引用）
- `DayCard.tsx`（Block 组件的 `block-${color}` 类名 → `ed-block--${variant}`）
- `Sidebar.tsx`、`Header.tsx`、`TechStackView.tsx`（少量内联样式）

## 三、组件改造详情

### 3.1 TechStackView（技术栈视图）

**区块顺序调整**（面试优先，非学习流程）：

```
01 面试题库 (琥珀, featured) → 02 必会题 (深翠) → 03 关键词卡片 (翠绿)
→ 04 重点知识 (墨绿) → 05 模拟题 (橄榄)
```

**Hero 区新增**：
- "加入复习清单"按钮（琥珀色，显示"N 项未完成"），点击将未掌握项加入复习清单
- Day 胶囊跳转（点击切到时间视图对应 Day）
- 全局控制栏：`[全部展开▾] [只看未掌握] [只看面试题] [显示全部]`

**面试题库改造**：
- 左边框从"来源色"改为"掌握状态色"（绿=已掌握/琥珀=标记复习/灰=未掌握）
- 每题加 🔖 标记复习按钮（hover 显示，点击切换 reviewing 状态）
- 每题加 Day 来源标签（可跳转到时间视图）
- 来源图例改为掌握状态图例

**关键词卡片**：
- 标题下加描述文字："核心概念速览，翻转验证掌握度"

### 3.2 DayCard（每日工作台）

**Block 组件 props 变更**：

```typescript
// 旧：color: 'blue' | 'purple' | 'green' | 'orange' | 'yellow' | 'gray'
// 新：variant: 'review' | 'knowledge' | 'card' | 'algo' | 'interview' | 'mock'
interface BlockProps {
  variant: BlockVariant;
  num: string;        // "01" | "02" ...
  title: string;
  count: string;      // "4 项 · 80min"
  desc?: string;      // 描述小字
  featured?: boolean; // 面试题库突出
  children: React.ReactNode;
}
```

**区块顺序**（学习流程，含时间标注）：

```
00 复习昨日 (紫, 20min) → 01 重点知识 (墨绿, 80min)
→ 02 关键词卡片 (翠绿, 25min) → 03 算法练习 (橙, 20min)
→ 04 面试题库·口述练习 (琥珀, 15min) → 05 模拟题 (橄榄, 20min)
```

**新增功能**：
- 关键词卡片 3D 翻转（CSS `rotateY`）+ ✅/❌ 自评按钮 + 状态持久化（✅ 绿边框保持/❌ 红边框+半透明保持）
- 模拟题折叠参考要点（`<details>`）+ 计时器（⏱ 2min/3min）
- 阻塞提示条（有 🔴 项时 Hero 顶部红色 ⚠️ 提示）
- 优先级选择器（添加框旁 🔴🟡🟢）
- 面试题库标题改为"口述练习" + 描述"闭眼讲一遍，讲不清楚的标记 ❌"

### 3.3 Sidebar（侧边栏）

**技术栈视图**：
- `ts-count` 从显示天数改为 `8/15` 完成率格式
- 已完成技术栈显示绿色 ✓
- 空技术栈半透明 + "待补充"

**时间视图**：
- 按周折叠（Week 1-5）
- 当前日高亮（绿色左条 + 衬线字体）
- 每周显示完成率 `5/7`

**响应式**：
- 窄屏（<900px）侧边栏改抽屉菜单
- Header 加 ☰ 汉堡按钮触发

### 3.4 Header

**新增元素**：
- 面包屑：`按技术栈 / 语言基础` 或 `Week 1 / Day 4`
- 导出/导入按钮（JSON 格式，导出 AppState）
- 复习清单入口

### 3.5 App.tsx

- 窄屏抽屉菜单状态管理（`sidebarOpen`）
- 视图切换过渡动画

## 四、状态扩展

### 4.1 新增字段（types/index.ts）

```typescript
interface AppState {
  // ... 现有字段保留

  // 卡片自评状态（key: `${day}-${cardIndex}`）
  cardEval: Record<string, 'pass' | 'fail'>;

  // 面试题标记复习（key: questionId）
  questionReview: Record<string, boolean>;

  // 模拟题参考要点展开状态（key: `${day}-${index}`）
  mockTipsExpanded: Record<string, boolean>;

  // 技术栈视图全局筛选
  techStackFilter: 'all' | 'unmastered' | 'interview';

  // 窄屏侧边栏抽屉开关
  sidebarOpen: boolean;
}
```

### 4.2 新增 Action 类型

```typescript
| { type: 'TOGGLE_CARD_EVAL'; day: number; cardIndex: number; result: 'pass' | 'fail' }
| { type: 'TOGGLE_QUESTION_REVIEW'; questionId: string }
| { type: 'TOGGLE_MOCK_TIPS'; day: number; index: number }
| { type: 'SET_TECHSTACK_FILTER'; filter: 'all' | 'unmastered' | 'interview' }
| { type: 'TOGGLE_SIDEBAR' }
| { type: 'ADD_TO_REVIEW'; items: string[] }
```

### 4.3 IndexedDB 兼容

`useAppState.tsx` 初始化时做字段补全：

```typescript
const migratedState = { ...defaultState, ...loadedState };
if (!migratedState.cardEval) migratedState.cardEval = {};
if (!migratedState.questionReview) migratedState.questionReview = {};
if (!migratedState.mockTipsExpanded) migratedState.mockTipsExpanded = {};
if (!migratedState.techStackFilter) migratedState.techStackFilter = 'all';
if (migratedState.sidebarOpen === undefined) migratedState.sidebarOpen = false;
```

## 五、实施步骤（方案 C，6 步）

### Step 1: 准备（小改动）

- `index.html` 修复字体加载（三体全加载）
- 移动 6 个 `design-*.html` 到 `docs/design-prototypes/`
- 创建 `docs/superpowers/specs/` 目录

**验证**：字体加载正常，演示文件可访问

### Step 2: CSS 变量完全重写（最大改动）

- `styles.css` `:root` 替换所有旧变量为 `--ed-*`
- 同步更新 `styles.css` 全文所有 `var(--旧)` → `var(--ed-*)`
- 追加 `@keyframes ed-fade-up` + 通用工具类
- `DayCard.tsx` Block 组件 `color` → `variant`（className 同步改）

**验证**：页面无样式破坏，颜色正确显示，`npx tsc --noEmit` 通过

### Step 3: TechStackView 改造

- 区块顺序调整（面试优先）
- Hero 加"加入复习"按钮 + Day 胶囊跳转
- 全局控制栏 + 筛选逻辑
- 面试题掌握状态左边框 + 🔖 标记复习按钮
- 关键词卡片描述文字

**验证**：技术栈视图功能完整，交互可用

### Step 4: DayCard 改造

- Block 单色系 + 章节编号 + 时间标注
- 复习区块（00）+ 阻塞提示条
- 关键词卡片 3D 翻转 + ✅/❌ 自评
- 模拟题折叠参考要点 + 计时器
- 优先级选择器（🔴🟡🟢）

**验证**：每日工作台视觉统一，功能完整

### Step 5: Sidebar + Header + App

- Sidebar 技术栈完成率显示 + 时间视图按周折叠
- Header 面包屑 + 导出/导入 + 复习清单入口
- `App.tsx` 响应式抽屉菜单
- 窄屏 ☰ 汉堡按钮

**验证**：全局导航完整，响应式可用

### Step 6: 状态扩展 + 最终验证

- `types/index.ts` 新增字段
- `useAppState.tsx` Action + 迁移逻辑
- 组件接入新状态
- 全量验证

**验证**：状态持久化正常，功能无退化

## 六、验证标准

| 类别 | 验证项 | 命令/方式 |
|------|--------|----------|
| 类型 | TypeScript 零错误 | `npx tsc --noEmit` |
| 构建 | Vite 构建通过 | `npm run build` |
| 功能 | 勾选/增删/跳转/优先级正常 | 手动测试 |
| 视觉 | 与演示文件效果一致 | 对比 `design-techstack-v2.html` |
| 持久化 | 刷新后状态保留 | IndexedDB 检查 |
| 响应式 | 窄屏抽屉菜单可用 | 缩窄窗口测试 |
| 兼容性 | 旧数据加载不报错 | 清空 IndexedDB 后重载 |

## 七、风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| CSS 变量全替换遗漏 | Step 2 用全局搜索替换 + `npx tsc` 验证 |
| Block props 变更影响调用方 | DayCard + TechStackView 同 Step 改完 |
| IndexedDB 旧数据缺新字段 | Step 6 迁移逻辑做字段补全 |
| 卡片 3D 翻转旧浏览器不支持 | `backface-visibility` 降级为简单显隐 |
| 字体加载延迟导致 FOIT | `display=swap` + `font-display: swap` |

## 八、文件清单

### 修改的文件

| 文件 | 改动类型 |
|------|---------|
| `index.html` | 字体加载修复 |
| `src/styles.css` | CSS 变量完全重写 + 动画 + 工具类 |
| `src/types/index.ts` | 新增状态字段 + Action 类型 |
| `src/hooks/useAppState.tsx` | 新增 Action 处理 + 迁移逻辑 |
| `src/components/DayCard.tsx` | Block 改造 + 卡片翻转 + 模拟题折叠 + 复习区块 |
| `src/components/TechStackView.tsx` | 区块顺序 + Hero + 控制栏 + 掌握状态 |
| `src/components/Sidebar.tsx` | 完成率显示 + 按周折叠 + 响应式 |
| `src/components/Header.tsx` | 面包屑 + 导出/导入 + 复习清单 |
| `src/App.tsx` | 响应式抽屉菜单 |

### 移动的文件

| 原路径 | 新路径 |
|--------|--------|
| `design-comparison.html` | `docs/design-prototypes/design-comparison.html` |
| `design-hybrid.html` | `docs/design-prototypes/design-hybrid.html` |
| `design-hybrid-v2.html` | `docs/design-prototypes/design-hybrid-v2.html` |
| `design-hybrid-v3.html` | `docs/design-prototypes/design-hybrid-v3.html` |
| `design-techstack.html` | `docs/design-prototypes/design-techstack.html` |
| `design-techstack-v2.html` | `docs/design-prototypes/design-techstack-v2.html` |
