import { InterviewQuestion, QuestionPriority } from '../types';
import { INTERVIEW_QUESTIONS } from '../data/interviewQuestions';

// 中文停用词：匹配时忽略，保留技术术语
const STOP_WORDS = [
    '的', '是', '什么', '怎么', '如何', '为什么', '哪些', '区别',
    '原理', '请', '说明', '描述', '简述', '谈一下', '理解',
];

/**
 * 题目匹配：md 和 PDF 的题目做关键词匹配
 * 匹配上的标记为 source: 'both'，priority: 'red'（双来源交集 = 必考）
 * 只在 PDF 出现的题标记为 source: 'pdf'，priority: 'yellow'
 */
export function matchQuestions(
    mdQuestions: InterviewQuestion[],
    pdfQuestions: InterviewQuestion[]
): InterviewQuestion[] {
    const matched: InterviewQuestion[] = [];

    // 遍历 md 题目，命中 PDF 的标记为 both + red
    for (const mdQ of mdQuestions) {
        const matchedPdf = pdfQuestions.find(pdfQ => isSimilar(mdQ.question, pdfQ.question));

        if (matchedPdf) {
            matched.push({
                ...mdQ,
                source: 'both',
                priority: 'red',
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
 * 基于关键词匹配：提取关键词，计算交集占较短列表的比例，50% 阈值
 */
export function isSimilar(q1: string, q2: string): boolean {
    const keywords1 = extractKeywords(q1);
    const keywords2 = extractKeywords(q2);

    // 计算交集
    const intersection = keywords1.filter(k => keywords2.includes(k));

    // 相似度 = 交集 / 较短的关键词列表长度
    const shorter = Math.min(keywords1.length, keywords2.length);
    if (shorter === 0) return false;

    const similarity = intersection.length / shorter;
    return similarity >= 0.5;
}

/**
 * 提取关键词
 * 转小写、去除标点和停用词，保留长度 > 1 的词
 */
export function extractKeywords(question: string): string[] {
    const words = question
        .toLowerCase()
        .replace(/[？?，,。.、！!]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !STOP_WORDS.includes(w));

    return words;
}

/**
 * 根据题目内容自动分类到技术栈
 * 命中任一关键词即归类，未命中返回空字符串
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

    return '';
}

// 优先级展示文案，供 UI 层复用
export function priorityLabel(p: QuestionPriority): string {
    const labels: Record<QuestionPriority, string> = {
        red: '🔴 必考',
        yellow: '🟡 常考',
        green: '🟢 偶尔考',
        gray: '⚪ 加分',
    };
    return labels[p];
}

/**
 * 检查 mock 题是否在面试题库中，返回其优先级
 * @param question mock 题内容
 * @param techStackId 技术栈 ID（可选，用于缩小搜索范围）
 * @returns 优先级（如果匹配上），否则 null
 */
export function getQuestionPriority(
    question: string,
    techStackId?: string,
): QuestionPriority | null {
    // 遍历面试题库，查找匹配的题
    const stacksToSearch = techStackId
        ? [techStackId]
        : Object.keys(INTERVIEW_QUESTIONS);

    for (const stackId of stacksToSearch) {
        const questions = INTERVIEW_QUESTIONS[stackId] || [];
        for (const q of questions) {
            if (isSimilar(question, q.question)) {
                return q.priority;
            }
        }
    }

    return null;
}
