const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public');
const files = [
  'index.html', 'consult.html', 'services.html', 'sample.html',
  'sample-detail.html', 'guide.html',
  'assets/site.css', 'assets/site.js',
  'assets/assistant.css', 'assets/assistant.js',
  '08_材料核对与行动清单_V2样例.md'
];

fs.rmSync(output, { recursive: true, force: true });
for (const file of files) {
  const target = path.join(output, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, file), target);
}
console.log(`Static build: ${files.length} public files.`);
