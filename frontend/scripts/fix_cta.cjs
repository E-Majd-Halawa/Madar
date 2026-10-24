const fs = require('fs');
let content = fs.readFileSync('frontend/src/i18n/locales/en.landing.json', 'utf8');
content = content.replace('"subtitle": "Open the demo workspace in one click. No account needed.",', '"subtitle": "Get started with Madar today.",');
fs.writeFileSync('frontend/src/i18n/locales/en.landing.json', content, 'utf8');
console.log('Updated en.landing.json cta');
