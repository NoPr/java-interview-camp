import * as fs from 'fs';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';

const PDF_PATH = 'C:\\Users\\18991\\Downloads\\热门面试题速记通关版 _ 面试刷题 mianshiya.com.pdf';

async function main() {
  const dataBuffer = fs.readFileSync(PDF_PATH);

  // pdf-parse v2 API：通过 data 传入 buffer
  const parser = new PDFParse({ data: dataBuffer });

  const result = await parser.getText();
  const text = result.text;

  // 获取页数信息
  const info = await parser.getInfo({ parsePageInfo: true });
  const numPages = info.total;
  await parser.destroy();

  console.log(`PDF pages: ${numPages}`);
  console.log(`Text length: ${text.length}`);

  // 提取题目：以 ? 或 ？结尾的行，或包含特定关键词的行
  const lines = text.split('\n');
  const questions: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 5) continue;

    // 匹配以问号结尾的题目
    if (trimmed.endsWith('?') || trimmed.endsWith('？')) {
      questions.push(trimmed);
      continue;
    }

    // 匹配包含"什么是"/"如何"/"为什么"/"请简述"/"谈一下"/"描述一下"的行
    if (/^(什么是|如何|为什么|请简述|谈一下|描述一下|简述|说明|列举|对比|分析)/.test(trimmed)) {
      questions.push(trimmed);
      continue;
    }
  }

  console.log(`Extracted ${questions.length} questions from PDF`);

  // 输出到文件
  const output = {
    source: 'pdf',
    fileName: '热门面试题速记通关版.pdf',
    questions: questions.map((q, i) => ({
      id: `pdf-${i + 1}`,
      question: q,
    })),
  };

  // 确保 src/data 目录存在（ESM 中使用 process.cwd() 替代 __dirname）
  const outputDir = path.resolve(process.cwd(), 'src', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.resolve(outputDir, 'pdfQuestions.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Written to ${outputPath}`);

  // 打印前 20 题作为样本
  console.log('\nSample questions:');
  questions.slice(0, 20).forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
}

main().catch((err) => {
  console.error('Failed to extract PDF:', err);
  process.exit(1);
});
