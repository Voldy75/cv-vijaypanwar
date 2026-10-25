# cv-vijaypanwar

Personal site for **Vijay Panwar**: senior product manager, payments and applied AI.
Live at [cv-vijaypanwar.vercel.app](https://cv-vijaypanwar.vercel.app).

## Pages

| Route | What it is | Source |
|-------|-----------|--------|
| `/` | Editorial homepage: today, past roles, projects, writing, Tetris, ask-bar chat | `src/editorial/Index.tsx` |
| `/playbook` | Notes on shipping AI products, available on request | `src/editorial/Playbook.tsx` |
| `/3d` | The résumé inside a 3D scene; scrolling moves the camera (experimental, noindex) | `src/three/` |
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

The 3D page's design and scene code are adapted from [dayinji/sen-3d-resume](https://github.com/dayinji/sen-3d-resume)
by Sen Zheng (code MIT; his name, model, résumé and logos are not used). Display fonts Mansalva and
Cormorant Upright are under the SIL Open Font License (`public/fonts/OFL-NOTICE.txt`).

Started as a fork of [santifer/cv-santiago](https://github.com/santifer/cv-santiago)
by Santiago Fernández de Valderrama (MIT). Its case studies, LLMOps dashboard and evals
have since been removed.

## License

MIT
