import * as fs from 'fs';
import * as path from 'path';

/**
 * 匹配脚本：将 PDF 题目与 md 题目做关键词匹配
 * 匹配上的 md 题目标记为 source='both', priority='red'（双来源交集 = 必考）
 *
 * 匹配算法核心思路：
 * - 英文术语是区分技术栈的关键（JVM vs Spring vs Redis）
 * - 中文 bigram 用于验证题目语义相似度
 * - 如果两题英文术语不同，要求更高的 bigram 交集才能匹配
 */

// 单字停用词：包含这些字的 bigram 视为非技术性，过滤掉
// 这些是中文常见虚词、助词、代词等，不具备区分题目的能力
const STOP_CHARS = new Set([
  '的', '是', '了', '吗', '呢', '吧', '啊', '说', '下', '有', '无',
  '和', '与', '及', '或', '在', '对', '从', '到', '为', '被', '把',
  '让', '使', '给', '向', '以', '于', '按', '据', '跟', '同',
  '什', '么', '怎', '样', '哪', '些', '多', '少', '几', '个', '种',
  '这', '那', '它', '他', '她', '我', '你', '们', '其', '此',
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '请', '能', '可', '会', '要', '应', '该', '需', '须',
  '即', '便', '则', '而', '且', '但', '却', '只', '仅',
  '过', '着', '地', '得', '所', '之', '乃', '亦', '都', '还',
  '已', '将', '曾', '正', '刚', '才', '就', '未',
  '里', '中', '上', '下', '前', '后', '内', '外', '间', '时',
  // 疑问代词，无区分度（"如何解决X问题" 中的 "如何" 不应产生匹配）
  '如', '何',
]);

/**
 * 规范化文本：NFKC 规范化处理 CJK 兼容字符（异体字）
 * PDF 提取的文本可能包含 ⼀(U+2F00)、⽤(U+2F44) 等部首字符，
 * NFKC 会将它们转换为标准中文 一、用
 */
function normalize(s: string): string {
  return s.normalize('NFKC').toLowerCase();
}

interface Keywords {
  english: string[];  // 英文单词（去重）
  bigrams: string[];  // 中文 bigram（去重，过滤含停用字的）
}

/**
 * 提取关键词
 * 1. NFKC 规范化、转小写
 * 2. 提取英文单词（长度 > 1，去重）
 * 3. 提取中文 bigram（连续 2 个中文字符），过滤含停用字的 bigram（去重）
 */
function extractKeywords(question: string): Keywords {
  const normalized = normalize(question);
  // 去除中英文标点
  const cleaned = normalized.replace(/[？?，,。.、！!（）()【】\[\]{}「」""''：:；;]/g, ' ');

  // 提取英文单词（长度 > 1，去重）
  const englishWords = cleaned.match(/[a-z][a-z0-9]+/gi) || [];
  const englishSet = new Set(englishWords.map(w => w.toLowerCase()));

  // 提取中文 bigram：连续 2 个中文字符，过滤含停用字的
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

/**
 * 判断两个题目是否相似
 *
 * 匹配规则：
 * 1. 两方都有英文术语：
 *    a. 英文交集 >= 2：
 *       - 两方都有 bigram：要求 bigram 交集 >= 1（英文术语 + 中文验证）
 *       - 任一方无 bigram：直接匹配（纯英文术语题目）
 *    b. 英文交集 = 1：要求 bigram 交集 >= 2（单个英文术语 + 更多中文验证）
 *    c. 英文交集 = 0：要求 bigram 交集 >= 4（处理 JVM/Java 等同义术语）
 * 2. 只有一方有英文术语：不匹配（不同技术栈，避免误匹配）
 * 3. 两方都没有英文术语：要求 bigram 交集 >= 3 且 bigram 相似度 >= 50%
 */
function isSimilar(q1: string, q2: string): boolean {
  const kw1 = extractKeywords(q1);
  const kw2 = extractKeywords(q2);

  const e1 = kw1.english;
  const e2 = kw2.english;
  const b1 = kw1.bigrams;
  const b2 = kw2.bigrams;

  // 计算 bigram 交集
  const bIntersection = b1.filter(b => b2.includes(b));
  const bShorter = Math.min(b1.length, b2.length);
  const bSimilarity = bShorter > 0 ? bIntersection.length / bShorter : 0;

  // 计算英文交集
  const eIntersection = e1.filter(e => e2.includes(e));

  const bothHaveEnglish = e1.length > 0 && e2.length > 0;
  const oneHasEnglish = (e1.length > 0) !== (e2.length > 0);

  if (bothHaveEnglish) {
    if (eIntersection.length >= 2) {
      // 多个英文术语交集
      if (b1.length > 0 && b2.length > 0) {
        // 两方都有 bigram：要求至少 1 个 bigram 交集
        return bIntersection.length >= 1;
      }
      // 任一方无 bigram（纯英文题目或中文全是停用词）
      // 要求另一方 bigram <= 1，避免短英文题目匹配长中文题目
      const maxBigram = Math.max(b1.length, b2.length);
      return maxBigram <= 1;
    } else if (eIntersection.length === 1) {
      // 单个英文术语交集：要求 bigram 交集 >= 2
      return bIntersection.length >= 2;
    } else {
      // 英文无交集：要求 bigram 交集 >= 4（处理 JVM/Java 等同义术语）
      return bIntersection.length >= 4;
    }
  }

  if (oneHasEnglish) {
    // 只有一方有英文术语：不匹配（不同技术栈，避免误匹配）
    return false;
  }

  // 都没有英文术语：要求 bigram 交集 >= 3 且相似度 >= 50%
  return bIntersection.length >= 3 && bSimilarity >= 0.5;
}

async function main() {
  // 1. 读取 PDF 题目
  const pdfPath = path.resolve(process.cwd(), 'src', 'data', 'pdfQuestions.json');
  const pdfData = JSON.parse(fs.readFileSync(pdfPath, 'utf-8'));
  const pdfQuestions: string[] = pdfData.questions.map((q: { id: string; question: string }) => q.question);
  console.log(`Loaded ${pdfQuestions.length} PDF questions`);

  // 2. 读取 interviewQuestions.ts 文件文本
  const tsPath = path.resolve(process.cwd(), 'src', 'data', 'interviewQuestions.ts');
  let content = fs.readFileSync(tsPath, 'utf-8');

  // 3. 逐行处理，匹配题目行
  const lines = content.split('\n');
  let matchCount = 0;
  const matchedSamples: string[] = [];

  // 正则匹配题目行：{ id: 'xxx', question: '题目内容', priority: 'xxx', source: 'md', techStackId: 'xxx' },
  const questionLineRegex = /^(\s*\{ id: '[^']+', question: ')(.+?)(', priority: ')(yellow|green|gray|red)(', source: ')(md|pdf|both)(', techStackId: '[^']+' \},?\s*)$/;

  const newLines = lines.map(line => {
    const match = line.match(questionLineRegex);
    if (!match) return line;

    const [, prefix, question, mid1, , mid2, source, suffix] = match;

    // 检查是否与任一 PDF 题相似
    const matchedPdf = pdfQuestions.find(pdfQ => isSimilar(question, pdfQ));

    if (matchedPdf) {
      matchCount++;
      if (matchedSamples.length < 15) {
        matchedSamples.push(`  md: "${question}"\n     <-> pdf: "${matchedPdf}"`);
      }
      // 替换 priority 为 red，source 为 both
      return `${prefix}${question}${mid1}red${mid2}both${suffix}`;
    }

    return line;
  });

  // 4. 写回文件
  fs.writeFileSync(tsPath, newLines.join('\n'), 'utf-8');

  console.log(`\nMatched ${matchCount} questions (marked as source='both', priority='red')`);
  console.log('\nSample matches:');
  matchedSamples.forEach(s => console.log(s));

  // 5. 统计各技术栈匹配情况
  console.log('\nMatched questions by tech stack:');
  const stackCount: Record<string, number> = {};
  const stackRegex = /techStackId: '([^']+)'/;
  for (let i = 0; i < lines.length; i++) {
    const oldLine = lines[i];
    const newLine = newLines[i];
    if (oldLine !== newLine) {
      const stackMatch = newLine.match(stackRegex);
      const stack = stackMatch ? stackMatch[1] : 'unknown';
      stackCount[stack] = (stackCount[stack] || 0) + 1;
    }
  }
  Object.entries(stackCount).forEach(([stack, count]) => {
    console.log(`  ${stack}: ${count}`);
  });
}

main().catch((err) => {
  console.error('Failed to match questions:', err);
  process.exit(1);
});
