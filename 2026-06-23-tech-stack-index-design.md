# 技术栈索引功能设计文档

> 状态：设计确认，待生成执行计划
> 日期：2026-06-23
> 作者：蔡光耀

## 一、背景

当前 Dashboard 采用"按时间进度"组织内容（Day 1-30 线性推进），适合面试冲刺场景。但存在一个痛点：**想查某个技术栈的知识点时，不知道在 Day 几**。比如面试前想复习"Redis 分布式锁"，得记得在 Day 17。

本设计在保持时间进度为主视图的基础上，新增"按技术栈"的索引视图，方便快速定位和复习。

## 二、设计目标

- 保持时间进度为主视图（不破坏现有功能）
- 新增技术栈索引视图，支持按技术模块筛选/查看
- 技术栈详情页聚合该技术栈的所有知识点，标注来自 Day 几
- 技术栈详情页支持勾选（复用现有 tasks state）
- 技术栈详情页支持增删（复用现有 customContent/hiddenContent 机制）

## 三、技术栈分类

基于当前 30 天内容，分为 16 个技术栈：

| 技术栈 | 对应 Day | 知识点数 | 关键词标签 |
|--------|---------|---------|-----------|
| Java 基础 | Day 1 | 8 | 面向对象, Stream, 泛型, record, sealed |
| 集合 | Day 2-3 | 10 | HashMap, ConcurrentHashMap, ArrayList |
| 并发 | Day 4-6 | 15 | volatile, synchronized, 线程池, 虚拟线程, AQS |
| JVM | Day 8-11 | 20 | 内存结构, GC, 类加载, OOM, 调优 |
| MySQL | Day 12-14 | 15 | 索引, 事务, MVCC, 锁, 慢SQL, MyBatis |
| Redis | Day 16-17 | 10 | 数据结构, 持久化, 缓存一致性, 分布式锁 |
| Elasticsearch | Day 18 | 5 | 倒排索引, 分词器, 跟 MySQL 对比, 使用场景 |
| Spring 生态 | Day 19-21 | 15 | Spring, SpringBoot, SpringCloud, 事务 |
| MQ/Kafka | Day 23-24 | 10 | Kafka, 消息可靠性, 积压, 丢失 |
| Docker | Day 25 | 5 | Docker, 镜像, 容器, Compose |
| 分布式 | Day 26 | 5 | 分布式锁, 分布式事务, CAP, BASE |
| 设计模式 | Day 1,5,9,16,19,25 | 12 | 单例, 工厂, 策略, 观察者, 责任链, 装饰器, 模板方法, 适配器 |
| 算法 | 贯穿 | 25 | 链表, 树, 滑窗, 二分, LRU, TopK |
| 项目案例 | Day 28 | 7 | OOM, 慢SQL, 缓存一致性, MQ积压, Flink |
| 系统设计 | Day 27, 29 | 5 | 短链, 秒杀, IM, 配置中心 |
| 行为面试 | Day 27 | 5 | 自我介绍, 项目亮点, 离职原因, 职业规划 |

## 四、UI 设计

### 4.1 侧边栏 tab 切换

侧边栏顶部新增两个 tab：

```
┌─ 侧边栏 ──────────────┐
│ [按时间] [按技术栈]     │  ← tab 切换
│ ─────────────────────  │
│                         │
│ （tab 切换后内容变化）   │
│                         │
└─────────────────────────┘
```

- **按时间**（默认）：显示现有的 Week/Day 列表
- **按技术栈**：显示 16 个技术栈列表，每个显示名称和知识点数

### 4.2 按技术栈视图（侧边栏）

```
┌─ 侧边栏（按技术栈）─────┐
│ [按时间] [按技术栈]     │
│ ─────────────────────  │
│                         │
│ 📘 Java 基础      (8)  │
│ 📚 集合          (10)  │
│ ⚡ 并发          (15)  │
│ ☕ JVM           (20)  │
│ 🗄️ MySQL        (15)  │
│ 🔴 Redis         (10)  │
│ 🔍 Elasticsearch   (5)  │
│ 🌱 Spring 生态   (15)  │
│ 📨 MQ/Kafka      (10)  │
│ 🐳 Docker         (5)  │
│ 🌐 分布式          (5)  │
│ 🎨 设计模式       (12)  │
│ 📊 算法          (25)  │
│ 💼 项目案例        (7)  │
│ 🏗️ 系统设计       (5)  │
│ 💬 行为面试        (5)  │
│                         │
│ ─────────────────────  │
│ 📋 路线图总览           │
└─────────────────────────┘
```

### 4.3 技术栈详情页（主内容区）

点击某个技术栈后，主内容区显示该技术栈的详情页：

```
┌─ ⚡ 并发 ────────────────────────────────────┐
│                                               │
│ 重点知识                                      │
│ ☐ volatile 可见性              [Day 4]       │
│ ☐ synchronized 锁升级          [Day 5]       │
│ ☐ 线程池 7 参数                [Day 6]       │
│ ☐ 虚拟线程                     [Day 6]       │
│                                               │
│ 必会题                                        │
│ ☐ volatile 不保证原子性？      [Day 4]       │
│ ☐ synchronized 和 Lock 区别？  [Day 5]       │
│ ☐ 线程池核心参数？             [Day 6]       │
│                                               │
│ 模拟题                                        │
│ ☐ volatile 和 synchronized？   [Day 4]       │
│ ☐ 线程池 OOM 排查？            [Day 6]       │
│                                               │
│ [+ 添加重点知识] [+ 添加必会题]                │
│ 已删除 1 项 [恢复]                            │
└───────────────────────────────────────────────┘
```

**特点**：
- 每个知识点右侧标注 `[Day X]`，点击可跳转到该 Day
- 勾选状态复用现有 `tasks` state（key 格式不变：`${day}-${type}-${index}`）
- 增删功能复用现有 `customContent`/`hiddenContent` 机制
- 知识点从各 Day 聚合，按 Day 顺序排列

## 五、数据结构

### 5.1 技术栈定义

```typescript
// src/data/techStacks.ts
export interface TechStack {
  id: string;           // 技术栈 ID（如 'concurrency'）
  name: string;         // 显示名称（如 '并发'）
  icon: string;         // emoji 图标
  days: number[];       // 涉及的 Day 列表
}

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
```

### 5.2 State 扩展

```typescript
// AppState 新增字段
interface AppState {
  // ... 现有字段
  
  sidebarView: 'time' | 'techstack';     // 侧边栏视图模式
  currentTechStack: string | null;       // 选中的技术栈 ID
}
```

### 5.3 Action 扩展

```typescript
type Action =
  // ... 现有 actions
  | { type: 'SET_SIDEBAR_VIEW'; view: 'time' | 'techstack' }
  | { type: 'SET_TECH_STACK'; stackId: string | null };
```

### 5.4 知识点聚合逻辑

技术栈详情页的数据从 plan.ts 聚合：

```typescript
function getTechStackContent(stackId: string) {
  const stack = TECH_STACKS.find(s => s.id === stackId);
  if (!stack) return null;
  
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
  
  return { knowledge, mustKnow, mock };
}
```

## 六、组件设计

### 6.1 新增组件

| 组件 | 职责 |
|------|------|
| `TechStackView.tsx` | 技术栈详情页，聚合知识点 + 勾选 + 增删 + Day 跳转 |

### 6.2 修改组件

| 组件 | 修改内容 |
|------|---------|
| `Sidebar.tsx` | 新增 tab 切换，按技术栈视图时显示技术栈列表 |
| `App.tsx` | 主内容区根据 currentView 显示 DayCard/Overview/TechStackView |
| `useAppState.tsx` | 新增 sidebarView/currentTechStack 状态 + 2 个 Action |

## 七、交互流程

```
用户点击"按技术栈"tab
  → sidebarView = 'techstack'
  → 侧边栏显示技术栈列表

用户点击某个技术栈（如"并发"）
  → currentTechStack = 'concurrency'
  → currentView = 'techstack'
  → 主内容区显示 TechStackView

用户点击知识点右侧 [Day 4]
  → currentDay = 4
  → currentView = 'day'
  → 主内容区显示 DayCard

用户点击"按时间"tab
  → sidebarView = 'time'
  → 侧边栏显示 Week/Day 列表
```

## 八、与现有功能的兼容性

| 现有功能 | 兼容性 |
|---------|--------|
| 勾选状态（tasks） | ✅ 复用，key 格式不变 |
| 增删功能（customContent/hiddenContent） | ✅ 复用 |
| 档位切换（tier） | ✅ 不影响 |
| 打卡（checkins） | ✅ 不影响 |
| IndexedDB 持久化 | ✅ 新字段自动持久化 |
| 路线图总览 | ✅ 不影响 |

## 九、面试题整合

### 9.1 背景

用户有两个面试题数据源：

1. **面试题集合**（`C:\Users\18991\WorkBuddy\2026-06-23-01-44-07`）：21 个 md 文件，约 5677 行，280KB，覆盖 Java 基础到算法的全部主题，含详细答案
2. **热门面试题 PDF**（`C:\Users\18991\Downloads\热门面试题速记通关版 _ 面试刷题 mianshiya.com.pdf`）：mianshiya.com 的热门面试题速记通关版

两个数据源是独立的，需要整合到 Dashboard 中。

### 9.2 整合策略：双来源交集 + 分层 + 优先级标记

**核心逻辑**：两个独立来源都包含的题 = 真正的高频必考题

```
md 面试题集合（来源1）  ∩  PDF 热门题（来源2）  =  🔴 必考 + 放到每日卡片
        ↓                        ↓
    只在 md 出现            只在 PDF 出现
        ↓                        ↓
    🟡 常考（按频率）        🟡 常考（按频率）
```

| 层级 | 位置 | 内容 | 来源 |
|------|------|------|------|
| **每日卡片** | Day 卡片 mock | 必考题（双来源交集 + 现有 mock） | md ∩ PDF + 现有 mock |
| **技术栈详情页** | 技术栈视图 | 完整面试题库（按优先级标记） | md 文件 + PDF 文件 |

### 9.3 优先级标记

| 优先级 | 说明 | 占比 | 位置 |
|--------|------|------|------|
| 🔴 必考 | 几乎每次面试都问 | ~30% | 每日卡片 + 技术栈详情页 |
| 🟡 常考 | 经常会问 | ~40% | 技术栈详情页 |
| 🟢 偶尔考 | 偶尔会问，跟岗位相关 | ~20% | 技术栈详情页 |
| ⚪ 加分 | 很少问，答出来加分 | ~10% | 技术栈详情页 |

### 9.4 必要题判断标准

| 标准 | 说明 |
|------|------|
| **双来源交集** | md 文件和 PDF 文件都包含的题（最高优先级） |
| 频率 | 面试中出现频率高（几乎每次都问） |
| 基础性 | 是理解后续知识的基础 |
| 项目相关 | 跟用户简历项目强相关 |
| 区分度 | 能区分候选人水平 |

### 9.5 判断方式

- **双来源匹配**：md 文件和 PDF 文件做题目匹配（关键词/语义匹配），交集 = 🔴 必考
- **AI 判断**：根据面试经验 + 现有 mock 题作为基准，补充挑选必要题
- **人工标记**：用户可手动调整每道题的优先级（🔴🟡🟢⚪）

### 9.6 面试题文件与技术栈映射

| 面试题文件 | 对应技术栈 |
|-----------|-----------|
| 05-Java基础 | java-basics |
| 06-JVM | jvm |
| 07-Java集合容器 | collections |
| 08-Java并发编程 | concurrency |
| 09-Spring + 10-SpringMVC + 11-Mybatis + 12-SpringCloud + 13-SpringBoot | spring |
| 14-IO网络 | （新增技术栈 io-network） |
| 15-Kafka + 16-RabbitMQ | mq |
| 17-MySQL | mysql |
| 18-Dubbo | （新增技术栈 dubbo） |
| 19-Docker | docker |
| 20-Redis | redis |
| 21-分布式 | distributed |
| 22-ElasticSearch | elasticsearch |
| 23-Netty | （新增技术栈 netty） |
| 24-Zookeeper | （新增技术栈 zookeeper） |
| 25-数据结构与算法 | algorithm |

### 9.7 技术栈扩展（新增 4 个）

基于面试题文件，新增 4 个技术栈：

| 技术栈 | 对应文件 | 说明 |
|--------|---------|------|
| IO 网络 | 14-IO网络 | TCP/UDP/IO 模型 |
| Dubbo | 18-Dubbo | RPC 框架 |
| Netty | 23-Netty | NIO 框架 |
| Zookeeper | 24-Zookeeper | 分布式协调 |

技术栈总数从 16 个变为 **20 个**。

### 9.8 数据结构扩展

```typescript
// 面试题数据结构
export interface InterviewQuestion {
  id: string;              // 题目 ID
  question: string;        // 题目
  answer?: string;         // 答案（可选，技术栈详情页展开显示）
  priority: 'red' | 'yellow' | 'green' | 'gray';  // 优先级
  source: string;          // 来源文件
  mastered?: boolean;      // 是否已掌握（用户标记）
}

// 技术栈新增字段
export interface TechStack {
  id: string;
  name: string;
  icon: string;
  days: number[];
  questions?: InterviewQuestion[];  // 该技术栈的面试题
}
```

### 9.9 State 扩展

```typescript
// AppState 新增
questionStatus: Record<string, { mastered: boolean; priority: string }>;
// key: question.id，value: { mastered, priority }
```

## 十、不实现的功能（YAGNI）

- ❌ 技术栈之间的依赖关系图
- ❌ 技术栈完成率统计（只显示知识点数，不单独算完成率）
- ❌ 技术栈排序/搜索
- ❌ 跨技术栈的知识点关联推荐

## 十、验证标准

1. 侧边栏 tab 切换正常，两种视图都显示正确
2. 点击技术栈后，主内容区显示该技术栈的知识点聚合
3. 知识点右侧显示 [Day X]，点击可跳转
4. 勾选状态与 Day 卡片视图同步
5. 增删功能在技术栈详情页正常工作
6. IndexedDB 持久化正常（刷新不丢）
7. 编译通过，无 TypeScript 错误
