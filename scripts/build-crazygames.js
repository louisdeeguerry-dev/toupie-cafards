// Prépare la version CrazyGames du jeu : dossier crazygames/ + crazygames.zip
// Différences avec le site : SDK CrazyGames chargé (sauvegardes) et window.PLATFORM = 'crazygames'
// (le jeu masque alors les liens externes : café, partage, page confidentialité).
// usage : node scripts/build-crazygames.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const out = path.join(root, 'crazygames');
const FILES = ['index.html', 'i18n.js', 'version.json'];
const DIRS = ['vendor', 'app-assets'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of FILES) fs.copyFileSync(path.join(root, f), path.join(out, f));
for (const d of DIRS) fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true });

const indexPath = path.join(out, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const anchor = '<script type="importmap">';
if (html.split(anchor).length !== 2) throw new Error('importmap introuvable');
html = html.split(anchor).join(
  '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>\n' +
  "<script>window.PLATFORM = 'crazygames';</script>\n" + anchor);
// pas de manifeste d'appli ni d'adresse canonique vers le site
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '').replace(/<link rel="canonical"[^>]*>\n?/, '');
fs.writeFileSync(indexPath, html);

const zip = path.join(root, 'crazygames.zip');
fs.rmSync(zip, { force: true });
// tar (Windows 10+) écrit des chemins avec « / », lisibles partout (Compress-Archive met des « \ »)
// tar de Windows (pas celui de Git Bash, qui prend « C: » pour un serveur distant)
const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
execFileSync(tar, ['-a', '-c', '-f', zip, ...fs.readdirSync(out)], { cwd: out });
console.log('crazygames/ et crazygames.zip prêts');
