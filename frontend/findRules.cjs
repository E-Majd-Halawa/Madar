const fs = require('fs');
const path = require('path');

function findRules(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const p = path.join(dir, file);
    if (p.includes('node_modules') || p.includes('.git')) return;
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      findRules(p);
    } else if (file.endsWith('.md')) {
      const content = fs.readFileSync(p, 'utf8');
      if (content.includes('AI RULES') || content.includes('Rules') || content.includes('GEMINI')) {
        console.log('Found candidate:', p);
      }
    }
  });
}

findRules('.');
