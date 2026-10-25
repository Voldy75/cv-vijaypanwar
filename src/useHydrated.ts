import { useSyncExternalStore } from 'react'

const noop = () => () => {}

/** false during prerender and hydration, true once the app is live in the browser. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false)
}
