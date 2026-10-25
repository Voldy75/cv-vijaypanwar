/**
 * The 3D scene behind /3d: gradient sky, clay lighting, the model (placeholder or /models/me.glb),
 * a scroll-driven camera, autofocus depth of field, bloom, and eyes that follow the cursor.
 *
 * Ported from sen-3d-resume (MIT, github.com/dayinji/sen-3d-resume) to React 19 / R3F 9.
 *
 * Scroll → u, a continuous index over the camera stops:
 *   u = 0          hero            (focus-0)
 *   u = k          role k          (focus-k, 1…M)
 *   u = M + 1      projects        (focus-works)
 * With a glb that has a "CameraAction" clip, u drives the clip (role k = frame 50k, the projects
 * segment runs to the clip's last frame). Without one, the camera frames each anchor itself.
 */
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode, type DepthOfFieldEffect } from 'postprocessing'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildPlaceholder } from './placeholder'
import { FPS, FRAMES_PER_NODE, MODEL_URL, NODE_LINE, ROLE_COUNT, ROLE_POINTS, SKY } from './config'

const M = ROLE_COUNT
const STOPS = M + 1 // index of the projects stop

// ---- tunables (plain constants, as in the original) --------------------------
const CAM = {
  damping: 0.1, // per-second fraction left after easing; lower = snappier
  dwell: 0.35, // share of each scroll segment the camera holds still at a stop
  parallax: 3.5, // degrees of orbit around the focus point from the mouse
  parallaxEase: 0.1,
  mobilePullback: 1.5, // phones: camera this much further out
  mobileShift: 0.14, // phones: shift subject left during the résumé (fraction of view distance)
  fov: 30,
}
// Auto-framing, used when the model has no CameraAction clip. A model can override the role-stop
// values per anchor with glTF extras on its focus-k empties: cameraDistance, cameraOffset, cameraLift.
const FRAME = {
  heroDistance: 7.4,
  heroDrop: 0.55, // look this far below focus-0 so the face sits above the hero text
  nodeDistance: 4.6,
  nodeLift: 0.55,
  nodeOffset: 1.05, // push the subject left of centre, away from the right-hand timeline
  worksPosition: new THREE.Vector3(0, 1.8, 12.5),
  worksTarget: new THREE.Vector3(0, 0.2, 0),
}
const EYE = { gain: 3, maxYaw: 15, maxPitch: 8, smooth: 0.44, crossEye: 40, crossRadius: 0.25 }
const POST = { bloomIntensity: 0.6, bloomThreshold: 0.82, wideBokeh: 6.5, wideRange: 2.2, tightBokeh: 10, tightRange: 0.35 }

type Ref<T> = RefObject<T>

/** Inside-out sphere with a vertical gradient; steep so the narrow FOV still sees the full blend. */
function Sky() {
  const uniforms = useMemo(() => ({ uTop: { value: new THREE.Color(SKY.top) }, uBottom: { value: new THREE.Color(SKY.bottom) }, uSteep: { value: 1.3 } }), [])
  return (
    <mesh scale={100}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec3 vDir;
          void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={/* glsl */ `
          uniform vec3 uTop; uniform vec3 uBottom; uniform float uSteep; varying vec3 vDir;
          void main() { float t = clamp(vDir.y * uSteep * 0.5 + 0.5, 0.0, 1.0); gl_FragColor = vec4(mix(uBottom, uTop, t), 1.0); }`}
      />
    </mesh>
  )
}

/** Image-based light from three's built-in RoomEnvironment (generated, no HDR file to download), plus key and fill. */
function Lights() {
  const get = useThree((s) => s.get)
  useEffect(() => {
    const { gl, scene } = get()
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.8
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [get])
  return (
    <>
      <hemisphereLight args={['#ffffff', '#404040', 1.0]} />
      <directionalLight position={[5, 8, 5]} intensity={2.3} color="#ffd9c6" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <directionalLight position={[-5, 4, -4]} intensity={2.0} color="#9fc6ff" />
    </>
  )
}

/** Scroll position → u (see header). Reads the page's [data-point] entries and the projects section. */
function readScroll(dwell: number): number {
  const d = THREE.MathUtils.clamp(dwell, 0, 0.49)
  const hold = (t: number) => (t < d ? 0 : t > 1 - d ? 1 : THREE.MathUtils.smoothstep((t - d) / (1 - 2 * d), 0, 1))
  const ih = window.innerHeight
  const refLine = window.scrollY + ih * NODE_LINE
  const tops = ROLE_POINTS.map((n) => {
    const el = document.querySelector(`[data-point="${n}"]`)
    return el ? el.getBoundingClientRect().top + window.scrollY : NaN
  })
  if (tops.some(Number.isNaN)) return 0

  let u: number
  if (refLine <= tops[0]) {
    u = hold(THREE.MathUtils.clamp(window.scrollY / Math.max(1, tops[0] - ih * NODE_LINE), 0, 1))
  } else if (refLine >= tops[M - 1]) {
    u = M
  } else {
    u = M
    for (let i = 0; i < M - 1; i++) {
      if (refLine <= tops[i + 1]) {
        u = i + 1 + hold((refLine - tops[i]) / Math.max(1, tops[i + 1] - tops[i]))
        break
      }
    }
  }
  // projects: from the section entering the viewport to the end of its pinned scroll
  const works = document.querySelector<HTMLElement>('[data-point="focus-works"]')
  if (works) {
    const r = works.getBoundingClientRect()
    const travel = ih + Math.max(0, works.offsetHeight - ih)
    const w = THREE.MathUtils.clamp((ih - r.top) / travel, 0, 1)
    if (w > 0) u = M + THREE.MathUtils.smoothstep(w, 0, 0.6)
  }
  return u
}

type Model = { root: THREE.Object3D; animations: THREE.AnimationClip[]; update?: (t: number) => void }

function Rig({ model, focusRef, uRef, reduced }: { model: Model; focusRef: Ref<THREE.Vector3>; uRef: Ref<number>; reduced: boolean }) {
  // Collect anchors, eyes and an optional glb camera from the model, by name.
  const rig = useMemo(() => {
    const byName: Record<string, THREE.Object3D> = {}
    const eyes: { obj: THREE.Object3D; base: THREE.Quaternion; x: number; sx: number }[] = []
    let glbCam: THREE.PerspectiveCamera | null = null
    model.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = o.receiveShadow = true
      if ((o as THREE.PerspectiveCamera).isPerspectiveCamera) glbCam = o as THREE.PerspectiveCamera
      if (o.name) byName[o.name] = o
      if (/eye/i.test(o.name)) eyes.push({ obj: o, base: o.quaternion.clone(), x: o.position.x, sx: 0 })
    })
    if (eyes.length > 1) {
      const mid = (Math.min(...eyes.map((e) => e.x)) + Math.max(...eyes.map((e) => e.x))) / 2
      eyes.forEach((e) => (e.sx = e.x < mid ? -1 : 1))
    }
    const roles = ROLE_POINTS.map((n) => byName[n] ?? null)
    const start = byName['focus-0'] ?? byName['focus-start'] ?? roles[0]
    const works = byName['focus-works'] ?? roles[M - 1]
    const anchors = [start, ...roles, works] // index = u stop
    const clip = model.animations.find((c) => c.name === 'CameraAction') ?? null
    return { eyes, anchors, glbCam: clip ? glbCam : null, clip }
  }, [model])

  // glb animations: all clips play on one shared timeline that scroll scrubs via mixer.setTime
  const mixer = useMemo(() => new THREE.AnimationMixer(model.root), [model])
  useEffect(() => {
    for (const clip of model.animations) mixer.clipAction(clip).play()
    return () => { mixer.stopAllAction() }
  }, [mixer, model])
  const totalFrames = rig.clip ? Math.round(rig.clip.duration * FPS) : 0

  // Auto-framed shots, one per stop, for models without a CameraAction clip
  const shots = useMemo(() => {
    model.root.updateWorldMatrix(true, true)
    const world = (o: THREE.Object3D | null) => (o ? o.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3())
    const up = new THREE.Vector3(0, 1, 0)
    const fwd = new THREE.Vector3(0, 0, 1)
    return rig.anchors.map((a, i) => {
      const p = world(a)
      if (i === 0) {
        return { pos: p.clone().add(new THREE.Vector3(0, 0.1, FRAME.heroDistance)), target: p.clone().add(new THREE.Vector3(0, -FRAME.heroDrop, 0)) }
      }
      if (i === STOPS) return { pos: FRAME.worksPosition.clone(), target: FRAME.worksTarget.clone() }
      const ud = (a?.userData ?? {}) as { cameraDistance?: number; cameraOffset?: number; cameraLift?: number }
      const out = new THREE.Vector3(p.x, 0, p.z).normalize().lerp(fwd, 0.5).normalize()
      const pos = p.clone().addScaledVector(out, ud.cameraDistance ?? FRAME.nodeDistance).addScaledVector(up, ud.cameraLift ?? FRAME.nodeLift)
      const right = new THREE.Vector3().subVectors(p, pos).normalize().cross(up).normalize()
      return { pos, target: p.clone().addScaledVector(right, ud.cameraOffset ?? FRAME.nodeOffset) }
    })
  }, [rig, model])
  const path = useMemo(() => new THREE.CatmullRomCurve3(shots.map((s) => s.pos), false, 'centripetal'), [shots])

  // input
  const mouse = useRef({ x: 0, y: 0 })
  const smouse = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
  const isMobile = useMemo(() => window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 640, [])

  // scratch objects, reused every frame
  const s = useMemo(
    () => ({
      a: new THREE.Vector3(), b: new THREE.Vector3(), v: new THREE.Vector3(), target: new THREE.Vector3(),
      pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scl: new THREE.Vector3(),
      pe: new THREE.Euler(0, 0, 0, 'YXZ'), pq: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), q: new THREE.Quaternion(), dq: new THREE.Quaternion(),
      m: new THREE.Matrix4(),
    }),
    [],
  )
  const uSmooth = useRef(0)

  useFrame((state, dt) => {
    const camera = state.camera as THREE.PerspectiveCamera
    model.update?.(reduced ? 0 : state.clock.elapsedTime)

    // 1) scroll → u, eased (reduced motion: hold the hero shot)
    const uTarget = reduced ? 0 : readScroll(CAM.dwell)
    uSmooth.current += (uTarget - uSmooth.current) * (1 - Math.pow(CAM.damping, dt))
    const u = THREE.MathUtils.clamp(uSmooth.current, 0, STOPS)
    uRef.current = u
    const iA = Math.min(Math.floor(u), STOPS - 1)
    const f = u - iA

    // 2) focus point: between neighbouring anchors
    const A = rig.anchors[iA]
    const B = rig.anchors[iA + 1]
    if (A && B) focusRef.current.lerpVectors(A.getWorldPosition(s.a), B.getWorldPosition(s.b), f)

    // 3) base camera: the glb's own animation, or the auto-framed path
    if (rig.glbCam && rig.clip) {
      const frame = u <= M ? u * FRAMES_PER_NODE : M * FRAMES_PER_NODE + (totalFrames - M * FRAMES_PER_NODE) * (u - M)
      // capped just short of the camera clip's end, so it never wraps back to frame 0
      mixer.setTime(Math.min(frame / FPS, (rig.clip.duration || 0) - 1e-4))
      const glbCam: THREE.PerspectiveCamera = rig.glbCam
      glbCam.updateWorldMatrix(true, false)
      glbCam.matrixWorld.decompose(s.pos, s.quat, s.scl)
      if (camera.fov !== glbCam.fov) {
        camera.fov = glbCam.fov
        camera.updateProjectionMatrix()
      }
    } else {
      path.getPoint(u / STOPS, s.pos)
      s.target.lerpVectors(shots[iA].target, shots[iA + 1].target, THREE.MathUtils.smoothstep(f, 0, 1))
      s.m.lookAt(s.pos, s.target, camera.up)
      s.quat.setFromRotationMatrix(s.m)
      if (camera.fov !== CAM.fov) {
        camera.fov = CAM.fov
        camera.updateProjectionMatrix()
      }
    }

    // 4) mouse parallax: orbit around the focus point so it stays put on screen
    const me = 1 - Math.pow(CAM.parallaxEase, dt)
    smouse.current.x += (mouse.current.x - smouse.current.x) * me
    smouse.current.y += (mouse.current.y - smouse.current.y) * me
    const ax = reduced || isMobile ? 0 : THREE.MathUtils.degToRad(CAM.parallax)
    s.pe.set(-smouse.current.y * ax, -smouse.current.x * ax, 0)
    s.pq.setFromEuler(s.pe)
    s.v.copy(s.pos).sub(focusRef.current).applyQuaternion(s.pq)
    if (isMobile) s.v.multiplyScalar(CAM.mobilePullback)
    camera.position.copy(s.v.add(focusRef.current))
    camera.quaternion.multiplyQuaternions(s.pq, s.quat)
    if (isMobile && CAM.mobileShift) {
      // résumé only: fade in after the hero, out as the projects arrive
      const w = THREE.MathUtils.smoothstep(u, 0.2, 1.3) * (1 - THREE.MathUtils.smoothstep(u, M, STOPS))
      if (w > 0) camera.translateX(-camera.position.distanceTo(focusRef.current) * CAM.mobileShift * w)
    }

    // 5) eyes follow the cursor (not on touch screens, not with reduced motion)
    if (reduced || isMobile || rig.eyes.length === 0) return
    let ex = 0
    let ey = 0
    for (const e of rig.eyes) {
      e.obj.getWorldPosition(s.v).project(camera)
      ex += s.v.x
      ey += s.v.y
    }
    const mx = mouse.current.x - ex / rig.eyes.length
    const my = mouse.current.y - ey / rig.eyes.length
    const yaw = mx * THREE.MathUtils.degToRad(EYE.maxYaw) * EYE.gain
    const pitch = -my * THREE.MathUtils.degToRad(EYE.maxPitch) * EYE.gain
    const conv = THREE.MathUtils.degToRad(EYE.crossEye) * THREE.MathUtils.clamp(1 - Math.hypot(mx, my) / EYE.crossRadius, 0, 1)
    for (const e of rig.eyes) {
      s.e.set(THREE.MathUtils.clamp(pitch, -0.6, 0.6), THREE.MathUtils.clamp(yaw - e.sx * conv, -0.8, 0.8), 0)
      s.q.setFromEuler(s.e)
      s.dq.copy(s.q).multiply(e.base)
      e.obj.quaternion.slerp(s.dq, EYE.smooth)
    }
  })

  return <primitive object={model.root} />
}

function PlaceholderModel(props: { focusRef: Ref<THREE.Vector3>; uRef: Ref<number>; reduced: boolean }) {
  const model = useMemo<Model>(() => {
    const p = buildPlaceholder()
    return { root: p.root, animations: [], update: p.update }
  }, [])
  return <Rig model={model} {...props} />
}

function GlbModel(props: { focusRef: Ref<THREE.Vector3>; uRef: Ref<number>; reduced: boolean }) {
  // no Draco/Meshopt: their decoders are WebAssembly or a third-party CDN, both blocked by the CSP
  const { scene, animations } = useGLTF(MODEL_URL, false, false)
  const model = useMemo<Model>(() => ({ root: scene.clone(true), animations }), [scene, animations])
  return <Rig model={model} {...props} />
}

/**
 * DoF → Bloom → ACES tone mapping → SMAA. Focus follows the rig; the hero and projects get a wide
 * focus, roles a tight one. The composer switches the renderer's own tone mapping off while it runs,
 * so it's re-applied here — otherwise full and lite modes would render with different contrast.
 */
function Post({ focusRef, uRef }: { focusRef: Ref<THREE.Vector3>; uRef: Ref<number> }) {
  const dof = useRef<DepthOfFieldEffect>(null)
  useFrame(() => {
    const e = dof.current
    if (!e) return
    e.target?.copy(focusRef.current)
    const u = uRef.current
    const wide = Math.max(1 - THREE.MathUtils.smoothstep(u, 0, 0.9), THREE.MathUtils.smoothstep(u, M, STOPS))
    e.bokehScale = THREE.MathUtils.lerp(POST.tightBokeh, POST.wideBokeh, wide)
    e.cocMaterial.focusRange = THREE.MathUtils.lerp(POST.tightRange, POST.wideRange, wide)
  })
  return (
    <EffectComposer multisampling={0} stencilBuffer={false}>
      <DepthOfField ref={dof} target={[0, 0, 0]} focusRange={POST.wideRange} bokehScale={POST.wideBokeh} height={480} />
      <Bloom mipmapBlur intensity={POST.bloomIntensity} luminanceThreshold={POST.bloomThreshold} luminanceSmoothing={0.3} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  )
}

export default function Scene({ useGlb, reduced, lite }: { useGlb: boolean; reduced: boolean; lite: boolean }) {
  const focusRef = useRef(new THREE.Vector3(0, 0.12, 0.9))
  const uRef = useRef(0)
  const props = { focusRef, uRef, reduced }
  return (
    <>
      <Sky />
      <Lights />
      {useGlb ? <GlbModel {...props} /> : <PlaceholderModel {...props} />}
      {!lite && <Post focusRef={focusRef} uRef={uRef} />}
    </>
  )
}
