# Vijay Panwar — Interactive Portfolio

> A personal portfolio site for Vijay Panwar (Senior Product Manager · AI/ML · Payments & Fintech): an editorial, single-column homepage, an AI ask-bar grounded in his real background, browser-native voice input, and an experimental scroll-driven 3D résumé.

[![Live Site](https://img.shields.io/badge/demo-cv--vijaypanwar.vercel.app-blue?style=flat-square)](https://cv-vijaypanwar.vercel.app)
[![Built with Claude Code](https://img.shields.io/badge/built%20with-Claude%20Code-blueviolet?style=flat-square)](https://claude.ai/code)

---

## What this is

A static CV doesn't show how someone actually thinks or builds — it's a list of job titles. This site is an attempt at something closer to a conversation: a lowercase, editorial homepage you can skim in two minutes, an "ask" bar you can type (or speak) a real question into, and a handful of personal projects you can open inline without leaving the page.

**Highlights:**
- **Editorial homepage** — narrow single column, "today / past / personal projects" structure, inline `<details>` asides instead of modals, device-framed project previews; follows the system light/dark setting
- **AI ask-bar** — `⌘K` / `Ctrl K` opens an inline chat grounded in Vijay's actual experience, streamed via the [Vercel AI SDK](https://ai-sdk.dev) against Gemini. Markdown replies, stop and retry, and the conversation survives a refresh
- **Voice input** — a mic control using the browser's native Web Speech API (no backend, no extra key); it hides itself in browsers that don't support it
- **3D résumé** (`/3d`, experimental) — scrolling moves a camera through a 3D scene, one stop per role
- **Playbook** — a chaptered `/playbook` page for longer-form notes on shipping AI products
- **A Tetris easter egg** — because the "dark block" on the homepage had to do something
- **SEO basics done properly** — per-route prerendering, sitemap, structured data (JSON-LD), `llms.txt`, and a build that fails on a broken page

---

## Tech Stack

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![three.js](https://img.shields.io/badge/three.js-000000?style=flat&logo=threedotjs&logoColor=white)
![AI SDK](https://img.shields.io/badge/Vercel_AI_SDK_7-000000?style=flat&logo=vercel&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=flat&logo=googlegemini&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

---

## Pages

| Route | What it is | Source |
|-------|-----------|--------|
| `/` | Editorial homepage: today, past roles, projects, writing, Tetris, ask-bar | `src/editorial/Index.tsx` |
| `/playbook` | Notes on shipping AI products, available on request | `src/editorial/Playbook.tsx` |
| `/3d` | The résumé inside a 3D scene; scrolling moves the camera (experimental, noindex) | `src/three/` |
| `/about` | Long-form profile: timeline, certifications, education, FAQ | `src/AboutPage.tsx` |
| `/privacy` | Privacy policy | `src/PrivacyPolicy.tsx` |

## Where to change things

- **CV facts** (roles, projects, writing, contact): `src/content.json`. The homepage, the 3D page and
  the chat's system prompt all read it, so they can't drift apart.
- **Site address, page titles and descriptions**: `src/site.ts`. The prerender, sitemap and
  validation scripts read it too.
- **Editorial look** (colours, light/dark, spacing): the `.ed` block in `src/index.css`.
  Colours are `--ed-*` tokens; dark mode just redefines them.

Adding a route takes three edits: an entry in `SITE_PAGES` (`src/site.ts`), a `<Route>` in
`src/main.tsx`, and a rewrite in `vercel.json`. `npm run build` fails if any of them is missing.

---

## Ask-Bar Architecture

```
Question (typed or spoken) → src/editorial/AskBar.tsx (useChat + DefaultChatTransport)
                                └── POST /api/chat (Vercel Edge Function)
                                      ├── System prompt built from src/content.json
                                      └── streamText → Gemini
                                            ├── via GOOGLE_GENERATIVE_AI_API_KEY (direct, no card), or
                                            └── via AI_GATEWAY_API_KEY (Vercel AI Gateway)
                                      → toUIMessageStream → streamed back to the ask-bar

Voice input → src/editorial/useVoiceInput.ts → Web Speech API (browser-native)
                └── fills the ask-bar live, final result submits the question
```

| File | Description |
|------|-------------|
| `api/chat.js` | Edge function — resolves Gemini via Gateway or direct key, streams the response |
| `src/editorial/Index.tsx` | Homepage — header, today, i also, past roles, personal projects, playbook callout, links |
| `src/editorial/AskBar.tsx` | The ask-bar — chat state, streaming, markdown, stop/retry, `⌘K` focus |
| `src/editorial/useVoiceInput.ts` | Web Speech API wrapper for the mic control |
| `src/editorial/Playbook.tsx` | `/playbook` — chaptered index and request form |
| `src/editorial/Tetris.tsx` | The homepage's dark block — playable Tetris |

---

## The 3D résumé (`/3d`)

A scroll-driven 3D page, after [sen-3d-resume](https://github.com/dayinji/sen-3d-resume) by Sen Zheng
(code MIT; none of his personal assets are used). A fixed 3D scene sits behind normal HTML; each
timeline entry is a camera stop, with autofocus depth of field, bloom, film grain and eyes that
follow the cursor.

| File | What it does |
|------|--------------|
| `src/three/ThreeD.tsx` | The page: hero, résumé timeline, projects gallery, contact. Prerendered like the rest. |
| `src/three/Stage.tsx` | The canvas, loaded only after hydration. Picks your model or the placeholder; drops to a lite mode on phones, slow devices, or without WebGL. |
| `src/three/Scene.tsx` | Lights, sky, scroll → camera, autofocus, eyes, post effects. Tunables are plain constants at the top. |
| `src/three/placeholder.ts` | The stand-in model: a clay hub with eyes at the centre of a payments network, one node per role. |
| `src/three/config.ts` | Camera stops (one per role in `content.json`), model path, sky colours. |

three.js is about 355 KB gzipped, so it lives in its own chunk (`vendor-three`) that only `/3d` loads.

### Your own 3D model

**The current model** (`public/models/me.glb`) is an original stylized clay bust of Vijay, built from
his photo by `blender/build_vijay.py` (Blender's Python API; nothing from sen-3d-resume's model).
To change it, edit the constants or shapes in that script and re-run it:
`python blender/build_vijay.py --out public/models/me.glb` (needs Blender 4.2+, or `pip install bpy`).
Each `focus-k` empty can also carry `cameraDistance`, `cameraOffset` and `cameraLift` glTF extras
to tune that stop's auto-framed camera.

Put a `.glb` at **`public/models/me.glb`** and redeploy. The page finds it and uses it instead of the
placeholder; nothing else to change. The code looks objects up by name:

| Object in the glb | Needed for | If it's missing |
|-------------------|-----------|-----------------|
| Empty `focus-0` | The hero shot's focus point (your face) | Falls back to `focus-1` |
| Empties `focus-1` … `focus-5` | One per role, in `content.json` order: Zrika, NPCI, Rapipay, Burgon, ICICI | That stop has no focus point |
| Empty `focus-works` | The projects shot | Reuses the last role's point |
| Meshes or groups whose name contains `eye` | Eyes that follow the cursor | Eyes stay still |
| A camera plus an animation clip named `CameraAction` (optional) | Your own camera path: 24fps, role *k* at frame 50·*k*, projects from there to the last frame | The camera frames each `focus-*` point itself (assumes the model faces +Z and is about 2 units tall) |

Ways to make one:
- **No code:** [intro3d.com](https://intro3d.com) arranges a model and camera in the browser and exports a
  glb with this naming (it's what sen-3d-resume recommends).
- **From a photo:** an image-to-3D tool gives you a base mesh; add the empties and camera in Blender.
- **Blender:** model or adjust, add empties named as above, animate a camera as `CameraAction`, export glTF binary.

Keep it under ~5 MB, and export **without Draco or Meshopt compression**: those need decoder files
from a third-party CDN, which the site's Content-Security-Policy blocks. Embedded textures are fine.

The number of stops follows `content.json`: add a role and the page gets another stop
(`focus-6`), so add a matching empty to your model.

---

## Quick Start

```bash
git clone https://github.com/Voldy75/cv-vijaypanwar.git
cd cv-vijaypanwar
npm install
cp .env.local.example .env.local   # add a Gemini key for the ask-bar
npm run dev                         # http://localhost:5173
```

```bash
# Ask-bar (pick one — direct key takes precedence when both are set)
GOOGLE_GENERATIVE_AI_API_KEY=   # Free tier via aistudio.google.com, no card needed
AI_GATEWAY_API_KEY=             # Vercel AI Gateway (requires a card on file)
```

`npm run build` runs: typecheck → Vite build → sitemap → `llms.txt` check → prerender →
prerender validation → IndexNow ping. No environment variables are needed to build.

`npm run preview` serves the result, but note it ignores `vercel.json`'s rewrites, so `/playbook`,
`/3d`, `/about` and `/privacy` get the homepage's HTML there (and a React hydration warning).
That doesn't happen on Vercel.

Deploy with `vercel --prod --yes` (pushes to `main` don't auto-deploy yet).

---

## Credit

The overall concept — a portfolio that *demonstrates* the skills it lists rather than just stating them — comes from Santiago Fernández de Valderrama's [`cv-santiago`](https://github.com/santifer/cv-santiago), which this repo was forked from. It has since been re-branded and largely re-architected for Vijay Panwar; Santiago's case studies, LLMOps dashboard and evals have been removed.

The 3D page's design and scene code are adapted from [`dayinji/sen-3d-resume`](https://github.com/dayinji/sen-3d-resume) by Sen Zheng (MIT; his name, model, résumé and logos are not used). See `THIRD_PARTY_NOTICES.md`.

---

## License

No license is published for this repo's own code (`package.json` is marked `private`). It's shared for reference, not for reuse. Third-party code and fonts keep their own licenses: see `THIRD_PARTY_NOTICES.md` and `public/fonts/OFL-NOTICE.txt`.

---

## Let's Connect

[![Live Site](https://img.shields.io/badge/cv--vijaypanwar.vercel.app-000?style=for-the-badge&logo=vercel&logoColor=white)](https://cv-vijaypanwar.vercel.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/vijay-panwar-835bb13a)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:vijaypanwar333@gmail.com)
