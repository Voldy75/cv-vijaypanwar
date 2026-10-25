/**
 * Shared between the /3d page (HTML) and the 3D scene, so both agree on the camera stops.
 *
 * Stops, in scroll order:  focus-0 (hero) → focus-1 … focus-M (one per role) → focus-works (projects)
 * M comes from content.json, so adding a role adds a camera stop.
 */
import { content } from '../content'

export const ROLE_POINTS = content.roles.map((_, i) => `focus-${i + 1}`)
export const ROLE_COUNT = ROLE_POINTS.length

/** Drop a model here to replace the placeholder. Contract: docs in README → "Your own 3D model". */
export const MODEL_URL = '/models/me.glb'

/** glb camera animations are authored at 24fps with each role 50 frames apart (same convention as sen-3d-resume). */
export const FPS = 24
export const FRAMES_PER_NODE = 50

/** A timeline entry "arrives" when its top reaches this fraction of the viewport height. */
export const NODE_LINE = 0.3

/** Backdrop gradient, sage → sand (sen-3d-resume's palette). Keep in step with .td-stage in index.css and the /3d theme colour in index.html. */
export const SKY = { top: '#6f906f', bottom: '#dbd3b5' }
