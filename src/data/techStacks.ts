import { PLAN } from './plan';
import { INTERVIEW_QUESTIONS } from './interviewQuestions';
import type { TechStack } from '../types';

// 20 个技术栈定义：id/name/icon/days
// days 表示该技术栈涉及的 Day 列表，用于在 TechStackView 中聚合知识点
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
  { id: 'algorithm', name: '算法', icon: '📊', days: [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 13, 16, 17, 19, 20, 23, 25, 26, 28, 29] },
  { id: 'project', name: '项目案例', icon: '💼', days: [28] },
  { id: 'system-design', name: '系统设计', icon: '🏗️', days: [27, 29] },
  { id: 'behavior', name: '行为面试', icon: '💬', days: [27] },
];

// 技术栈分组：用于侧边栏按类别组织展示
// 按学习路径分类，从语言基础到软技能，符合面试复习心智模型
export interface TechStackGroup {
  id: string;
  name: string;
  subtitle: string;
  stackIds: string[];
}

export const TECH_STACK_GROUPS: TechStackGroup[] = [
  {
    id: 'language',
    name: '语言基础',
    subtitle: 'Java 核心与 JVM',
    stackIds: ['java-basics', 'collections', 'concurrency', 'jvm', 'io-network', 'netty'],
  },
  {
    id: 'framework',
    name: '框架生态',
    subtitle: 'Spring 全家桶',
    stackIds: ['spring', 'design-patterns'],
  },
  {
    id: 'storage',
    name: '数据存储',
    subtitle: '数据库与缓存',
    stackIds: ['mysql', 'redis', 'elasticsearch'],
  },
  {
    id: 'middleware',
    name: '中间件',
    subtitle: '消息与协调',
    stackIds: ['mq', 'dubbo', 'zookeeper'],
  },
  {
    id: 'distributed',
    name: '分布式与系统',
    subtitle: '架构与设计',
    stackIds: ['distributed', 'system-design', 'docker'],
  },
  {
    id: 'practice',
    name: '实战与软技能',
    subtitle: '项目复盘与面试',
    stackIds: ['algorithm', 'project', 'behavior'],
  },
];

// 根据 id 查找技术栈
export function getTechStackById(id: string): TechStack | undefined {
  return TECH_STACKS.find((s) => s.id === id);
}

// 计算技术栈的知识点总数
// 聚合该技术栈涉及的所有 Day 的 knowledge/mustKnow/mock，加上面试题库题数
export function getTechStackPointCount(stack: TechStack): number {
  let count = 0;
  for (const day of stack.days) {
    const dayData = PLAN.days[day];
    if (!dayData) continue;
    count += dayData.knowledge?.length || 0;
    count += dayData.mustKnow?.length || 0;
    count += dayData.mock?.length || 0;
  }
  count += INTERVIEW_QUESTIONS[stack.id]?.length || 0;
  return count;
}

// 格式化 Day 范围显示：[1] → "Day 1"；[4,5,6] → "Day 4-6"；[1,5,9,16] → "Day 1,5,9,16"
export function formatDayRange(days: number[]): string {
  if (days.length === 0) return '待补充';
  if (days.length === 1) return `Day ${days[0]}`;
  // 检查是否连续
  const sorted = [...days].sort((a, b) => a - b);
  let isContinuous = true;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== 1) {
      isContinuous = false;
      break;
    }
  }
  if (isContinuous) return `Day ${sorted[0]}-${sorted[sorted.length - 1]}`;
  return `Day ${sorted.join(',')}`;
}
