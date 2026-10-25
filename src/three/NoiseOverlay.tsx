/**
 * Full-screen film grain for /3d — the noise shader from sen-3d-resume's NoiseOverlay (MIT,
 * github.com/dayinji/sen-3d-resume), which ported it from speakio's homepage.
 *
 * Its own small canvas, multiplied over the whole page and redrawn only about once a second
 * (frameloop="demand"), so it costs next to nothing. With reduced motion it draws one still frame.
 */
import { useEffect, useMemo, useRef } from 'react'
import { Canvas, invalidate, useFrame } from '@react-three/fiber'
import { DoubleSide, ShaderMaterial, Vector2 } from 'three'

const OPACITY = 0.5
const FRAMES_PER_SECOND = 1

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 pixel = gl_FragCoord.xy;
    float frame = uTime;
    float mask = noise(pixel / uResolution.y * 30.0 + 1000.0 * hash(vec2(frame * 0.1))) * 0.2;
    mask = smoothstep(0.005, 0.03, mask);
    float b = noise(pixel / uResolution.y * 30.0 + 1000.0 * hash(vec2(frame * 0.1))) * 0.2;
    b += noise(pixel / uResolution.y * 60.0 + 1000.0 * hash(vec2(frame * 0.2))) * 0.5;
    b = clamp(b, 0.0, 1.0);
    b = smoothstep(0.1, 0.12, b);
    vec3 color = mix(vec3(0.2, 0.4, 0.45), vec3(1.0, 1.4, 1.3), b);
    color += vec3(mask);
    color *= hash(pixel / uResolution.y * 200.0 + 1000.0 * hash(vec2(frame * 0.3))) * 4.0;
    color = clamp(color, 0.0, 1.0);
    gl_FragColor = vec4(color, 1.0);
  }
`

function NoisePlane({ still }: { still: boolean }) {
  const material = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uResolution: { value: new Vector2() } }), [])

  useFrame(({ clock, size }) => {
    const m = material.current
    if (!m) return
    m.uniforms.uTime.value = still ? 1 : clock.elapsedTime % 10000
    m.uniforms.uResolution.value.set(size.width, size.height)
  })

  // demand mode: a timer asks for a redraw, so the grain shimmers slowly instead of every frame
  useEffect(() => {
    if (still) return
    const id = setInterval(() => invalidate(), 1000 / FRAMES_PER_SECOND)
    return () => clearInterval(id)
  }, [still])

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        transparent
        depthTest={false}
        depthWrite={false}
        side={DoubleSide}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function NoiseOverlay({ onReady }: { onReady?: () => void }) {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // without WebGL the page keeps its CSS grain (.td-grain)
  if (!hasWebGL()) return null
  return (
    <Canvas
      className="td-noise"
      style={{ opacity: OPACITY, pointerEvents: 'none' }}
      frameloop="demand"
      camera={{ position: [0, 0, 1] }}
      gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
      onCreated={() => onReady?.()}
    >
      <NoisePlane still={still} />
    </Canvas>
  )
}
