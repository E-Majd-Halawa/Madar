const fs = require('fs');
const files = ['frontend/src/i18n/locales/ar.json', 'frontend/src/i18n/locales/ar.landing.json', 'frontend/src/i18n/locales/en.json', 'frontend/src/i18n/locales/en.landing.json'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.split('"secondary": "استكشف العرض التجريبي"').join('');
  content = content.split('"secondary": "Explore Demo"').join('');
  fs.writeFileSync(f, content, 'utf8');
  console.log('Updated', f);
});
