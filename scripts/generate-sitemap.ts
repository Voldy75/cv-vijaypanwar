/**
 * Generates dist/sitemap.xml from src/site.ts → SITE_PAGES (indexable pages only).
 *
 * Usage: npx tsx --tsconfig tsconfig.app.json scripts/generate-sitemap.ts  (runs via "npm run build")
 */

import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE_URL, SITE_PAGES } from '../src/site.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = resolve(__dirname, '..', 'dist', 'sitemap.xml')
const today = new Date().toISOString().slice(0, 10)

const urls = SITE_PAGES.filter((p) => p.indexable).map((p) => `  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <priority>${p.path === '/' ? '1.0' : '0.8'}</priority>
  </url>`)

writeFileSync(out, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`, 'utf-8')

console.log(`[sitemap] Generated ${urls.length} URLs in dist/sitemap.xml`)
