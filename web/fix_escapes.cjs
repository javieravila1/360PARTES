const fs = require('fs');
const files = ['src/pages/Sales.tsx', 'src/pages/Purchases.tsx', 'src/pages/Dashboard.tsx'];
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\\\$/g, '$');
  content = content.replace(/\\`/g, '`');
  fs.writeFileSync(f, content, 'utf8');
}
console.log('Fixed escape characters in TSX files');
