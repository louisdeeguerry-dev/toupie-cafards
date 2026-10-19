// Prépare le dossier www/ embarqué dans les applications Android / iPhone :
// uniquement les fichiers du jeu (pas les outils de test, ni les dossiers natifs).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
const FILES = ['index.html', 'version.json', 'manifest.webmanifest', 'confidentialite.html'];
const DIRS = ['vendor', 'app-assets'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of FILES) fs.copyFileSync(path.join(root, f), path.join(out, f));
for (const d of DIRS) fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true });
console.log('www/ prêt :', fs.readdirSync(out).join(', '));
