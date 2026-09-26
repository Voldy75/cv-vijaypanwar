# cv-vijaypanwar

Personal site for **Vijay Panwar**: senior product manager, payments and applied AI.
Live at [cv-vijaypanwar.vercel.app](https://cv-vijaypanwar.vercel.app).

## Pages

| Route | What it is | Source |
|-------|-----------|--------|
| `/` | Editorial homepage: today, past roles, projects, writing, Tetris, ask-bar chat | `src/editorial/Index.tsx` |
| `/playbook` | Notes on shipping AI products, available on request | `src/editorial/Playbook.tsx` |
| `/about` | Long-form profile: timeline, certifications, education, FAQ | `src/AboutPage.tsx` |
| `/privacy` | Privacy policy | `src/PrivacyPolicy.tsx` |

## Where to change things

- **CV facts** (roles, projects, writing, contact): `src/content.ts`. The homepage and the
  chat's system prompt both read it, so they can't drift apart.
- **Site address, page titles and descriptions**: `src/site.ts`. The prerender, sitemap and
  validation scripts read it too.
- **Editorial look** (colours, light/dark, spacing): the `.ed` block in `src/index.css`.
  Colours are `--ed-*` tokens; dark mode just redefines them.

Adding a route takes three edits: an entry in `SITE_PAGES` (`src/site.ts`), a `<Route>` in
`src/main.tsx`, and a rewrite in `vercel.json`. `npm run build` fails if any of them is missing.

## Stack

React 19 · TypeScript · Vite · Tailwind v4 · React Router 7 · Vercel.
The chat (`api/chat.js`) streams Gemini through the Vercel AI SDK (`ai` + `@ai-sdk/react`).

Pages are prerendered to static HTML at build time (`scripts/prerender.tsx`) and hydrated
in the browser, so the first paint is real content.

## Develop

```bash
npm install
cp .env.local.example .env.local   # add a Gemini key for the chat
npm run dev                         # http://localhost:5173
```

`npm run build` runs: typecheck → Vite build → sitemap → `llms.txt` check → prerender →
prerender validation → IndexNow ping. `npm run preview` serves the result on :4173.

Deploy with `vercel --prod --yes` (pushes to `main` don't auto-deploy yet).

## Credits

Started as a fork of [santifer/cv-santiago](https://github.com/santifer/cv-santiago)
by Santiago Fernández de Valderrama (MIT). Its case studies, LLMOps dashboard and evals
have since been removed.

## License

MIT
