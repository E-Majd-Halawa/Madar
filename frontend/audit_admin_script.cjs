const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'src/pages/admin'),
  path.join(__dirname, 'src/components/admin'),
  path.join(__dirname, 'src/layouts')
];

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const allFiles = [];
targetDirs.forEach(d => getFiles(d, allFiles));

// Filter to admin pages, admin components, AdminLayout.tsx
const adminFiles = allFiles.filter(f => f.includes('admin') || f.includes('AdminLayout'));

console.log('--- AUDIT FILES ---');
adminFiles.forEach(f => console.log(path.relative(__dirname, f)));

const patterns = {
  a: />\s*[A-Za-z][^<>{}]*</g,
  b: /(placeholder|title|aria-label|alt|label|description|tooltip|helperText|emptyText)=["'][A-Za-z]/g,
  c: /(label|title|header|name|description|message|text|placeholder)\s*:\s*['"][A-Za-z]/g,
  d: /(toast|alert|confirm)\w*\(\s*['"`]/g,
  e: /\b(ml|mr|pl|pr)-[0-9]|\b(left|right)-[0-9]|text-(left|right)|rounded-(l|r)\b|border-(l|r)\b/g,
  f: /\}\s*(members|projects|tasks|users|workspaces|days|ago)\b|\b(members|projects|tasks|users)\s*\//g
};

Object.entries(patterns).forEach(([key, regex]) => {
  console.log(`\n=== Pattern ${key} ===`);
  adminFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (regex.test(line)) {
        regex.lastIndex = 0; // reset
        console.log(`${path.relative(__dirname, file)}:${idx + 1}: ${line.trim()}`);
      }
    });
  });
});
