# Handoff — cv-vijaypanwar

## Goal
A fully re-branded personal portfolio site for **Vijay Panwar** (forked from Santiago Fernández de Valderrama's `cv-santiago`). "Done" means: no Santiago branding visible anywhere on the live site, all links/emails point to Vijay's accounts, the chat feature is gone, and the site builds + deploys cleanly on every push to `main`.

---

## Current State

- **Live production URL**: `https://cv-vijaypanwar.vercel.app` (last deploy: commit `13b0430`, READY)
- **GitHub repo**: `https://github.com/Voldy75/cv-vijaypanwar`
- **Branch**: `main` — clean, up to date with remote
- **Unstaged change**: `src/CareerOps.tsx` has a trivial auto-generated star-count drift (`35.8K → 36.0K`) from the build script that updates GitHub stats. This is cosmetic noise from the build pipeline and can be committed or ignored.
- **Vercel CLI auth is working** (`voldy75`).
- **Chat feature was re-added** (session 2) using Vercel AI SDK v7 + Gemini via the AI Gateway. It is deployed but returns `GatewayError: Unauthenticated` until `AI_GATEWAY_API_KEY` is set on the Vercel project. **The project currently has ZERO environment variables.**
- **Redesign is NOT started.** The Claude Design file `Redesign Directions.dc.html` (directions 2a + 3a) could not be reached — see Dead Ends.
- The site still contains **article pages and content originally written about Santiago's projects** (Jacobo repair shop, Business OS, iRepair, Programmatic SEO, Self-Healing Chatbot, Career Ops). These pages are in-scope for future content replacement but were intentionally left untouched — the user only asked for UI/branding fixes, not content rewrites.

---

## Files in Play

| File | Status |
|------|--------|
| `src/App.tsx` | Modified, working — footer CTA updated, hero pill removed, avatar alt text fixed |
| `src/main.tsx` | Modified, working — FloatingChat removed, ReactNode import restored |
| `src/PrivacyPolicy.tsx` | Modified, working — rewritten for Vijay, email updated, santifer.io removed |
| `src/articles/components.tsx` | Modified, working — author name, LinkedIn/GitHub links, copyright all updated |
| `src/AboutPage.tsx` | Modified, working — avatar alt text updated |
| `public/favicon.svg` | New, working — VP initials on teal (#0f7b87) rounded square |
| `index.html` | Modified, working — SVG favicon wired as primary `<link rel="icon" type="image/svg+xml">` |
| `src/CareerOps.tsx` | Unstaged auto-mutation from build script (stars 35.8K→36.0K) — benign, commit or ignore |

---

## Changes Made

1. **Footer CTA** (`src/App.tsx`): Added GitHub button linking to `https://github.com/Voldy75` after the LinkedIn button. Fixed LinkedIn URL from `santifer/` to `vijay-panwar-835bb13a`.
2. **Copyright** (`src/App.tsx`, `src/articles/components.tsx`): "Santiago Fernández de Valderrama" → "Vijay Panwar" in both the main footer and article footer.
3. **Article author block** (`src/articles/components.tsx`): Default `authorName`, displayed name text, avatar `alt`, LinkedIn href, GitHub href — all updated to Vijay's.
4. **Avatar alt text** (`src/App.tsx`, `src/AboutPage.tsx`): Changed from "Santiago Fernández de Valderrama" to "Vijay Panwar".
5. **FloatingChat removed** (`src/main.tsx`): Deleted lazy import of `FloatingChat`, the `ChatErrorBoundary` class, the `GlobalChat` function component, and its `<GlobalChat />` render call. The floating chat bubble no longer exists in the DOM.
6. **Hero repo stats pill removed** (`src/App.tsx`): The `<Link to="/career-ops-system">` block containing `career-ops`, 36.0K stars, 7.2K forks icons was deleted entirely.
7. **Privacy Policy** (`src/PrivacyPolicy.tsx`): Full content rewrite — removed chatbot/voice mode sections (no longer relevant), updated contact email to `vijaypanwar333@gmail.com`, domain references from `santifer.io` → `vijaypanwar.io`, `document.title` and meta description updated.
8. **Favicon** (`public/favicon.svg` + `index.html`): New SVG favicon (VP, teal background). Added `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` as the first favicon entry in `index.html`.
9. **Console easter egg** (`src/main.tsx`): Updated `hi@santifer.io` and `hola@santifer.io` → `vijaypanwar333@gmail.com`.
10. **ReactNode fix** (`src/main.tsx`): When `ChatErrorBoundary` was deleted, `ReactNode` type was accidentally removed from the React import, causing a TypeScript build error (`Cannot find name 'ReactNode'`). Fixed by adding `type ReactNode` back to the import.

---

## Dead Ends — Do Not Retry

### PR accidentally targeted upstream repo
- **Attempted**: `gh pr create` without specifying `--repo`
- **Why it seemed reasonable**: The `gh` CLI defaults to the repo detected from `git remote`
- **What happened**: The project has two remotes — `origin` (Voldy75/cv-vijaypanwar) and `upstream` (santifer/cv-santiago). `gh pr create` picked `upstream` and opened PR #5 on `santifer/cv-santiago`.
- **Fix applied**: Closed that PR and re-ran with `gh pr create --repo Voldy75/cv-vijaypanwar --base main --head fix/branding-ui-cleanup`. Always pass `--repo` explicitly on this project.

### Vercel GitHub integration does not auto-deploy
- **Attempted**: Relied on GitHub push to `main` triggering a Vercel production build
- **What happened**: After the PR merged to `main`, no new Vercel deployment appeared. The integration is either not connected or not configured for the `Voldy75` fork.
- **Fix applied**: Run `vercel --prod --yes` directly from the CLI to deploy.
- **Note**: Vercel CLI token is now expired. Run `vercel login` first.

---

## Key Decisions & Assumptions

- **Article content left as-is**: Pages like `/career-ops-system`, `/ai-agent-jacobo`, `/programmatic-seo`, etc. still reference Santiago's projects, repos, and events. This was a deliberate scope decision — user only asked for branding/UI fixes. These pages will need separate content passes if Vijay wants them to reflect his own work.
- **`santifer/career-ops` repo badge in CareerOps.tsx** (`src/CareerOps.tsx` line 110): Still points to `santifer/career-ops`. Not changed because the article content itself is about that repo — changing just the badge without rewriting the article would be inconsistent.
- **Favicon: SVG only added, old PNGs kept**: `favicon.ico`, `favicon-32x32.png`, `favicon-16x16.png`, `apple-touch-icon.png` are still the old ones. Browsers that support SVG favicons (all modern browsers) will use the new VP SVG. Older browsers fall back to the old icon. This is acceptable until proper PNG assets are generated.
- **`src/FloatingChat.tsx` file still exists on disk** — only the import and render were removed from `main.tsx`. The file itself was not deleted. It is dead code but does not affect the build.
- **Email used throughout**: `vijaypanwar333@gmail.com` (from `src/i18n.ts` line 16). This is what was already in i18n — used consistently for privacy page and console easter egg.
- **LinkedIn URL**: `https://linkedin.com/in/vijay-panwar-835bb13a` (from `src/i18n.ts` line 467).

---

## Next Steps

1. **Re-authenticate Vercel CLI** (token expired):
   ```
   vercel login
   ```

2. **Commit the CareerOps.tsx drift** (optional but clean):
   ```
   git add src/CareerOps.tsx && git commit -m "chore: sync career-ops star count from build script"
   git push origin main
   vercel --prod --yes
   ```

3. **Delete the dead FloatingChat file**:
   ```
   rm /Users/vijaypanwar/Projects/cv-vijaypanwar/src/FloatingChat.tsx
   # Also check: src/useVoiceMode.ts, src/chatbot-i18n.ts — both exist only to support the chat. Safe to delete if confirmed unused.
   grep -r "FloatingChat\|useVoiceMode\|chatbot-i18n" src/ --include="*.tsx" --include="*.ts"
   ```

4. **Generate proper PNG favicons from the SVG** (for Apple touch icon + legacy browsers):
   - Use `src/favicon.svg` as the source
   - Generate 16×16, 32×32, 180×180 PNGs and replace the stale ones in `public/`

5. **Fix Vercel GitHub auto-deploy** (if desired):
   - Go to `https://vercel.com/vijay-panwars-projects/cv-vijaypanwar/settings/git`
   - Confirm the connected branch is `main` on `Voldy75/cv-vijaypanwar` (not the upstream)
   - Currently every deploy requires a manual `vercel --prod --yes`

6. **Replace article content** (future scope, not started):
   - Pages `/career-ops-system`, `/ai-agent-jacobo`, `/business-os-for-airtable`, `/programmatic-seo`, `/self-healing-chatbot`, `/n8n-for-pms` are still Santiago's projects
   - `src/CareerOps.tsx`, `src/JacoboAgent.tsx`, `src/BusinessOS.tsx`, `src/ProgrammaticSeo.tsx`, `src/SelfHealingChatbot.tsx`, `src/N8nForPMs.tsx` need full content rewrites to reflect Vijay's own work

---

## Open Questions

- Does Vijay want the article pages replaced with his own case studies, or removed entirely?
- Should `src/FloatingChat.tsx`, `src/useVoiceMode.ts`, and `src/chatbot-i18n.ts` be deleted (they are dead code)?
- What domain will the site use in production? Currently `cv-vijaypanwar.vercel.app`. The privacy page canonical is hardcoded to `vijaypanwar.io` — if that domain isn't owned/configured, the canonical will be wrong.
- The `upstream` remote points to `santifer/cv-santiago`. Should it be removed to avoid future `gh` CLI confusion?

---

## Environmental Notes

- **Project root**: `/Users/vijaypanwar/Projects/cv-vijaypanwar`
- **Branch**: `main`
- **Node**: check `.nvmrc` or `package.json engines` — project uses Vite + React 19 + TypeScript
- **Vercel project**: `prj_CdymmXebb9yXhpQnzw9kaDkKLqA6` / org `team_a9w8fkiPWLU45V2N0bK0yER6` / name `cv-vijaypanwar`
- **Vercel CLI token expired** — must run `vercel login` before any CLI commands
- **Two git remotes**:
  - `origin` → `https://github.com/Voldy75/cv-vijaypanwar.git` ← correct one
  - `upstream` → `https://github.com/santifer/cv-santiago.git` ← old source fork, keep/remove as needed
- **No `.env.local`** — build scripts that require `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (RAG ingestion) and Langfuse credentials gracefully skip if missing. Build succeeds without them.
- **Build command** (from `package.json`): `npm run rag:sync && npm run prompt:sync && ... && tsc -b && vite build && ...` — long pipeline but all optional steps degrade gracefully


---

# SESSION 2 ADDENDUM (supersedes conflicting notes above)

## What changed
- `api/chat.js` **rewritten** on Vercel AI SDK v7: `streamText` + `toUIMessageStream` + `createUIMessageStreamResponse`. Model `google/gemini-3.8-flash` via AI Gateway. Dropped the old Anthropic/Langfuse/Supabase-RAG stack. System prompt is grounded in Vijay's real CV.
- `src/AskChat.tsx` **new** — floating chat widget on `useChat` + `DefaultChatTransport`. Listens for the `openChat` window event.
- `src/main.tsx` — added `GlobalChat` (lazy, hydration-gated, skipped on `/ops`).
- Installed `ai@7.0.91`, `@ai-sdk/react@4.0.94`.
- This **fixed a latent bug**: the "Ask me" nav item in `src/i18n.ts` dispatches `openChat`, which had gone nowhere since the old chat was deleted.

## Verified on production (`cv-vijaypanwar.vercel.app`)
- Homepage `200`; `AskChat-C3pKrLHH.js` chunk deployed
- `GET /api/chat` → `405`; `POST {}` → `400 {"error":"messages required"}`
- Real chat message → stream opens then `{"type":"error"}`. Logs: `GatewayError: Unauthenticated. Configure AI_GATEWAY_API_KEY`

## Dead Ends — session 2
- **AI Gateway OIDC does not auto-authenticate here.** Deploying with no env vars and hoping Vercel's OIDC covers the gateway does not work — it returns `GatewayError: Unauthenticated`. An explicit `AI_GATEWAY_API_KEY` is required.
- **Gemini model IDs from memory are wrong.** `gemini-2.5-flash` is stale. Always run `curl -s https://ai-gateway.vercel.sh/v1/models | jq -r '[.data[]|select(.id|startswith("google/"))|.id]|reverse|.[]'`. Newest is `google/gemini-3.8-flash`.
- **AI SDK is v7, not v6.** `system:` is now `instructions:`; `useChat` needs an explicit `transport: new DefaultChatTransport({api})`; messages render from `.parts`, not `.content`. Read `node_modules/ai/docs/`, do not trust memory.
- **Claude Design file unreachable from a headless session.** WebFetch on `claude.ai/design/p/...` → `403`. `DesignSync` → needs `/design-login`, which cannot run non-interactively. Vercel's `import-claude-design-from-url` needs a pre-signed public export URL, not the app URL.

## Next steps
1. **Set the gateway key** (user action — creates/handles a credential):
   `vercel env add AI_GATEWAY_API_KEY production` then `vercel --prod --yes`.
   Re-test: `curl -X POST https://cv-vijaypanwar.vercel.app/api/chat -H 'Content-Type: application/json' -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"hi"}]}]}'`
2. **Unblock the redesign**: user runs `/design-login` once in an interactive Claude Code terminal on this machine. Headless sessions then reuse it. After that, `DesignSync` `get_file` on project `b99a5ab2-3a94-47b2-ac9d-6b6ac7e694ba`, implement directions **2a and 3a**, and pull `assets/logos/{burgon,icici,npci-mark,rapipay,zrika}.png` into `public/logos/`.
3. Note `public/logos/` still holds only Santiago's logos (brenntag, dipusevilla, junta, lilly, santander, xylem). Vijay's five are **not** in the repo yet.
4. Dead code still present: `src/FloatingChat.tsx`, `src/useVoiceMode.ts`, `src/chatbot-i18n.ts`, `api/voice-token.js`, `api/voice-trace.js`, `api/rag-search.js`. Not imported by the new chat.

## Open questions
- Redesign reference is `https://www.surajgaud.com` (single-column, chronological, minimal sans-serif, light/neutral, emoji markers, tagged projects). Confirm 2a/3a align with that before building.
