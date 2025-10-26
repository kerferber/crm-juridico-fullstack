const fs = require('fs');
const file = process.argv[2];
if (!file) {
  console.error('Usage: node wrap-esm <file>');
  process.exit(1);
}
const code = fs.readFileSync(file, 'utf8');
const wrapped = `const exports = module.exports;\nconst module = { exports, hot: { accept(){}, dispose(){} } };\n${code}\nexport default module.exports?.default ?? module.exports;\nexport const __esModule = true;\n`;
fs.writeFileSync(file.replace('.tmp.cjs', '.js'), wrapped);
fs.rmSync(file);
