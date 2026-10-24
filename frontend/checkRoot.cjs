const fs = require('fs');
const path = require('path');

const rootDir = path.resolve('..');
console.log('Root dir files:', fs.readdirSync(rootDir));
const mdFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.md') || f === 'GEMINI.md');
mdFiles.forEach(f => {
  const p = path.join(rootDir, f);
  console.log('--- ' + f + ' ---');
  console.log(fs.readFileSync(p, 'utf8').slice(0, 1000));
});
