import * as fs from 'fs';
import * as path from 'path';

// 回滚脚本：把所有 priority: 'red', source: 'both' 改回 priority: 'yellow', source: 'md'
const filePath = path.resolve(process.cwd(), 'src', 'data', 'interviewQuestions.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const beforeCount = (content.match(/priority: 'red'/g) || []).length;
content = content.replace(/priority: 'red', source: 'both'/g, "priority: 'yellow', source: 'md'");
const afterCount = (content.match(/priority: 'red'/g) || []).length;

fs.writeFileSync(filePath, content, 'utf-8');
console.log(`Rolled back: ${beforeCount} red -> ${afterCount} red`);
