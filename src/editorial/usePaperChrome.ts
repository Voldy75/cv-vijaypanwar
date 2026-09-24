import { useEffect } from 'react'

const PAPER = '#faf9f7'

/**
 * Paint the browser chrome (mobile address bar) paper-coloured while an editorial page is mounted.
 * index.html does the same before first paint; this covers client-side navigation in and out.
 */
export function usePaperChrome() {
  useEffect(() => {
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const scheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')
    if (theme) theme.content = PAPER
    if (scheme) scheme.content = 'light'
    return () => {
      // hand back to the site theme, the same way index.html's first-paint script picks it
      const dark = document.documentElement.classList.contains('dark')
      if (theme) theme.content = dark ? '#0a0a0a' : '#ffffff'
      if (scheme) scheme.content = dark ? 'dark' : 'light'
    }
  }, [])
}
