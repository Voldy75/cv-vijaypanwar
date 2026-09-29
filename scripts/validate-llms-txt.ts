/**
 * Build-time validation: checks that llms.txt stays in sync with the site's content (src/content.json, src/about-i18n.ts).
 *
 * Defines "proof points" — key terms/phrases that MUST appear in llms.txt
 * because they represent real content from the website. When the content adds
 * new sections or projects, add matching proof points here so the check
 * catches the drift on next build.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.app.json scripts/validate-llms-txt.ts
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// Proof points: key terms that MUST appear in llms.txt
// Grouped by source section for readable error messages.
// ---------------------------------------------------------------------------

interface ProofPoint {
  /** Where this content lives in the codebase */
  source: string
  /** Terms that must ALL appear in llms.txt (case-insensitive) */
  terms: string[]
}

const PROOF_POINTS: ProofPoint[] = [
  // -- Projects (content.json → projects) --
  {
    source: 'content.json → projects → Local RAG System',
    terms: ['Local RAG System', 'vector embeddings', 'semantic search'],
  },
  {
    source: 'content.json → projects → Data Dashboard',
    terms: ['Data Dashboard'],
  },
  {
    source: 'content.json → projects → Create Shop Crave',
    terms: ['Create, Shop & Crave'],
  },

  // -- Experience (content.json → roles) --
  {
    source: 'content.json → roles → Zrika',
    terms: ['Zrika', 'payment infrastructure'],
  },
  {
    source: 'content.json → roles → NPCI',
    terms: ['NPCI', 'UPI Lite', '350M'],
  },
  {
    source: 'content.json → roles → Rapipay',
    terms: ['Rapipay', 'merchant'],
  },
  {
    source: 'content.json → roles → ICICI',
    terms: ['ICICI'],
  },

  // -- AI/ML Skills --
  {
    source: 'about-i18n.ts → certifications → Anthropic',
    terms: ['RAG', 'multi-agent', 'LangSmith'],
  },

  // -- Education --
  {
    source: 'about-i18n.ts → education → Purdue',
    terms: ['Purdue'],
  },

  // -- Certifications --
  {
    source: 'about-i18n.ts → certifications → Product School',
    terms: ['Product School'],
  },
  {
    source: 'about-i18n.ts → certifications → Anthropic',
    terms: ['Claude Code in Action'],
  },
]

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const llmsTxtPath = resolve(root, 'public/llms.txt')
let llmsTxt: string

try {
  llmsTxt = readFileSync(llmsTxtPath, 'utf-8').toLowerCase()
} catch {
  console.error(`\n❌ public/llms.txt not found\n`)
  process.exit(1)
}

let errors = 0

for (const pp of PROOF_POINTS) {
  const missing = pp.terms.filter(t => !llmsTxt.includes(t.toLowerCase()))
  if (missing.length > 0) {
    errors++
    console.error(
      `❌ llms.txt missing content from [${pp.source}]:\n` +
      `   Missing terms: ${missing.map(t => `"${t}"`).join(', ')}\n`
    )
  }
}

if (errors > 0) {
  console.error(
    `\n🔴 llms.txt is out of sync — ${errors} section(s) have missing content.\n` +
    `   Update public/llms.txt to include the missing information,\n` +
    `   or add the proof point to scripts/validate-llms-txt.ts if intentionally omitted.\n`
  )
  process.exit(1)
} else {
  console.log('✅ llms.txt is in sync with the site content')
}
