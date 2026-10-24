const fs = require('fs');
let content = fs.readFileSync('frontend/src/i18n/locales/en.landing.json', 'utf8');
const idx = content.indexOf('"cta":');
console.log(content.slice(idx, idx + 300));
