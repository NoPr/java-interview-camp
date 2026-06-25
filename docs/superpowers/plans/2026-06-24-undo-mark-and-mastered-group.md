# 撤销标记与已掌握归组实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复两个问题——标记后无法撤销（新增弹窗标记详情视图+撤销确认）、已掌握后从复习队列消失（已掌握题归入已掌握分组置底，不再自动移出队列）。

**Architecture:** 状态层新增 CLEAR_WEAK_MARK Action + 修改 SET_MASTERY_LEVEL 移除自动移出队列逻辑；WeakDecisionDialog 新增标记详情视图模式+撤销确认弹窗；ReviewQueue 新增已掌握分组置底+计数调整。

**Tech Stack:** React 18, TypeScript, Vite, Vitest, 纯原生 CSS

**Spec:** `docs/superpowers/specs/2026-06-24-undo-mark-and-mastered-group-design.md`

---

## 文件结构

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/hooks/useAppState.tsx` | 新增 CLEAR_WEAK_MARK Action + reducer；修改 SET_MASTERY_LEVEL 移除自动移出队列 |
| `src/components/WeakDecisionDialog.tsx` | 新增标记详情视图模式 + 撤销确认弹窗 |
| `src/components/ReviewQueue.tsx` | 新增已掌握分组置底 + 计数调整 + 按钮文案调整 |
| `src/styles.css` | 新增已掌握分组样式 + 撤销确认弹窗样式 |

---

## Task 1: 状态层——新增 CLEAR_WEAK_MARK + 修改 SET_MASTERY_LEVEL

**Files:**
- Modify: `src/hooks/useAppState.tsx`

- [ ] **Step 1: 在 Action 联合类型中新增 CLEAR_WEAK_MARK**

在 `src/hooks/useAppState.tsx` 第 62 行 `CLOSE_WEAK_DIALOG` 后追加：

```typescript
    | { type: 'CLOSE_WEAK_DIALOG' }
    // 清除某题所有不牢固标记，回到从未标记状态
    | { type: 'CLEAR_WEAK_MARK'; key: string }
```

- [ ] **Step 2: 修改 SET_MASTERY_LEVEL reducer，移除自动移出复习队列逻辑**

将 `src/hooks/useAppState.tsx` 中 SET_MASTERY_LEVEL 的 case（约 276-292 行）：

```typescript
        case 'SET_MASTERY_LEVEL': {
            const masteryLevel = { ...state.masteryLevel, [action.key]: action.level };
            // 同步 questionStatus.mastered（面试题）
            const questionStatus = { ...state.questionStatus };
            if (questionStatus[action.key]) {
                questionStatus[action.key] = {
                    ...questionStatus[action.key],
                    mastered: action.level === 'mastered',
                };
            }
            // 若标记为已掌握，自动从复习队列移除（统一 delete 风格保持对象干净）
            let questionReview = state.questionReview;
            if (action.level === 'mastered' && questionReview[action.key]) {
                questionReview = { ...questionReview };
                delete questionReview[action.key];
            }
            return { ...state, masteryLevel, questionStatus, questionReview };
        }
```

改为：

```typescript
        case 'SET_MASTERY_LEVEL': {
            const masteryLevel = { ...state.masteryLevel, [action.key]: action.level };
            // 同步 questionStatus.mastered（面试题）
            const questionStatus = { ...state.questionStatus };
            if (questionStatus[action.key]) {
                questionStatus[action.key] = {
                    ...questionStatus[action.key],
                    mastered: action.level === 'mastered',
                };
            }
            // 已掌握的题留在复习队列，归入"已掌握"分组置底展示（不再自动移出）
            return { ...state, masteryLevel, questionStatus };
        }
```

- [ ] **Step 3: 在 CLOSE_WEAK_DIALOG case 后新增 CLEAR_WEAK_MARK case**

在 `src/hooks/useAppState.tsx` 的 CLOSE_WEAK_DIALOG case（约 311-313 行）后、`default:` 前追加：

```typescript
        case 'CLOSE_WEAK_DIALOG': {
            return { ...state, dialogState: null };
        }
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
            delete questionReview[key];
            // 同步 questionStatus.mastered（若存在）
            const questionStatus = { ...state.questionStatus };
            if (questionStatus[key]) {
                questionStatus[key] = { ...questionStatus[key], mastered: false };
            }
            return {
                ...state,
                weakReason,
                masteryLevel,
                reviewUrgency,
                weakMeta,
                questionReview,
                questionStatus,
            };
        }
```

- [ ] **Step 4: 运行 tsc 验证类型**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: 运行单测确保无回归**

Run: `npx vitest run`
Expected: 所有现有测试通过

- [ ] **Step 6: 提交**

```bash
git add src/hooks/useAppState.tsx
git commit -m "feat: 新增 CLEAR_WEAK_MARK Action 并修复 SET_MASTERY_LEVEL 自动移出队列 bug"
```

---

## Task 2: WeakDecisionDialog 新增标记详情视图 + 撤销确认

**Files:**
- Modify: `src/components/WeakDecisionDialog.tsx`

- [ ] **Step 1: 在 WeakDecisionDialog.tsx 顶部新增常量映射**

在 `src/components/WeakDecisionDialog.tsx` 第 18 行 `URGENCY_LABEL` 常量后追加：

```typescript
const MASTERY_LABEL: Record<string, string> = {
    mastered: '已掌握',
    vague: '能讲个大概',
    clueless: '完全没思路',
    unknown: '未评估',
};

const REASON_META: Record<WeakReason, { icon: string; label: string; advice: string }> = {
    concept: { icon: '📖', label: '概念不清', advice: '重学理论：展开答案/查文档' },
    memory: { icon: '🔄', label: '记忆模糊', advice: '闪卡重复：快速过一遍关键词' },
    articulate: { icon: '🗣', label: '讲不出来', advice: '口述练习：闭眼讲一遍' },
    confuse: { icon: '🔀', label: '易混淆', advice: '对比辨析：找相似概念对比' },
    apply: { icon: '✏️', label: '不会应用', advice: '实战做题：找相关题练习' },
};
```

- [ ] **Step 2: 在组件内新增 confirmClear 状态**

在 `src/components/WeakDecisionDialog.tsx` 第 27 行 `showAnswer` 状态后追加：

```typescript
    const [showAnswer, setShowAnswer] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
```

在 useEffect 的重置逻辑（第 30-37 行）中追加 `setConfirmClear(false);`：

```typescript
    useEffect(() => {
        if (dialog?.open) {
            setIsPrerequisite('no');
            setMastery('vague');
            setReason(null);
            setShowAnswer(false);
            setConfirmClear(false);
        }
    }, [dialog?.open, dialog?.key]);
```

- [ ] **Step 3: 新增 handleClear 函数**

在 `src/components/WeakDecisionDialog.tsx` 的 `handleSubmit` 函数后（约第 70 行）追加：

```typescript
    const handleClear = () => {
        dispatch({ type: 'CLEAR_WEAK_MARK', key: dialog.key });
        dispatch({ type: 'CLOSE_WEAK_DIALOG' });
    };
```

- [ ] **Step 4: 新增标记详情视图渲染逻辑**

在 `src/components/WeakDecisionDialog.tsx` 中，找到 `if (!dialog?.open) return null;`（第 39 行），在其后、`const priority` 前插入标记详情视图判断。

将：
```typescript
    if (!dialog?.open) return null;

    const priority: QuestionPriority = dialog.priority;
```

改为：
```typescript
    if (!dialog?.open) return null;

    // 已标记：显示标记详情视图（含撤销入口）
    const existingReason = state.weakReason[dialog.key];
    if (existingReason && !showAnswer) {
        const reasonMeta = REASON_META[existingReason];
        const existingMastery = state.masteryLevel[dialog.key] ?? 'unknown';
        const existingUrgency = state.reviewUrgency[dialog.key];
        const inReview = !!state.questionReview[dialog.key];

        // 撤销确认弹窗
        if (confirmClear) {
            return (
                <div className="ed-dialog-overlay" onClick={() => setConfirmClear(false)}>
                    <div className="ed-dialog" onClick={(e) => e.stopPropagation()}>
                        <h3 className="ed-dialog-title">确认撤销标记？</h3>
                        <p className="ed-dialog-text">
                            将清除该题所有不牢固标记并移出复习队列，此操作不可恢复。
                        </p>
                        <div className="ed-dialog-actions">
                            <button
                                className="ed-dialog-btn ed-dialog-btn-secondary"
                                onClick={() => setConfirmClear(false)}
                            >
                                取消
                            </button>
                            <button
                                className="ed-dialog-btn ed-dialog-btn-primary"
                                onClick={handleClear}
                            >
                                确认撤销
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // 标记详情视图
        return (
            <div className="ed-dialog-overlay" onClick={() => dispatch({ type: 'CLOSE_WEAK_DIALOG' })}>
                <div className="ed-dialog" onClick={(e) => e.stopPropagation()}>
                    <h3 className="ed-dialog-title">这道题已标记不牢固</h3>
                    <p className="ed-dialog-text">{dialog.text}</p>

                    <div className="ed-dialog-section">
                        <div className="ed-dialog-detail-row">
                            <span className="ed-dialog-detail-label">不掌握原因：</span>
                            <span>{reasonMeta.icon} {reasonMeta.label}</span>
                        </div>
                        <div className="ed-dialog-detail-advice">
                            → 复习方式：{reasonMeta.advice}
                        </div>
                    </div>

                    <div className="ed-dialog-section">
                        <div className="ed-dialog-detail-row">
                            <span className="ed-dialog-detail-label">掌握程度：</span>
                            <span>{MASTERY_LABEL[existingMastery]}</span>
                        </div>
                        <div className="ed-dialog-detail-row">
                            <span className="ed-dialog-detail-label">复习紧迫度：</span>
                            <span>
                                {existingUrgency
                                    ? `${URGENCY_LABEL[existingUrgency]?.split('（')[0] ?? existingUrgency}`
                                    : '—（死磕，未进队列）'}
                            </span>
                        </div>
                        <div className="ed-dialog-detail-row">
                            <span className="ed-dialog-detail-label">在复习队列：</span>
                            <span>{inReview ? '是' : '否'}</span>
                        </div>
                    </div>

                    <button
                        className="ed-dialog-btn ed-dialog-btn-danger"
                        onClick={() => setConfirmClear(true)}
                    >
                        撤销标记
                    </button>
                </div>
            </div>
        );
    }

    const priority: QuestionPriority = dialog.priority;
```

- [ ] **Step 5: 运行 tsc 验证类型**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 6: 提交**

```bash
git add src/components/WeakDecisionDialog.tsx
git commit -m "feat: WeakDecisionDialog 新增标记详情视图与撤销确认"
```

---

## Task 3: ReviewQueue 新增已掌握分组置底 + 计数调整

**Files:**
- Modify: `src/components/ReviewQueue.tsx`

- [ ] **Step 1: 修改 ReviewQueue 数据收集，移除已掌握过滤**

在 `src/components/ReviewQueue.tsx` 中，将第 37-52 行的数据收集逻辑：

```typescript
    // 收集所有待复习项：questionReview[key] === true 且 masteryLevel !== 'mastered'
    const items: ReviewItem[] = Object.entries(state.questionReview)
        .filter(([_, inReview]) => inReview)
        .filter(([key]) => state.masteryLevel[key] !== 'mastered')
        .map(([key]) => {
            const meta = state.weakMeta[key];
            return {
                key,
                text: meta?.text ?? key,
                day: meta?.day ?? 0,
                reason: state.weakReason[key],
                urgency: state.reviewUrgency[key],
                mastery: state.masteryLevel[key] ?? 'unknown',
            };
        })
        .sort((a, b) => urgencyWeight(a.urgency) - urgencyWeight(b.urgency));
```

改为：

```typescript
    // 收集所有待复习项：questionReview[key] === true（含已掌握，归入已掌握分组置底）
    const items: ReviewItem[] = Object.entries(state.questionReview)
        .filter(([_, inReview]) => inReview)
        .map(([key]) => {
            const meta = state.weakMeta[key];
            return {
                key,
                text: meta?.text ?? key,
                day: meta?.day ?? 0,
                reason: state.weakReason[key],
                urgency: state.reviewUrgency[key],
                mastery: state.masteryLevel[key] ?? 'unknown',
            };
        })
        .sort((a, b) => urgencyWeight(a.urgency) - urgencyWeight(b.urgency));
```

- [ ] **Step 2: 修改分组逻辑，新增 mastered 组**

在 `src/components/ReviewQueue.tsx` 中，将第 54-59 行的分组逻辑：

```typescript
    // 按紧迫度分组
    const groups: Record<ReviewUrgency, ReviewItem[]> = {
        high: items.filter((i) => i.urgency === 'high'),
        mid: items.filter((i) => i.urgency === 'mid'),
        low: items.filter((i) => i.urgency === 'low'),
    };
```

改为：

```typescript
    // 按紧迫度分组（已掌握单独分组置底）
    const groups: Record<string, ReviewItem[]> = {
        high: items.filter((i) => i.urgency === 'high' && i.mastery !== 'mastered'),
        mid: items.filter((i) => i.urgency === 'mid' && i.mastery !== 'mastered'),
        low: items.filter((i) => i.urgency === 'low' && i.mastery !== 'mastered'),
        mastered: items.filter((i) => i.mastery === 'mastered'),
    };
```

- [ ] **Step 3: 修改计数和按钮文案**

在 `src/components/ReviewQueue.tsx` 中，将第 61 行 `const total = items.length;` 改为：

```typescript
    const total = items.length;
    const unmasteredCount = items.filter((i) => i.mastery !== 'mastered').length;
    const masteredCount = total - unmasteredCount;
```

将第 73-77 行 `handleMarkAllMastered` 函数：

```typescript
    const handleMarkAllMastered = () => {
        items.forEach((item) => {
            dispatch({ type: 'SET_MASTERY_LEVEL', key: item.key, level: 'mastered' });
        });
    };
```

改为：

```typescript
    const handleMarkAllMastered = () => {
        items
            .filter((item) => item.mastery !== 'mastered')
            .forEach((item) => {
                dispatch({ type: 'SET_MASTERY_LEVEL', key: item.key, level: 'mastered' });
            });
    };
```

- [ ] **Step 4: 修改空状态判断和标题计数**

在 `src/components/ReviewQueue.tsx` 中，将第 79 行空状态判断：

```typescript
    if (total === 0) {
```

改为：

```typescript
    if (total === 0) {
        // 保留现有空状态（total 含已掌握，若 total===0 说明真没有项）
```

将第 90 行标题：

```typescript
                <h3 className="ed-review-queue-title">🔄 复习队列（{total} 项）</h3>
                <button className="ed-review-queue-btn" onClick={handleMarkAllMastered}>
                    全部标记已掌握
                </button>
```

改为：

```typescript
                <h3 className="ed-review-queue-title">
                    🔄 复习队列（未掌握 {unmasteredCount} / 已掌握 {masteredCount}）
                </h3>
                <button className="ed-review-queue-btn" onClick={handleMarkAllMastered}>
                    将未掌握项全部标已掌握
                </button>
```

- [ ] **Step 5: 修改分组渲染，追加 mastered 组**

在 `src/components/ReviewQueue.tsx` 中，将第 96 行分组渲染：

```typescript
            {(['high', 'mid', 'low'] as ReviewUrgency[]).map((urgency) => {
                const groupItems = groups[urgency];
                if (groupItems.length === 0) return null;
                const meta = URGENCY_META[urgency as ReviewUrgency];
                return (
                    <div key={urgency} className={`ed-review-group ed-review-group--${meta.color}`}>
                        <div className="ed-review-group-header">
                            {meta.icon} {meta.label}（{groupItems.length} 项）
                        </div>
```

改为：

```typescript
            {(['high', 'mid', 'low', 'mastered'] as const).map((urgency) => {
                const groupItems = groups[urgency];
                if (groupItems.length === 0) return null;
                // 已掌握组用固定 meta，其余用 URGENCY_META
                const meta = urgency === 'mastered'
                    ? { icon: '✅', label: '已掌握', color: 'mastered' }
                    : URGENCY_META[urgency as ReviewUrgency];
                return (
                    <div key={urgency} className={`ed-review-group ed-review-group--${meta.color}`}>
                        <div className="ed-review-group-header">
                            {meta.icon} {meta.label}（{groupItems.length} 项）
                        </div>
```

- [ ] **Step 6: 运行 tsc 验证类型**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 7: 提交**

```bash
git add src/components/ReviewQueue.tsx
git commit -m "feat: ReviewQueue 新增已掌握分组置底与计数调整"
```

---

## Task 4: 补全样式

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: 在 styles.css 末尾追加标记详情视图和撤销确认样式**

在 `src/styles.css` 末尾追加：

```css
/* ===================== 标记详情视图与撤销确认 ===================== */
.ed-dialog-detail-row {
    display: flex;
    gap: 8px;
    font-size: 13px;
    color: var(--ed-ink, #1c1c1a);
    margin: 4px 0;
    line-height: 1.5;
}

.ed-dialog-detail-label {
    color: var(--ed-ink-muted, #8a8a82);
    min-width: 80px;
    flex-shrink: 0;
}

.ed-dialog-detail-advice {
    font-size: 12px;
    color: var(--ed-ink-muted, #8a8a82);
    margin: 4px 0 4px 88px;
    line-height: 1.5;
}

.ed-dialog-btn-danger {
    background: var(--ed-red, #dc2626);
    color: white;
    border-color: var(--ed-red, #dc2626);
    width: 100%;
    margin-top: 12px;
}

.ed-dialog-btn-danger:hover {
    opacity: 0.9;
}

/* ===================== 已掌握分组样式 ===================== */
.ed-review-group--mastered .ed-review-group-header {
    color: var(--ed-brand-deep, #14532d);
}
```

- [ ] **Step 2: 运行 build 验证**

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 3: 提交**

```bash
git add src/styles.css
git commit -m "style: 补全标记详情视图与已掌握分组样式"
```

---

## Task 5: 最终验证

**Files:** 无

- [ ] **Step 1: 运行 tsc + 单测 + build 全量验证**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: 全部通过

- [ ] **Step 2: 启动 dev server 手动验证**

Run: `npm run dev`

验证清单：
1. 已标记题点💡→显示标记详情视图（原因/程度/紧迫度/是否在队列）→不显示决策表单
2. 点"撤销标记"→显示确认弹窗→点取消→返回详情视图
3. 点"撤销标记"→显示确认弹窗→点确认撤销→弹窗关闭+列表项标记消失+题从复习队列移除
4. ReviewQueue 改程度为"已掌握"→题归入"已掌握"分组置底，不消失
5. 已掌握组改回 vague/clueless→回到原紧迫度分组
6. ReviewQueue 标题显示"未掌握 X / 已掌握 Y"
7. "将未掌握项全部标已掌握"按钮只作用于未掌握项
8. 刷新页面→撤销后的标记确实清除（IndexedDB 持久化）

- [ ] **Step 3: 提交最终状态（如有改动）**

若手动验证发现需微调，修复后提交。否则此步跳过。

---

## 自我审查

**1. Spec 覆盖检查：**
- ✅ 撤销标记（二 2.1-2.4）→ Task 1 CLEAR_WEAK_MARK + Task 2 标记详情视图+撤销确认
- ✅ 已掌握归组（三 3.2-3.4）→ Task 1 修改 SET_MASTERY_LEVEL + Task 3 ReviewQueue 分组+计数
- ✅ 数据结构（四）→ Task 1 CLEAR_WEAK_MARK reducer
- ✅ 组件改动（五）→ Task 2 弹窗 + Task 3 队列 + Task 4 样式
- ✅ 验证标准（六）→ Task 5 手动验证清单覆盖全部

**2. 占位符扫描：** 无 TBD/TODO，每步都有完整代码。

**3. 类型一致性：**
- `CLEAR_WEAK_MARK` 在 Task 1 定义 Action + reducer，Task 2 在 handleClear 中 dispatch，一致
- `REASON_META` 在 Task 2 定义，与 ReviewQueue 中的 REASON_META 字段一致（独立定义避免跨组件依赖）
- `groups: Record<string, ReviewItem[]>` 从 `Record<ReviewUrgency, ...>` 改为 string 键以容纳 'mastered'，与 Task 3 渲染逻辑一致
- 撤销确认用 `confirmClear` 状态控制，与 useEffect 重置逻辑一致

**4. 与现有代码对齐：**
- Task 1 Step 2 的修改基于实际代码（实际用 `delete questionReview[key]` 而非设 false，spec 中写的设 false，计划按实际代码删除逻辑）
- Task 2 在 `if (!dialog?.open) return null;` 后插入详情视图判断，不影响现有 showAnswer 流程
- Task 3 分组类型从 `Record<ReviewUrgency, ...>` 改为 `Record<string, ...>` 以容纳 mastered 键
