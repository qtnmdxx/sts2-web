// Static wiki: boots the rule layer headless (as the core tests do), extracts every category in each language and writes
// the site to packages/wiki/dist/: the pages under wiki/, public/ at the root (/ redirects to wiki/) and the assets/
// files the pages and wiki.css reference.
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as core from '@sts2/core';
import { extract } from './data';
import { LANGS, detailPage, homePage, landingPage, layout, listPage, setTextures, type Page } from './html';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const ASSETS = path.join(ROOT, 'assets');
const DIST = path.join(ROOT, 'packages/wiki/dist');
const OUT = path.join(DIST, 'wiki');
const ORIGIN = (process.env.WIKI_ORIGIN ?? 'https://sts2.moonrailgun.com').replace(/\/$/, '');
/** Fewer entries than this means the rule layer or the assets changed under the wiki: fail rather than publish a gutted site. */
const MIN: Record<string, number> = { cards: 500, relics: 250, potions: 50, powers: 200, keywords: 5, characters: 5, monsters: 90, encounters: 60, events: 50 };

const G: any = core;
const file = (rel: string) => path.join(ASSETS, rel.replace(/^localization\//, 'i18n/'));
G.$.setResourceReader((rel: string) => { const f = file(rel); return fs.existsSync(f) && fs.statSync(f).isFile() ? fs.readFileSync(f, 'utf8') : null; });
G.$.setResourceLister((dir: string) => { const d = file(dir.replace(/\/$/, '')); return fs.existsSync(d) ? fs.readdirSync(d) : []; });
G.initGame({ test: true });
setTextures(JSON.parse(fs.readFileSync(path.join(ASSETS, 'manifest.json'), 'utf8')).textures);

const pages: Page[] = [landingPage()];
const problems: string[] = [];
for (const lang of LANGS) {
  G.LocManager.Instance.SetLanguage(lang);
  const { cats, problems: p } = extract(G, lang, path.join(ASSETS, 'i18n'));
  problems.push(...p);
  for (const c of cats) if (c.items.length < (MIN[c.key] ?? 1)) throw new Error(`wiki: ${lang} ${c.key} has ${c.items.length} entries (expected at least ${MIN[c.key] ?? 1})`);
  console.log(`wiki ${lang}: ${cats.map((c) => `${c.key} ${c.items.length}`).join(', ')}`);
  pages.push(homePage(lang, cats), ...cats.flatMap((c) => [listPage(lang, c), ...c.items.map((i) => detailPage(lang, c, i))]));
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(fileURLToPath(new URL('../public', import.meta.url)), DIST, { recursive: true });
const used = new Set<string>();
const write = (file: string, text: string) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  for (const m of text.matchAll(/assets\/[^"')\s]+/g)) used.add(decodeURIComponent(m[0]));
};
for (const p of pages) write(path.join(OUT, p.path, 'index.html'), layout(p, ORIGIN));
for (const f of ['wiki.css', 'wiki.js']) write(path.join(OUT, f), fs.readFileSync(new URL(f, import.meta.url), 'utf8'));
for (const a of used) {
  fs.mkdirSync(path.dirname(path.join(DIST, a)), { recursive: true });
  fs.copyFileSync(path.join(ROOT, a), path.join(DIST, a));
}
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + pages.map((p) => `<url><loc>${ORIGIN}/wiki/${p.path}</loc></url>`).join('\n') + '\n</urlset>\n');

console.log(`wiki: ${pages.length} pages, ${used.size} assets → ${path.relative(ROOT, DIST)}`);
if (problems.length) console.log(`wiki: ${problems.length} texts fell back to their raw localization:\n  ${problems.join('\n  ')}`);
