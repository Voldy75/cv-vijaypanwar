import { useEffect } from 'react'

/** Editorial paper colours, light and dark. Keep in step with --ed-paper in index.css and the script in index.html. */
export const PAPER = { light: '#faf9f7', dark: '#141311' }

/**
 * Paint the browser chrome (mobile address bar) paper-coloured while an editorial page is mounted.
 * index.html does the same before first paint; this covers client-side navigation in and out.
 */
export function usePaperChrome() {
  useEffect(() => {
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const dark = document.documentElement.classList.contains('dark')
    if (theme) theme.content = dark ? PAPER.dark : PAPER.light
    return () => {
      // hand back to the site theme, the same way index.html's first-paint script picks it
      const stillDark = document.documentElement.classList.contains('dark')
      if (theme) theme.content = stillDark ? '#0a0a0a' : '#ffffff'
    }
  }, [])
}
