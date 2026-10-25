"""
Builds Vijay's 3D character for the /3d page and exports it as a glTF binary.

An original, stylized clay bust modelled from public/foto-avatar.webp — salt-and-pepper hair
swept up and back, short beard, wide smile, beige band-collar shirt — at the centre of his
payments network (one orbiting node per role, as on the site). Nothing here is taken from
sen-3d-resume's model; only the idea (a clay bust with moving eyes) and the naming contract
the site's rig expects:

    focus-0               hero anchor (the face)
    focus-1 … focus-5     one empty per role, content.json order
    focus-works           projects anchor
    eye-L, eye-R          empties the site rotates to follow the cursor
                          (nothing else may contain "eye" in its name)

Run (Blender 4.2+ / 5.x, either as `blender -b -P` or with the `bpy` pip module):
    python blender/build_vijay.py --out public/models/me.glb [--blend blender/vijay.blend] [--preview DIR]

Coordinates: Blender is Z-up with the face looking down -Y. The glTF exporter converts that to
the site's Y-up / +Z-forward. All tunables are plain constants below.
"""
import math
import random
import sys

import bpy  # noqa: I001 — must come first: bmesh and mathutils load through it in the pip build
import bmesh
from mathutils import Matrix, Vector, noise

# ---- look --------------------------------------------------------------------------------
SKIN = (0.64, 0.42, 0.30)          # warm medium brown (sRGB); the site's lighting is bright
SKIN_SHADOW = (0.54, 0.34, 0.24)
LIPS = (0.60, 0.33, 0.28)
HAIR_DARK = (0.16, 0.16, 0.16)
HAIR_SILVER = (0.66, 0.65, 0.63)
BEARD_DARK = (0.22, 0.21, 0.20)
BEARD_LIGHT = (0.62, 0.60, 0.57)
BROW = (0.13, 0.12, 0.12)
IRIS = (0.20, 0.12, 0.08)
SCLERA = (0.97, 0.95, 0.91)
MOUTH = (0.30, 0.10, 0.09)
TEETH = (0.96, 0.94, 0.88)
SHIRT = (0.70, 0.58, 0.45)         # beige band-collar shirt
SHIRT_SHADE = (0.60, 0.49, 0.37)
TEE = (0.95, 0.94, 0.92)
BUTTON = (0.42, 0.29, 0.19)
NODE_COLORS = [(0.91, 0.76, 0.25), (0.36, 0.78, 0.84), (0.55, 0.63, 0.35), (0.91, 0.54, 0.36), (0.42, 0.56, 0.71)]
CREAM = (0.96, 0.95, 0.92)
PACKET = (1.0, 0.85, 0.70)

VOXEL = 0.022                      # clay resolution (smaller = finer, heavier)

# role-stop framing on the site, stored as glTF extras on each focus-k empty (see src/three/Scene.tsx):
# how far the camera sits from the node, how far left of centre the node is pushed, and camera height
CAMERA_DISTANCE = 6.4
CAMERA_OFFSET = 1.5                 # nodes on his right: the head is already left of the node,
CAMERA_OFFSET_RIGHT = 0.45          # so push less or it leaves the frame
CAMERA_LIFT = 0.7
SEED = 7

# network, in three.js coords: like the site's placeholder, but the nodes orbit the head and
# shoulders (not in front of the chest), so each role's camera stop frames a node beside the face
ORBIT_RADIUS = 2.9
NODE_HEIGHTS = [1.45, -0.35, 1.85, -0.6, 1.15, 0.2]
ROLE_COUNT = 5


def three(x, y, z):
    """three.js (Y-up, +Z toward the viewer) → Blender (Z-up, -Y toward the viewer)."""
    return Vector((x, -z, y))


# ---- helpers -----------------------------------------------------------------------------
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(SEED)


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def ellipsoid(name, r, loc=(0, 0, 0), scale=(1, 1, 1), rot=None, quat=None, seg=48, rings=32):
    """A sphere stretched by scale, then rotated (euler or quaternion), then moved to loc.
    All transforms are applied, so every part's vertices are in world space (origin at 0)."""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=rings, location=(0, 0, 0))
    o = bpy.context.object
    o.name = name
    o.scale = scale
    if quat is not None:
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = quat
    elif rot is not None:
        o.rotation_euler = rot
    o.location = loc
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return o


def capsule(name, a, b, r):
    """A rounded rod from a to b (cylinder + two caps), for brows, bridges and limbs."""
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d.length, vertices=24, location=(0, 0, 0))
    cyl = bpy.context.object
    cyl.rotation_mode = 'QUATERNION'
    cyl.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    cyl.location = (a + b) / 2
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    caps = [ellipsoid(name + '_c', r, p, seg=24, rings=16) for p in (a, b)]
    out = join([cyl, *caps])
    out.name = name
    return out


def select_only(objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]


def join(objs):
    select_only(objs)
    bpy.ops.object.join()
    return bpy.context.object


def apply_mod(obj, kind, **props):
    m = obj.modifiers.new(kind.lower(), kind)
    for k, v in props.items():
        setattr(m, k, v)
    select_only([obj])
    bpy.ops.object.modifier_apply(modifier=m.name)


def clay(obj, voxel=VOXEL, smooth=6, keep=0.45):
    """Merge overlapping parts into one soft surface: voxel remesh, relax, then thin out."""
    apply_mod(obj, 'REMESH', mode='VOXEL', voxel_size=voxel)
    apply_mod(obj, 'LAPLACIANSMOOTH', iterations=smooth, lambda_factor=0.6, use_volume_preserve=True)
    if keep < 1:
        apply_mod(obj, 'DECIMATE', ratio=keep)
    select_only([obj])
    bpy.ops.object.shade_smooth()
    return obj


def boolean(obj, cutter, op='DIFFERENCE'):
    apply_mod(obj, 'BOOLEAN', operation=op, object=cutter, solver='EXACT')
    bpy.data.objects.remove(cutter, do_unlink=True)


def paint(obj, fn):
    """Per-vertex colour from fn(world_co, normal) -> (r, g, b) in sRGB."""
    me = obj.data
    attr = me.color_attributes.get('Col') or me.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
    mw = obj.matrix_world
    for i, v in enumerate(me.vertices):
        c = fn(mw @ v.co, (mw.to_3x3() @ v.normal).normalized())
        attr.data[i].color_srgb = (*c, 1.0)
    me.color_attributes.active_color = attr


def solid(obj, rgb):
    paint(obj, lambda co, n: rgb)


_materials = {}


def material(name, rough=0.62, emit=0.0):
    """Clay material whose base colour comes from the vertex colours (exported as COLOR_0)."""
    key = (name, rough, emit)
    if key in _materials:
        return _materials[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    vc = nt.nodes.new('ShaderNodeVertexColor')
    vc.layer_name = 'Col'
    nt.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = rough
    if emit:
        nt.links.new(vc.outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = emit
    _materials[key] = m
    return m


def finish(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    select_only([obj])
    bpy.ops.object.shade_smooth()
    return obj


def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def sstep(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def surface_y(obj, x, z, default=-1.0):
    """Where a ray fired from the front at (x, z) first hits obj — for seating parts on the face."""
    hit, loc, *_ = obj.ray_cast(Vector((x, -5, z)), Vector((0, 1, 0)))
    return loc.y if hit else default


def empty(name, loc, parent=None):
    o = link(bpy.data.objects.new(name, None))
    o.location = loc
    o.empty_display_size = 0.15
    if parent:
        o.parent = parent
    return o


# ---- the head ----------------------------------------------------------------------------
EYE_X, EYE_Z = 0.33, 0.17           # eye centres, ±x
MOUTH_Z = -0.42
SMILE_CURVE = 1.4                   # how far the mouth corners turn up
EYE_SURFACE = {}                    # face surface y at each eye, filled by build_head
MOUTH_SURFACE = {}


def build_head():
    parts = [
        ellipsoid('cranium', 1.0, (0, 0.02, 0.05), (0.90, 0.95, 1.04)),
        ellipsoid('jaw', 0.74, (0, -0.12, -0.42), (1.08, 1.0, 0.92)),
        ellipsoid('chin', 0.30, (0, -0.56, -0.86), (1.25, 0.9, 0.85)),
        *[ellipsoid('cheek', 0.30, (s * 0.45, -0.58, -0.20), (1.0, 0.85, 0.9)) for s in (-1, 1)],
        ellipsoid('brow_ridge', 0.5, (0, -0.55, 0.40), (1.4, 0.55, 0.32)),
        # nose: bridge, a broad rounded tip, and the wings
        capsule('bridge', (0, -0.86, 0.26), (0, -0.98, -0.02), 0.085),
        ellipsoid('tip', 0.17, (0, -1.0, -0.06), (1.2, 1.0, 0.95)),
        *[ellipsoid('wing', 0.105, (s * 0.15, -0.9, -0.13), (1.0, 0.9, 0.85)) for s in (-1, 1)],
        # ears
        *[ellipsoid('ear', 0.27, (s * 0.88, 0.02, 0.02), (0.32, 0.55, 1.0), rot=(0, s * 0.25, 0)) for s in (-1, 1)],
        # neck
        capsule('neck', (0, 0.12, -0.7), (0, 0.16, -1.5), 0.47),
    ]
    head = clay(join(parts), keep=0.35)
    head.name = 'head'

    # eye sockets; the eyes are seated from the same surface points (see build_eyes)
    for s in (-1, 1):
        y = surface_y(head, s * EYE_X, EYE_Z)
        EYE_SURFACE[s] = y
        boolean(head, ellipsoid('socket', 0.17, (s * EYE_X, y + 0.08, EYE_Z), (1.05, 0.9, 0.95)))

    # the smile: a crescent — flatter upper edge, deeper lower edge, corners curving up
    y = surface_y(head, 0, MOUTH_Z)
    MOUTH_SURFACE[0] = y
    cut = ellipsoid('smile', 1.0, (0, y, MOUTH_Z), (0.33, 0.30, 0.075), seg=64, rings=32)
    for v in cut.data.vertices:
        lz = v.co.z - MOUTH_Z
        if lz < 0:
            lz *= 1 + 1.4 * max(0.0, 1 - (v.co.x / 0.33) ** 2)
        v.co.z = MOUTH_Z + lz + SMILE_CURVE * v.co.x ** 2
    boolean(head, cut)
    select_only([head])
    bpy.ops.object.shade_smooth()

    def skin(co, n):
        x, y, z = co
        c = SKIN
        # a touch of shadow under the cheeks and on the neck
        c = mix(c, SKIN_SHADOW, sstep(-0.9, -1.4, z) * 0.6 + sstep(0.2, 0.7, y) * 0.25)
        # lips: a band hugging the mouth line
        lip = 1 - sstep(0.0, 0.05, abs(z - (MOUTH_Z + SMILE_CURVE * x * x)) - 0.075) if abs(x) < 0.36 and y < -0.6 else 0
        c = mix(c, LIPS, lip * 0.7)
        # beard and stubble: jaw, chin, lower cheeks and a light moustache, salt-and-pepper
        jaw = sstep(-0.32, -0.52, z) * (1 - sstep(0.1, 0.45, y)) * (1 - sstep(-1.0, -1.18, z))
        stache = (1 - sstep(0.05, 0.1, abs(z - (MOUTH_Z + 0.16 + SMILE_CURVE * x * x)))) * (1 - sstep(0.26, 0.36, abs(x))) * (y < -0.7)
        side = sstep(0.6, 0.82, abs(x)) * sstep(-0.12, -0.35, z) * (1 - sstep(0.25, 0.5, y))
        beard = max(jaw, stache * 0.8, side * 0.9) * (1 - lip)
        speck = noise.noise(Vector((x * 70, y * 70, z * 70)))
        chin = sstep(-0.6, -0.85, z)                       # darker, denser at the chin
        hair_c = mix(BEARD_DARK, BEARD_LIGHT, 0.45 + 0.8 * speck - 0.15 * chin)
        return mix(c, hair_c, beard * (0.55 + 0.2 * chin))

    paint(head, skin)
    return finish(head, material('skin', rough=0.6))


def build_mouth(head):
    """Dark mouth interior and the upper teeth, seated behind the smile opening."""
    y = MOUTH_SURFACE[0]
    inside = ellipsoid('mouth_inside', 1.0, (0, y + 0.16, MOUTH_Z - 0.03), (0.31, 0.10, 0.12))
    for v in inside.data.vertices:
        v.co.z += SMILE_CURVE * v.co.x ** 2
    solid(inside, MOUTH)
    finish(inside, material('mouth', rough=0.8))

    # upper teeth, tucked just under the upper edge of the smile
    teeth = ellipsoid('teeth', 1.0, (0, y + 0.07, MOUTH_Z + 0.025), (0.25, 0.07, 0.042), seg=48, rings=16)
    for v in teeth.data.vertices:
        v.co.z += SMILE_CURVE * v.co.x ** 2
    solid(teeth, TEETH)
    finish(teeth, material('teeth', rough=0.25))
    return [inside, teeth]


def build_eyes(head):
    """Eyeballs on empties named eye-L / eye-R (the site rotates those), plus static upper lids."""
    out = []
    for s, side in ((-1, 'L'), (1, 'R')):
        ctr = Vector((s * EYE_X, EYE_SURFACE[s] + 0.085, EYE_Z))
        pivot = empty(f'eye-{side}', ctr)
        sclera = ellipsoid(f'sclera.{side}', 0.14, ctr, seg=32, rings=24)
        iris = ellipsoid(f'iris.{side}', 0.075, ctr + Vector((0, -0.11, 0.0)), (1, 0.45, 1), seg=24, rings=16)
        pupil = ellipsoid(f'pupil.{side}', 0.036, ctr + Vector((0, -0.136, 0.0)), (1, 0.4, 1), seg=16, rings=12)
        glint = ellipsoid(f'glint.{side}', 0.016, ctr + Vector((0.028, -0.142, 0.03)), seg=12, rings=8)
        solid(sclera, SCLERA); finish(sclera, material('sclera', rough=0.2))
        solid(iris, IRIS); finish(iris, material('iris', rough=0.3))
        solid(pupil, (0.03, 0.03, 0.03)); finish(pupil, material('pupil', rough=0.2))
        solid(glint, (1, 1, 1)); finish(glint, material('glint', rough=0.1, emit=1.5))
        for part in (sclera, iris, pupil, glint):
            part.parent = pivot
            part.matrix_parent_inverse = pivot.matrix_world.inverted()

        # smiling eyes: an upper lid shell over the top of the eye, tilted down at the outer corner
        # smiling eyes: an upper lid over the top, a lower lid pushed up by the cheek
        lids = []
        for upper in (True, False):
            lid = ellipsoid(f'lid.{side}', 0.147, ctr, seg=32, rings=24)
            bm = bmesh.new(); bm.from_mesh(lid.data)
            bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
                                   plane_co=ctr + Vector((0, 0, 0.075 if upper else -0.088)),
                                   plane_no=(0, 0, 1 if upper else -1), clear_inner=True)
            # upper: tilt forward, outer corner lower; lower: tilt up and forward
            tilt = (Matrix.Rotation(0.12, 3, 'X') @ Matrix.Rotation(0.12 * s, 3, 'Y')) if upper else Matrix.Rotation(-0.12, 3, 'X')
            bmesh.ops.rotate(bm, verts=bm.verts, cent=ctr, matrix=tilt)
            bm.to_mesh(lid.data); bm.free()
            apply_mod(lid, 'SOLIDIFY', thickness=0.02)
            lids.append(lid)
        lid = join(lids)
        lid.name = f'lid.{side}'
        solid(lid, SKIN); finish(lid, material('skin', rough=0.6))
        # brows: thick, nearly straight, dark
        beads = []
        for i in range(12):
            t = i / 11
            bx = s * (0.12 + 0.40 * t)
            bz = EYE_Z + 0.20 + 0.045 * math.sin(math.pi * min(1.0, t * 1.15))
            by = surface_y(head, bx, bz, default=-0.8) + 0.012
            beads.append(ellipsoid('bead', 0.064 * (1 - 0.4 * t), (bx, by, bz), (1.0, 0.55, 0.78), seg=16, rings=10))
        brow = clay(join(beads), voxel=0.01, smooth=4, keep=0.5)
        brow.name = f'brow.{side}'
        solid(brow, BROW); finish(brow, material('hair', rough=0.75))
        out += [pivot, lid, brow]
    return out


# ---- hair --------------------------------------------------------------------------------
def build_hair(head):
    """Combed-back hair: a smooth clay mass (cap + the quiff at the front-top + fuller sides),
    then grooves pressed in along lines running front to back over the head — the way hair
    combed straight back falls — with silver streaks following the same lines."""
    cap = ellipsoid('cap', 1.0, (0, 0.02, 0.16), (0.95, 1.02, 1.08))
    bm = bmesh.new(); bm.from_mesh(cap.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < hairline(v.co.x, v.co.y)], context='VERTS')
    bm.to_mesh(cap.data); bm.free()
    apply_mod(cap, 'SOLIDIFY', thickness=0.13)
    parts = [
        cap,
        # the quiff: volume swept up off the forehead, a little toward his right
        ellipsoid('quiff', 1.0, (0.06, -0.42, 0.98), (0.72, 0.62, 0.36), rot=(0.35, 0.0, 0.05)),
        ellipsoid('crown', 1.0, (0.0, 0.15, 1.02), (0.78, 0.85, 0.32)),
    ]
    hair = clay(join(parts), voxel=0.02, smooth=10, keep=1.0)
    hair.name = 'hair'

    # lines of constant angle around the front-back (y) axis are the comb lines
    def across(co):
        return math.atan2(co.x, co.z - 0.05)

    me = hair.data
    for v in me.vertices:
        co = v.co
        a = across(co) + 0.06 * noise.noise(Vector((co.x * 3, co.y * 1.2, co.z * 3)))
        groove = 0.5 + 0.5 * math.cos(a * 34)                    # 1 on a ridge, 0 in a groove
        depth = 0.026 * (1 - sstep(0.75, 1.05, abs(co.x))) # softer at the sides, kept short
        v.co += v.normal * (groove - 0.5) * depth
    apply_mod(hair, 'LAPLACIANSMOOTH', iterations=2, lambda_factor=0.5, use_volume_preserve=True)
    apply_mod(hair, 'DECIMATE', ratio=0.35)
    select_only([hair]); bpy.ops.object.shade_smooth()

    def color(co, n):
        x, y, z = co
        a = across(co)
        strand = noise.noise(Vector((a * 16, y * 1.6, 0.0)))     # streaks along the comb lines
        groove = 0.5 + 0.5 * math.cos((a + 0.06 * noise.noise(Vector((x * 3, y * 1.2, z * 3)))) * 34)
        temples = sstep(0.42, 0.78, abs(x)) * (1 - sstep(0.45, 0.95, z))     # silver at the sides
        silver = 0.16 + 0.55 * temples + 0.42 * max(0.0, strand) + 0.10 * groove
        return mix(HAIR_DARK, HAIR_SILVER, silver)

    paint(hair, color)
    return finish(hair, material('hair', rough=0.75))


def hairline(x, y):
    """Height (z) of the hairline around the head: high on the forehead, low at the ears and nape."""
    front = sstep(0.0, -0.8, y)
    sides = sstep(0.55, 0.9, abs(x))
    return 0.50 * front + (0.05 - 0.25 * sides) * (1 - front) - 0.30 * sstep(0.2, 0.9, y)


# ---- body --------------------------------------------------------------------------------
def build_body():
    parts = [
        ellipsoid('chest', 1.0, (0, 0.22, -2.25), (1.5, 0.9, 0.95)),
        *[ellipsoid('shoulder', 0.6, (s * 1.25, 0.25, -1.98), (1.05, 0.95, 0.75)) for s in (-1, 1)],
        *[capsule('arm', (s * 1.5, 0.3, -2.1), (s * 1.75, 0.35, -3.3), 0.42) for s in (-1, 1)],
    ]
    body = clay(join(parts), voxel=0.035, smooth=10, keep=0.3)
    body.name = 'shirt'
    # cut off flat at the bottom and make room for the neck
    bm = bmesh.new(); bm.from_mesh(body.data)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, -3.15), plane_no=(0, 0, 1), clear_inner=True)
    bm.to_mesh(body.data); bm.free()
    boolean(body, ellipsoid('neckhole', 0.52, (0, 0.14, -1.42), (1.0, 1.0, 0.8)))

    def color(co, n):
        x, y, z = co
        folds = noise.noise(Vector((x * 3, y * 3, z * 6)))
        shade = sstep(0.0, 0.9, y) * 0.5 + max(0.0, folds) * 0.35
        return mix(SHIRT, SHIRT_SHADE, shade)

    paint(body, color)
    finish(body, material('shirt', rough=0.85))

    # band collar, open at the front, the white tee showing in the gap, placket and buttons
    bpy.ops.mesh.primitive_torus_add(major_radius=0.53, minor_radius=0.06, location=(0, 0.14, -1.42), major_segments=64, minor_segments=12)
    collar = bpy.context.object; collar.name = 'collar'
    collar.scale = (1.0, 0.95, 1.6)
    select_only([collar]); bpy.ops.object.transform_apply(scale=True)
    bm = bmesh.new(); bm.from_mesh(collar.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y < -0.25 and abs(v.co.x) < 0.09], context='VERTS')
    bm.to_mesh(collar.data); bm.free()
    solid(collar, SHIRT); finish(collar, material('shirt', rough=0.85))

    tee = ellipsoid('tee', 0.22, (0, -0.3, -1.55), (0.85, 0.45, 0.8))
    solid(tee, TEE); finish(tee, material('tee', rough=0.8))

    strips = []
    for z in [-1.68 - 0.03 * i for i in range(48)]:
        strips.append(ellipsoid('placket', 1.0, (0, surface_y(body, 0.0, z, default=-0.7) + 0.004, z), (0.07, 0.018, 0.05), seg=12, rings=6))
    placket = clay(join(strips), voxel=0.012, smooth=8, keep=0.4)
    placket.name = 'placket'
    solid(placket, SHIRT_SHADE); finish(placket, material('shirt', rough=0.85))

    buttons = []
    for z in (-1.85, -2.3, -2.75):
        y = surface_y(body, 0.0, z, default=-0.7)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.03, vertices=20, location=(0, y - 0.03, z), rotation=(math.pi / 2, 0, 0))
        b = bpy.context.object; b.name = 'button'
        solid(b, BUTTON); finish(b, material('button', rough=0.4))
        buttons.append(b)
    return [body, collar, tee, placket, *buttons]


# ---- network -----------------------------------------------------------------------------
def build_network():
    out = []
    for k in range(ROLE_COUNT):
        t = k / (ROLE_COUNT - 1)
        th = math.radians(-62 + 124 * t)
        pos = three(ORBIT_RADIUS * math.sin(th), NODE_HEIGHTS[k % len(NODE_HEIGHTS)], ORBIT_RADIUS * math.cos(th) * 0.55 + 0.25)

        node = clay(ellipsoid('node', 0.32 + 0.03 * (k % 2), pos, seg=32, rings=24), voxel=0.03, smooth=2, keep=0.4)
        node.name = f'node-{k + 1}'
        rng = random.Random(k)
        base = NODE_COLORS[k % len(NODE_COLORS)]
        paint(node, lambda co, n, b=base: mix(b, (b[0] * 0.8, b[1] * 0.8, b[2] * 0.8), 0.5 + 0.5 * noise.noise(co * 6)))
        finish(node, material('node', rough=0.62))

        bpy.ops.mesh.primitive_torus_add(major_radius=0.5, minor_radius=0.018, location=pos, major_segments=64, minor_segments=8,
                                         rotation=(0.35 * (1 if k % 2 else -1), 0.2 * k, rng.uniform(0, 1)))
        ring = bpy.context.object; ring.name = f'ring-{k + 1}'
        solid(ring, CREAM); finish(ring, material('cream', rough=0.5))

        # an arc from the head's surface out to the node, with two glowing packets on it
        start = Vector((pos.x * 0.22, 0.45, pos.z * 0.22 + 0.1))   # inside the back of the head
        mid = (start + pos) / 2 + Vector((0, 0, 0.45 if pos.z >= 0 else -0.45))
        curve = bpy.data.curves.new(f'link-{k + 1}', 'CURVE')
        curve.dimensions = '3D'; curve.bevel_depth = 0.022; curve.bevel_resolution = 3
        sp = curve.splines.new('BEZIER'); sp.bezier_points.add(2)
        for bp, p in zip(sp.bezier_points, (start, mid, pos)):
            bp.co = p; bp.handle_left_type = bp.handle_right_type = 'AUTO'
        cobj = link(bpy.data.objects.new(f'link-{k + 1}', curve))
        select_only([cobj]); bpy.ops.object.convert(target='MESH')
        solid(cobj, CREAM); finish(cobj, material('cream', rough=0.5))

        for u in (0.33, 0.7):
            q = (1 - u) ** 2 * start + 2 * (1 - u) * u * mid + u * u * pos
            pk = ellipsoid('packet', 0.05, q, seg=12, rings=8)
            solid(pk, PACKET); finish(pk, material('packet', rough=0.3, emit=3.0))
            out.append(pk)
        out += [node, ring, cobj]
        anchor = empty(f'focus-{k + 1}', pos)
        anchor['cameraDistance'] = CAMERA_DISTANCE
        anchor['cameraOffset'] = CAMERA_OFFSET if pos.x < 0 else CAMERA_OFFSET_RIGHT
        anchor['cameraLift'] = CAMERA_LIFT
    return out


# ---- preview + export --------------------------------------------------------------------
def preview(dirpath):
    scene = bpy.context.scene
    world = bpy.data.worlds.new('w'); scene.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.42, 0.52, 0.48, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.8
    key = link(bpy.data.objects.new('key', bpy.data.lights.new('key', 'SUN')))
    key.data.energy = 3.2; key.data.color = (1, 0.88, 0.8); key.rotation_euler = (0.9, 0.35, 0.6)
    fill = link(bpy.data.objects.new('fill', bpy.data.lights.new('fill', 'SUN')))
    fill.data.energy = 1.4; fill.data.color = (0.7, 0.8, 1); fill.rotation_euler = (1.1, -0.4, -2.2)
    cam = link(bpy.data.objects.new('preview-cam', bpy.data.cameras.new('preview-cam')))
    cam.data.lens = 75
    scene.camera = cam
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 24
    scene.render.resolution_x, scene.render.resolution_y = 560, 700
    shots = {'front': ((0, -9.5, -0.35), (0, 0, -0.45)), 'three-quarter': ((5.6, -7.4, 0.4), (0, 0, -0.4)), 'face': ((0, -5.2, 0.05), (0, 0, -0.05))}
    for name, (loc, target) in shots.items():
        cam.location = loc
        cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = f'{dirpath}/{name}.png'
        bpy.ops.render.render(write_still=True)
    for o in (key, fill, cam):
        bpy.data.objects.remove(o, do_unlink=True)


def main():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    args = dict(zip(argv[::2], argv[1::2]))
    reset()
    head = build_head()
    build_mouth(head)
    build_eyes(head)
    build_hair(head)
    build_body()
    build_network()
    empty('focus-0', three(0, 0.12, 0.9))
    empty('focus-works', three(0, 0, 0))

    if '--preview' in args:
        preview(args['--preview'])
    if '--blend' in args:
        bpy.ops.wm.save_as_mainfile(filepath=args['--blend'])
    out = args.get('--out', 'me.glb')
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_cameras=False, export_lights=False,
                              export_apply=True, export_yup=True, export_extras=True)
    tris = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
    print(f'[build_vijay] wrote {out} · {len([o for o in bpy.data.objects if o.type == "MESH"])} meshes · {tris} faces')


if __name__ == '__main__':
    main()
