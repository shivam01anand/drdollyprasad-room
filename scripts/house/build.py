"""
The house — Dr Dolly Prasad's studio-house, built in Blender.

    blender -b -P scripts/house/build.py -- <out dir> [--render=a,b] [--spp=96] [--res=1440] [--save=1]

A gallery inside a Delhi home, in three spaces seen one through the next:

  the Aangan     a courtyard garden open to the sky: the floral works,
                 "Woman with Poppies" on the far wall, bougainvillea over it
  the Quiet Room through the arch: "Buddha Under the Bodhi Tree" under one
                 light, "The Blue Buddha", "Threads of Faith"; a high slit
                 lets the afternoon in through a peepal
  the Red Room   by the lane: "The Bullocks" on a red wall, "Shree 420",
                 "Three Women in Red", "Terracotta"; the turquoise door ajar

The architecture is a quiet ground: lime plaster, deep reveals, softened
edges, a few things that belong. Every canvas has wall around it and light
on it. Units are metres; Blender axes: x east, y north, z up. Afternoon sun
from the west-south-west.

Everything the site needs is named: Wall_*/Floor_*/Ceil_* carry a material
role ("role:wall"), Art_<id> the canvases, Prop_* the things that tumble
when the room is shaken, Foliage_* the leaves, Cam_<chapter> the views;
house.json records what the site cannot read from the geometry.
"""
import json
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]
opt = dict(a.split("=", 1) for a in argv[1:] if "=" in a)
RENDER = [s for s in opt.get("--render", "").split(",") if s]
SPP = int(opt.get("--spp", 96))
RES = int(opt.get("--res", 1440))
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PUB = os.path.join(ROOT, "public")
ART = os.path.expanduser("~/Desktop/dolly-prasad-study/images-final")
PH = os.path.join(ROOT, "assets", "polyhaven")
HT = os.path.join(ROOT, "assets", "house-tex")
os.makedirs(OUT, exist_ok=True)
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "METAL"
prefs.get_devices()
for d in prefs.devices:
    d.use = True
sc.cycles.device = "GPU"
sc.cycles.samples = SPP
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 10
sc.cycles.diffuse_bounces = 6
sc.cycles.transparent_max_bounces = 16
sc.view_settings.view_transform = "AgX"
sc.view_settings.look = "AgX - Base Contrast"
sc.view_settings.exposure = float(opt.get("--exposure", 0.0))

T = 0.45            # wall thickness
H_ROOM = 3.6        # the rooms
H_AANGAN = 4.3      # the courtyard's walls, open to the sky

INFO = {"roles": {}, "art": {}, "props": [], "colliders": [], "cams": {}, "lights": {}, "anchors": {}}

# ====================================================================== materials
_img = {}


def img(path, colour=True):
    if path not in _img:
        im = bpy.data.images.load(path, check_existing=True)
        im.colorspace_settings.name = "sRGB" if colour else "Non-Color"
        _img[path] = im
    return _img[path]


def lin(h):
    c = [((h >> s) & 255) / 255 for s in (16, 8, 0)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


# the site's material roles (lib/room/materials.ts SPECS): set, tint, tile
SITE = {
    "wall": ("plaster", (1.8, 1.73, 1.52), 2.0),
    "wallShade": ("plaster", (1.42, 1.32, 1.2), 2.0),
    "field": ("plaster", (0.66, 0.135, 0.07), 2.0),
    "court": ("plaster", (1.84, 1.8, 1.6), 2.4),
    "floor": ("floor", lin(0xF3EBE0), 2.8),
    "stone": ("floor", lin(0xE2D6C4), 1.6),
    "sandstone": ("sandstone", lin(0xF2DCC0), 1.4),
    "timber": ("timber", (1.25, 1.1, 0.95), 2.0),
    "door": ("door", (1.85, 1.85, 1.78), 1.15),
    "artFrame": ("timber", (0.30, 0.205, 0.14), 0.9),
    "teak": ("teak", (0.86, 0.77, 0.67), 0.9),
    "teakRail": ("teak", (0.86, 0.77, 0.67), 0.9),
    "courtFloor": ("terracotta", (1.25, 0.95, 0.78), 2.08),
    "iron": ("iron", lin(0x8A8178), 0.55),
    "ironDark": ("iron", lin(0x4A433D), 0.6),
    "clay": ("plaster", lin(0xD27A50), 0.7),
}


def role_mat(role):
    """a photographed surface laid in metres by box projection, as the site's worldUV lays it"""
    name = f"role:{role}"
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    tex_set, tint, tile = SITE[role]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / tile,) * 3
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])

    def tex(kind, colour):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = img(os.path.join(PUB, "tex", f"{tex_set}_{kind}.webp"), colour)
        t.projection = "BOX"
        t.projection_blend = 0.2
        nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
        return t

    d = tex("diff", True)
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs[0].default_value = 1.0
    nt.links.new(d.outputs["Color"], mix.inputs[6])
    mix.inputs[7].default_value = (*tint, 1.0)
    nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    a = tex("arm", False)
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(a.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs["Green"], b.inputs["Roughness"])
    if role in ("iron", "ironDark"):
        b.inputs["Metallic"].default_value = 0.8
    if role in ("door", "teak"):
        mp.inputs["Rotation"].default_value = (math.pi / 2, 0, 0)
    # normal maps stay out of the bake (the site adds them live); renders get them
    if opt.get("--normals", "1") == "1":
        n = tex("nor", False)
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nm.inputs["Strength"].default_value = 0.6
        nt.links.new(n.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m


def flat(name, rgb, rough=0.9, metal=0.0):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


def cutout(name, path, translucency=0.25, rough=0.6):
    """a leaf or flower card: colour and alpha from an RGBA image, light through it"""
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    out = nt.nodes["Material Output"]
    b = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = img(path, True)
    t.image.alpha_mode = "STRAIGHT"
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    tr = nt.nodes.new("ShaderNodeBsdfTranslucent")
    nt.links.new(t.outputs["Color"], tr.inputs["Color"])
    mx = nt.nodes.new("ShaderNodeMixShader")
    mx.inputs[0].default_value = translucency
    nt.links.new(b.outputs["BSDF"], mx.inputs[1])
    nt.links.new(tr.outputs["BSDF"], mx.inputs[2])
    tp = nt.nodes.new("ShaderNodeBsdfTransparent")
    ma = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(t.outputs["Alpha"], ma.inputs[0])
    nt.links.new(tp.outputs["BSDF"], ma.inputs[1])
    nt.links.new(mx.outputs["Shader"], ma.inputs[2])
    nt.links.new(ma.outputs["Shader"], out.inputs["Surface"])
    # the exporter reads alpha from the Principled node
    nt.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
    return m


M_CANVAS_EDGE = flat("canvasEdge", (0.62, 0.58, 0.52), 0.9)     # raw linen round the stretcher
M_BRASS = flat("brass", lin(0xB98B4B), 0.32, 1.0)
M_ALU = flat("aluminium", lin(0xA8A49B), 0.36, 1.0)
M_STEM = flat("stem", lin(0x6F7F3C), 0.7)
_jute = []


def jute_mat():
    if _jute:
        return _jute[0]
    m = bpy.data.materials.new("jute")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (3.2, 3.2, 3.2)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = img(os.path.join(HT, "jute_weave.png"), True)
    t.projection = "BOX"
    nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.95
    _jute.append(m)
    return m


# ====================================================================== geometry helpers
def link(o):
    if o.name not in sc.collection.objects:
        sc.collection.objects.link(o)
    return o


def box(name, x0, x1, y0, y1, z0, z1, mat, bevel=0.03, segs=2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    o = bpy.context.active_object
    o.name = name
    o.scale = (x1 - x0, y1 - y0, z1 - z0)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(mat)
    if bevel:
        bv = o.modifiers.new("soft", "BEVEL")
        bv.width = bevel
        bv.segments = segs
        bv.limit_method = "ANGLE"
    return o


def cutter(kind, cx, cy, w, h, z0, depth, axis):
    """an opening's volume: 'arch' (a box to the springing line, a half-cylinder
    above) or 'rect'. axis 'x' cuts a north-south wall, 'y' an east-west one."""
    spring = h - w / 2 if kind == "arch" else h
    sx, sy = (depth, w) if axis == "x" else (w, depth)
    INFO.setdefault("openings", []).append([cx - sx / 2, cx + sx / 2, cy - sy / 2, cy + sy / 2, z0, z0 + h])
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, z0 + spring / 2 - 0.02))
    b = bpy.context.active_object
    b.scale = (sx, sy, spring + 0.04)
    bpy.ops.object.transform_apply(scale=True)
    pieces = [b]
    if kind == "arch":
        rot = (0, math.pi / 2, 0) if axis == "x" else (math.pi / 2, 0, 0)
        bpy.ops.mesh.primitive_cylinder_add(vertices=72, radius=w / 2, depth=depth, location=(cx, cy, z0 + spring), rotation=rot)
        pieces.append(bpy.context.active_object)
    for c in pieces:
        c.hide_render = True
        c.hide_set(True)
        c.name = "cutter"
    return pieces


def cut(target, pieces):
    """every opening is cut before the softening bevel, so its edges are softened too"""
    bevel = target.modifiers.get("soft")
    if bevel:
        target.modifiers.remove(bevel)
    for c in pieces:
        m = target.modifiers.new("cut", "BOOLEAN")
        m.object = c
        m.operation = "DIFFERENCE"
        m.solver = "EXACT"
    if bevel:
        bv = target.modifiers.new("soft", "BEVEL")
        bv.width = 0.03
        bv.segments = 2
        bv.limit_method = "ANGLE"


def collider(x0, x1, y0, y1, z0, z1):
    INFO["colliders"].append([x0, x1, y0, y1, z0, z1])


def wall(name, x0, x1, y0, y1, z0, z1, role, openings=()):
    o = box(f"Wall_{name}", x0, x1, y0, y1, z0, z1, role_mat(role))
    for op in openings:
        cut(o, cutter(*op))
    collider(x0, x1, y0, y1, z0, z1)
    return o


def floor(name, x0, x1, y0, y1, role, z=0.0, lm=1.0):
    o = box(f"Floor_{name}", x0, x1, y0, y1, z - 0.2, z, role_mat(role), bevel=0)
    o["lm"] = lm
    return o


def lathe(name, profile, mat, segs=48, loc=(0, 0, 0)):
    """revolve (radius, height) points about z"""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    rings = []
    for r, z in profile:
        rings.append([bm.verts.new((r * math.cos(2 * math.pi * k / segs), r * math.sin(2 * math.pi * k / segs), z))
                      for k in range(segs)])
    for a, b in zip(rings, rings[1:]):
        for k in range(segs):
            try:
                bm.faces.new((a[k], a[(k + 1) % segs], b[(k + 1) % segs], b[k]))
            except ValueError:
                pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    o.location = loc
    o.data.materials.append(mat)
    return link(o)


def join(name, objs):
    """join parts built around the world origin; the result's origin is the world origin,
    so placing it afterwards moves the whole thing as built"""
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = objs[0]
    o.name = name
    sc.cursor.location = (0, 0, 0)
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    return o


def register_prop(o, mass):
    o["mass"] = mass
    INFO["props"].append(o.name)


# ====================================================================== the plan
AX0, AX1, AY0, AY1 = 0.0, 7.2, 0.0, 6.0                 # the Aangan
QX0, QX1, QY0, QY1 = -5.6, -T, 0.8, 6.0                  # the Quiet Room
RX0, RX1, RY0, RY1 = -5.6, -T, -4.8, QY0 - T             # the Red Room
ARCH = dict(cy=3.4, w=1.5, h=2.95)
INFO["plan"] = {"aangan": [AX0, AX1, AY0, AY1, H_AANGAN], "quiet": [QX0, QX1, QY0, QY1, H_ROOM],
                "red": [RX0, RX1, RY0, RY1, H_ROOM], "T": T}

# --- the Aangan
floor("Aangan", AX0, AX1, AY0, AY1, "courtFloor")
floor("Ground", AX0 - 24, AX1 + 24, -30, AY0 - T, "stone", z=-0.01, lm=0.04)
wall("AanganN", AX0 - T, AX1 + T, AY1, AY1 + T, 0, H_AANGAN, "court")
wall("AanganE", AX1, AX1 + T, AY0 - T, AY1, 0, H_AANGAN, "court")
wall("AanganS", AX0, AX1, AY0 - T, AY0, 0, H_AANGAN, "court",
     [("rect", 3.6, AY0 - T / 2, 1.5, 2.45, 0, T + 0.3, "y")])
wall("AanganW", AX0 - T, AX0, AY0 - T, AY1, 0, H_AANGAN, "court",
     [("arch", AX0 - T / 2, ARCH["cy"], ARCH["w"], ARCH["h"], 0, T + 0.3, "x")])
for n, (x0, x1, y0, y1) in {"N": (AX0 - T - 0.04, AX1 + T + 0.04, AY1 - 0.04, AY1 + T + 0.04),
                            "E": (AX1 - 0.04, AX1 + T + 0.04, AY0 - T - 0.04, AY1 - 0.04),
                            "S": (AX0 - T - 0.04, AX1 - 0.04, AY0 - T - 0.04, AY0 + 0.04),
                            "W": (AX0 - T - 0.04, AX0 + 0.04, AY0 + 0.04, AY1 - 0.04)}.items():
    box(f"Wall_Coping{n}", x0, x1, y0, y1, H_AANGAN, H_AANGAN + 0.09, role_mat("sandstone"), bevel=0.012)
box("Floor_ArchSill", AX0 - T - 0.02, AX0 + 0.06, ARCH["cy"] - ARCH["w"] / 2, ARCH["cy"] + ARCH["w"] / 2, 0, 0.035,
    role_mat("sandstone"), bevel=0.01)
for n, (x0, x1, y0, y1) in {"N": (AX0, AX1, AY1 - 0.34, AY1), "E": (AX1 - 0.34, AX1, AY0, AY1 - 0.34)}.items():
    box(f"Wall_Plinth{n}", x0, x1, y0, y1, 0, 0.16, role_mat("sandstone"), bevel=0.012)


M_HW_BRASS = flat("hwBrass", lin(0xC2964E), 0.24, 1.0)       # polished where hands go
M_HW_IRON = flat("hwIron", lin(0x2E2925), 0.55, 0.7)


def apply_mods(objs):
    """bake each part's own bevel in before a join, which keeps only the first part's"""
    for o in objs:
        if not o.modifiers:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        for m in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=m.name)
    return objs


def door_leaf(name, w, h, t, role, rail_role=None, panels=(1, 4), pull_left=False, hardware="brass", hinge_left=True):
    """a frame-and-panel leaf, as a joiner makes one, built flat in x (width) and z
    (height), thickness in y, its face at +y: stiles running the full height and
    rails between them, each opening holding a raised, softly fielded panel inside
    a rounded bead; then its hardware (returned apart, so it stays live-lit):
    polished brass bosses at the joints and a ring pull on a backplate, or iron
    strap hinges and a ring latch for a painted door"""
    m, mr = role_mat(role), role_mat(rail_role or role)
    st, top, bot, mid, mul = 0.115, 0.12, 0.19, 0.11, 0.085
    yb, yf = -t / 2, t / 2
    parts, hw = [], []
    parts.append(box(f"{name}_core", st - 0.004, w - st + 0.004, yb, yf - 0.03, bot - 0.004, h - top + 0.004, m, bevel=0))
    for x0 in (0, w - st):
        parts.append(box(f"{name}_stile", x0, x0 + st, yb, yf, 0, h, m, bevel=0.006, segs=3))
    cols, rows = panels
    weights = {3: [1.0, 0.42, 1.38], 4: [1.0, 0.42, 1.3, 0.42], 2: [1.0, 1.3]}.get(rows, [1.0] * rows)
    free = h - bot - top - (rows - 1) * mid
    z, bands = bot, []
    for k, wgt in enumerate(weights):
        hz = free * wgt / sum(weights)
        bands.append((z, z + hz))
        z += hz + mid
    for z0, z1 in [(0, bot)] + [(b[1], b[1] + mid) for b in bands[:-1]] + [(h - top, h)]:
        parts.append(box(f"{name}_rail", st, w - st, yb, yf, z0, z1, mr, bevel=0.005, segs=3))
    xs = [(st, w - st)] if cols == 1 else [(st, w / 2 - mul / 2), (w / 2 + mul / 2, w - st)]
    if cols > 1:
        for z0, z1 in bands:
            parts.append(box(f"{name}_muntin", w / 2 - mul / 2, w / 2 + mul / 2, yb, yf - 0.002, z0, z1, m, bevel=0.005, segs=3))
    for x0, x1 in xs:
        for z0, z1 in bands:
            b = 0.016
            # the bead that holds the panel, round in section
            parts.append(box(f"{name}_bead", x0, x1, yf - 0.03, yf - 0.008, z0, z0 + b, mr, bevel=0.007, segs=3))
            parts.append(box(f"{name}_bead", x0, x1, yf - 0.03, yf - 0.008, z1 - b, z1, mr, bevel=0.007, segs=3))
            parts.append(box(f"{name}_bead", x0, x0 + b, yf - 0.03, yf - 0.008, z0 + b, z1 - b, m, bevel=0.007, segs=3))
            parts.append(box(f"{name}_bead", x1 - b, x1, yf - 0.03, yf - 0.008, z0 + b, z1 - b, m, bevel=0.007, segs=3))
            # the panel's flat margin, and its field standing proud with a soft chamfer
            parts.append(box(f"{name}_panel", x0 + b, x1 - b, yf - 0.03, yf - 0.018, z0 + b, z1 - b, m, bevel=0))
            parts.append(box(f"{name}_field", x0 + b + 0.032, x1 - b - 0.032, yf - 0.03, yf - 0.006, z0 + b + 0.032, z1 - b - 0.032,
                             m, bevel=0.014, segs=3))
    if hardware == "brass":
        # domed bosses where the rails meet the stiles
        for z0, z1 in [(0, bot)] + [(bb[1], bb[1] + mid) for bb in bands[:-1]] + [(h - top, h)]:
            for x in (st / 2, w - st / 2):
                bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=10, radius=0.017, location=(x, yf + 0.001, (z0 + z1) / 2))
                o = bpy.context.active_object
                o.scale = (1, 0.42, 1)
                hw.append(o)
        # the ring pull, hanging from a round backplate on the meeting stile
        px = st / 2 if pull_left else w - st / 2
        bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.05, depth=0.008, location=(px, yf + 0.004, h * 0.47),
                                            rotation=(math.pi / 2, 0, 0))
        hw.append(bpy.context.active_object)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.014, location=(px, yf + 0.01, h * 0.47))
        hw.append(bpy.context.active_object)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.062, minor_radius=0.0075, major_segments=40, minor_segments=10,
                                         location=(px, yf + 0.016, h * 0.47 - 0.062), rotation=(math.pi / 2, 0, 0))
        hw.append(bpy.context.active_object)
        mat = M_HW_BRASS
    else:
        # iron straps from the hinge side, rounded at their ends, and a ring latch
        hx0, sgn = (0.0, 1) if hinge_left else (w, -1)
        for zc in (h * 0.16, h * 0.84):
            L = w * 0.62
            x0, x1 = sorted((hx0, hx0 + sgn * L))
            hw.append(box(f"{name}_strap", x0, x1, yf, yf + 0.006, zc - 0.022, zc + 0.022, M_HW_IRON, bevel=0.004))
            for x in (x0 + 0.05, (x0 + x1) / 2, x1 - 0.05):
                bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, radius=0.009, location=(x, yf + 0.007, zc))
                hw.append(bpy.context.active_object)
        lx = w - st / 2 if hinge_left else st / 2
        bpy.ops.mesh.primitive_torus_add(major_radius=0.05, minor_radius=0.007, major_segments=32, minor_segments=8,
                                         location=(lx, yf + 0.014, h * 0.47 - 0.05), rotation=(math.pi / 2, 0, 0))
        hw.append(bpy.context.active_object)
        mat = M_HW_IRON
    leaf = join(name, apply_mods(parts))
    hwo = None
    if hw:
        for o in hw:
            o.data.materials.clear()
            o.data.materials.append(mat)
        hwo = join(f"Deco_hw{name.replace('Wall_', '').replace('Deco_', '')}", apply_mods(hw))
        for p in hwo.data.polygons:
            p.use_smooth = True
    return leaf, hwo


def place(o, loc, rot_z):
    if o is None:
        return
    o.location = Vector(loc)
    o.rotation_euler = (0, 0, rot_z)


# the house's front doors, shut: two teak leaves in a moulded teak frame, brass at the joints
DW, DH = 0.75, 2.42
for k, x0 in enumerate((3.6 - DW, 3.6)):
    # the pulls meet at the centre: the right leaf's is on its left stile
    leaf, hwo = door_leaf(f"Wall_FrontDoor{k}", DW, DH, 0.06, "teak", rail_role="teakRail", panels=(1, 4),
                          pull_left=(k == 1), hardware="brass")
    place(leaf, (x0, AY0 - T / 2, 0), 0)
    place(hwo, (x0, AY0 - T / 2, 0), 0)
# the chaukhat: jambs with a stepped face, a lintel, and a thin cornice over it
for side, (x0, x1) in (("L", (3.6 - 0.75 - 0.16, 3.6 - 0.75)), ("R", (3.6 + 0.75, 3.6 + 0.75 + 0.16))):
    box(f"Wall_FrontDoorJamb{side}", x0, x1, AY0 - T + 0.02, AY0 + 0.035, 0, 2.5, role_mat("teak"), bevel=0.01, segs=3)
    inner = (x1 - 0.035, x1) if side == "L" else (x0, x0 + 0.035)
    box(f"Wall_FrontDoorStep{side}", inner[0], inner[1], AY0 - T + 0.02, AY0 + 0.055, 0, 2.47, role_mat("teak"), bevel=0.008, segs=3)
box("Wall_FrontDoorLintel", 3.6 - 0.75 - 0.2, 3.6 + 0.75 + 0.2, AY0 - T + 0.02, AY0 + 0.055, 2.42, 2.62, role_mat("teakRail"),
    bevel=0.01, segs=3)
box("Wall_FrontDoorCornice", 3.6 - 0.75 - 0.25, 3.6 + 0.75 + 0.25, AY0 - T + 0.02, AY0 + 0.09, 2.62, 2.68, role_mat("teakRail"),
    bevel=0.012, segs=3)
box("Floor_FrontStep", 3.6 - 0.95, 3.6 + 0.95, AY0 - T - 0.02, AY0 + 0.22, 0, 0.07, role_mat("sandstone"), bevel=0.012)

# --- the Quiet Room
floor("Quiet", QX0, QX1, QY0, QY1, "floor")
wall("QuietW", QX0 - T, QX0, QY0 - T, QY1 + T, 0, H_ROOM, "wall",
     [("rect", QX0 - T / 2, ARCH["cy"], 1.7, 0.28, 2.95, T + 0.3, "x")])
wall("QuietN", QX0, QX1, QY1, QY1 + T, 0, H_ROOM, "wall")
wall("QuietS", QX0, QX1, QY0 - T, QY0, 0, H_ROOM, "wall",
     [("rect", -4.3, QY0 - T / 2, 1.05, 2.3, 0, T + 0.3, "y")])
for n, (x0, x1, y0, y1) in {"W": (QX0, QX0 + 0.012, QY0, QY1), "N": (QX0, QX1, QY1 - 0.012, QY1)}.items():
    box(f"Wall_QuietSkirt{n}", x0, x1, y0, y1, 0, 0.14, role_mat("wallShade"), bevel=0.003)


def ceiling(name, x0, x1, y0, y1, h, along_x=True, spacing=0.62):
    # the roof bears 8 cm into the walls (a roof meeting a wall face exactly lets a
    # blade of sun through the seam); the rest of their tops stays open to the sky
    # for the plan, and it stops at the courtyard's wall (x1), never in its plane
    box(f"Ceil_{name}", x0 - 0.08, x1, y0 - 0.08, y1 + 0.08, h, h + 0.25, role_mat("timber"), bevel=0)
    span = (y1 - y0) if along_x else (x1 - x0)
    n = int(span / spacing)
    for k in range(1, n + 1):
        c = (y0 if along_x else x0) + span * k / (n + 1)
        if along_x:
            box(f"Ceil_{name}Beam{k}", x0, x1, c - 0.07, c + 0.07, h - 0.17, h, role_mat("timber"), bevel=0.008)
        else:
            box(f"Ceil_{name}Beam{k}", c - 0.07, c + 0.07, y0, y1, h - 0.17, h, role_mat("timber"), bevel=0.008)


ceiling("Quiet", QX0, QX1, QY0, QY1, H_ROOM, along_x=False)

# --- the Red Room
floor("Red", RX0, RX1, RY0, RY1, "floor")
wall("RedW", RX0 - T, RX0, RY0 - T, RY1, 0, H_ROOM, "wall",
     [("rect", RX0 - T / 2, -3.55, 1.12, 2.3, 0, T + 0.3, "x"),
      ("rect", RX0 - T / 2, -1.45, 1.0, 1.25, 1.05, T + 0.3, "x")])
wall("RedE", RX1, RX1 + T, RY0, AY0 - T, 0, H_ROOM, "wall")
wall("RedS", RX0, RX1 + T, RY0 - T, RY0, 0, H_ROOM, "wall")
box("Wall_RedField", RX0, RX1, RY0, RY0 + 0.012, 0, H_ROOM, role_mat("field"), bevel=0.002)
ceiling("Red", RX0, RX1, RY0, RY1, H_ROOM, along_x=True)
# RedE and the courtyard's west wall meet in this plane: one skin, so no joint shows
box("Wall_RedSkinE", RX1 - 0.012, RX1, RY0 + 0.012, RY1, 0, H_ROOM, role_mat("wall"), bevel=0.002)
box("Wall_RedSkirtE", RX1 - 0.024, RX1 - 0.012, RY0 + 0.012, RY1, 0, 0.14, role_mat("wallShade"), bevel=0.003)
for k in range(6):
    y = -1.45 - 0.5 + (k + 0.5) * (1.0 / 6)
    box(f"Wall_Grille{k}", RX0 - T * 0.55, RX0 - T * 0.45, y - 0.018, y + 0.018, 1.05, 2.3, role_mat("timber"), bevel=0.004)
for k in range(3):
    z = 1.05 + (k + 1) * 1.25 / 4
    box(f"Wall_GrilleH{k}", RX0 - T * 0.55, RX0 - T * 0.45, -1.95, -0.95, z - 0.015, z + 0.015, role_mat("timber"), bevel=0.004)
floor("Lane", RX0 - 4.2, RX0 - T, RY0 - 3, QY1 + 3, "stone", lm=0.25)
wall("LaneFacade", RX0 - 4.6, RX0 - 4.15, RY0 - 3, QY1 + 3, 0, 6.5, "court")

# ====================================================================== the paintings
def painting(art_id, side, face, along, centre_z, longest_m, depth=0.035):
    """a stretched canvas hung on a wall face; its front carries the work"""
    im = img(os.path.join(ART, f"{art_id}.jpg"), True)
    ar = im.size[0] / im.size[1]
    w, h = (longest_m, longest_m / ar) if ar >= 1 else (longest_m * ar, longest_m)
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object
    o.name = f"Art_{art_id}"
    o.scale = (w, depth, h)
    bpy.ops.object.transform_apply(scale=True)
    mat = bpy.data.materials.new(f"art:{art_id}")
    mat.use_nodes = True
    nt = mat.node_tree
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = im
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.62
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    o.data.materials.append(mat)
    o.data.materials.append(M_CANVAS_EDGE)
    me = o.data
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        front = f.normal.y < -0.9
        f.material_index = 0 if front else 1
        for lp in f.loops:
            lp[uv].uv = ((lp.vert.co.x / w + 0.5), (lp.vert.co.z / h + 0.5)) if front else (0.5, 0.5)
    bm.to_mesh(me)
    bm.free()
    rot = {"N": 0.0, "S": math.pi, "E": -math.pi / 2, "W": math.pi / 2}[side]
    o.rotation_euler = (0, 0, rot)
    off = depth / 2 + 0.008
    loc = {"N": (along, face - off, centre_z), "S": (along, face + off, centre_z),
           "E": (face - off, along, centre_z), "W": (face + off, along, centre_z)}[side]
    o.location = loc
    o["artId"] = art_id
    INFO["art"][art_id] = {"w": w, "h": h, "side": side, "centre": list(loc), "frame": FRAME_LIP + FRAME_GAP}
    float_frame(art_id, w, h, depth, Matrix.Translation(loc) @ Matrix.Rotation(rot, 4, "Z"))
    return o


FRAME_LIP, FRAME_GAP = 0.016, 0.009


def float_frame(art_id, w, h, depth, M):
    """the frame she would hang it in, made modern: a 16 mm dark lip around a 9 mm
    shadow gap, a tray behind the canvas, the back on the wall. In the canvas's own
    axes (x across, y into the wall, z up); static, so the bake holds its shadow."""
    lip, gap = FRAME_LIP, FRAME_GAP
    o, p = w / 2 + gap, h / 2 + gap
    y0, y1 = -depth / 2 - 0.004, depth / 2 + 0.008          # 4 mm proud of the paint, back to the wall
    pieces = [(-o - lip, o + lip, p, p + lip), (-o - lip, o + lip, -p - lip, -p),
              (-o - lip, -o, -p, p), (o, o + lip, -p, p)]
    bm = bmesh.new()
    def cube(x0, x1, ya, yb, z0, z1):
        r = bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=(x1 - x0, yb - ya, z1 - z0), verts=r["verts"])
        bmesh.ops.translate(bm, vec=((x0 + x1) / 2, (ya + yb) / 2, (z0 + z1) / 2), verts=r["verts"])
    for x0, x1, z0, z1 in pieces:
        cube(x0, x1, y0, y1, z0, z1)
    cube(-o, o, depth / 2, y1, -p, p)                          # the tray, seen in the gap
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    me = bpy.data.meshes.new(f"Wall_Frame_{art_id}")
    bm.to_mesh(me)
    bm.free()
    fr = link(bpy.data.objects.new(f"Wall_Frame_{art_id}", me))
    fr.data.materials.append(role_mat("artFrame"))
    bv = fr.modifiers.new("soft", "BEVEL")
    bv.width = 0.0022
    bv.segments = 2
    bv.limit_method = "ANGLE"
    return fr


painting("woman-with-poppies", "N", AY1, 3.6, 1.72, 1.58)
painting("child-among-flowers", "E", AX1, 1.3, 1.62, 1.15)
painting("woman-with-red-flower", "E", AX1, 3.0, 1.62, 0.61)
painting("woman-with-bird", "E", AX1, 4.45, 1.62, 0.61)
painting("boy-with-bananas", "S", AY0, 5.75, 1.66, 0.914)
painting("monk-and-green-buddha", "W", QX0, ARCH["cy"], 1.62, 1.5)
# the Quiet Room's south-east corner: one painting to a wall, each given its own attention
painting("monks-and-blue-buddha", "S", QY0, -1.78, 1.62, 1.3)
painting("temple-bells", "E", QX1, 1.98, 1.6, 0.914)
painting("bulls-and-wheel", "S", RY0 + 0.012, -3.2, 1.66, 1.3)
painting("shree-420-and-milk-cans", "E", RX1 - 0.012, -1.55, 1.62, 1.2)
painting("three-veiled-women", "E", RX1 - 0.012, -3.6, 1.6, 1.1)
painting("terracotta-pots", "S", RY0 + 0.012, -1.3, 1.6, 1.0)
BANDH = ("weathered-door-ring", "red-and-teal-door-lock", "teal-door-bolt", "carved-door-knocker")
for k, bid in enumerate(BANDH):
    painting(bid, "N", RY1, -2.42 + k * 0.44, 1.58, 0.305, depth=0.03)

# ====================================================================== things
def import_ph(ph_id, loc, rot_z=0.0, scale=1.0, decimate=None, prop=True, mass=1.0):
    path = os.path.join(PH, ph_id, f"{ph_id}_1k.gltf")
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        if o.type == "MESH" and decimate and len(o.data.polygons) > decimate:
            d = o.modifiers.new("lod", "DECIMATE")
            d.ratio = max(0.05, decimate / len(o.data.polygons))
    roots = [o for o in new if o.parent is None]
    grp = link(bpy.data.objects.new(f"{'Prop' if prop else 'Deco'}_{ph_id}_{len(INFO['props'])}", None))
    for r in roots:
        r.parent = grp
    grp.location = Vector(loc)
    grp.rotation_euler = Euler((0, 0, rot_z))
    grp.scale = (scale,) * 3
    if prop:
        register_prop(grp, mass)
    return grp


def charpai(name, loc, rot_z=0.0, L=1.9, W=0.95, H=0.46):
    """a charpai: four turned legs, four rails, a jute rope bed"""
    parts = []
    leg = [(0.0, 0), (0.042, 0), (0.042, 0.06), (0.03, 0.09), (0.046, 0.15), (0.046, 0.2), (0.032, 0.24),
           (0.038, 0.3), (0.036, H - 0.06), (0.05, H - 0.03), (0.05, H + 0.05), (0.035, H + 0.09), (0.0, H + 0.1)]
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(lathe(f"{name}_leg", leg, role_mat("timber"), segs=24, loc=(sx * (L / 2 - 0.05), sy * (W / 2 - 0.05), 0)))
    for sy in (-1, 1):
        parts.append(box(f"{name}_rail", -L / 2 + 0.05, L / 2 - 0.05, sy * (W / 2 - 0.05) - 0.035, sy * (W / 2 - 0.05) + 0.035,
                         H - 0.07, H + 0.01, role_mat("timber"), bevel=0.01))
    for sx in (-1, 1):
        parts.append(box(f"{name}_rail", sx * (L / 2 - 0.05) - 0.035, sx * (L / 2 - 0.05) + 0.035, -W / 2 + 0.05, W / 2 - 0.05,
                         H - 0.07, H + 0.01, role_mat("timber"), bevel=0.01))
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=24, y_subdivisions=12, size=1)
    bed = bpy.context.active_object
    bed.scale = (L - 0.16, W - 0.16, 1)
    bpy.ops.object.transform_apply(scale=True)
    for v in bed.data.vertices:
        u, w = v.co.x / ((L - 0.16) / 2), v.co.y / ((W - 0.16) / 2)
        v.co.z = H - 0.025 - 0.035 * (1 - u * u) * (1 - w * w)
    bed.data.materials.append(jute_mat())
    for f in bed.data.polygons:
        f.use_smooth = True
    sol = bed.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = 0.014
    parts.append(bed)
    o = join(f"Prop_{name}", parts)
    o.location = Vector(loc)
    o.rotation_euler = (0, 0, rot_z)
    register_prop(o, 4.0)
    return o


def milk_can(name, loc, s=1.0):
    prof = [(0.0, 0), (0.16, 0), (0.17, 0.02), (0.17, 0.42), (0.15, 0.47), (0.08, 0.53), (0.075, 0.6),
            (0.095, 0.62), (0.095, 0.66), (0.0, 0.67)]
    o = lathe(f"Prop_{name}", [(r * s, z * s) for r, z in prof], M_ALU, segs=40, loc=loc)
    register_prop(o, 1.2)
    return o


def cart_wheel(name, loc, rot_z, lean=0.16):
    R = 0.62
    parts = []
    bpy.ops.mesh.primitive_torus_add(major_radius=R - 0.03, minor_radius=0.04, major_segments=64, minor_segments=8)
    rim = bpy.context.active_object
    rim.scale = (1, 1, 1.6)
    bpy.ops.object.transform_apply(scale=True)
    rim.data.materials.append(role_mat("timber"))
    parts.append(rim)
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=0.012, major_segments=64, minor_segments=6)
    tyre = bpy.context.active_object
    tyre.data.materials.append(role_mat("ironDark"))
    parts.append(tyre)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.1, depth=0.22)
    hub = bpy.context.active_object
    hub.data.materials.append(role_mat("timber"))
    parts.append(hub)
    for k in range(12):
        a = 2 * math.pi * k / 12
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.022, depth=R - 0.12,
                                            location=(math.cos(a) * (R / 2 + 0.03), math.sin(a) * (R / 2 + 0.03), 0),
                                            rotation=(0, math.pi / 2, a))
        sp = bpy.context.active_object
        sp.data.materials.append(role_mat("timber"))
        parts.append(sp)
    w = join(f"Prop_{name}", parts)
    w.rotation_mode = "ZXY"
    w.rotation_euler = (math.pi / 2 - lean, 0, rot_z)
    w.location = Vector(loc) + Vector((0, 0, R + 0.02))
    register_prop(w, 3.0)
    return w


def lamp_tower(name, loc, H=1.25):
    """a kuthu vilakku: the tall brass oil lamp, the diya of the dark mode"""
    prof = [(0, 0), (0.17, 0), (0.17, 0.02), (0.12, 0.05), (0.05, 0.1), (0.03, 0.2), (0.03, H * 0.42),
            (0.11, H * 0.44), (0.11, H * 0.46), (0.03, H * 0.48), (0.026, H * 0.78), (0.14, H * 0.8),
            (0.15, H * 0.82), (0.026, H * 0.84), (0.022, H * 0.94), (0.05, H * 0.96), (0.0, H)]
    o = lathe(f"Prop_{name}", prof, M_BRASS, segs=40, loc=loc)
    register_prop(o, 2.0)
    INFO["anchors"]["diya"] = [loc[0], loc[1], loc[2] + H * 0.83]
    return o


charpai("charpai_aangan", (2.3, 1.25, 0), math.radians(-6))
import_ph("potted_plant_04_tc", (6.55, 5.35, 0.16), 0.3, 2.3, mass=1.5)
import_ph("potted_plant_04_tc", (6.6, 0.75, 0), 1.2, 2.6, mass=1.5)
import_ph("potted_plant_02", (0.62, 0.62, 0), 2.4, 1.0, decimate=12000)
for (x, y, r) in ((6.75, 3.75, 0.9), (1.55, 5.62, 2.9)):
    import_ph("potted_plant_04_tc", (x, y, 0.16), r, 2.0, mass=1.2)
import_ph("wooden_bowl_01", (5.35, 5.5, 0.16), 0.0, 1.4, mass=0.6)
import_ph("brass_diya_lantern", (3.55, 0.95, 0.0), 0.0, 1.4, mass=0.8)
INFO["anchors"]["lantern"] = [3.55, 0.95, 0.27]
import_ph("wooden_stool_02", (-1.35, 5.35, 0), 0.3, 1.25, mass=1.2)
import_ph("brass_vase_03", (-1.35, 5.35, 0.23), 0.0, 1.0, mass=0.4)
lamp_tower("lamp", (-5.1, 5.45, 0))


def deepa(name, loc, H=1.45):
    """the lamp at the centre of her exhibitions: a taller kuthu vilakku, five
    wicks round a wide cup, standing in a ring of marigolds (42-ctx-gallery-view)"""
    prof = [(0, 0), (0.19, 0), (0.19, 0.025), (0.15, 0.05), (0.07, 0.11), (0.045, 0.16), (0.032, 0.24),
            (0.05, 0.27), (0.032, 0.30), (0.028, H * 0.50), (0.06, H * 0.52), (0.028, H * 0.54),
            (0.026, H * 0.70), (0.16, H * 0.72), (0.17, H * 0.745), (0.15, H * 0.75), (0.03, H * 0.765),
            (0.024, H * 0.86), (0.07, H * 0.875), (0.075, H * 0.89), (0.022, H * 0.905), (0.02, H * 0.95),
            (0.045, H * 0.965), (0.03, H * 0.99), (0.0, H)]
    o = lathe(f"Prop_{name}", prof, M_BRASS, segs=48, loc=loc)
    register_prop(o, 2.5)
    INFO["anchors"]["deepa"] = [loc[0], loc[1], loc[2] + H * 0.75, 0.15]     # centre of the rim, its radius
    # the marigolds: three rings of heads, saffron outside, yellow within
    rnd = random.Random(42)
    rows = ((0.38, lin(0xD9561A)), (0.32, lin(0xEB7F1C)), (0.26, lin(0xF2A81E)))
    bm = bmesh.new()
    mats = []
    for k, (r, rgb) in enumerate(rows):
        mats.append(flat(f"marigold{k}", rgb, 0.85))
        n = int(2 * math.pi * r / 0.047)
        for i in range(n):
            a = 2 * math.pi * (i + rnd.random() * 0.4) / n
            rr = 0.024 + rnd.random() * 0.006
            res = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=rr)
            vs = res["verts"]
            for v in vs:
                j = 1.0 + (rnd.random() - 0.5) * 0.42          # ruffled petals
                v.co = Vector((v.co.x * j, v.co.y * j, v.co.z * j * 0.62))
            for f in {f for v in vs for f in v.link_faces}:
                f.material_index = k
                f.smooth = True
            bmesh.ops.translate(bm, vec=(loc[0] + (r + (rnd.random() - 0.5) * 0.012) * math.cos(a),
                                         loc[1] + (r + (rnd.random() - 0.5) * 0.012) * math.sin(a),
                                         loc[2] + rr * 0.55), verts=vs)
    me = bpy.data.meshes.new(f"Deco_{name}Marigolds")
    bm.to_mesh(me)
    bm.free()
    m = link(bpy.data.objects.new(f"Deco_{name}Marigolds", me))
    for mt in mats:
        m.data.materials.append(mt)
    return o


deepa("deepa", (0.72, 2.25, 0))
milk_can("can_0", (-5.15, -2.85, 0))
milk_can("can_1", (-4.85, -2.62, 0), 0.85)
milk_can("can_2", (-5.18, -2.35, 0), 0.92)
cart_wheel("wheel", (-4.95, -4.58, 0), 0.0)
charpai("charpai_red", (-1.05, -2.6, 0), math.radians(90), L=1.85, W=0.9)
import_ph("brass_pot_01", (-1.2, -2.0, 0), 0.4, 0.95, mass=1.0)
import_ph("brass_pot_01", (-0.95, -3.2, 0), 1.7, 0.8, mass=1.0)
import_ph("ceramic_pot", (-1.0, -0.15, 0), 1.0, 0.75, mass=2.0)


def rod(name, p0, p1, r, mat, segs=12):
    """a round rod from p0 to p1"""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    bpy.ops.mesh.primitive_cylinder_add(vertices=segs, radius=r, depth=d.length, location=(p0 + p1) / 2)
    o = bpy.context.active_object
    o.name = name
    o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    bpy.ops.object.transform_apply(location=True, rotation=True)
    o.data.materials.append(mat)
    return o


def press_easel(name, loc, face_deg, photo):
    """her, in conversation beside "The Bullocks" (a press photograph from her own
    site): printed and framed — a thin dark frame, a white mat — on a slender teak
    easel. Built facing -y (the print's face), then turned to the room."""
    tk = role_mat("teak")
    top_y, H = 0.1, 1.32
    lean = math.atan2(top_y, H)
    parts = [rod(f"{name}_legL", (-0.22, 0, 0), (-0.12, top_y, H), 0.013, tk),
             rod(f"{name}_legR", (0.22, 0, 0), (0.12, top_y, H), 0.013, tk),
             rod(f"{name}_legB", (0, 0.56, 0), (0, top_y + 0.015, H - 0.03), 0.012, tk)]
    zl = 0.62
    yl = top_y * zl / H
    parts.append(box(f"{name}_ledge", -0.27, 0.27, yl - 0.075, yl + 0.005, zl - 0.03, zl, tk, bevel=0.004))
    parts.append(box(f"{name}_lip", -0.27, 0.27, yl - 0.075, yl - 0.065, zl, zl + 0.02, tk, bevel=0.002))
    zb = 1.08
    parts.append(box(f"{name}_bar", -0.2, 0.2, top_y * zb / H - 0.01, top_y * zb / H + 0.015, zb, zb + 0.03, tk, bevel=0.004))
    easel = join(f"Deco_{name}", apply_mods(parts))
    # the print: 3:2 in a mat and a thin dark frame, its face at -y
    pw, ph, mw, fr = 0.5, 0.5 / 1.494, 0.055, 0.016
    W, Hh = pw + 2 * mw + 2 * fr, ph + 2 * mw + 2 * fr
    fparts = [box(f"{name}_frame", -W / 2, W / 2, 0.0, 0.014, 0, Hh, flat("photoFrame", lin(0x1E1A17), 0.45), bevel=0.003),
              box(f"{name}_mat", -W / 2 + fr, W / 2 - fr, -0.002, 0.0, fr, Hh - fr, flat("photoMat", lin(0xF2EEE6), 0.85), bevel=0)]
    frame = join(f"Deco_{name}Frame", apply_mods(fparts))
    bpy.ops.mesh.primitive_plane_add(size=1)
    po = bpy.context.active_object
    po.name = f"Deco_{name}Photo"
    po.scale = (pw, ph, 1)
    bpy.ops.object.transform_apply(scale=True)
    po.rotation_euler = (math.pi / 2, 0, 0)            # plane's +z normal turned to -y
    bpy.ops.object.transform_apply(rotation=True)
    po.location = (0, -0.0025, fr + mw + ph / 2)
    bpy.ops.object.transform_apply(location=True)
    m = bpy.data.materials.new("pressPhoto")
    m.use_nodes = True
    t = m.node_tree.nodes.new("ShaderNodeTexImage")
    t.image = img(photo, True)
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.35          # a satin print
    m.node_tree.links.new(t.outputs["Color"], b.inputs["Base Color"])
    po.data.materials.append(m)
    # the framed print stands on the ledge, leaning back with the easel
    for o in (frame, po):
        o.rotation_euler = (-lean, 0, 0)
        o.location = (0, yl - 0.05, zl)
    group = link(bpy.data.objects.new(f"Deco_{name}Group", None))
    for o in (easel, frame, po):
        o.parent = group
    group.location = Vector(loc)
    group.rotation_euler = (0, 0, math.radians(face_deg))
    return group


# beside "The Bullocks", in the gap before "Terracotta", turned a little toward the door from the Quiet Room
press_easel("press", (-2.16, -4.28, 0), 180 + 28, os.path.join(HT, "press-interview.jpg"))
INFO["anchors"]["press"] = [-2.16, -4.24, 0.86]       # the print's middle, for its caption

# the lane door: one leaf ajar into the room, turquoise flaking over old wood
lane, lane_iron = door_leaf("Deco_laneDoor", 1.06, 2.26, 0.055, "door", panels=(2, 3), hardware="iron", hinge_left=True)
# shut in its frame, a few centimetres back from the room's face: hinged on the north jamb,
# the panelled face and its iron to the room
place(lane, (RX0 - 0.06, -3.55 + 0.53, 0), math.radians(-90))
place(lane_iron, (RX0 - 0.06, -3.55 + 0.53, 0), math.radians(-90))
box("Wall_LaneDoorFrameS", RX0 - T + 0.02, RX0 + 0.03, -3.55 - 0.56 - 0.11, -3.55 - 0.56, 0, 2.42, role_mat("teak"), bevel=0.01, segs=3)
box("Wall_LaneDoorFrameN", RX0 - T + 0.02, RX0 + 0.03, -3.55 + 0.56, -3.55 + 0.56 + 0.11, 0, 2.42, role_mat("teak"), bevel=0.01, segs=3)
box("Wall_LaneDoorFrameT", RX0 - T + 0.02, RX0 + 0.04, -3.55 - 0.56 - 0.15, -3.55 + 0.56 + 0.15, 2.3, 2.46, role_mat("teakRail"),
    bevel=0.01, segs=3)

# ====================================================================== foliage
def card(name, w, h, mat):
    bpy.ops.mesh.primitive_plane_add(size=1)
    o = bpy.context.active_object
    o.name = name
    o.scale = (w, h, 1)
    o.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    o.data.materials.append(mat)
    return o


def banana_plant(loc, rot=0.0, H=2.5):
    """a young banana: a pseudostem and nine arching leaves"""
    parts = []
    stem = lathe("stem", [(0.0, 0), (0.12, 0), (0.1, 0.4), (0.075, H * 0.55), (0.055, H * 0.62), (0.0, H * 0.63)], M_STEM, segs=20)
    leaf_m = cutout("foliage:banana", os.path.join(HT, "banana_leaf_cut.png"), translucency=0.35, rough=0.45)
    for k in range(9):
        a = 2 * math.pi * k / 9 + random.uniform(-0.2, 0.2)
        L = random.uniform(1.35, 1.9)
        bpy.ops.mesh.primitive_grid_add(x_subdivisions=3, y_subdivisions=14, size=1)
        lf = bpy.context.active_object
        lf.scale = (L * 0.36, L, 1)
        bpy.ops.object.transform_apply(scale=True)
        droop = random.uniform(0.8, 1.25)
        for v in lf.data.vertices:
            t = v.co.y / L + 0.5
            v.co.y = t * L
            v.co.z = math.sin(t * math.pi * 0.85) * L * 0.28 - (t ** 2) * L * 0.35 * droop
            v.co.x *= 1 - 0.15 * t
            v.co.z -= abs(v.co.x) * 0.25        # a leaf folds a little along its rib
        uvl = lf.data.uv_layers.active.data
        for poly in lf.data.polygons:
            for li in poly.loop_indices:
                v = lf.data.vertices[lf.data.loops[li].vertex_index].co
                uvl[li].uv = (v.x / (L * 0.36 * (1 - 0.15 * (v.y / L))) + 0.5, v.y / L)
        lf.data.materials.append(leaf_m)
        lf.rotation_euler = (math.radians(random.uniform(-8, 12)), 0, a)
        lf.location = (0, 0, H * random.uniform(0.5, 0.62))
        parts.append(lf)
    o = join("Foliage_banana", parts + [stem])
    o.location = loc
    o.rotation_euler = (0, 0, rot)
    return o


def bougainvillea(name, along, count, depth, z0, z1, hang, fall_bias=1.6):
    """flowering cards crossed in pairs, heaped on the coping and falling down
    the face into the courtyard; heavier toward the end of `along`"""
    mat = cutout("foliage:bougainvillea", os.path.join(HT, "bougainvillea_cut.png"), translucency=0.3, rough=0.55)
    (xa, ya), (xb, yb) = along
    yaw = math.atan2(yb - ya, xb - xa)
    parts = []
    for k in range(count):
        t = random.random() ** 0.7
        x, y = xa + (xb - xa) * t, ya + (yb - ya) * t
        top = random.random() < 0.35
        s = random.uniform(0.32, 0.62)
        if top:
            # heaped on the coping: cards in all directions, for the crown's volume
            c = card("b", s, s, mat)
            c.location = (x + hang[0] * random.uniform(-0.25, 0.25), y + hang[1] * random.uniform(-0.25, 0.25),
                          random.uniform(z0, z1))
            c.rotation_euler = (random.uniform(-0.9, 0.9), random.uniform(-0.9, 0.9), random.uniform(0, math.pi))
        else:
            # falling down the face: close to the wall, nearly parallel to it, in loose strands
            fall = random.random() ** fall_bias * (0.3 + 1.25 * t)
            c = card("b", s, s * random.uniform(1.0, 1.5), mat)
            out = random.uniform(0.03, depth)
            c.location = (x + hang[0] * (T / 2 + out), y + hang[1] * (T / 2 + out), z0 + 0.1 - fall)
            c.rotation_euler = (random.uniform(-0.25, 0.25), random.uniform(-0.25, 0.25), yaw + random.uniform(-0.35, 0.35))
        parts.append(c)
    return join(f"Foliage_{name}", parts)


def canopy(name, x0, x1, y0, y1, z0, z1, count):
    """a tree crown, as leaf cards: seen through an opening, and casting the dapple"""
    mat = cutout("foliage:peepal", os.path.join(HT, "peepal_cut.png"), translucency=0.35, rough=0.5)
    parts = []
    for k in range(count):
        c = card("p", random.uniform(0.5, 0.95), random.uniform(0.5, 0.95), mat)
        c.location = (random.uniform(x0, x1), random.uniform(y0, y1), random.uniform(z0, z1))
        c.rotation_euler = (random.uniform(0, 3.1), random.uniform(0, 3.1), random.uniform(0, 3.1))
        parts.append(c)
    return join(f"Foliage_{name}", parts)


banana_plant((0.82, 5.05, 0), 2.2, H=3.1)
bougainvillea("bougainvilleaN", ((2.2, AY1 + T / 2), (AX1 + T / 2, AY1 + T / 2)), 520, 0.22, H_AANGAN + 0.0, H_AANGAN + 0.55, (0, -1))
bougainvillea("bougainvilleaE", ((AX1 + T / 2, 2.0), (AX1 + T / 2, AY1 + T / 2)), 380, 0.22, H_AANGAN + 0.0, H_AANGAN + 0.5, (-1, 0))
canopy("peepal", QX0 - T - 3.2, QX0 - T - 0.5, ARCH["cy"] - 3.2, ARCH["cy"] + 3.2, 2.6, 6.2, 200)
canopy("laneTree", RX0 - T - 3.6, RX0 - T - 1.0, RY0 - 1.5, 0.8, 3.4, 6.8, 160)

# ====================================================================== light
world = bpy.data.worlds.new("Sky")
sc.world = world
world.use_nodes = True
wn = world.node_tree
bg = wn.nodes["Background"]
geo = wn.nodes.new("ShaderNodeTexCoord")
sep = wn.nodes.new("ShaderNodeSeparateXYZ")
wn.links.new(geo.outputs["Generated"], sep.inputs[0])
ramp = wn.nodes.new("ShaderNodeValToRGB")
mapz = wn.nodes.new("ShaderNodeMapRange")
mapz.inputs["From Min"].default_value = -1.0
wn.links.new(sep.outputs["Z"], mapz.inputs["Value"])
wn.links.new(mapz.outputs["Result"], ramp.inputs["Fac"])
ramp.color_ramp.elements[0].position = 0.42
ramp.color_ramp.elements[0].color = (*lin(0xD9CBB4), 1)
ramp.color_ramp.elements[1].position = 0.98
ramp.color_ramp.elements[1].color = (*lin(0x9DB6CF), 1)
mid = ramp.color_ramp.elements.new(0.52)
mid.color = (*lin(0xF2E6D2), 1)
wn.links.new(ramp.outputs["Color"], bg.inputs["Color"])
bg.inputs["Strength"].default_value = float(opt.get("--sky", 1.5))
INFO["lights"]["sky"] = {"strength": bg.inputs["Strength"].default_value}

SUN_AZ, SUN_EL = math.radians(float(opt.get("--sunaz", 230))), math.radians(float(opt.get("--sunel", 52)))
to_sun = Vector((math.sin(SUN_AZ) * math.cos(SUN_EL), math.cos(SUN_AZ) * math.cos(SUN_EL), math.sin(SUN_EL)))
sd = bpy.data.lights.new("Sun", "SUN")
sd.energy = float(opt.get("--sunE", 4.5))
sd.angle = math.radians(0.6)
sd.color = (1.0, 0.9, 0.76)
sun = link(bpy.data.objects.new("Sun", sd))
sun.rotation_euler = (-to_sun).to_track_quat("-Z", "Y").to_euler()
INFO["lights"]["sun"] = {"toSun": list(to_sun), "energy": sd.energy, "color": list(sd.color)}


def gallery_light(art_id, power=42, size=0.35, dist=1.45):
    a = INFO["art"][art_id]
    cx, cy, cz = a["centre"]
    n = {"N": Vector((0, -1, 0)), "S": Vector((0, 1, 0)), "E": Vector((-1, 0, 0)), "W": Vector((1, 0, 0))}[a["side"]]
    d = bpy.data.lights.new(f"L_{art_id}", "SPOT")
    d.shadow_soft_size = 0.06
    d.spot_size = math.radians(84)
    d.spot_blend = 1.0
    d.energy = power
    d.color = (1.0, 0.86, 0.68)
    o = link(bpy.data.objects.new(f"L_{art_id}", d))
    # in the rooms from the ceiling; in the courtyard from a bracket high on the facing side
    o.location = Vector((cx, cy, min(H_ROOM - 0.22, cz + 1.9))) + n * 0.95
    o.rotation_euler = (Vector((cx, cy, cz)) - o.location).to_track_quat("-Z", "Y").to_euler()
    INFO["lights"][f"L_{art_id}"] = {"pos": list(o.location), "target": [cx, cy, cz], "power": power}
    return o


def fill(name, x0, x1, y0, y1, power):
    """the light a room gathers from its openings and bounces about: a soft panel at the ceiling"""
    d = bpy.data.lights.new(name, "AREA")
    d.shape = "RECTANGLE"
    d.size, d.size_y = (x1 - x0) * 0.8, (y1 - y0) * 0.8
    d.energy = power
    d.color = (1.0, 0.93, 0.84)
    o = link(bpy.data.objects.new(name, d))
    o.location = ((x0 + x1) / 2, (y0 + y1) / 2, H_ROOM - 0.3)
    INFO["lights"][name] = {"rect": [x0, x1, y0, y1], "power": power}
    return o


fill("Fill_quiet", QX0, QX1, QY0, QY1, float(opt.get("--fillq", 45)))
fill("Fill_red", RX0, RX1, RY0, RY1, float(opt.get("--fillr", 90)))

for k in ("monk-and-green-buddha", "monks-and-blue-buddha", "temple-bells",
          "bulls-and-wheel", "shree-420-and-milk-cans", "three-veiled-women", "terracotta-pots"):
    gallery_light(k, power=float(opt.get("--gallery", 135)))
for k in BANDH:
    gallery_light(k, power=float(opt.get("--gallery", 135)) * 0.32)


def studio_lamp(name, plate, aim, out=Vector((0, 1, 0)), reach=0.62):
    """a painter's studio lamp on the wall: a round plate, a gooseneck arm, a green
    enamel shade (white inside) and its bulb, turned on the painting; and the spot
    it throws, which the bake keeps afternoon and evening. Live-lit (Deco_), so the
    brass-and-enamel catch the light; the bulb glows."""
    plate, aim = Vector(plate), Vector(aim)
    parts = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.055, depth=0.018, location=plate + out * 0.009,
                                        rotation=out.to_track_quat("Z", "Y").to_euler())
    parts.append(bpy.context.active_object)
    p0, p1, p2 = plate + out * 0.01, plate + out * (reach * 0.65) + Vector((0, 0, 0.12)), plate + out * reach + Vector((0, 0, 0.02))
    cu = bpy.data.curves.new(f"{name}_arm", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.0085
    cu.bevel_resolution = 4
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(2)
    for bp, co in zip(sp.bezier_points, (p0, p1, p2)):
        bp.co = co
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    arm = link(bpy.data.objects.new(f"{name}_arm", cu))
    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.convert(target="MESH")
    parts.append(arm)
    for o in parts:
        o.data.materials.clear()
        o.data.materials.append(M_HW_IRON)
    iron = join(f"Deco_{name}Arm", apply_mods(parts))
    # the shade: apex at the arm's end, mouth on the painting
    d = (aim - p2).normalized()
    prof = [(0.0, 0.0), (0.02, 0.0), (0.024, 0.012), (0.028, 0.03), (0.058, 0.09), (0.083, 0.145), (0.09, 0.16), (0.091, 0.163)]
    shade = lathe(f"Deco_{name}Shade", prof, flat("enamelGreen", lin(0x2D4132), 0.3), segs=48, loc=p2)
    shade.data.materials.append(flat("enamelWhite", lin(0xEFE8DA), 0.45))
    sol = shade.modifiers.new("shell", "SOLIDIFY")
    sol.thickness = 0.003
    sol.material_offset = 1
    shade.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    bulb_at = p2 + d * 0.06
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.027, location=bulb_at)
    bulb = bpy.context.active_object
    bulb.name = f"Deco_{name}Bulb"
    bm_ = bpy.data.materials.new("bulb")
    bm_.use_nodes = True
    bb = bm_.node_tree.nodes["Principled BSDF"]
    bb.inputs["Base Color"].default_value = (1.0, 0.86, 0.62, 1)
    bb.inputs["Emission Color"].default_value = (1.0, 0.82, 0.55, 1)
    bb.inputs["Emission Strength"].default_value = 6.0
    bulb.data.materials.append(bm_)
    # the light it throws
    ld = bpy.data.lights.new(f"L_{name}", "SPOT")
    ld.energy = float(opt.get("--studio", 68))
    ld.spot_size = math.radians(48)
    ld.spot_blend = 0.55
    ld.shadow_soft_size = 0.03
    ld.color = (1.0, 0.85, 0.66)
    lo = link(bpy.data.objects.new(f"L_{name}", ld))
    lo.location = bulb_at + d * 0.03
    lo.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    INFO["lights"][f"L_{name}"] = {"pos": list(lo.location), "target": list(aim), "power": ld.energy}
    return lo


# "Under Canopy of Greens" hangs in the courtyard's shade: two studio lamps over it, as a painter would
_c = INFO["art"]["boy-with-bananas"]["centre"]
for k, dx in enumerate((-0.34, 0.34)):
    studio_lamp(f"studio{k}", (_c[0] + dx, AY0, 2.6), (_c[0] + dx * 0.3, AY0, _c[2] - 0.08))

# the courtyard's own lights: off in the afternoon, they come on with the evening (export.py)
for k in ("woman-with-poppies", "child-among-flowers", "woman-with-red-flower", "woman-with-bird", "boy-with-bananas"):
    o = gallery_light(k, power=0.0)
    o.name = f"N_{k}"
    o.data["night"] = 120.0

# ====================================================================== the chapters' views
VIEWS = {
    # the walk, in order: each turn at most a quarter, every room change through a doorway
    "start":     ((3.6, 0.55, 1.62), (3.6, AY1, 1.86)),
    "presence":  ((3.6, 2.05, 1.62), (3.6, AY1, 1.86)),
    "floral":    ((3.25, 3.0, 1.6), (AX1, 2.85, 1.6)),
    "canopy":    ((4.9, 3.85, 1.6), (4.9, AY0, 1.62)),
    "threshold": ((4.8, 3.4, 1.6), (AX0, 3.4, 1.42)),
    "bodhi":     ((-1.45, 3.4, 1.6), (QX0, 3.4, 1.62)),
    # the Quiet Room's south-east corner, two walls, a painting on each
    "faith":     ((-3.28, 3.63, 1.6), (-0.95, 1.3, 1.55)),
    # passing poses: the walk goes through them without stopping (lib/chapters.ts `via`)
    "faithvia":  ((-2.6, 4.3, 1.6), (-2.6, QY0, 1.55)),
    "redvia":    ((-4.2, -2.0, 1.58), (RX1, -2.4, 1.5)),
    # the red wall, turned a little east so her photograph stands clear of the chapter's words
    "street":    ((-4.0, 0.0, 1.6), (-2.3, RY0, 1.5)),
    # three-quarters on the east wall, Bandh Darwaze on the north wall to the left
    "redwall":   ((-5.35, -4.2, 1.55), (-1.1, -1.75, 1.45)),
    "featured":  ((-2.66, -2.55, 3.62), (-1.2, -2.55, 0.0)),
    "plan":      ((-2.4, 0.6, 23.0), (-2.4, 0.6, 0.0)),
    "mess":      ((10.5, -10.5, 11.5), (0.4, 0.4, 0.4)),
}
# a step closer to the work on a wide screen: the paintings at about 1.3× where a wall has one,
# less where a view must hold several (the eye slides toward the target, along the line of sight)
CLOSER = {"presence": 0.76, "canopy": 0.86, "bodhi": 0.8,
          "street": 0.86}
for k, f in CLOSER.items():
    e, t = Vector(VIEWS[k][0]), Vector(VIEWS[k][1])
    VIEWS[k] = (tuple(t + (e - t) * f), VIEWS[k][1])

# portrait screens: one painting per chapter, centred, high in the frame (the copy sits below)
NARROW = {
    "start":     ((3.6, 0.9, 1.55), (3.6, AY1, 1.3)),
    "presence":  ((3.6, 2.55, 1.55), (3.6, AY1, 1.3)),
    "floral":    ((4.55, 3.0, 1.55), (AX1, 3.0, 1.22)),
    "canopy":    ((5.75, 3.25, 1.55), (5.75, AY0, 1.45)),
    "threshold": ((4.4, 3.4, 1.55), (AX0, 3.4, 1.35)),
    "bodhi":     ((-1.85, 3.4, 1.55), (QX0, 3.4, 0.98)),
    # a portrait screen holds one wall: Threads of Faith, frontal; the Blue Buddha comes round on the turn
    "faith":     ((-3.05, 1.98, 1.55), (QX1, 1.98, 1.3)),
    # from facing Threads of Faith, turn first to the passage, then go through it
    "streetvia": ((-4.0, 2.2, 1.58), (-4.3, -0.5, 1.5)),
    "street":    ((-4.3, -0.4, 1.55), (-3.35, RY0, 1.3)),
    "redwall":   ((-3.55, -3.55, 1.55), (RX1, -3.55, 1.3)),
    "featured":  ((-2.66, -2.55, 3.62), (-1.2, -2.55, 0.0)),
    "plan":      ((0.8, -3.2, 34.0), (0.8, -3.2, 0.0)),
    "mess":      ((10.5, -10.5, 11.5), (0.4, 0.4, 0.4)),
}
FOV = 40.0


def camera(name, eye, at, fov=FOV):
    cd = bpy.data.cameras.new(name)
    cd.sensor_fit = "VERTICAL"
    cd.angle_y = math.radians(fov)
    cd.clip_start = 0.05
    o = link(bpy.data.objects.new(f"Cam_{name}", cd))
    o.location = eye
    d = Vector(at) - Vector(eye)
    o.rotation_euler = (d.to_track_quat("-Z", "Y") if abs(d.normalized().z) < 0.95 else Euler((0, 0, 0)).to_quaternion()).to_euler()
    INFO["cams"][name] = {"eye": list(eye), "target": list(at), "fov": fov}
    return o


cams = {k: camera(k, *v) for k, v in VIEWS.items()}
for k, (eye, at) in NARROW.items():
    INFO["cams"][f"n:{k}"] = {"eye": list(eye), "target": list(at), "fov": 62.0}

# ====================================================================== out
json.dump(INFO, open(os.path.join(OUT, "house.json"), "w"), indent=1)
if opt.get("--save", "1") == "1":
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "house.blend"))

sc.render.resolution_x = RES
sc.render.resolution_y = round(RES * 10 / 16)
ceil = [o for o in bpy.data.objects if o.name.startswith("Ceil_")]
for name in RENDER:
    sc.camera = cams[name]
    for o in ceil:
        o.hide_render = name in ("plan", "featured", "mess")
    sc.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("rendered", name, flush=True)
