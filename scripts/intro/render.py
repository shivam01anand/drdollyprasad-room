"""
The opening's still life: the brass lamp of her openings, its marigolds, its
shadow, rendered once in Cycles for the preloader (public/intro).

    blender -b -P scripts/intro/render.py -- <out dir> [--spp=256]

Out (transparent PNGs; scripts/intro/publish.py makes them WebP in public/intro): lamp, shadow, marigold-0…5,
and intro.json — where each wick and each marigold of the ring falls in the
lamp image (fractions of its width and height), and which flowers stand
behind the lamp. The camera is orthographic, a little above the lamp, so the
ring is a flat ellipse and one marigold sprite fits anywhere on it.
"""
import json
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]
opt = dict(a.split("=", 1) for a in argv[1:] if "=" in a)
SPP = int(opt.get("--spp", 256))
os.makedirs(OUT, exist_ok=True)

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
sc.render.film_transparent = True
sc.view_settings.view_transform = "Khronos PBR Neutral"
sc.view_settings.look = "None"
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGBA"


def lin(h):
    c = [((h >> s) & 255) / 255 for s in (16, 8, 0)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def link(o):
    sc.collection.objects.link(o)
    return o


# ------------------------------------------------------------------ the lamp
H = 1.45
prof = [(0, 0), (0.19, 0), (0.19, 0.025), (0.15, 0.05), (0.07, 0.11), (0.045, 0.16), (0.032, 0.24),
        (0.05, 0.27), (0.032, 0.30), (0.028, H * 0.50), (0.06, H * 0.52), (0.028, H * 0.54),
        (0.026, H * 0.70), (0.16, H * 0.72), (0.17, H * 0.745), (0.15, H * 0.75), (0.03, H * 0.765),
        (0.024, H * 0.86), (0.07, H * 0.875), (0.075, H * 0.89), (0.022, H * 0.905), (0.02, H * 0.95),
        (0.045, H * 0.965), (0.03, H * 0.99), (0.0, H)]
segs = 96
me = bpy.data.meshes.new("lamp")
bm = bmesh.new()
rings = [[bm.verts.new((r * math.cos(2 * math.pi * k / segs), r * math.sin(2 * math.pi * k / segs), z)) for k in range(segs)]
         for r, z in prof]
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
lamp = link(bpy.data.objects.new("lamp", me))
sub = lamp.modifiers.new("s", "SUBSURF"); sub.levels = 1; sub.render_levels = 2

brass = bpy.data.materials.new("brass")
brass.use_nodes = True
nt = brass.node_tree
b = nt.nodes["Principled BSDF"]
b.inputs["Metallic"].default_value = 1.0
noise = nt.nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 26.0
noise.inputs["Detail"].default_value = 6.0
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].color = (*lin(0x8C6730), 1)        # an old lamp: polished where hands go, darker in the turns
ramp.color_ramp.elements[1].color = (*lin(0xA88241), 1)
ramp.color_ramp.elements[0].position = 0.3
ramp.color_ramp.elements[1].position = 0.7
nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
rr = nt.nodes.new("ShaderNodeMapRange")
rr.inputs["To Min"].default_value = 0.24
rr.inputs["To Max"].default_value = 0.36
nt.links.new(noise.outputs["Fac"], rr.inputs["Value"])
nt.links.new(rr.outputs["Result"], b.inputs["Roughness"])
lamp.data.materials.append(brass)

# the shadow catcher, the floor the lamp stands on (only its shadow is kept)
bpy.ops.mesh.primitive_plane_add(size=6)
floor = bpy.context.active_object
floor.is_shadow_catcher = True

# ------------------------------------------------------------------ marigolds
rnd = random.Random(11)
COLS = [lin(0xE0520A), lin(0xEC7A06), lin(0xF2A80A)]


def marigold(name, rgb, seed):
    """a marigold head: some three hundred ruffled petals packed round a dome,
    each a little cupped disc tilted out from the centre"""
    r = random.Random(seed)
    bm = bmesh.new()
    n = 300
    golden = math.pi * (3 - math.sqrt(5))
    for i in range(n):
        zf = 1 - (i / (n - 1)) * 1.35                      # from the crown down past the equator
        if zf < -0.35:
            break
        rad = math.sqrt(max(0.0, 1 - zf * zf))
        th = golden * i
        d = Vector((math.cos(th) * rad, math.sin(th) * rad, zf))
        R = 0.026 + 0.006 * r.random()
        c = Vector((d.x * R, d.y * R, d.z * R * 0.82 + 0.004))
        res = bmesh.ops.create_circle(bm, cap_ends=True, radius=1.0, segments=9)
        vs = res["verts"]
        a, b = 0.0105 + 0.003 * r.random(), 0.0075 + 0.002 * r.random()
        for v in vs:
            x, y = v.co.x * a, v.co.y * b
            # a ruffled, cupped edge
            ang = math.atan2(v.co.y, v.co.x)
            v.co = Vector((x * (1 + 0.18 * math.sin(ang * 5 + i)), y, -0.004 * (v.co.x ** 2 + v.co.y ** 2)))
        # face the petal outward, tilted up and a little twisted
        out = d.copy(); out.z = out.z * 0.6 + 0.35; out.normalize()
        q = out.to_track_quat("Z", "Y")
        tw = Vector((0, 0, 1)).rotation_difference(Vector((0, 0, 1)))
        for v in vs:
            v.co = q @ v.co + c
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    o = link(bpy.data.objects.new(name, me))
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt2 = m.node_tree
    bb = nt2.nodes["Principled BSDF"]
    # petals deepen toward the heart of the flower
    geo = nt2.nodes.new("ShaderNodeNewGeometry")
    sep = nt2.nodes.new("ShaderNodeSeparateXYZ")
    nt2.links.new(geo.outputs["Position"], sep.inputs[0])
    mr = nt2.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = -0.02
    mr.inputs["From Max"].default_value = 0.03
    nt2.links.new(sep.outputs["Z"], mr.inputs["Value"])
    cr = nt2.nodes.new("ShaderNodeValToRGB")
    deep = tuple(c * 0.55 for c in rgb)
    cr.color_ramp.elements[0].color = (*deep, 1)
    cr.color_ramp.elements[1].color = (*rgb, 1)
    nt2.links.new(mr.outputs["Result"], cr.inputs["Fac"])
    nt2.links.new(cr.outputs["Color"], bb.inputs["Base Color"])
    bb.inputs["Roughness"].default_value = 0.72
    bb.inputs["Subsurface Weight"].default_value = 0.1
    bb.inputs["Subsurface Radius"].default_value = (0.006, 0.002, 0.001)
    o.data.materials.append(m)
    return o


flowers = [marigold(f"marigold-{k}", COLS[k % 3], 3 + k * 7) for k in range(6)]

# ------------------------------------------------------------------ light
world = bpy.data.worlds.new("w")
sc.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (*lin(0xEFE6D6), 1)            # the page's own paper, reflected in the brass
bg.inputs["Strength"].default_value = 0.85


def area(name, loc, energy, size, rgb):
    d = bpy.data.lights.new(name, "AREA")
    d.energy = energy
    d.size = size
    d.color = rgb
    o = link(bpy.data.objects.new(name, d))
    o.location = loc
    o.rotation_euler = (Vector((0, 0, 0.7)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return o


# a high soft key, so the lamp's shadow pools at its foot rather than streaking away
area("key", (-0.9, -1.3, 3.6), 300, 2.6, (1.0, 0.93, 0.82))
area("fill", (2.2, -1.6, 1.2), 55, 2.4, (0.95, 0.95, 1.0))
area("rim", (0.8, 2.2, 2.2), 170, 1.0, (1.0, 0.85, 0.65))

# ------------------------------------------------------------------ camera
EL = math.radians(13)
W, HT = 720, 1200
cd = bpy.data.cameras.new("cam")
cd.type = "ORTHO"
cd.ortho_scale = 1.86
cam = link(bpy.data.objects.new("cam", cd))
look = Vector((0, 0, 0.66))
cam.location = look + Vector((0, -math.cos(EL), math.sin(EL))) * 10
cam.rotation_euler = (look - cam.location).to_track_quat("-Z", "Y").to_euler()
sc.camera = cam
sc.render.resolution_x, sc.render.resolution_y = W, HT
bpy.context.view_layer.update()


def px(co):
    v = world_to_camera_view(sc, cam, Vector(co))
    return [round(v.x, 5), round(1 - v.y, 5)]


# the wicks, round the rim of the cup, as the house's lamp has them
wicks = []
for k in range(5):
    a = (k / 5) * math.pi * 2 + 0.3
    wicks.append(px((math.cos(a) * 0.14, math.sin(a) * 0.14, H * 0.75 + 0.012)))

# the ring: two rows, the garland laid from the back round both sides to close at the front
ring = []
for row, (r, n) in enumerate(((0.395, 34), (0.33, 28), (0.268, 22))):
    for i in range(n):
        a = 2 * math.pi * (i + (0.5 if row else 0)) / n
        x, y = math.cos(a) * r, math.sin(a) * r
        p = px((x, y, 0.024))
        ring.append({"x": p[0], "y": p[1], "behind": y > 0.02, "a": round(math.degrees(a) % 360, 1), "row": row,
                     "v": rnd.randrange(6), "s": round(0.92 + rnd.random() * 0.16, 3),
                     "r": rnd.randrange(-14, 15), "m": rnd.random() < 0.5})
# the order they arrive in: from the back (90°) both ways round to the front (270°)
for f in ring:
    f["order"] = round(abs(((f["a"] - 90 + 180) % 360) - 180) / 180 + f["row"] * 0.012 + rnd.random() * 0.02, 4)
ring.sort(key=lambda f: f["order"])
# one marigold's size in the image, as a fraction of the image width
s0, s1 = px((-0.034, -0.38, 0.02)), px((0.034, -0.38, 0.02))
head = round(abs(s1[0] - s0[0]) * 1.08, 5)
json.dump({"w": W, "h": HT, "wicks": wicks, "ring": ring, "head": head,
           "base": px((0, 0, 0)), "top": px((0, 0, H))}, open(os.path.join(OUT, "intro.json"), "w"), indent=1)

# ------------------------------------------------------------------ renders
def only(*keep, shadow=False):
    for o in [lamp, *flowers]:
        o.hide_render = o not in keep
    floor.hide_render = not shadow


# the lamp alone, then its shadow alone
only(lamp)
sc.render.filepath = os.path.join(OUT, "lamp.png")
bpy.ops.render.render(write_still=True)
only(lamp, shadow=True)
lamp.visible_camera = False
sc.render.filepath = os.path.join(OUT, "shadow.png")
bpy.ops.render.render(write_still=True)
lamp.visible_camera = True

# each marigold, alone, at the front of the ring, rendered at a higher resolution in a small border
sc.render.resolution_x, sc.render.resolution_y = W * 2, HT * 2
for k, f in enumerate(flowers):
    f.location = (0, -0.38, 0.018)
    f.rotation_euler = (0, 0, rnd.random() * 6.28)
    only(f)
    c = px((0, -0.38, 0.018))
    pad = head * 0.75
    sc.render.use_border = True
    sc.render.use_crop_to_border = True
    sc.render.border_min_x, sc.render.border_max_x = c[0] - pad, c[0] + pad
    sc.render.border_min_y, sc.render.border_max_y = (1 - c[1]) - pad * W / HT, (1 - c[1]) + pad * W / HT
    sc.render.filepath = os.path.join(OUT, f"marigold-{k}.png")
    bpy.ops.render.render(write_still=True)
print("INTRO_DONE", flush=True)

