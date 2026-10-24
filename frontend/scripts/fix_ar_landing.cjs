const fs = require('fs');
let content = fs.readFileSync('frontend/src/i18n/locales/ar.landing.json', 'utf8');
content = content.replace('"rights": "© 2026 مدار. مشروع ."', '"rights": "© 2026 مدار. All rights reserved."');
fs.writeFileSync('frontend/src/i18n/locales/ar.landing.json', content, 'utf8');
console.log('Updated ar.landing.json rights');
