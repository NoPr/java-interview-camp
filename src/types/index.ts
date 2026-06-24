// 模拟题目（含问题与答题要点）
export interface MockQuestion {
  q: string;
  tips: string;
}

// 单日学习数据
export interface DayData {
  title: string;
  week: number;
  isReview?: boolean;
  knowledge?: string[];
  mustKnow?: string[];
  mock?: MockQuestion[];
  card?: { title: string; keywords: string };
  algo?: { name: string; lc: string | null };
  tier5?: string[];
  tier6?: string[];
  tasks?: string[];
}

// 周数据
export interface WeekData {
  name: string;
  subtitle: string;
  days: number[];
}

// 完整计划数据
export interface PlanData {
  weeks: WeekData[];
  reviewDays: number[];
  reviewRanges: Record<number, [number, number]>;
  days: Record<number, DayData>;
}

// 学习档位
export type Tier = '3h' | '5h' | '6h';

// 内容类型：支持增删的 7 种类型（question 为技术栈详情页面试题自定义内容）
export type ContentType = 'knowledge' | 'mustKnow' | 'mock' | 'card' | 'tier5' | 'tier6' | 'question';

// 用户自定义内容条目
// knowledge/mustKnow/tier5/tier6 用 content；mock 用 q+tips；card 用 title+keywords
export interface CustomItem {
  id: string;
  content: string;
  q?: string;
  tips?: string;
  title?: string;
  keywords?: string;
}

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

// 应用全局状态
export interface AppState {
  // key: `${dayNum}-${type}-${index}`，type 为 knowledge/mustKnow/tier5/tier6/tasks
  tasks: Record<string, boolean>;
  // key: `${dayNum}-${index}`
  mock: Record<string, boolean>;
  // key: `${dayNum}`
  algo: Record<string, boolean>;
  // 打卡日期数组，格式 "2026-06-23"
  checkins: string[];
  tier: Tier;
  currentDay: number;
  currentView: 'day' | 'overview' | 'techstack';
  expandedWeeks: number[];
  // 用户自定义内容，key: `${day}-${contentType}`，value: 自定义条目数组
  customContent: Record<string, CustomItem[]>;
  // 被隐藏的预置内容索引，key: `${day}-${contentType}`，value: 预置索引数组
  hiddenContent: Record<string, number[]>;
  // 侧边栏视图模式：按时间 / 按技术栈
  sidebarView: 'time' | 'techstack';
  // 当前选中的技术栈 id（按技术栈视图下使用）
  currentTechStack: string | null;
  // 面试题状态：key 为 questionId，value 为掌握状态 + 优先级
  questionStatus: Record<string, { mastered: boolean; priority: QuestionPriority }>;
  // Editorial Hybrid 新增字段
  // 卡片评估：key 为 `${day}-${cardIndex}`，value 为 pass/fail
  cardEval: Record<string, 'pass' | 'fail'>;
  // 题目复习标记：key 为 questionId，value 为是否加入复习
  questionReview: Record<string, boolean>;
  // 模拟题要点展开状态：key 为 `${day}-${index}`，value 为是否展开
  mockTipsExpanded: Record<string, boolean>;
  // 技术栈筛选：全部 / 未掌握 / 面试高频
  techStackFilter: 'all' | 'unmastered' | 'interview';
  // 侧边栏是否展开（移动端）
  sidebarOpen: boolean;
  // 内容排序：key 为 `${day}-${contentType}`
  // 技术栈级用 `techStack-${stackId}-${type}`
  // value 为排序后的条目 id 数组（存全量顺序，含被隐藏/被过滤的条目）
  contentOrder: Record<string, string[]>;
    // ===================== 不牢固决策与复习队列 =====================
    // 不掌握原因：key 为 contentKey/questionId
    weakReason: Record<string, WeakReason>;
    // 掌握程度：key 同上
    masteryLevel: Record<string, MasteryLevel>;
    // 复习紧迫度：key 同上（仅"跳过+加入复习"的题有值）
    reviewUrgency: Record<string, ReviewUrgency>;
    // 标记元信息：key 同上，记录标记时的 day 和 text
    weakMeta: Record<string, WeakMeta>;
    // 决策弹窗状态
    dialogState: DialogState | null;
}

// ===================== 不牢固决策与复习队列 =====================

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
    day: number;   // 标记时的 currentDay
    text: string;  // 题目/知识点文本
}

// 决策弹窗状态（全局挂载，避免 prop drilling）
export interface DialogState {
    open: boolean;
    key: string;
    text: string;
    priority: QuestionPriority;
}

// 标记元信息（记录标记时的 Day 和文本，供 ReviewQueue 展示）
export interface WeakMeta {
    day: number;
    text: string;
}
