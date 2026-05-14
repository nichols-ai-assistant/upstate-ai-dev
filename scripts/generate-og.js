#!/usr/bin/env node
// generate-og.js — generate OG social card images for blog posts and pages
// Usage: node scripts/generate-og.js
// Generates images/og/<slug>.png for each blog post, plus images/og-image.png for the site

import { execSync, spawnSync } from 'child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OG_DIR = join(ROOT, 'images', 'og');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

mkdirSync(OG_DIR, { recursive: true });

// Brand
const GREEN = '#1a3a2e';
const CREAM = '#f7f4ea';
const ORANGE = '#ff6900';
const MUTED = '#4a7a5e';

function buildHtml({ title, category, isGeneric = false }) {
  if (isGeneric) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1200px;height:630px;background:${GREEN};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;flex-direction:column;justify-content:space-between;padding:60px 72px;}
.logo{font-size:36px;font-weight:800;color:${CREAM};letter-spacing:-0.5px;}
.logo span{color:${ORANGE};}
.headline{font-size:72px;font-weight:800;color:${CREAM};line-height:1.1;letter-spacing:-2px;}
.headline span{color:${ORANGE};}
.sub{font-size:20px;font-weight:500;color:${MUTED};}
</style></head><body>
<div class="logo">upst<span>a</span>te ai</div>
<div class="headline">Put <span>AI</span><br>to Work.</div>
<div class="sub">up-state-ai.com</div>
</body></html>`;
  }

  // Truncate at word boundary
  const maxChars = 72;
  let short = title;
  if (title.length > maxChars) {
    short = title.slice(0, maxChars).replace(/\s\S+$/, '') + '...';
  }
  const fontSize = short.length > 55 ? '46px' : short.length > 38 ? '54px' : '62px';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1200px;height:630px;background:${GREEN};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;position:relative;overflow:hidden;}
.top{position:absolute;top:56px;left:80px;display:flex;align-items:center;gap:14px;}
.logo{font-size:26px;font-weight:800;color:${CREAM};letter-spacing:-0.5px;}
.logo span{color:${ORANGE};}
.tag{background:${ORANGE};color:#fff;font-size:14px;font-weight:700;padding:5px 13px;border-radius:3px;letter-spacing:0.3px;}
.headline{position:absolute;top:50%;left:80px;right:80px;transform:translateY(-50%);font-size:${fontSize};font-weight:800;color:${CREAM};line-height:1.18;letter-spacing:-1.5px;}
.domain{position:absolute;bottom:56px;left:80px;font-size:18px;font-weight:500;color:${MUTED};}
</style></head><body>
<div class="top"><div class="logo">upst<span>a</span>te ai</div>${category ? `<div class="tag">${category}</div>` : ''}</div>
<div class="headline">${short}</div>
<div class="domain">up-state-ai.com</div>
</body></html>`;
}

function renderOG(html, outPath) {
  const tmp = join(os.tmpdir(), `og-${Date.now()}.html`);
  writeFileSync(tmp, html);

  spawnSync(CHROME, [
    '--headless=new',
    `--screenshot=${outPath}`,
    '--window-size=1200,630',
    '--force-device-scale-factor=1',
    '--hide-scrollbars',
    '--no-sandbox',
    '--disable-gpu',
    `file://${tmp}`
  ], { stdio: 'pipe' });

  execSync(`rm -f "${tmp}"`);
}

// --- Posts from posts.yml (simple parse) ---
const postsYml = readFileSync(join(ROOT, '_data', 'posts.yml'), 'utf8');
const posts = [];
let current = {};
for (const line of postsYml.split('\n')) {
  if (line.match(/^- title:/)) {
    if (current.url) posts.push(current);
    current = {};
  }
  const titleMatch = line.match(/title:\s*"(.+)"/);
  const urlMatch = line.match(/url:\s*"(.+)"/);
  const catMatch = line.match(/category:\s*"(.+)"/);
  if (titleMatch) current.title = titleMatch[1];
  if (urlMatch) current.url = urlMatch[1];
  if (catMatch) current.category = catMatch[1];
}
if (current.url) posts.push(current);

// Generic site OG image
console.log('Generating generic og-image.png...');
renderOG(buildHtml({ isGeneric: true }), join(ROOT, 'images', 'og-image.png'));
console.log('  done');

// Per-post OG images
for (const post of posts) {
  const slug = post.url.replace('blog/', '');
  const outPath = join(OG_DIR, `${slug}.png`);
  console.log(`Generating og/${slug}.png...`);
  renderOG(buildHtml({ title: post.title, category: post.category }), outPath);
  console.log('  done');
}

console.log(`\nGenerated ${posts.length} post images + 1 generic. Output: images/og/`);
