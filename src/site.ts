/**
 * The one place the site's public address and page list live.
 * Used by the app (canonicals, titles) and by the build scripts (prerender, sitemap, IndexNow, validation).
 * Static files carry the address by hand too: index.html, public/robots.txt, public/.well-known/security.txt.
 */
export const SITE_URL = 'https://cv-vijaypanwar.vercel.app'
export const SITE_HOST = new URL(SITE_URL).host

export type SitePage = {
  path: string
  title: string
  description: string
  /** false → noindex, and left out of the sitemap */
  indexable: boolean
  /** editorial pages ship their own chrome and fonts; the rest use GlobalNav + the article theme */
  editorial: boolean
}

/** Every prerendered route. A new route needs an entry here, a <Route> in main.tsx and a rewrite in vercel.json. */
export const SITE_PAGES: SitePage[] = [
  {
    path: '/',
    title: 'Vijay Panwar | Senior Product Manager · AI/ML · Payments & Fintech',
    description: 'Senior Product Manager with 8+ years scaling platforms to millions of users. Led UPI Lite at NPCI (350M+ users). Expert in AI/ML products, payment infrastructure, and 0-to-1 product development.',
    indexable: true,
    editorial: true,
  },
  {
    path: '/playbook',
    title: 'The Playbook — notes on shipping AI products | Vijay Panwar',
    description: 'A structured approach to building AI-powered products: RAG architecture, agentic systems, LLM observability, and responsible AI governance.',
    indexable: true,
    editorial: true,
  },
  {
    // experimental: noindex until it replaces the homepage
    path: '/3d',
    title: 'Vijay Panwar — 3D résumé',
    description: 'A scroll-driven 3D résumé: payments, product and applied AI, one camera stop per role.',
    indexable: false,
    editorial: true,
  },
  {
    path: '/about',
    title: 'Vijay Panwar | Senior Product Manager · AI/ML Product Leader',
    description: 'Senior Product Manager with 8+ years scaling consumer & business platforms to millions of users. Expert in 0-to-1 product development, AI/ML products, and payment systems.',
    indexable: true,
    editorial: false,
  },
  {
    path: '/privacy',
    title: `Privacy Policy | ${SITE_HOST}`,
    description: `Privacy policy for ${SITE_HOST}. How website data is collected and used.`,
    indexable: false,
    editorial: false,
  },
]
