/**
 * The fixed 3D background for /3d, loaded lazily so three.js never touches the other pages.
 * Decides: your model or the placeholder, full or lite effects, motion or still.
 */
import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import Scene from './Scene'
import { MODEL_URL } from './config'

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** True only if /models/me.glb is really there (not the 404 page or an SPA fallback). */
async function modelExists() {
  try {
    const r = await fetch(MODEL_URL, { method: 'HEAD' })
    const type = r.headers.get('content-type') ?? ''
    return r.ok && !type.includes('text/html')
  } catch {
    return false
  }
}

export default function Stage({ onReady }: { onReady: () => void }) {
  const [useGlb, setUseGlb] = useState<boolean | null>(null)
  const [webgl] = useState(hasWebGL)
  // drops to lite (no DoF/bloom, 1x resolution) if the device can't keep a steady frame rate
  const [degraded, setDegraded] = useState(false)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Phones and small screens skip depth of field and bloom: they cost the most and show the least.
  const lite = degraded || window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 640

  useEffect(() => {
    let live = true
    modelExists().then((yes) => live && setUseGlb(yes))
    return () => { live = false }
  }, [])

  useEffect(() => {
    if (!webgl) onReady()
  }, [webgl, onReady])

  if (!webgl || useGlb === null) return null

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={degraded ? 1 : [1, lite ? 1.25 : 1.5]}
      camera={{ position: [0, 0.2, 7.4], fov: 30, near: 0.1, far: 500 }}
      gl={{ antialias: false, stencil: false, depth: true, toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={() => requestAnimationFrame(() => onReady())}
    >
      <PerformanceMonitor onDecline={() => setDegraded(true)} flipflops={1}>
        <Suspense fallback={null}>
          <Scene useGlb={useGlb} reduced={reduced} lite={lite} />
        </Suspense>
      </PerformanceMonitor>
    </Canvas>
  )
}
