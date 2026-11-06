// usage : node tools/i18n/check-unwrapped.js index.html i18n.js  (à lancer après avoir ajouté du texte au jeu)
// Liste les littéraux NON entourés de T() qui contiennent un mot « typiquement français »
// (mot présent dans les clés françaises mais absent des traductions anglaises).
const fs = require('fs');
const [, , file, i18nFile] = process.argv;
const src = fs.readFileSync(file, 'utf8');
const OPEN = '<script type="module">';
const start = src.indexOf(OPEN) + OPEN.length;
const js = src.slice(start, src.indexOf('</script>', start));
const i18n = fs.readFileSync(i18nFile, 'utf8');
const body = i18n.slice(i18n.indexOf('export const I18N = ') + 'export const I18N = '.length);
const I18N = eval('(' + body.slice(0, body.lastIndexOf('}') + 1) + ')');
const words = s => (s.match(/[A-Za-zÀ-ÿ]{4,}/g) || []).map(w => w.toLowerCase());
const fr = new Set(), en = new Set();
for (const [k, v] of Object.entries(I18N)) { words(k).forEach(w => fr.add(w)); if (typeof v[0] === 'string') words(v[0]).forEach(w => en.add(w)); }
const FRONLY = new Set([...fr].filter(w => !en.has(w)));
let i = 0; const hits = [];
const lineOf = p => src.slice(0, start + p).split('\n').length;
while (i < js.length) {
  const c = js[i];
  if (c === '/' && js[i + 1] === '/') { i = js.indexOf('\n', i); continue; }
  if (c === '/' && js[i + 1] === '*') { i = js.indexOf('*/', i) + 2; continue; }
  if (c === "'" || c === '"' || c === '`') {
    let j = i + 1; while (j < js.length && js[j] !== c) { if (js[j] === '\\') j++; j++; }
    const s = js.slice(i + 1, j);
    const before = js.slice(Math.max(0, i - 2), i);
    if (before !== 'T(' && !/<(svg|path|circle|rect|g |ellipse)/.test(s)) {
      const w = words(s.replace(/\$\{[^}]*\}/g, ' ')).filter(x => FRONLY.has(x));
      if (w.length) hits.push(lineOf(i) + ': ' + s.slice(0, 110).replace(/\n/g, '⏎') + '   [' + w.join(',') + ']');
    }
    i = j + 1; continue;
  }
  i++;
}
console.log(hits.join('\n'));
console.log('total', hits.length);
