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
from mathutils import Euler, Vector

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
    "wall": ("plaster", (1.84, 1.71, 1.5), 2.0),
    "wallShade": ("plaster", (1.42, 1.32, 1.2), 2.0),
    "field": ("plaster", (0.66, 0.135, 0.07), 2.0),
    "court": ("plaster", (1.9, 1.78, 1.6), 2.4),
    "floor": ("floor", lin(0xF3EBE0), 2.8),
    "stone": ("floor", lin(0xE2D6C4), 1.6),
    "sandstone": ("sandstone", lin(0xF2DCC0), 1.4),
    "timber": ("timber", (1.25, 1.1, 0.95), 2.0),
    "door": ("door", (1.85, 1.85, 1.78), 1.15),
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
    if role == "door":
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


def door_leaf(name, w, h, t, role, studs=True, panels=(2, 4), pull_left=False):
    """an old panelled leaf, built flat in x (width) and z (height), thickness in y:
    stiles and rails stand proud of recessed panels; iron studs at the joints"""
    parts, iron = [], []
    m = role_mat(role)
    st = 0.11
    parts.append(box(f"{name}_back", 0, w, -t / 2, t / 2 - 0.012, 0, h, m, bevel=0.004))
    for x0 in (0, w - st):
        parts.append(box(f"{name}_stile", x0, x0 + st, -t / 2, t / 2, 0, h, m, bevel=0.006))
    cols, rows = panels
    rail_z = [0.0] + [h * (k / rows) for k in range(1, rows)] + [h - st]
    for z in rail_z:
        parts.append(box(f"{name}_rail", st, w - st, -t / 2, t / 2, z, z + st, m, bevel=0.006))
    if cols > 1:
        # the mullion runs between the rails, never through them (shared faces render black)
        mid = w / 2 - 0.04
        for z0, z1 in zip(rail_z, rail_z[1:]):
            parts.append(box(f"{name}_mullion", mid, mid + 0.08, -t / 2, t / 2 - 0.004, z0 + st, z1, m, bevel=0.005))
    if studs:
        for z in rail_z:
            for x in (st / 2, w / 2, w - st / 2):
                bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, radius=0.016,
                                                     location=(x, t / 2 + 0.002, z + st / 2))
                o = bpy.context.active_object
                o.scale = (1, 0.55, 1)
                iron.append(o)
        # the ring pull, on the meeting stile
        bpy.ops.mesh.primitive_torus_add(major_radius=0.055, minor_radius=0.008, major_segments=24, minor_segments=8,
                                         location=(st / 2 if pull_left else w - st / 2, t / 2 + 0.012, h * 0.47),
                                         rotation=(math.pi / 2, 0, 0))
        iron.append(bpy.context.active_object)
    leaf = join(name, parts)
    studs_o = None
    if iron:
        for o in iron:
            o.data.materials.append(role_mat("ironDark"))
        studs_o = join(f"{name}Iron", iron)
    return leaf, studs_o


def place(o, loc, rot_z):
    if o is None:
        return
    o.location = Vector(loc)
    o.rotation_euler = (0, 0, rot_z)


# the house's front doors, shut: two teak leaves in a timber frame, studded
DW, DH = 0.75, 2.42
for k, x0 in enumerate((3.6 - DW, 3.6)):
    # the pulls meet at the centre: the right leaf's is on its left stile
    leaf, iron = door_leaf(f"Wall_FrontDoor{k}", DW, DH, 0.06, "timber", pull_left=(k == 1))
    place(leaf, (x0, AY0 - T / 2, 0), 0)
    place(iron, (x0, AY0 - T / 2, 0), 0)
box("Wall_FrontDoorFrameL", 3.6 - 0.75 - 0.09, 3.6 - 0.75, AY0 - T + 0.02, AY0 + 0.015, 0, 2.52, role_mat("timber"), bevel=0.01)
box("Wall_FrontDoorFrameR", 3.6 + 0.75, 3.6 + 0.75 + 0.09, AY0 - T + 0.02, AY0 + 0.015, 0, 2.52, role_mat("timber"), bevel=0.01)
box("Wall_FrontDoorFrameT", 3.6 - 0.75, 3.6 + 0.75, AY0 - T + 0.02, AY0 + 0.015, 2.43, 2.52, role_mat("timber"), bevel=0.01)
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
    # the roof stops at the courtyard's wall (x1), never in its plane
    box(f"Ceil_{name}", x0 - T, x1, y0 - T, y1 + T, h, h + 0.25, role_mat("timber"), bevel=0)
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
box("Wall_RedSkirtE", RX1 - 0.012, RX1, RY0, RY1, 0, 0.14, role_mat("wallShade"), bevel=0.003)
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
    INFO["art"][art_id] = {"w": w, "h": h, "side": side, "centre": list(loc)}
    return o


painting("woman-with-poppies", "N", AY1, 3.6, 1.72, 1.32)
painting("child-among-flowers", "E", AX1, 1.25, 1.62, 0.96)
painting("woman-with-red-flower", "E", AX1, 3.0, 1.62, 0.61)
painting("woman-with-bird", "E", AX1, 4.45, 1.62, 0.61)
painting("boy-with-bananas", "S", AY0, 5.75, 1.66, 0.914)
painting("monk-and-green-buddha", "W", QX0, ARCH["cy"], 1.62, 1.3)
painting("monks-and-blue-buddha", "S", QY0, -2.62, 1.62, 1.2)
painting("temple-bells", "S", QY0, -1.12, 1.6, 0.86)
painting("bulls-and-wheel", "S", RY0 + 0.012, -3.15, 1.66, 1.1)
painting("shree-420-and-milk-cans", "E", RX1, -1.55, 1.62, 1.0)
painting("three-veiled-women", "E", RX1, -3.55, 1.6, 0.92)
painting("terracotta-pots", "S", RY0 + 0.012, -1.32, 1.6, 0.86)

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
milk_can("can_0", (-5.15, -2.85, 0))
milk_can("can_1", (-4.85, -2.62, 0), 0.85)
milk_can("can_2", (-5.18, -2.35, 0), 0.92)
cart_wheel("wheel", (-4.95, -4.58, 0), 0.0)
charpai("charpai_red", (-1.05, -2.6, 0), math.radians(90), L=1.85, W=0.9)
import_ph("brass_pot_01", (-1.2, -2.0, 0), 0.4, 0.95, mass=1.0)
import_ph("brass_pot_01", (-0.95, -3.2, 0), 1.7, 0.8, mass=1.0)
import_ph("ceramic_pot", (-1.0, -0.15, 0), 1.0, 0.75, mass=2.0)
# the lane door: one leaf ajar into the room, turquoise flaking over old wood
lane, lane_iron = door_leaf("Deco_laneDoor", 1.06, 2.26, 0.055, "door", panels=(1, 3))
# hinged on the door's south jamb: closed it would lie at 90° (along the wall); swung 58° into the room
place(lane, (RX0 + 0.03, -3.55 - 0.54, 0), math.radians(90 - 58))
place(lane_iron, (RX0 + 0.03, -3.55 - 0.54, 0), math.radians(90 - 58))
if lane_iron:
    lane_iron.name = "Deco_laneDoorIron"
box("Wall_LaneDoorFrameS", RX0 - T + 0.02, RX0 + 0.015, -3.55 - 0.56 - 0.09, -3.55 - 0.56, 0, 2.4, role_mat("timber"), bevel=0.01)
box("Wall_LaneDoorFrameN", RX0 - T + 0.02, RX0 + 0.015, -3.55 + 0.56, -3.55 + 0.56 + 0.09, 0, 2.4, role_mat("timber"), bevel=0.01)
box("Wall_LaneDoorFrameT", RX0 - T + 0.02, RX0 + 0.015, -3.55 - 0.56, -3.55 + 0.56, 2.3, 2.4, role_mat("timber"), bevel=0.01)

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
bg.inputs["Strength"].default_value = float(opt.get("--sky", 1.15))
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
    "threshold": ((4.8, 3.4, 1.6), (AX0, 3.4, 1.7)),
    "bodhi":     ((-1.45, 3.4, 1.6), (QX0, 3.4, 1.62)),
    "faith":     ((-3.35, 4.45, 1.6), (-2.55, QY0, 1.55)),
    "street":    ((-4.3, -0.05, 1.6), (-3.25, RY0, 1.6)),
    "redwall":   ((-4.85, -2.55, 1.55), (RX1, -2.55, 1.45)),
    "featured":  ((-2.66, -2.55, 3.62), (-1.2, -2.55, 0.0)),
    "plan":      ((-2.4, 0.6, 23.0), (-2.4, 0.6, 0.0)),
    "mess":      ((10.5, -10.5, 11.5), (0.4, 0.4, 0.4)),
}
# portrait screens: one painting per chapter, centred, high in the frame (the copy sits below)
NARROW = {
    "start":     ((3.6, 0.9, 1.55), (3.6, AY1, 1.3)),
    "presence":  ((3.6, 2.55, 1.55), (3.6, AY1, 1.3)),
    "floral":    ((4.55, 3.0, 1.55), (AX1, 3.0, 1.22)),
    "canopy":    ((5.75, 3.25, 1.55), (5.75, AY0, 1.25)),
    "threshold": ((4.4, 3.4, 1.55), (AX0, 3.4, 1.35)),
    "bodhi":     ((-1.85, 3.4, 1.55), (QX0, 3.4, 0.98)),
    "faith":     ((-2.75, 4.95, 1.55), (-2.65, QY0, 1.28)),
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
