const fs = require('fs');
const path = require('path');

const adminDir = path.join('src', 'pages', 'admin');
const layoutFile = path.join('src', 'layouts', 'AdminLayout.tsx');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk(adminDir);
if (fs.existsSync(layoutFile)) files.push(layoutFile);

const regexA = />\s*[A-Za-z][^<>{}]*</g;
const regexB = /(placeholder|title|aria-label|alt|label|description|tooltip|helperText|emptyText)\s*=\s*[\"'][A-Za-z]/g;
const regexC = /(label|title|header|name|description|message|text|placeholder)\s*:\s*['\"'][A-Za-z]/g;
const regexD = /(toast|alert|confirm)\w*\s*\(\s*['\"`]/g;
const regexE = /\b(ml|mr|pl|pr)-[0-9]|\b(left|right)-[0-9]|text-(left|right)|rounded-(l|r)\b|border-(l|r)\b/g;

let totalHardcoded = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const hasTrans = content.includes('useTranslation') || content.includes('t(');
  
  const matchesA = content.match(regexA) || [];
  const matchesB = content.match(regexB) || [];
  const matchesC = content.match(regexC) || [];
  const matchesD = content.match(regexD) || [];
  const matchesE = content.match(regexE) || [];
  
  const count = matchesA.length + matchesB.length + matchesC.length + matchesD.length + matchesE.length;
  totalHardcoded += count;

  console.log(file + ' | ' + count + ' | ' + (hasTrans ? 'yes' : 'no'));
});

console.log('Total potential matches:', totalHardcoded);
