import * as fs from 'fs';
import * as path from 'path';

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

function isSimilar(q1: string, q2: string): boolean {
  const kw1 = extractKeywords(q1);
  const kw2 = extractKeywords(q2);
  const e1 = kw1.english, e2 = kw2.english;
  const b1 = kw1.bigrams, b2 = kw2.bigrams;
  const bIntersection = b1.filter(b => b2.includes(b));
  const bShorter = Math.min(b1.length, b2.length);
  const bSimilarity = bShorter > 0 ? bIntersection.length / bShorter : 0;
  const eIntersection = e1.filter(e => e2.includes(e));
  const bothHaveEnglish = e1.length > 0 && e2.length > 0;
  const oneHasEnglish = (e1.length > 0) !== (e2.length > 0);

  if (bothHaveEnglish) {
    if (eIntersection.length >= 2) {
      if (b1.length > 0 && b2.length > 0) {
        return bIntersection.length >= 1;
      }
      const maxBigram = Math.max(b1.length, b2.length);
      return maxBigram <= 1;
    } else if (eIntersection.length === 1) {
      return bIntersection.length >= 2;
    } else {
      return bIntersection.length >= 4;
    }
  }
  if (oneHasEnglish) return false;
  return bIntersection.length >= 3 && bSimilarity >= 0.5;
}

// 读取 PDF 题目
const pdfPath = path.resolve(process.cwd(), 'src', 'data', 'pdfQuestions.json');
const pdfData = JSON.parse(fs.readFileSync(pdfPath, 'utf-8'));
const pdfQuestions: string[] = pdfData.questions.map((q: any) => q.question);

// 测试 "Spring 中 Bean 的作用域有哪些" 匹配哪些 PDF 题
const testMd = 'Spring 中 Bean 的作用域有哪些';
console.log(`Testing: "${testMd}"`);
console.log(`md keywords:`, extractKeywords(testMd));

const matchedPdf = pdfQuestions.find(pdfQ => isSimilar(testMd, pdfQ));
console.log(`Matched PDF: "${matchedPdf}"`);
if (matchedPdf) {
  console.log(`pdf keywords:`, extractKeywords(matchedPdf));
  // 详细分析
  const kw1 = extractKeywords(testMd);
  const kw2 = extractKeywords(matchedPdf);
  const eInter = kw1.english.filter(e => kw2.english.includes(e));
  const bInter = kw1.bigrams.filter(b => kw2.bigrams.includes(b));
  console.log(`eIntersection: [${eInter.join(', ')}] (${eInter.length})`);
  console.log(`bIntersection: [${bInter.join(', ')}] (${bInter.length})`);
}

// 也测试所有匹配的 PDF 题
console.log('\nAll matching PDF questions:');
for (const pdfQ of pdfQuestions) {
  if (isSimilar(testMd, pdfQ)) {
    console.log(`  - "${pdfQ}"`);
  }
}
