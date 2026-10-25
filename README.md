# Vijay Panwar — Interactive Portfolio

> A personal portfolio site for Vijay Panwar (Senior Product Manager · AI/ML · Payments & Fintech) with an editorial, single-column design, an AI ask-bar grounded in his real background, and browser-native voice input.

[![Live Site](https://img.shields.io/badge/demo-cv--vijaypanwar.vercel.app-blue?style=flat-square)](https://cv-vijaypanwar.vercel.app)
[![Built with Claude Code](https://img.shields.io/badge/built%20with-Claude%20Code-blueviolet?style=flat-square)](https://claude.ai/code)

---

## What this is

A static CV doesn't show how someone actually thinks or builds — it's a list of job titles. This site is an attempt at something closer to a conversation: a lowercase, editorial homepage you can skim in two minutes, an "ask" bar you can type (or speak) a real question into, and a handful of personal projects you can open inline without leaving the page.

**Highlights:**
- **Editorial homepage** — narrow single column, chronological "today / past / personal projects" structure, inline `<details>` asides instead of modals, device-framed project previews
- **AI ask-bar** — `⌘K` (or the bar itself) opens an inline chat grounded in Vijay's actual experience, streamed via the [Vercel AI SDK](https://ai-sdk.dev) (`streamText` + `useChat`) against Gemini through the Vercel AI Gateway (or a direct Google AI Studio key)
- **Voice input** — a mic control on the ask-bar using the browser's native Web Speech API (no backend, no extra key); it hides itself automatically in browsers that don't support it
- **Playbook** — a chaptered `/playbook` page for longer-form notes on shipping AI products
- **A Tetris easter egg** — because the "dark block" on the homepage had to do something
- **SEO basics done properly** — per-route prerendering, sitemap, structured data (JSON-LD), `llms.txt`

---

## Tech Stack

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![AI SDK](https://img.shields.io/badge/Vercel_AI_SDK_7-000000?style=flat&logo=vercel&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=flat&logo=googlegemini&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

---

## Ask-Bar Architecture

```
Question (typed or spoken) → src/editorial/AskBar.tsx (useChat + DefaultChatTransport)
                                └── POST /api/chat (Vercel Edge Function)
                                      ├── System prompt grounded in Vijay's real CV
                                      └── streamText → Gemini
                                            ├── via GOOGLE_GENERATIVE_AI_API_KEY (direct, no card), or
                                            └── via AI_GATEWAY_API_KEY (Vercel AI Gateway)
                                      → toUIMessageStream → streamed back to the ask-bar

Voice input → src/editorial/useVoiceInput.ts → Web Speech API (browser-native)
                └── fills the ask-bar live, final result submits the question
```

### Key Files

| File | Description |
|------|-------------|
| `api/chat.js` | Edge function — resolves Gemini via Gateway or direct key, streams the response |
| `src/editorial/Index.tsx` | Homepage — header, today, i also, past roles, personal projects, playbook callout, links |
| `src/editorial/AskBar.tsx` | The ask-bar itself — chat state, streaming, `⌘K` focus |
| `src/editorial/useVoiceInput.ts` | Web Speech API wrapper for the mic control |
| `src/editorial/Playbook.tsx` | `/playbook` — chaptered index |
| `src/editorial/Tetris.tsx` | The homepage's dark block — playable Tetris |
| `chatbot-prompt.txt` | Fallback/reference copy of the ask-bar system prompt |

---

## Quick Start

```bash
git clone https://github.com/Voldy75/cv-vijaypanwar.git
cd cv-vijaypanwar
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173)

### Environment Variables

```bash
# Ask-bar (pick one — direct key takes precedence when both are set)
GOOGLE_GENERATIVE_AI_API_KEY=   # Free tier via aistudio.google.com, no card needed
AI_GATEWAY_API_KEY=             # Vercel AI Gateway (requires a card on file)
```

The production build runs without any environment variables set — the optional RAG/stats/Langfuse-sync steps inherited from the original build pipeline skip gracefully when their credentials are missing.

---

## Project Structure

```
src/
├── editorial/                # Current homepage, ask-bar, voice input, playbook, Tetris
├── articles/                 # Case-study page components + i18n content
├── ops/                      # LLMOps dashboard components (legacy, see note below)
├── main.tsx                  # React Router + lazy loading
├── i18n.ts                   # Copy, links, and project data
└── PrivacyPolicy.tsx / AboutPage.tsx / ...

api/
├── chat.js                   # Ask-bar edge function (AI SDK v7 + Gemini)
└── ops/                      # Legacy dashboard API layer (see note below)

public/
├── favicon.svg / favicon.ico / *.png   # Favicons (Vijay's photo + initials mark)
└── fonts/, logos/                      # Self-hosted fonts, company logos

scripts/                      # Build pipeline (sitemap, prerender, SEO validation, etc.)
```

> **Note on legacy code:** this repo started as a fork of [`santifer/cv-santiago`](https://github.com/santifer/cv-santiago) — Santiago Fernández de Valderrama's self-healing chatbot portfolio, which shipped agentic RAG, a Langfuse-backed LLMOps dashboard (`/ops`), 71 automated evals, and OpenAI Realtime voice. Most of that stack (`src/ops/`, `evals/`, `src/useVoiceMode.ts`, the RAG/Langfuse pipeline in `api/_shared/`) is still present in the tree but is **not** wired into the current ask-bar, which was rebuilt from scratch on a simpler AI SDK + Gemini setup. It's kept around for reference rather than deleted outright; see `handoff.md` for the current cleanup status.

---

## Credit

The overall concept — a portfolio that *demonstrates* the skills it lists rather than just stating them — and the original production-grade architecture (agentic RAG, LLMOps dashboard, closed-loop evals) are from Santiago Fernández de Valderrama's [`cv-santiago`](https://github.com/santifer/cv-santiago). This repo is a fork, substantially re-branded and partially re-architected for Vijay Panwar; it is not a copy of the live santifer.io site.

---

## License

No license file is published for this repo (`package.json` is marked `private`). It's shared for reference, not for reuse.

---

## Let's Connect

[![Live Site](https://img.shields.io/badge/cv--vijaypanwar.vercel.app-000?style=for-the-badge&logo=vercel&logoColor=white)](https://cv-vijaypanwar.vercel.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/vijay-panwar-835bb13a)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:vijaypanwar333@gmail.com)
