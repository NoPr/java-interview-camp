import * as fs from 'fs';
import * as path from 'path';

const STOP_CHARS = new Set([
  '的', '是', '了', '吗', '呢', '吧', '啊', '说', '下', '有', '无',
  '和', '与', '及', '或', '在', '对', '从', '到', '为', '被', '把',
  '让', '使', '给', '向', '用', '以', '于', '按', '据', '跟', '同',
  '什', '么', '怎', '样', '哪', '些', '多', '少', '几', '个', '种',
  '这', '那', '它', '他', '她', '我', '你', '们', '其', '此',
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '请', '能', '可', '会', '要', '应', '该', '需', '须',
  '即', '便', '则', '而', '且', '但', '却', '只', '仅',
  '过', '着', '地', '得', '所', '之', '乃', '亦', '都', '还',
  '已', '将', '曾', '正', '刚', '才', '就', '未',
  '里', '中', '上', '下', '前', '后', '内', '外', '间', '时',
  '如', '何',
]);

function normalize(s: string): string {
  return s.normalize('NFKC').toLowerCase();
}

function extractKeywords(question: string) {
  const normalized = normalize(question);
  const cleaned = normalized.replace(/[？?，,。.、！!（）()【】\[\]{}「」""''：:；;]/g, ' ');
  const englishWords = cleaned.match(/[a-z][a-z0-9]+/gi) || [];
  const englishSet = new Set(englishWords.map(w => w.toLowerCase()));
  const chineseSegments = cleaned.match(/[\u4e00-\u9fff]+/g) || [];
  const bigramSet = new Set<string>();
  for (const seg of chineseSegments) {
    for (let i = 0; i < seg.length - 1; i++) {
      const bigram = seg.substring(i, i + 2);
      if (!STOP_CHARS.has(bigram[0]) && !STOP_CHARS.has(bigram[1])) {
        bigramSet.add(bigram);
      }
    }
  }
  return {
    english: Array.from(englishSet),
    bigrams: Array.from(bigramSet),
  };
}

// 测试案例
const testCases: Array<[string, string, boolean]> = [
  // [md题, pdf题, 是否应该匹配]
  ['CPU飙高系统反应慢怎么排查', '线上 CPU 飙⾼如何排查？', true],
  ['为什么阿里巴巴不建议使用Java自带的线程池', 'Java 中如何创建多线程？', false],
  ['JVM如何判断一个对象可以被回收', 'JVM 垃圾回收调优的主要⽬标是什么？', false],
  ['对 Spring IOC 和 DI 的理解', '如何理解 Spring Boot 中的 starter？', false],
  ['对 Spring Bean 的理解', '如何理解 Spring Boot 中的 starter？', false],
  ['lock和synchronized区别', 'Synchronized 和 ReentrantLock 有什么区别？', true],
  ['Spring Bean 生命周期的执行流程', '说下 Spring Bean 的⽣命周期？', true],
];

for (const [q1, q2, expected] of testCases) {
  const kw1 = extractKeywords(q1);
  const kw2 = extractKeywords(q2);
  const bIntersection = kw1.bigrams.filter(b => kw2.bigrams.includes(b));
  const eIntersection = kw1.english.filter(e => kw2.english.includes(e));
  console.log(`\nmd: "${q1}"`);
  console.log(`  english: [${kw1.english.join(', ')}]`);
  console.log(`  bigrams: [${kw1.bigrams.join(', ')}] (${kw1.bigrams.length})`);
  console.log(`pdf: "${q2}"`);
  console.log(`  english: [${kw2.english.join(', ')}]`);
  console.log(`  bigrams: [${kw2.bigrams.join(', ')}] (${kw2.bigrams.length})`);
  console.log(`eIntersection: [${eIntersection.join(', ')}] (${eIntersection.length})`);
  console.log(`bIntersection: [${bIntersection.join(', ')}] (${bIntersection.length})`);
  console.log(`expected: ${expected ? 'MATCH' : 'NO MATCH'}`);
}
