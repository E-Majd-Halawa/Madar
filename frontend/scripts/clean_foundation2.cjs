const fs = require('fs');
const files = ['frontend/src/i18n/locales/en.json', 'frontend/src/i18n/locales/ar.json'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  let out = [];
  let skip = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"foundation": {')) {
      skip = true;
      continue;
    }
    if (skip && lines[i].includes('}')) {
      skip = false;
      continue;
    }
    if (skip) continue;
    out.push(lines[i]);
  }
  fs.writeFileSync(f, out.join('\n'), 'utf8');
  console.log('Updated', f);
});
