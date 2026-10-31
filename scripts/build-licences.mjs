#!/usr/bin/env node
/**
 * Builds licences/index.html from the app's generated licence notices.
 *
 *   node scripts/build-licences.mjs [path/to/LICENSES.txt]
 *
 * Default source: ../flowkick/assets/licenses/LICENSES.txt (the app repo next
 * to this folder). Re-run after the app regenerates LICENSES.txt
 * (`node scripts/generate-licenses.mjs` in the app repo).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(process.argv[2] ?? path.join(siteRoot, '..', 'flowkick', 'assets', 'licenses', 'LICENSES.txt'));
const target = path.join(siteRoot, 'licences', 'index.html');

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const text = fs.readFileSync(source, 'utf8').replace(/\r\n/g, '\n');
const lines = text.split('\n');

// The first line is the file's own title; the page has an <h1> instead.
if (/^FlowKick: open-source licences\s*$/.test(lines[0] ?? '')) lines.shift();

// "=====" / TITLE / "=====" banners become <h2> headings; everything else stays preformatted.
const RULE = /^={10,}$/;
const parts = [];
let buffer = [];
const flush = () => {
  const body = buffer.join('\n').replace(/^\n+|\n+$/g, '');
  if (body) parts.push(`<pre>${escape(body)}</pre>`);
  buffer = [];
};
for (let i = 0; i < lines.length; i++) {
  if (RULE.test(lines[i]) && i + 2 < lines.length && RULE.test(lines[i + 2])) {
    flush();
    const title = lines[i + 1].trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    parts.push(`<h2 id="${id}">${escape(title)}</h2>`);
    i += 2;
  } else if (/^-{10,}$/.test(lines[i])) {
    flush(); // one box per group of packages that share a licence text
  } else {
    buffer.push(lines[i]);
  }
}
flush();

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FlowKick Open-source Licences</title>
<meta name="description" content="The open-source software FlowKick uses, with its licence texts.">
<style>
  :root { color-scheme: light dark; --fg: #1a1a1a; --muted: #555; --bg: #fff; --code: #f6f6f6; --line: #ddd; --green: #16A34A; --link: #15803D; }
  @media (prefers-color-scheme: dark) { :root { --fg: #eee; --muted: #aaa; --bg: #121212; --code: #1c1c1c; --line: #333; --link: #4ADE80; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 17px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  main { max-width: 48rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
  nav { font-size: .95rem; margin-bottom: 1.5rem; }
  h1 { font-size: 1.9rem; line-height: 1.2; margin: 0 0 .5rem; }
  h2 { font-size: 1.2rem; margin: 2rem 0 .5rem; padding-top: .6rem; border-top: 4px solid var(--green); }
  a { color: var(--link); }
  a:focus-visible { outline: 3px solid var(--green); outline-offset: 2px; }
  pre { background: var(--code); border: 1px solid var(--line); border-radius: 4px; padding: .8rem; font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
</head>
<body>
<main>
  <nav><a href="../">FlowKick</a></nav>
  <h1>Open-source licences</h1>
${parts.map((p) => `  ${p}`).join('\n')}
</main>
</body>
</html>
`;

fs.writeFileSync(target, html);
console.log(`Wrote ${path.relative(siteRoot, target)} from ${source} (${lines.length} lines).`);
