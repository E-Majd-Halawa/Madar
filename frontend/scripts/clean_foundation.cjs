const fs = require('fs');
const files = ['frontend/src/i18n/locales/en.json', 'frontend/src/i18n/locales/ar.json', 'frontend/src/i18n/locales/en.landing.json', 'frontend/src/i18n/locales/ar.landing.json'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  // Remove foundation block in en.json and ar.json
  content = content.replace(/"foundation": \{\n[^}]*\},?\n/g, '');
  content = content.replace(/"foundation": " check",?\n/g, '');
  content = content.replace(/"rights": "© 2026 Madar. Portfolio project."/g, '"rights": "© 2026 Madar. All rights reserved."');
  content = content.replace(/"rights": "© 2026 مدار. Portfolio project."/g, '"rights": "© 2026 مدار. All rights reserved."');
  fs.writeFileSync(f, content, 'utf8');
  console.log('Updated', f);
});
