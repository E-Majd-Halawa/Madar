const fs = require('fs');
let content = fs.readFileSync('frontend/src/i18n/locales/ar.landing.json', 'utf8');
content = content.replace('"subtitle": "افتح مساحة العمل التجريبية بنقرة واحدة. دون حساب.",', '"subtitle": "ابدأ مع مدار اليوم.",');
fs.writeFileSync('frontend/src/i18n/locales/ar.landing.json', content, 'utf8');
console.log('Updated ar.landing.json cta');
