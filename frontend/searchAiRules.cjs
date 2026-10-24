const fs = require('fs');
const path = require('path');

function search(dir) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (p.includes('node_modules') || p.includes('.git')) return;
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      search(p);
    } else if (file.endsWith('.md')) {
      const content = fs.readFileSync(p, 'utf8');
      if (content.toLowerCase().includes('ai rules') || content.toLowerCase().includes('rule')) {
        console.log('Match in:', p);
      }
    }
  });
}

search('.');
