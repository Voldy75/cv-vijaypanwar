/**
 * The stand-in model, built in code: a clay hub with eyes at the centre of a small payments
 * network. Each role in content.json is a node orbiting the hub; glowing packets run along
 * the links. It is replaced wholesale by /models/me.glb when that file exists.
 *
 * It follows the same naming contract a real model must (see README → "Your own 3D model"):
 *   focus-0            hero anchor (the face)
 *   focus-1 … focus-M  one empty per role, in content.json order
 *   focus-works        projects anchor
 *   names containing "eye"  objects rotated to follow the cursor
 */
import * as THREE from 'three'
import { ROLE_COUNT } from './config'

// ---- look (plain constants, edit freely) ------------------------------------
const HUB_COLOR = '#c66a4a'
const NODE_COLORS = ['#e8c341', '#5bc8d6', '#8da05a', '#e8895c', '#6b8fb5', '#c98b4b']
const CREAM = '#f4f1ea'
const PACKET_COLOR = '#ffd9b3'
const ORBIT_RADIUS = 2.7
const NODE_HEIGHTS = [1.45, -1.25, 1.85, -1.55, 1.15, -1.0]

const clay = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0 })

/** Low-frequency bumps so the hub reads as hand-shaped clay rather than a perfect sphere. */
function lumpySphere(radius: number, detail = 1) {
  const g = new THREE.SphereGeometry(radius, Math.round(96 * detail), Math.round(64 * detail))
  const p = g.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const n = v.clone().normalize()
    const bump = 0.022 * Math.sin(n.x * 5.1 + n.y * 2.3) + 0.016 * Math.sin(n.y * 6.7 - n.z * 3.9) + 0.012 * Math.sin(n.z * 8.3 + n.x * 4.4)
    v.addScaledVector(n, bump * radius)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
}

function makeEye(name: string, x: number) {
  const eye = new THREE.Group()
  eye.name = name // matched by /eye/i → rotates toward the cursor
  eye.position.set(x, 0.2, 0.84)
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 24), new THREE.MeshStandardMaterial({ color: '#f7f3ea', roughness: 0.25 }))
  // children must NOT contain "eye" in their names, or they would be rotated twice
  sclera.name = 'sclera'
  const iris = new THREE.Mesh(new THREE.SphereGeometry(0.095, 24, 16), new THREE.MeshStandardMaterial({ color: '#1d1a17', roughness: 0.3 }))
  iris.name = 'iris'
  iris.position.z = 0.135
  iris.scale.z = 0.55
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }))
  glint.name = 'glint'
  glint.position.set(0.035, 0.045, 0.19)
  eye.add(sclera, iris, glint)
  for (const m of [sclera, iris]) m.castShadow = m.receiveShadow = true
  return eye
}

function empty(name: string, pos: THREE.Vector3) {
  const o = new THREE.Object3D()
  o.name = name
  o.position.copy(pos)
  return o
}

export type Placeholder = { root: THREE.Group; update: (t: number) => void }

export function buildPlaceholder(): Placeholder {
  const root = new THREE.Group()
  root.name = 'placeholder'

  // ---- hub (the face) ----
  const hub = new THREE.Group()
  const head = new THREE.Mesh(lumpySphere(1), clay(HUB_COLOR))
  head.scale.set(1, 0.94, 0.96)
  head.castShadow = head.receiveShadow = true
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.032, 12, 32, Math.PI * 0.8), clay('#7a3524'))
  mouth.position.set(0, -0.2, 0.92)
  mouth.rotation.set(0.25, 0, Math.PI * 1.1)
  const blush = clay('#e08a74')
  const cheeks = [-0.55, 0.55].map((x) => {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 12), blush)
    c.position.set(x, -0.08, 0.78)
    c.scale.set(1, 0.6, 0.35)
    return c
  })
  hub.add(head, mouth, ...cheeks, makeEye('eye-L', -0.32), makeEye('eye-R', 0.32))
  root.add(hub)

  // ---- network: one node per role ----
  const nodes: THREE.Vector3[] = []
  for (let k = 0; k < ROLE_COUNT; k++) {
    const t = ROLE_COUNT === 1 ? 0.5 : k / (ROLE_COUNT - 1)
    const theta = THREE.MathUtils.degToRad(-62 + 124 * t)
    nodes.push(new THREE.Vector3(ORBIT_RADIUS * Math.sin(theta), NODE_HEIGHTS[k % NODE_HEIGHTS.length], ORBIT_RADIUS * Math.cos(theta) * 0.55 + 0.25))
  }

  const ringMat = new THREE.MeshStandardMaterial({ color: CREAM, roughness: 0.5 })
  const linkMat = new THREE.MeshStandardMaterial({ color: CREAM, roughness: 0.55, transparent: true, opacity: 0.75 })
  const packetMat = new THREE.MeshStandardMaterial({ color: PACKET_COLOR, emissive: PACKET_COLOR, emissiveIntensity: 2.4 })
  const curves: THREE.QuadraticBezierCurve3[] = []

  nodes.forEach((pos, k) => {
    const node = new THREE.Mesh(lumpySphere(0.3 + 0.04 * (k % 2), 0.5), clay(NODE_COLORS[k % NODE_COLORS.length]))
    node.position.copy(pos)
    node.castShadow = node.receiveShadow = true
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.018, 8, 64), ringMat)
    ring.position.copy(pos)
    ring.rotation.set(Math.PI / 2 + 0.35 * (k % 2 ? 1 : -1), 0.2 * k, 0)
    root.add(node, ring)

    // a gentle arc from the hub's surface out to the node
    const start = pos.clone().normalize().multiplyScalar(0.95)
    const mid = start.clone().lerp(pos, 0.5).add(new THREE.Vector3(0, 0.45 * Math.sign(pos.y || 1), 0))
    const curve = new THREE.QuadraticBezierCurve3(start, mid, pos)
    curves.push(curve)
    root.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.022, 8, false), linkMat))
  })

  // packets: two per link, offset in phase
  const packets = curves.flatMap((curve, k) =>
    [0, 0.5].map((phase) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), packetMat)
      root.add(m)
      return { m, curve, phase: phase + k * 0.13, speed: 0.16 + 0.03 * (k % 3) }
    }),
  )

  // ---- focus anchors (the naming contract) ----
  root.add(empty('focus-0', new THREE.Vector3(0, 0.12, 0.9)))
  nodes.forEach((pos, k) => root.add(empty(`focus-${k + 1}`, pos)))
  root.add(empty('focus-works', new THREE.Vector3(0, 0, 0)))

  const update = (t: number) => {
    hub.position.y = Math.sin(t * 0.9) * 0.05
    hub.rotation.z = Math.sin(t * 0.6) * 0.02
    for (const p of packets) {
      const u = (t * p.speed + p.phase) % 1
      p.curve.getPoint(u, p.m.position)
      p.m.scale.setScalar(Math.sin(u * Math.PI) * 1.2 + 0.2) // fade in/out at the ends
    }
  }
  update(0)

  return { root, update }
}
