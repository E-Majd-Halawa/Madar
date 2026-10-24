const fs = require('fs');
let content = fs.readFileSync('frontend/src/i18n/locales/ar.landing.json', 'utf8');
content = content.replace('"foundation": "",\n', '');
content = content.replace('"foundation": ""', '');
fs.writeFileSync('frontend/src/i18n/locales/ar.landing.json', content, 'utf8');
console.log('Updated ar.landing.json');
