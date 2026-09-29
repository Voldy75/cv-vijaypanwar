/**
 * Typed view of src/content.json — the CV facts.
 *
 * The facts live in JSON so the chat API (api/chat.js, an Edge function) can import the
 * same file and build its system prompt from it. Edit content.json, not this file.
 */
import data from './content.json'

export type Role = {
  company: string
  /** how the homepage writes the name, lowercase editorial voice */
  short: string
  /** path under public/; empty shows a letter badge instead */
  logo: string
  role: string
  /** e.g. "Dec 2023–Nov 2024" */
  period: string
  highlights: string[]
  /** a real page for this role; left out rather than pointing somewhere generic */
  href?: string
}

export type Project = {
  title: string
  tags: string
  blurb: string
  href?: string
  hrefLabel?: string
  note?: string
  /** live embed shown in the device frame */
  iframe?: string
  /** screenshot shown in the device frame, e.g. '/projects/local-rag.webp' */
  image?: string
  open?: boolean
}

export type Writing = {
  title: string
  blurb: string
  /** the post itself; without one the item links to the LinkedIn posts feed */
  href?: string
}

export type Content = {
  name: string
  location: string
  email: string
  linkedin: string
  github: string
  headline: string
  summary: string
  skills: string[]
  nowPlaying: { title: string; spotify: string; apple: string }
  roles: Role[]
  projects: Project[]
  writing: Writing[]
}

export const content: Content = data

/** "Dec 2023–Nov 2024" → "2023—2024"; "Dec 2024–Present" → "2024—now" */
export function years(period: string): string {
  const [from, to] = period.split('–')
  const y = (s: string) => s.match(/\d{4}/)?.[0] ?? 'now'
  return `${y(from)}—${y(to ?? '')}`
}

export const linkedinPosts = `${content.linkedin}/recent-activity/all/`
