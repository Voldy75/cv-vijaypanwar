/**
 * Post-prerender checks on dist/: every page in src/site.ts → SITE_PAGES must have
 * prerendered HTML with the right head, a vercel.json rewrite, and (if indexable) a sitemap entry.
 * Exits 1 on any error so a broken page never deploys.
 *
 * Usage: npx tsx --tsconfig tsconfig.app.json scripts/validate-prerender.ts  (runs via "npm run build")
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE_URL, SITE_PAGES } from '../src/site.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')

const errors: string[] = []
const warnings: string[] = []

const vercel = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf-8')) as { rewrites?: { source: string }[] }
const rewrites = new Set((vercel.rewrites ?? []).map((r) => r.source))
const sitemap = existsSync(resolve(dist, 'sitemap.xml')) ? readFileSync(resolve(dist, 'sitemap.xml'), 'utf-8') : ''

const meta = (html: string, re: RegExp) => html.match(re)?.[1] ?? null

for (const page of SITE_PAGES) {
  const file = page.path === '/' ? resolve(dist, 'index.html') : resolve(dist, page.path.slice(1), 'index.html')
  const at = (msg: string) => `${page.path}: ${msg}`
  if (!existsSync(file)) { errors.push(at(`missing ${file.slice(root.length + 1)}`)); continue }
  const html = readFileSync(file, 'utf-8')

  const root_ = html.match(/<div id="root">([\s\S]*)<\/div>\s*<\/body>/)?.[1] ?? ''
  if (!root_.trim()) errors.push(at('#root is empty — SSR failed'))

  const title = meta(html, /<title>([^<]*)<\/title>/)
  if (!title) errors.push(at('no <title>'))
  else if (title.length > 70) warnings.push(at(`title is ${title.length} chars (search results cut at ~60)`))

  const canonical = meta(html, /<link rel="canonical" href="([^"]*)"/)
  const expected = page.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${page.path}`
  if (canonical !== expected) errors.push(at(`canonical is ${canonical}, expected ${expected}`))

  const og = meta(html, /<meta property="og:image" content="([^"]*)"/)
  if (!og?.startsWith('https://')) errors.push(at(`og:image must be an absolute URL, got ${og}`))

  const robots = meta(html, /<meta name="robots" content="([^"]*)"/) ?? ''
  if (page.indexable === robots.includes('noindex')) errors.push(at(`robots is "${robots}" but indexable is ${page.indexable}`))

  for (const block of html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ?? []) {
    try { JSON.parse(block.replace(/<\/?script[^>]*>/g, '')) } catch { errors.push(at('JSON-LD does not parse')) }
  }
  if (/santifer|Santiago/i.test(html)) errors.push(at('still mentions santifer/Santiago'))

  if (page.path !== '/' && !rewrites.has(page.path)) errors.push(at('no rewrite in vercel.json — it will 404 in production'))
  if (page.indexable && !sitemap.includes(`<loc>${SITE_URL}${page.path}</loc>`)) errors.push(at('not in sitemap.xml'))
}

for (const w of warnings) console.warn(`  WARN  ${w}`)
for (const e of errors) console.error(`  ERROR ${e}`)
console.log(`\nPages: ${SITE_PAGES.length} | Errors: ${errors.length} | Warnings: ${warnings.length}\n`)
if (errors.length) process.exit(1)
console.log('✓ Prerender validation passed.')
