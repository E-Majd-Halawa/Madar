const fs = require('fs');
let content = fs.readFileSync('frontend/src/i18n/locales/en.landing.json', 'utf8');
content = content.replace('    "primary": "Start for Free",\n    \n  },', '    "primary": "Start for Free"\n  },');
fs.writeFileSync('frontend/src/i18n/locales/en.landing.json', content, 'utf8');
console.log('Updated en.landing.json empty');
