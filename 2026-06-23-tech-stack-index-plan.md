# 技术栈索引 + 面试题整合 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 React Dashboard 中实现技术栈索引视图（20 个技术栈），并整合双来源面试题（md + PDF），按优先级标记，双来源交集的题扩充到每日卡片。

**Architecture:** 侧边栏 tab 切换（按时间/按技术栈），技术栈详情页聚合知识点 + 面试题库，双来源匹配确定必考题，每日卡片扩充必考题。

**Tech Stack:** React 18 + TypeScript + Vite + IndexedDB

**设计文档:** [2026-06-23-tech-stack-index-design.md](file:///c:/Users/18991/Desktop/30days/2026-06-23-tech-stack-index-design.md)

---

## 文件结构

### 新增文件

| 文件 | 职责 |
|------|------|
| `src/data/techStacks.ts` | 20 个技术栈定义（id/name/icon/days） |
| `src/data/interviewQuestions.ts` | 面试题数据（从 md + PDF 提取，按技术栈分类） |
| `src/components/TechStackView.tsx` | 技术栈详情页（知识点聚合 + 面试题库 + 优先级标记） |
| `src/utils/questionMatcher.ts` | 题目匹配工具（md ∩ PDF 交集） |
| `scripts/extract-questions.ts` | 数据预处理脚本（提取 md + PDF 面试题） |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/types/index.ts` | 新增 TechStack, InterviewQuestion, QuestionPriority 类型 |
| `src/hooks/useAppState.tsx` | 新增 sidebarView/currentTechStack/questionStatus 状态 + Action |
| `src/components/Sidebar.tsx` | 新增 tab 切换（按时间/按技术栈） |
| `src/components/DayCard.tsx` | mock 题显示优先级标记 |
| `src/App.tsx` | 集成 TechStackView |
| `src/styles.css` | 新增 tab/技术栈列表/优先级标记样式 |

---

## Phase 1: 技术栈索引基础

### Task 1: 定义技术栈类型和数据

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/data/techStacks.ts`

- [ ] **Step 1: 在 types/index.ts 新增类型定义**

在 `src/types/index.ts` 末尾新增：

```typescript
// 技术栈相关类型
export interface TechStack {
  id: string;
  name: string;
  icon: string;
  days: number[];
  questions?: InterviewQuestion[];
}

export type QuestionPriority = 'red' | 'yellow' | 'green' | 'gray';

export interface InterviewQuestion {
  id: string;
  question: string;
  answer?: string;
  priority: QuestionPriority;
  source: 'md' | 'pdf' | 'both';
  techStackId: string;
}
```

同时扩展 AppState：

```typescript
export interface AppState {
  // ... 现有字段
  sidebarView: 'time' | 'techstack';
  currentTechStack: string | null;
  questionStatus: Record<string, { mastered: boolean; priority: QuestionPriority }>;
}
```

- [ ] **Step 2: 创建 techStacks.ts**

创建 `src/data/techStacks.ts`：

```typescript
import { TechStack } from '../types';

export const TECH_STACKS: TechStack[] = [
  { id: 'java-basics', name: 'Java 基础', icon: '📘', days: [1] },
  { id: 'collections', name: '集合', icon: '📚', days: [2, 3] },
  { id: 'concurrency', name: '并发', icon: '⚡', days: [4, 5, 6] },
  { id: 'jvm', name: 'JVM', icon: '☕', days: [8, 9, 10, 11] },
  { id: 'mysql', name: 'MySQL', icon: '🗄️', days: [12, 13, 14] },
  { id: 'redis', name: 'Redis', icon: '🔴', days: [16, 17] },
  { id: 'elasticsearch', name: 'Elasticsearch', icon: '🔍', days: [18] },
  { id: 'spring', name: 'Spring 生态', icon: '🌱', days: [19, 20, 21] },
  { id: 'mq', name: 'MQ/Kafka', icon: '📨', days: [23, 24] },
  { id: 'docker', name: 'Docker', icon: '🐳', days: [25] },
  { id: 'distributed', name: '分布式', icon: '🌐', days: [26] },
  { id: 'design-patterns', name: '设计模式', icon: '🎨', days: [1, 5, 9, 16, 19, 25] },
  { id: 'io-network', name: 'IO 网络', icon: '🔌', days: [] },
  { id: 'dubbo', name: 'Dubbo', icon: '🔗', days: [] },
  { id: 'netty', name: 'Netty', icon: '📡', days: [] },
  { id: 'zookeeper', name: 'Zookeeper', icon: '🐘', days: [] },
  { id: 'algorithm', name: '算法', icon: '📊', days: [1,2,3,4,5,6,8,9,10,12,13,16,17,19,20,23,25,26,28,29] },
  { id: 'project', name: '项目案例', icon: '💼', days: [28] },
  { id: 'system-design', name: '系统设计', icon: '🏗️', days: [27, 29] },
  { id: 'behavior', name: '行为面试', icon: '💬', days: [27] },
];

export function getTechStackById(id: string): TechStack | undefined {
  return TECH_STACKS.find(s => s.id === id);
}
```

- [ ] **Step 3: 验证编译**

Run: `npm run build`
Expected: 编译通过，无 TypeScript 错误

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/data/techStacks.ts
git commit -m "feat: 定义技术栈类型和 20 个技术栈数据"
```

---

### Task 2: 扩展状态管理

**Files:**
- Modify: `src/hooks/useAppState.tsx`

- [ ] **Step 1: 新增 Action 类型**

在 `src/hooks/useAppState.tsx` 的 Action 类型中新增：

```typescript
type Action =
  // ... 现有 actions
  | { type: 'SET_SIDEBAR_VIEW'; view: 'time' | 'techstack' }
  | { type: 'SET_TECH_STACK'; stackId: string | null }
  | { type: 'TOGGLE_QUESTION_MASTERED'; questionId: string }
  | { type: 'SET_QUESTION_PRIORITY'; questionId: string; priority: QuestionPriority }
```

- [ ] **Step 2: 扩展 initialState**

在 initialState 中新增：

```typescript
const initialState: AppState = {
  // ... 现有字段
  sidebarView: 'time',
  currentTechStack: null,
  questionStatus: {},
};
```

- [ ] **Step 3: 新增 reducer case**

在 reducer 函数中新增：

```typescript
case 'SET_SIDEBAR_VIEW':
  return { ...state, sidebarView: action.view };

case 'SET_TECH_STACK':
  return { ...state, currentTechStack: action.stackId, currentView: action.stackId ? 'techstack' : state.currentView };

case 'TOGGLE_QUESTION_MASTERED': {
  const current = state.questionStatus[action.questionId] || { mastered: false, priority: 'yellow' as QuestionPriority };
  return {
    ...state,
    questionStatus: {
      ...state.questionStatus,
      [action.questionId]: { ...current, mastered: !current.mastered },
    },
  };
}

case 'SET_QUESTION_PRIORITY': {
  const current = state.questionStatus[action.questionId] || { mastered: false, priority: action.priority };
  return {
    ...state,
    questionStatus: {
      ...state.questionStatus,
      [action.questionId]: { ...current, priority: action.priority },
    },
  };
}
```

- [ ] **Step 4: 更新 LOAD_STATE 兼容**

修改 LOAD_STATE case，确保新字段有默认值：

```typescript
case 'LOAD_STATE':
  return { ...initialState, ...action.state };
```

- [ ] **Step 5: 验证编译**

Run: `npm run build`
Expected: 编译通过

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useAppState.tsx
git commit -m "feat: 扩展 state 支持技术栈视图和面试题状态"
```

---

### Task 3: Sidebar tab 切换

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: 在 Sidebar 顶部添加 tab 切换**

修改 `src/components/Sidebar.tsx`，在组件返回的顶部添加 tab 切换 UI：

```tsx
// 在 Sidebar 组件返回的最外层 div 内，最前面添加：
<div className="sidebar-tabs">
  <button
    className={`sidebar-tab ${state.sidebarView === 'time' ? 'active' : ''}`}
    onClick={() => dispatch({ type: 'SET_SIDEBAR_VIEW', view: 'time' })}
  >
    按时间
  </button>
  <button
    className={`sidebar-tab ${state.sidebarView === 'techstack' ? 'active' : ''}`}
    onClick={() => dispatch({ type: 'SET_SIDEBAR_VIEW', view: 'techstack' })}
  >
    按技术栈
  </button>
</div>
```

- [ ] **Step 2: 添加按技术栈视图的渲染逻辑**

在 Sidebar 组件中，根据 `state.sidebarView` 条件渲染：

```tsx
{state.sidebarView === 'time' ? (
  // 现有的 Week/Day 列表渲染逻辑
  <div className="sidebar-weeks">
    {/* 现有代码 */}
  </div>
) : (
  // 按技术栈视图
  <div className="sidebar-techstacks">
    {TECH_STACKS.map(stack => (
      <div
        key={stack.id}
        className={`techstack-item ${state.currentTechStack === stack.id ? 'active' : ''}`}
        onClick={() => dispatch({ type: 'SET_TECH_STACK', stackId: stack.id })}
      >
        <span className="techstack-icon">{stack.icon}</span>
        <span className="techstack-name">{stack.name}</span>
        <span className="techstack-count">({stack.days.length})</span>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 3: 在 Sidebar.tsx 顶部导入 TECH_STACKS**

```tsx
import { TECH_STACKS } from '../data/techStacks';
```

- [ ] **Step 4: 添加 tab 和技术栈列表样式**

在 `src/styles.css` 中新增：

```css
.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 12px;
}

.sidebar-tab {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #64748b;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.sidebar-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  font-weight: 600;
}

.sidebar-tab:hover {
  background: #f1f5f9;
}

.sidebar-techstacks {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.techstack-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  color: #334155;
  transition: background 0.2s;
}

.techstack-item:hover {
  background: #f1f5f9;
}

.techstack-item.active {
  background: #dbeafe;
  color: #1e40af;
  font-weight: 600;
}

.techstack-icon {
  font-size: 16px;
}

.techstack-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.techstack-count {
  font-size: 11px;
  color: #94a3b8;
  flex-shrink: 0;
}
```

- [ ] **Step 5: 验证编译 + 手动测试**

Run: `npm run build`
Expected: 编译通过

手动测试：
1. 打开浏览器 http://localhost:5173/
2. 点击"按技术栈"tab，应显示 20 个技术栈列表
3. 点击"按时间"tab，应恢复 Week/Day 列表

- [ ] **Step 6: Commit**

```bash
git add src/components/Sidebar.tsx src/styles.css
git commit -m "feat: Sidebar 实现 tab 切换（按时间/按技术栈）"
```

---

### Task 4: TechStackView 组件（基础版）

**Files:**
- Create: `src/components/TechStackView.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: 创建 TechStackView.tsx**

创建 `src/components/TechStackView.tsx`：

```tsx
import { useAppState } from '../hooks/useAppState';
import { PLAN } from '../data/plan';
import { getTechStackById } from '../data/techStacks';

export function TechStackView() {
  const { state, dispatch } = useAppState();
  const stack = state.currentTechStack ? getTechStackById(state.currentTechStack) : null;

  if (!stack) {
    return <div className="techstack-view">请选择一个技术栈</div>;
  }

  // 聚合知识点
  const knowledge: Array<{ day: number; index: number; content: string }> = [];
  const mustKnow: Array<{ day: number; index: number; content: string }> = [];
  const mock: Array<{ day: number; index: number; q: string; tips: string }> = [];

  for (const day of stack.days) {
    const dayData = PLAN.days[day];
    if (!dayData) continue;

    dayData.knowledge?.forEach((content, index) => {
      knowledge.push({ day, index, content });
    });
    dayData.mustKnow?.forEach((content, index) => {
      mustKnow.push({ day, index, content });
    });
    dayData.mock?.forEach((m, index) => {
      mock.push({ day, index, q: m.q, tips: m.tips });
    });
  }

  const toggleTask = (day: number, type: string, index: number) => {
    const key = `${day}-${type}-${index}`;
    dispatch({ type: 'TOGGLE_TASK', key });
  };

  return (
    <div className="techstack-view">
      <h2 className="techstack-title">
        <span className="techstack-title-icon">{stack.icon}</span>
        {stack.name}
      </h2>

      {knowledge.length > 0 && (
        <section className="techstack-section">
          <h3>重点知识</h3>
          {knowledge.map((item, i) => {
            const key = `${item.day}-knowledge-${item.index}`;
            return (
              <div key={i} className="content-item">
                <input
                  type="checkbox"
                  checked={state.tasks[key] || false}
                  onChange={() => toggleTask(item.day, 'knowledge', item.index)}
                />
                <span className="content-text">{item.content}</span>
                <button
                  className="day-link"
                  onClick={() => {
                    dispatch({ type: 'SET_CURRENT_DAY', day: item.day });
                    dispatch({ type: 'SET_CURRENT_VIEW', view: 'day' });
                  }}
                >
                  [Day {item.day}]
                </button>
              </div>
            );
          })}
        </section>
      )}

      {mustKnow.length > 0 && (
        <section className="techstack-section">
          <h3>必会题</h3>
          {mustKnow.map((item, i) => {
            const key = `${item.day}-mustKnow-${item.index}`;
            return (
              <div key={i} className="content-item">
                <input
                  type="checkbox"
                  checked={state.tasks[key] || false}
                  onChange={() => toggleTask(item.day, 'mustKnow', item.index)}
                />
                <span className="content-text">{item.content}</span>
                <button
                  className="day-link"
                  onClick={() => {
                    dispatch({ type: 'SET_CURRENT_DAY', day: item.day });
                    dispatch({ type: 'SET_CURRENT_VIEW', view: 'day' });
                  }}
                >
                  [Day {item.day}]
                </button>
              </div>
            );
          })}
        </section>
      )}

      {mock.length > 0 && (
        <section className="techstack-section">
          <h3>模拟题</h3>
          {mock.map((item, i) => {
            const key = `${item.day}-mock-${item.index}`;
            return (
              <div key={i} className="content-item">
                <input
                  type="checkbox"
                  checked={state.mock[key] || false}
                  onChange={() => dispatch({ type: 'TOGGLE_MOCK', key })}
                />
                <span className="content-text">{item.q}</span>
                <button
                  className="day-link"
                  onClick={() => {
                    dispatch({ type: 'SET_CURRENT_DAY', day: item.day });
                    dispatch({ type: 'SET_CURRENT_VIEW', view: 'day' });
                  }}
                >
                  [Day {item.day}]
                </button>
              </div>
            );
          })}
        </section>
      )}

      {knowledge.length === 0 && mustKnow.length === 0 && mock.length === 0 && (
        <p className="empty-hint">该技术栈暂无预置内容（面试题将在 Phase 2 添加）</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 在 App.tsx 集成 TechStackView**

修改 `src/App.tsx`，在主内容区渲染逻辑中新增 techstack 视图：

```tsx
// 在主内容区条件渲染中新增：
{state.currentView === 'techstack' && <TechStackView />}
```

并在文件顶部导入：

```tsx
import { TechStackView } from './components/TechStackView';
```

- [ ] **Step 3: 添加 TechStackView 样式**

在 `src/styles.css` 中新增：

```css
.techstack-view {
  max-width: 800px;
  margin: 0 auto;
}

.techstack-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  margin-bottom: 24px;
  color: #1e293b;
}

.techstack-title-icon {
  font-size: 28px;
}

.techstack-section {
  margin-bottom: 32px;
}

.techstack-section h3 {
  font-size: 16px;
  color: #475569;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.day-link {
  background: none;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
  color: #64748b;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.day-link:hover {
  background: #f1f5f9;
  color: #3b82f6;
  border-color: #3b82f6;
}

.empty-hint {
  color: #94a3b8;
  font-style: italic;
  text-align: center;
  padding: 40px;
}
```

- [ ] **Step 4: 验证编译 + 手动测试**

Run: `npm run build`
Expected: 编译通过

手动测试：
1. 点击"按技术栈"tab
2. 点击"并发"技术栈
3. 应显示 Day 4-6 的重点知识/必会题/模拟题聚合
4. 点击 [Day 4] 链接，应跳转到 Day 4 卡片

- [ ] **Step 5: Commit**

```bash
git add src/components/TechStackView.tsx src/App.tsx src/styles.css
git commit -m "feat: 实现 TechStackView 组件（知识点聚合 + Day 跳转）"
```

---

## Phase 2: 面试题数据提取与整合

### Task 5: 提取 md 文件面试题

**Files:**
- Create: `scripts/extract-questions.ts`
- Create: `src/data/interviewQuestions.ts`

- [ ] **Step 1: 创建数据提取脚本**

创建 `scripts/extract-questions.ts`，读取 21 个 md 文件，提取题目。

由于 md 文件格式统一（有目录索引表格），解析逻辑：
1. 读取每个 md 文件
2. 找到"目录索引"表格
3. 解析表格行，提取序号、题目、核心知识点
4. 按技术栈分类

```typescript
// scripts/extract-questions.ts
import * as fs from 'fs';
import * as path from 'path';

const MD_DIR = 'C:\\Users\\18991\\WorkBuddy\\2026-06-23-01-44-07';

const FILE_TO_STACK: Record<string, string> = {
  '05-Java基础面试题整理.md': 'java-basics',
  '06-JVM面试题整理.md': 'jvm',
  '07-Java集合容器面试题整理.md': 'collections',
  '08-Java并发编程面试题整理.md': 'concurrency',
  '09-Spring面试题整理.md': 'spring',
  '10-SpringMVC面试题整理.md': 'spring',
  '11-Mybatis面试题整理.md': 'spring',
  '12-SpringCloud面试题整理.md': 'spring',
  '13-SpringBoot面试题整理.md': 'spring',
  '14-IO网络面试题整理.md': 'io-network',
  '15-Kafka面试题整理.md': 'mq',
  '16-RabbitMQ面试题整理.md': 'mq',
  '17-MySQL面试题整理.md': 'mysql',
  '18-Dubbo面试题整理.md': 'dubbo',
  '19-Docker容器化面试题整理.md': 'docker',
  '20-Redis面试题整理.md': 'redis',
  '21-分布式面试题整理.md': 'distributed',
  '22-ElasticSearch面试题整理.md': 'elasticsearch',
  '23-Netty面试题整理.md': 'netty',
  '24-Zookeeper面试题整理.md': 'zookeeper',
  '25-数据结构与算法面试题整理.md': 'algorithm',
};

interface ExtractedQuestion {
  id: string;
  question: string;
  source: 'md';
  techStackId: string;
  fileName: string;
}

function extractQuestionsFromMd(filePath: string, techStackId: string, fileName: string): ExtractedQuestion[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const questions: ExtractedQuestion[] = [];
  
  // 匹配目录索引表格行: | 序号 | 题目 | 核心知识点 |
  const tableRegex = /\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/g;
  let match;
  let count = 0;
  
  while ((match = tableRegex.exec(content)) !== null) {
    const seq = parseInt(match[1]);
    const question = match[2].trim();
    
    // 跳过表头
    if (question === '题目' || question.includes('---')) continue;
    
    count++;
    questions.push({
      id: `${techStackId}-md-${count}`,
      question,
      source: 'md',
      techStackId,
      fileName,
    });
  }
  
  return questions;
}

function main() {
  const allQuestions: ExtractedQuestion[] = [];
  
  for (const [fileName, techStackId] of Object.entries(FILE_TO_STACK)) {
    const filePath = path.join(MD_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }
    
    const questions = extractQuestionsFromMd(filePath, techStackId, fileName);
    allQuestions.push(...questions);
    console.log(`${fileName}: ${questions.length} questions`);
  }
  
  console.log(`Total: ${allQuestions.length} questions`);
  
  // 输出到 src/data/interviewQuestions.ts
  const output = generateTypeScriptFile(allQuestions);
  fs.writeFileSync('src/data/interviewQuestions.ts', output, 'utf-8');
  console.log('Written to src/data/interviewQuestions.ts');
}

function generateTypeScriptFile(questions: ExtractedQuestion[]): string {
  const grouped: Record<string, ExtractedQuestion[]> = {};
  for (const q of questions) {
    if (!grouped[q.techStackId]) grouped[q.techStackId] = [];
    grouped[q.techStackId].push(q);
  }
  
  let output = `// 自动生成：面试题数据（从 md 文件提取）\n`;
  output += `// 生成时间：${new Date().toISOString()}\n\n`;
  output += `import { InterviewQuestion } from '../types';\n\n`;
  output += `export const INTERVIEW_QUESTIONS: Record<string, InterviewQuestion[]> = {\n`;
  
  for (const [stackId, qs] of Object.entries(grouped)) {
    output += `  '${stackId}': [\n`;
    for (const q of qs) {
      output += `    { id: '${q.id}', question: '${q.question.replace(/'/g, "\\'")}', priority: 'yellow', source: 'md', techStackId: '${stackId}' },\n`;
    }
    output += `  ],\n`;
  }
  
  output += `};\n`;
  return output;
}

main();
```

- [ ] **Step 2: 运行提取脚本**

Run: `npx tsx scripts/extract-questions.ts`
Expected: 输出每个文件的题目数，生成 `src/data/interviewQuestions.ts`

- [ ] **Step 3: 验证生成的数据文件**

Run: `npm run build`
Expected: 编译通过

- [ ] **Step 4: Commit**

```bash
git add scripts/extract-questions.ts src/data/interviewQuestions.ts
git commit -m "feat: 提取 md 文件面试题数据（21 个文件）"
```

---

### Task 6: 提取 PDF 面试题

**Files:**
- Modify: `scripts/extract-questions.ts`

- [ ] **Step 1: 安装 PDF 解析库**

Run: `npm install pdf-parse`
Expected: 安装成功

- [ ] **Step 2: 在提取脚本中新增 PDF 解析**

在 `scripts/extract-questions.ts` 中新增 PDF 解析逻辑：

```typescript
import * as pdfParse from 'pdf-parse';

const PDF_PATH = 'C:\\Users\\18991\\Downloads\\热门面试题速记通关版 _ 面试刷题 mianshiya.com.pdf';

async function extractPdfQuestions(): Promise<ExtractedQuestion[]> {
  const dataBuffer = fs.readFileSync(PDF_PATH);
  const data = await pdfParse(dataBuffer);
  const text = data.text;
  
  // PDF 文本按行分割，提取题目（通常以 ? 或 ？结尾的行）
  const lines = text.split('\n');
  const questions: ExtractedQuestion[] = [];
  let count = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    // 匹配以问号结尾的题目，或包含特定关键词的行
    if (trimmed.endsWith('?') || trimmed.endsWith('？') || trimmed.endsWith('？ ')) {
      if (trimmed.length > 5) {  // 过滤太短的行
        count++;
        questions.push({
          id: `pdf-${count}`,
          question: trimmed,
          source: 'pdf',
          techStackId: '',  // PDF 题目需要手动分类
          fileName: '热门面试题速记通关版.pdf',
        });
      }
    }
  }
  
  console.log(`PDF: ${questions.length} questions extracted`);
  return questions;
}
```

- [ ] **Step 3: 运行 PDF 提取**

修改 main 函数，同时处理 md 和 PDF：

```typescript
async function main() {
  // 提取 md 文件
  const mdQuestions = extractMdQuestions();
  
  // 提取 PDF
  const pdfQuestions = await extractPdfQuestions();
  
  // 合并并生成数据文件
  // ...
}
```

Run: `npx tsx scripts/extract-questions.ts`
Expected: 输出 md 和 PDF 的题目数

- [ ] **Step 4: Commit**

```bash
git add scripts/extract-questions.ts
git commit -m "feat: 提取 PDF 面试题数据"
```

---

### Task 7: 题目匹配工具

**Files:**
- Create: `src/utils/questionMatcher.ts`

- [ ] **Step 1: 创建题目匹配工具**

创建 `src/utils/questionMatcher.ts`：

```typescript
import { InterviewQuestion, QuestionPriority } from '../types';

/**
 * 题目匹配：md 和 PDF 的题目做关键词匹配
 * 匹配上的标记为 source: 'both'，priority: 'red'
 */
export function matchQuestions(
  mdQuestions: InterviewQuestion[],
  pdfQuestions: InterviewQuestion[]
): InterviewQuestion[] {
  const matched: InterviewQuestion[] = [];
  
  for (const mdQ of mdQuestions) {
    const matchedPdf = pdfQuestions.find(pdfQ => isSimilar(mdQ.question, pdfQ.question));
    
    if (matchedPdf) {
      matched.push({
        ...mdQ,
        source: 'both',
        priority: 'red',  // 双来源交集 = 必考
      });
    } else {
      matched.push(mdQ);
    }
  }
  
  // 添加只在 PDF 出现的题
  for (const pdfQ of pdfQuestions) {
    const matchedMd = mdQuestions.find(mdQ => isSimilar(mdQ.question, pdfQ.question));
    if (!matchedMd) {
      matched.push({
        ...pdfQ,
        source: 'pdf',
        priority: 'yellow',
      });
    }
  }
  
  return matched;
}

/**
 * 判断两个题目是否相似
 * 基于关键词匹配：提取关键词，计算相似度
 */
function isSimilar(q1: string, q2: string): boolean {
  const keywords1 = extractKeywords(q1);
  const keywords2 = extractKeywords(q2);
  
  // 计算交集
  const intersection = keywords1.filter(k => keywords2.includes(k));
  
  // 相似度 = 交集 / 较短的关键词列表长度
  const shorter = Math.min(keywords1.length, keywords2.length);
  if (shorter === 0) return false;
  
  const similarity = intersection.length / shorter;
  return similarity >= 0.5;  // 50% 相似度阈值
}

/**
 * 提取关键词
 * 去除常见停用词，保留技术术语
 */
function extractKeywords(question: string): string[] {
  const stopWords = ['的', '是', '什么', '怎么', '如何', '为什么', '哪些', '区别', '原理', '请', '说明', '描述', '简述', '谈一下', '理解'];
  
  const words = question
    .toLowerCase()
    .replace(/[？?，,。.、！!]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.includes(w));
  
  return words;
}

/**
 * 根据题目内容自动分类到技术栈
 */
export function classifyQuestion(question: string): string {
  const classifiers: Record<string, string[]> = {
    'java-basics': ['java', '面向对象', '接口', '抽象类', 'string', 'stream', 'lambda', '泛型', 'record', 'sealed'],
    'collections': ['hashmap', 'concurrentmap', 'arraylist', 'linkedlist', '集合', 'hashtable'],
    'concurrency': ['线程', '并发', 'synchronized', 'volatile', 'lock', 'cas', 'aqs', '线程池', '死锁', 'threadlocal'],
    'jvm': ['jvm', 'gc', '内存', '类加载', 'oom', '垃圾回收', '堆', '栈'],
    'mysql': ['mysql', '索引', '事务', 'mvcc', '锁', 'sql', '数据库', 'b+树'],
    'redis': ['redis', '缓存', '持久化', '哨兵', '集群', '淘汰'],
    'elasticsearch': ['es', 'elasticsearch', '倒排索引', '分词'],
    'spring': ['spring', 'ioc', 'aop', 'bean', '事务', 'mybatis', 'springboot', 'springcloud', 'springmvc'],
    'mq': ['kafka', 'rabbitmq', '消息', 'mq', '积压', 'acks'],
    'docker': ['docker', '容器', '镜像', 'compose'],
    'distributed': ['分布式', 'cap', 'base', '一致性', 'raft', 'paxos'],
    'design-patterns': ['设计模式', '单例', '工厂', '策略', '观察者', '责任链', '装饰器', '适配器'],
    'io-network': ['tcp', 'udp', 'io', 'nio', 'epoll', 'select', '网络', 'socket'],
    'dubbo': ['dubbo', 'rpc', 'spi'],
    'netty': ['netty', 'nio', 'channel', 'buffer'],
    'zookeeper': ['zookeeper', 'zk', 'zab', 'paxos', '选主'],
    'algorithm': ['算法', '链表', '树', '排序', '二分', '动态规划', 'lrucache'],
  };
  
  const lowerQ = question.toLowerCase();
  for (const [stackId, keywords] of Object.entries(classifiers)) {
    for (const kw of keywords) {
      if (lowerQ.includes(kw.toLowerCase())) {
        return stackId;
      }
    }
  }
  
  return '';  // 未分类
}
```

- [ ] **Step 2: 验证编译**

Run: `npm run build`
Expected: 编译通过

- [ ] **Step 3: Commit**

```bash
git add src/utils/questionMatcher.ts
git commit -m "feat: 实现题目匹配工具（关键词匹配 + 技术栈分类）"
```

---

### Task 8: TechStackView 扩展（面试题库 + 优先级标记）

**Files:**
- Modify: `src/components/TechStackView.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: 在 TechStackView 中新增面试题区块**

在 `src/components/TechStackView.tsx` 中导入面试题数据：

```tsx
import { INTERVIEW_QUESTIONS } from '../data/interviewQuestions';
```

在组件返回中，在 mock 区块后新增面试题区块：

```tsx
{/* 面试题库 */}
{questions && questions.length > 0 && (
  <section className="techstack-section">
    <h3>面试题库 ({questions.length} 题)</h3>
    <div className="priority-filter">
      {(['red', 'yellow', 'green', 'gray'] as QuestionPriority[]).map(p => {
        const count = questions.filter(q => getPriority(q) === p).length;
        return (
          <span key={p} className="priority-badge priority-{p}">
            {priorityLabel(p)} {count}
          </span>
        );
      })}
    </div>
    {questions.map((q, i) => {
      const status = state.questionStatus[q.id] || { mastered: false, priority: q.priority };
      return (
        <div key={i} className={`content-item question-item priority-${status.priority}`}>
          <input
            type="checkbox"
            checked={status.mastered}
            onChange={() => dispatch({ type: 'TOGGLE_QUESTION_MASTERED', questionId: q.id })}
          />
          <span className="content-text">{q.question}</span>
          <select
            className="priority-select"
            value={status.priority}
            onChange={(e) => dispatch({
              type: 'SET_QUESTION_PRIORITY',
              questionId: q.id,
              priority: e.target.value as QuestionPriority,
            })}
          >
            <option value="red">🔴 必考</option>
            <option value="yellow">🟡 常考</option>
            <option value="green">🟢 偶尔考</option>
            <option value="gray">⚪ 加分</option>
          </select>
          {q.source === 'both' && <span className="source-badge">双来源</span>}
        </div>
      );
    })}
  </section>
)}
```

- [ ] **Step 2: 添加辅助函数**

在 TechStackView 组件内或顶部添加：

```tsx
function getPriority(q: InterviewQuestion): QuestionPriority {
  return q.priority;
}

function priorityLabel(p: QuestionPriority): string {
  const labels: Record<QuestionPriority, string> = {
    red: '🔴 必考',
    yellow: '🟡 常考',
    green: '🟢 偶尔考',
    gray: '⚪ 加分',
  };
  return labels[p];
}
```

- [ ] **Step 3: 添加面试题样式**

在 `src/styles.css` 中新增：

```css
.priority-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.priority-badge.priority-red { background: #fee2e2; color: #991b1b; }
.priority-badge.priority-yellow { background: #fef3c7; color: #92400e; }
.priority-badge.priority-green { background: #d1fae5; color: #065f46; }
.priority-badge.priority-gray { background: #f1f5f9; color: #475569; }

.question-item {
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 4px;
}

.question-item.priority-red { border-left: 3px solid #ef4444; background: #fef2f2; }
.question-item.priority-yellow { border-left: 3px solid #f59e0b; background: #fffbeb; }
.question-item.priority-green { border-left: 3px solid #10b981; background: #f0fdf4; }
.question-item.priority-gray { border-left: 3px solid #94a3b8; background: #f8fafc; }

.priority-select {
  font-size: 11px;
  padding: 2px 4px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: white;
  flex-shrink: 0;
}

.source-badge {
  font-size: 10px;
  padding: 1px 6px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 8px;
  flex-shrink: 0;
}
```

- [ ] **Step 4: 验证编译 + 手动测试**

Run: `npm run build`
Expected: 编译通过

手动测试：
1. 点击"并发"技术栈
2. 应显示面试题库区块，题目带优先级颜色
3. 勾选题目标记已掌握
4. 下拉框可调整优先级

- [ ] **Step 5: Commit**

```bash
git add src/components/TechStackView.tsx src/styles.css
git commit -m "feat: TechStackView 扩展面试题库 + 优先级标记"
```

---

## Phase 3: 每日卡片扩充

### Task 9: 识别双来源交集题并扩充每日 mock

**Files:**
- Modify: `src/data/plan.ts`
- Modify: `src/components/DayCard.tsx`

- [ ] **Step 1: 生成双来源交集题列表**

在 `src/data/interviewQuestions.ts` 中新增导出：

```typescript
// 导出双来源交集题（source: 'both'），按技术栈分组
export const MUST_KNOW_QUESTIONS: Record<string, InterviewQuestion[]> = {};

// 初始化：遍历所有技术栈，提取 source='both' 的题
for (const [stackId, questions] of Object.entries(INTERVIEW_QUESTIONS)) {
  MUST_KNOW_QUESTIONS[stackId] = questions.filter(q => q.source === 'both');
}
```

- [ ] **Step 2: 在 DayCard 中显示必考题标记**

修改 `src/components/DayCard.tsx`，在 mock 题渲染中显示优先级标记：

```tsx
// 在 mock 题渲染逻辑中，检查该题是否在双来源交集里
// 如果是，显示 🔴 必考 标记
```

- [ ] **Step 3: 验证编译 + 手动测试**

Run: `npm run build`
Expected: 编译通过

- [ ] **Step 4: Commit**

```bash
git add src/data/interviewQuestions.ts src/components/DayCard.tsx
git commit -m "feat: 每日卡片显示必考题标记"
```

---

## Phase 4: 最终验证

### Task 10: 全功能验证

- [ ] **Step 1: 编译验证**

Run: `npm run build`
Expected: 编译通过，无错误

- [ ] **Step 2: 功能验证清单**

手动测试以下功能：
1. ✅ 侧边栏 tab 切换（按时间/按技术栈）
2. ✅ 按技术栈视图显示 20 个技术栈
3. ✅ 点击技术栈显示详情页（知识点聚合 + Day 跳转）
4. ✅ 面试题库显示（按优先级标记）
5. ✅ 勾选面试题标记已掌握
6. ✅ 下拉框调整优先级
7. ✅ 双来源交集题标记为 🔴 必考
8. ✅ 每日卡片显示必考题标记
9. ✅ IndexedDB 持久化（刷新不丢）
10. ✅ 增删功能在技术栈详情页正常工作

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: 技术栈索引 + 面试题整合功能完成"
```

---

## 自检

### Spec 覆盖率

| 设计文档章节 | 对应 Task |
|-------------|-----------|
| 三、技术栈分类 | Task 1 |
| 四、UI 设计 | Task 3, 4, 8 |
| 五、数据结构 | Task 1, 2 |
| 六、组件设计 | Task 3, 4, 8 |
| 七、交互流程 | Task 3, 4 |
| 九、面试题整合 | Task 5, 6, 7, 8, 9 |

### 占位符扫描

无 TBD/TODO，所有步骤包含完整代码。

### 类型一致性

- `TechStack` 在 Task 1 定义，Task 3/4 使用
- `InterviewQuestion` 在 Task 1 定义，Task 7/8 使用
- `QuestionPriority` 在 Task 1 定义，Task 2/8 使用
- `AppState` 扩展字段在 Task 2 定义，Task 3/4/8 使用
