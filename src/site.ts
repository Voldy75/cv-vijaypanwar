/**
 * The one place the site's public address lives.
 * Used by the app (canonicals, titles) and by the build scripts (prerender, sitemap, IndexNow).
 * Static files carry it by hand too: index.html, public/robots.txt, public/.well-known/security.txt.
 */
export const SITE_URL = 'https://cv-vijaypanwar.vercel.app'
export const SITE_HOST = new URL(SITE_URL).host
