/**
 * Post-build script: SSR prerender using React's renderToString.
 *
 * Renders each page in src/site.ts → SITE_PAGES to static HTML, so the first paint
 * is real content and the client can hydrateRoot() onto it. The tree here must match
 * what src/main.tsx renders for the same path, or hydration fails.
 *
 * Usage: npx tsx --tsconfig tsconfig.app.json scripts/prerender.tsx  (runs via "npm run build")
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import React, { Suspense } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter, Routes, Route } from 'react-router-dom';
import Critters from 'critters';
import EditorialIndex from '../src/editorial/Index.tsx';
import Playbook from '../src/editorial/Playbook.tsx';
import GlobalNav from '../src/GlobalNav.tsx';
import AboutPage from '../src/AboutPage.tsx';
import PrivacyPolicy from '../src/PrivacyPolicy.tsx';
import { SITE_URL, SITE_HOST, SITE_PAGES, type SitePage } from '../src/site.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');
const indexPath = resolve(distDir, 'index.html');

const ELEMENTS: Record<string, React.ReactElement> = {
  '/': <EditorialIndex />,
  '/playbook': <Playbook />,
  '/about': <AboutPage lang="en" />,
  '/privacy': <PrivacyPolicy lang="en" />,
};

let template: string;
try {
  template = readFileSync(indexPath, 'utf-8');
} catch {
  console.error('Error: dist/index.html not found. Run "vite build" first.');
  process.exit(1);
}
// This script overwrites dist/index.html, so a second run would read its own output as the template.
if (!template.includes('<div id="root"></div>')) {
  console.error('Error: dist/index.html is already prerendered. Run "vite build" again first.');
  process.exit(1);
}

/** Strip React 19 SSR-injected <link> tags from inside #root to prevent hydration mismatch */
function stripReactSSRTags(html: string): string {
  return html.replace(/<link[^>]*>/g, '');
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * index.html preloads the editorial pages' fonts. The other pages render in
 * Space Grotesk + DM Sans, so give them those preloads instead.
 */
const EDITORIAL_FONT_PRELOADS = /<link rel="preload" href="\/fonts\/libre-franklin-latin\.woff2"[^>]*\/>\s*<link rel="preload" href="\/fonts\/jetbrains-mono-latin\.woff2"[^>]*\/>/;
const ARTICLE_FONT_PRELOADS = '<link rel="preload" href="/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin />\n    <link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin />';
function withArticleFonts(html: string): string {
  if (!EDITORIAL_FONT_PRELOADS.test(html)) throw new Error('[prerender] editorial font preloads not found in index.html — update EDITORIAL_FONT_PRELOADS');
  return html.replace(EDITORIAL_FONT_PRELOADS, ARTICLE_FONT_PRELOADS);
}

/** Same shape as main.tsx: GlobalNav on non-editorial pages, then PageTransition's <div>. */
function renderRoute(page: SitePage): string {
  try {
    return stripReactSSRTags(renderToString(
      <StaticRouter location={page.path}>
        {!page.editorial && <GlobalNav />}
        <div>
          <Suspense fallback={null}>
            <Routes>
              <Route path={page.path} element={ELEMENTS[page.path]} />
            </Routes>
          </Suspense>
        </div>
      </StaticRouter>
    ));
  } catch (err) {
    console.error(`[prerender] SSR failed for ${page.path}, falling back to empty root:`, err);
    return '';
  }
}

function setHead(html: string, page: SitePage): string {
  const url = page.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${page.path}`;
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace(/<meta name="title" content="[^"]*" \/>/, `<meta name="title" content="${esc(page.title)}" />`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(page.description)}" />`)
    .replace(/<meta name="robots" content="[^"]*" \/>/, `<meta name="robots" content="${page.indexable ? 'index, follow' : 'noindex, nofollow'}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(page.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(page.description)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(page.title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(page.description)}" />`);
}

function buildPage(page: SitePage): string {
  let html = setHead(template, page).replace('<div id="root"></div>', `<div id="root">${renderRoute(page)}</div>`);
  if (!page.editorial) html = withArticleFonts(html);
  // The Person/FAQ JSON-LD in index.html describes the whole site; only the home and about pages carry it.
  if (page.path !== '/' && page.path !== '/about') html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
  return html;
}

// ---------------------------------------------------------------------------
// Critical CSS inlining with Critters
// ---------------------------------------------------------------------------
const critters = new Critters({
  path: distDir,
  publicPath: '/',
  inlineFonts: false,
  preload: 'media',
  compress: true,
  reduceInlineStyles: true,
});

async function writePage(html: string, outputPath: string, label: string) {
  mkdirSync(dirname(outputPath), { recursive: true });
  try {
    writeFileSync(outputPath, await critters.process(html), 'utf-8');
    console.log(`[prerender] ${label} (with critical CSS)`);
  } catch {
    writeFileSync(outputPath, html, 'utf-8');
    console.log(`[prerender] ${label} (no critical CSS)`);
  }
}

/** Structural checks that catch the usual causes of a hydration mismatch. */
function validateHydrationStructure(html: string, label: string) {
  const rootMatch = html.match(/<div id="root">([\s\S]*)<\/div>\s*<\/body>/);
  if (!rootMatch || !rootMatch[1].trim()) {
    console.error(`[hydration-check] FAIL ${label}: #root is empty — SSR failed`);
    process.exit(1);
  }
  const content = rootMatch[1];
  if (/<link\s/.test(content)) {
    console.error(`[hydration-check] FAIL ${label}: <link> tags found inside #root — will cause hydration mismatch`);
    process.exit(1);
  }
  if (!content.includes('<div')) {
    console.error(`[hydration-check] FAIL ${label}: missing <div> wrapper (PageTransition) inside #root`);
    process.exit(1);
  }
}

for (const page of SITE_PAGES) {
  const html = buildPage(page);
  validateHydrationStructure(html, page.path);
  const out = page.path === '/' ? indexPath : resolve(distDir, page.path.slice(1), 'index.html');
  await writePage(html, out, `${page.path} → ${out.slice(distDir.length - 4)}`);
}

// ---------------------------------------------------------------------------
// 404 page — Vercel serves this with HTTP 404 status automatically
// ---------------------------------------------------------------------------
const notFoundHtml = withArticleFonts(template)
  .replace('<div id="root"></div>', `<div id="root"><div style="min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 1.5rem"><p style="font-size:6rem;font-weight:bold;color:var(--primary);margin-bottom:1rem;font-family:var(--font-display)">404</p><h1 style="font-size:1.5rem;font-weight:600;color:var(--foreground);margin-bottom:0.5rem">Page not found</h1><p style="color:var(--muted-foreground);margin-bottom:2rem;max-width:28rem">The page you're looking for doesn't exist or has been moved.</p><a href="/" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 1.5rem;border-radius:0.75rem;background:var(--primary);color:var(--primary-foreground);font-weight:500;text-decoration:none">← Back to home</a></div></div>`)
  .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="noindex, nofollow" />')
  .replace(/<title>[^<]*<\/title>/, `<title>404 — Page not found | ${SITE_HOST}</title>`)
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
writeFileSync(resolve(distDir, '404.html'), notFoundHtml, 'utf-8');
console.log('[prerender] 404 → dist/404.html');

console.log('[hydration-check] All pages pass structural validation');
console.log('[prerender] Done.');
