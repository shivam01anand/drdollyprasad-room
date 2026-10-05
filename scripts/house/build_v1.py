"""
The house — Dr Dolly Prasad's studio-house, built in Blender.

    blender -b -P scripts/house/build.py -- <out dir> [--render a,b,c] [--spp 96] [--res 1440]

Three spaces in one line of thresholds, so each room is seen through the
last (an enfilade): the Aangan (a courtyard garden, open to the sky), the
Quiet Room, the Red Room. The architecture is a quiet ground — lime-washed
walls, deep reveals, softened corners — and every canvas is lit as a gallery
lights it. Units are metres; Blender axes: x east, y north, z up.

This first pass builds the blockout and renders the chapters' views for
review. Later passes add the bespoke objects and export for the site.
"""
import json
import math
import os
import sys

import bpy
import bmesh
from mathutils import Euler, Vector

argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]
opt = {a.split("=")[0]: a.split("=")[1] for a in argv[1:] if "=" in a}
RENDER = [s for s in opt.get("--render", "").split(",") if s]
SPP = int(opt.get("--spp", 96))
RES = int(opt.get("--res", 1440))
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PUB = os.path.join(ROOT, "public")
ART = os.path.expanduser("~/Desktop/dolly-prasad-study/images-final")
PH = os.path.join(ROOT, "assets", "polyhaven")
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
sc.cycles.max_bounces = 8
sc.cycles.diffuse_bounces = 5
sc.view_settings.view_transform = "AgX"
sc.view_settings.look = "AgX - Base Contrast"

T = 0.45          # wall thickness
H_ROOM = 3.6      # interior rooms
H_AANGAN = 4.2    # courtyard walls, open to the sky

# ------------------------------------------------------------------ materials
_img = {}


def img(path, colour=True):
    if path not in _img:
        im = bpy.data.images.load(path, check_existing=True)
        im.colorspace_settings.name = "sRGB" if colour else "Non-Color"
        _img[path] = im
    return _img[path]


def surface(name, tex_set, tint, tile, rough=1.0, normal=0.7):
    """a photographed surface laid in metres by box projection, tinted"""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / tile, 1 / tile, 1 / tile)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])

    def tex(kind, colour):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = img(os.path.join(PUB, "tex", f"{tex_set}_{kind}.webp"), colour)
        t.projection = "BOX"
        t.projection_blend = 0.25
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
    n = tex("nor", False)
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = normal
    nt.links.new(n.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    a = tex("arm", False)
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(a.outputs["Color"], sep.inputs["Color"])
    r = nt.nodes.new("ShaderNodeMath")
    r.operation = "MULTIPLY"
    r.inputs[1].default_value = rough
    nt.links.new(sep.outputs["Green"], r.inputs[0])
    nt.links.new(r.outputs[0], b.inputs["Roughness"])
    return m


def flat(name, rgb, rough=0.9):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    return m


# the three grounds: warm ivory in the garden, cool chalk for stillness, red lime by the street
M = {
    "aangan": surface("Lime_Aangan", "plaster", (1.80, 1.66, 1.52), 2.0),
    "quiet": surface("Lime_Quiet", "plaster", (1.55, 1.56, 1.55), 2.0, normal=0.5),
    "red": surface("Lime_Red", "plaster", (0.95, 0.30, 0.17), 2.0),
    "redwhite": surface("Lime_RedRoomWhite", "plaster", (1.72, 1.55, 1.36), 2.0),
    "court_floor": surface("Terracotta_Floor", "terracotta", (1.0, 0.86, 0.76), 2.0, rough=1.0),
    "kota": surface("Kota_Floor", "floor", (0.95, 0.92, 0.86), 2.8),
    "sandstone": surface("Sandstone", "sandstone", (0.98, 0.86, 0.72), 1.4),
    "timber": surface("Timber", "timber", (1.1, 0.95, 0.8), 2.0),
    "canvas_edge": flat("CanvasEdge", (0.05, 0.04, 0.035), 0.8),
}

# ------------------------------------------------------------------ geometry
def box(name, x0, x1, y0, y1, z0, z1, mat, bevel=0.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    o = bpy.context.active_object
    o.name = name
    o.scale = (x1 - x0, y1 - y0, z1 - z0)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(mat)
    if bevel:
        bv = o.modifiers.new("soft", "BEVEL")
        bv.width = bevel
        bv.segments = 3
        bv.limit_method = "ANGLE"
    return o


def cutter_arch(x, y, w, h, depth, axis):
    """an arched opening: a box to the springing line and a half-cylinder above"""
    spring = h - w / 2
    if axis == "x":      # opening through a wall that runs along y (an east/west wall)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, spring / 2 - 0.05))
        b = bpy.context.active_object
        b.scale = (depth, w, spring + 0.1)
        bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=w / 2, depth=depth, location=(x, y, spring),
                                            rotation=(0, math.pi / 2, 0))
    else:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, spring / 2 - 0.05))
        b = bpy.context.active_object
        b.scale = (w, depth, spring + 0.1)
        bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=w / 2, depth=depth, location=(x, y, spring),
                                            rotation=(math.pi / 2, 0, 0))
    c = bpy.context.active_object
    bpy.ops.object.select_all(action="DESELECT")
    b.select_set(True)
    c.select_set(True)
    bpy.context.view_layer.objects.active = b
    bpy.ops.object.join()
    b.display_type = "WIRE"
    b.hide_render = True
    return b


def cut(target, cutter):
    m = target.modifiers.new("cut", "BOOLEAN")
    m.object = cutter
    m.operation = "DIFFERENCE"
    m.solver = "EXACT"
    # the cut comes before the softening, so the opening's edges are softened too
    bpy.context.view_layer.objects.active = target
    while target.modifiers[0].name != "cut":
        bpy.ops.object.modifier_move_up(modifier="cut")


# --- the Aangan: x 0…8, y 0…6.4, open to the sky
AX0, AX1, AY0, AY1 = 0.0, 8.0, 0.0, 6.4
box("Aangan_Floor", AX0 - T, AX1 + T, AY0 - 2.5, AY1 + T, -0.2, 0.0, M["court_floor"], bevel=0)
east = box("Aangan_E", AX1, AX1 + T, AY0, AY1 + T, 0, H_AANGAN, M["aangan"])
north = box("Aangan_N", AX0 - T, AX1 + T, AY1, AY1 + T, 0, H_AANGAN, M["aangan"])
west = box("Aangan_W", AX0 - T, AX0, AY0, AY1, 0, H_AANGAN, M["aangan"])
# a low parapet to the south: the courtyard opens toward the viewer
box("Aangan_S_Plinth", AX0 - T, AX1 + T, AY0 - T, AY0, 0, 0.45, M["sandstone"])
# the threshold into the Quiet Room, on the courtyard's west wall, on the house's axis
ARCH_Y = 4.1
cut(west, cutter_arch(AX0 - T / 2, ARCH_Y, 1.5, 2.9, T + 0.2, "x"))

# --- the Quiet Room: west of the Aangan, x -5.6…-0.45, y 1.0…6.4
QX0, QX1, QY0, QY1 = -5.6, AX0 - T, 1.0, AY1
box("Quiet_Floor", QX0 - T, QX1, QY0 - T, QY1 + T, -0.2, 0.0, M["kota"], bevel=0)
qw = box("Quiet_W", QX0 - T, QX0, QY0 - T, QY1 + T, 0, H_ROOM, M["quiet"])
qn = box("Quiet_N", QX0 - T, QX1, QY1, QY1 + T, 0, H_ROOM, M["quiet"])
qs = box("Quiet_S", QX0 - T, QX1, QY0 - T, QY0, 0, H_ROOM, M["quiet"])
box("Quiet_Roof", QX0 - T, QX1 + T, QY0 - T, QY1 + T, H_ROOM, H_ROOM + 0.3, M["quiet"], bevel=0)
# a high slit of light on the north wall — the room's only window
bpy.ops.mesh.primitive_cube_add(size=1, location=(-3.0, QY1 + T / 2, 2.95))
slit = bpy.context.active_object
slit.scale = (1.6, T + 0.2, 0.32)
slit.hide_render = True
slit.display_type = "WIRE"
cut(qn, slit)
# the way on, to the Red Room: a plain doorway in the south wall
DOOR_X = -3.0
cut(qs, cutter_arch(DOOR_X, QY0 - T / 2, 1.2, 2.5, T + 0.2, "y"))

# --- the Red Room: south of the Quiet Room, x -5.6…-0.45, y -4.6…0.55
RX0, RX1, RY0, RY1 = QX0, QX1, -4.6, QY0 - T
box("Red_Floor", RX0 - T, RX1 + T, RY0 - T, RY1, -0.2, 0.0, M["kota"], bevel=0)
rw = box("Red_W", RX0 - T, RX0, RY0 - T, RY1, 0, H_ROOM, M["redwhite"])
re_ = box("Red_E", RX1, RX1 + T, RY0 - T, RY1 + T, 0, H_ROOM, M["redwhite"])
rs = box("Red_S", RX0 - T, RX1 + T, RY0 - T, RY0, 0, H_ROOM, M["redwhite"])
box("Red_Roof", RX0 - T, RX1 + T, RY0 - T, RY1 + T, H_ROOM, H_ROOM + 0.3, M["redwhite"], bevel=0)
# the red field the Bullocks hang on: lime-washed red over the west wall's middle
box("Red_Field", RX0, RX0 + 0.012, -3.4, -0.6, 0.0, 3.1, M["red"], bevel=0.004)
# the street door, in the south wall (the old turquoise door hangs here later)
cut(rs, cutter_arch(-1.9, RY0 - T / 2, 1.1, 2.3, T + 0.2, "y"))
# a grille window to the east, for the sun
bpy.ops.mesh.primitive_cube_add(size=1, location=(RX1 + T / 2, -2.4, 2.1))
win = bpy.context.active_object
win.scale = (T + 0.2, 1.3, 1.0)
win.hide_render = True
win.display_type = "WIRE"
cut(re_, win)
for k in range(5):
    box(f"Red_Grille_{k}", RX1 + T * 0.4, RX1 + T * 0.5, -2.4 - 0.55 + k * 0.275 - 0.012, -2.4 - 0.55 + k * 0.275 + 0.012,
        1.6, 2.6, M["timber"], bevel=0.003)

# ------------------------------------------------------------------ paintings
def painting(art_id, wall, along, centre_z, longest_m, depth=0.038):
    """a stretched canvas, hung flat on a wall; wall is the face it hangs on:
    ('E'|'W'|'N'|'S', coordinate of that face)"""
    path = os.path.join(ART, f"{art_id}.jpg")
    im = img(path, True)
    ar = im.size[0] / im.size[1]
    w, h = (longest_m, longest_m / ar) if ar >= 1 else (longest_m * ar, longest_m)
    side, face = wall
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object
    o.name = f"Art_{art_id}"
    # local: x = width, y = depth (out of the wall), z = height
    o.scale = (w, depth, h)
    bpy.ops.object.transform_apply(scale=True)
    # the face toward the room carries the painting, the edges the dark wrap
    mat = bpy.data.materials.new(f"Paint_{art_id}")
    mat.use_nodes = True
    nt = mat.node_tree
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = im
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.55
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    o.data.materials.append(mat)
    o.data.materials.append(M["canvas_edge"])
    me = o.data
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        if f.normal.y < -0.9:          # the front (toward -y in local space)
            f.material_index = 0
            for lp in f.loops:
                lp[uv].uv = (lp.vert.co.x / w + 0.5, lp.vert.co.z / h + 0.5)
        else:
            f.material_index = 1
    bm.to_mesh(me)
    bm.free()
    # the canvas's face is local -y; turn it to face into the room
    rot = {"N": 0.0, "S": math.pi, "E": -math.pi / 2, "W": math.pi / 2}[side]
    o.rotation_euler = (0, 0, rot)
    off = depth / 2 + 0.006
    if side == "N":
        o.location = (along, face - off, centre_z)
    elif side == "S":
        o.location = (along, face + off, centre_z)
    elif side == "E":
        o.location = (face - off, along, centre_z)
    else:
        o.location = (face + off, along, centre_z)
    return o, (w, h)


HANG = [
    # the Aangan — the light
    ("woman-with-poppies", ("E", AX1), AY1 / 2, 1.62, 1.22),
    ("child-among-flowers", ("N", AY1), 1.7, 1.62, 0.95),
    ("woman-with-red-flower", ("N", AY1), 4.0, 1.62, 0.70),
    ("woman-with-bird", ("N", AY1), 6.2, 1.62, 0.70),
    ("boy-with-bananas", ("W", AX0), 1.6, 1.62, 0.92),
    # the Quiet Room — stillness
    ("monk-and-green-buddha", ("W", QX0), ARCH_Y, 1.70, 1.25),
    ("monks-and-blue-buddha", ("N", QY1), -2.0, 1.62, 1.10),
    ("temple-bells", ("S", QY0), -1.25, 1.62, 0.92),
    # the Red Room — the street
    ("bulls-and-wheel", ("W", RX0), -2.0, 1.62, 1.05),
    ("shree-420-and-milk-cans", ("E", RX1), -0.9, 1.62, 0.86),
    ("terracotta-pots", ("S", RY0), -4.2, 1.55, 0.86),
    ("three-veiled-women", ("E", RX1), -3.9, 1.62, 0.86),
]
placed = {}
for art_id, wall, along, cz, longest in HANG:
    placed[art_id] = painting(art_id, wall, along, cz, longest)

# ------------------------------------------------------------------ objects
def asset(ph_id, loc, rot_z=0.0, scale=1.0):
    path = os.path.join(PH, ph_id, f"{ph_id}_1k.gltf")
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    roots = [o for o in new if o.parent is None]
    for r in roots:
        r.location = Vector(loc)
        r.rotation_euler = Euler((0, 0, rot_z))
        r.scale = (scale, scale, scale)
    return roots


# the Aangan: plants in terracotta, gathered at the floral wall's foot and the hero's
asset("potted_plant_01", (AX1 - 0.55, 1.2, 0), 0.4)
asset("potted_plant_02", (AX1 - 0.6, AY1 - 1.0, 0), 1.1)
asset("periwinkle_plant", (3.4, AY1 - 0.35, 0), 0.0, 1.0)
asset("planter_pot_clay", (0.9, AY1 - 0.45, 0), 0.3)
asset("fern_02", (0.55, 0.6, 0), 0.8, 0.8)
asset("wicker_basket_02", (5.6, AY1 - 0.5, 0), 0.6)
# the Quiet Room: a peedha, a lota, a lamp
asset("wooden_stool_02", (-4.8, 2.4, 0), 0.4)
asset("brass_vase_03", (-4.86, 2.42, 0.18), 0.0)
asset("brass_diya_lantern", (-4.9, 5.7, 0), 0.0, 1.3)
asset("carved_wooden_plate", (-1.2, 5.85, 0.0), 0.0)
# the Red Room: the street's things
asset("metal_jug", (-1.0, -4.15, 0), 0.4)
asset("metal_jug", (-1.25, -3.85, 0), 1.9, 0.85)
asset("brass_pot_01", (-5.0, -0.3, 0), 0.0)
asset("wooden_bucket_01", (-1.0, 0.05, 0), 0.7)
asset("ceramic_pot", (-4.9, -4.05, 0), 0.2, 0.8)

# ------------------------------------------------------------------ light
sky = bpy.data.worlds.new("Sky")
sc.world = sky
sky.use_nodes = True
st = sky.node_tree.nodes.new("ShaderNodeTexSky")
for k, v in (("sky_type", "NISHITA"), ("sun_elevation", math.radians(38)), ("sun_rotation", math.radians(118)),
             ("air_density", 1.2), ("dust_density", 2.4), ("sun_intensity", 0.55)):
    try:
        setattr(st, k, v)
    except (AttributeError, TypeError):
        print("sky: no", k, flush=True)
bg = sky.node_tree.nodes["Background"]
sky.node_tree.links.new(st.outputs["Color"], bg.inputs["Color"])
bg.inputs["Strength"].default_value = 0.22

# the morning sun, from the east-south-east, low enough to reach into the rooms
sun_d = bpy.data.lights.new("Sun", "SUN")
sun_d.energy = 4.2
sun_d.angle = math.radians(0.8)
sun_d.color = (1.0, 0.93, 0.82)
sun = bpy.data.objects.new("Sun", sun_d)
sc.collection.objects.link(sun)
sun.rotation_euler = Euler((math.radians(52), 0, math.radians(118)))


def gallery_light(name, target, side, power=55, dist=1.9, height=3.25, size=0.5):
    """a soft area light high on the facing side, raking down onto a canvas"""
    tx, ty, tz = target
    d = bpy.data.lights.new(name, "AREA")
    d.shape = "DISK"
    d.size = size
    d.energy = power
    d.color = (1.0, 0.94, 0.86)
    o = bpy.data.objects.new(name, d)
    sc.collection.objects.link(o)
    n = {"N": Vector((0, -1, 0)), "S": Vector((0, 1, 0)), "E": Vector((-1, 0, 0)), "W": Vector((1, 0, 0))}[side]
    o.location = Vector((tx, ty, height)) + n * dist
    o.rotation_euler = (Vector((tx, ty, tz)) - o.location).to_track_quat("-Z", "Y").to_euler()
    return o


for art_id, wall, along, cz, longest in HANG:
    side, face = wall
    t = (along, face, cz) if side in "NS" else (face, along, cz)
    # the courtyard is lit by the sky; rooms get their lights
    if art_id in ("monk-and-green-buddha", "monks-and-blue-buddha", "temple-bells"):
        gallery_light(f"L_{art_id}", t, side, power=38, height=3.3)
    elif art_id in ("bulls-and-wheel", "shree-420-and-milk-cans", "terracotta-pots", "three-veiled-women"):
        gallery_light(f"L_{art_id}", t, side, power=45)

# ------------------------------------------------------------------ cameras
VIEWS = {
    # name: (eye, look-at, vertical fov in degrees)
    "aangan_hero": ((2.2, 3.2, 1.55), (AX1, 3.2, 1.62), 48),
    "aangan_floral": ((4.0, 1.0, 1.5), (4.0, AY1, 1.55), 56),
    "aangan_threshold": ((6.2, 2.4, 1.55), (AX0, 3.3, 1.6), 54),
    "quiet_buddha": ((-1.2, 3.9, 1.5), (QX0, 3.9, 1.65), 52),
    "quiet_faith": ((-3.0, 4.6, 1.5), (-1.6, QY0, 1.55), 52),
    "red_bulls": ((-1.4, -2.0, 1.5), (RX0, -2.0, 1.55), 54),
    "red_room": ((-1.0, 0.2, 1.6), (-4.4, -3.6, 1.3), 58),
    "overhead": ((1.0, 0.6, 15.5), (0.4, 0.9, 0.0), 50),
}


def camera(name, eye, at, fov):
    cd = bpy.data.cameras.new(name)
    cd.sensor_fit = "VERTICAL"
    cd.angle_y = math.radians(fov)
    o = bpy.data.objects.new(name, cd)
    sc.collection.objects.link(o)
    o.location = eye
    d = Vector(at) - Vector(eye)
    # looking straight down, "up" in the frame is north
    o.rotation_euler = (d.to_track_quat("-Z", "Y") if abs(d.normalized().z) < 0.95 else
                        Euler((0, 0, 0)).to_quaternion()).to_euler()
    return o


cams = {k: camera(k, *v) for k, v in VIEWS.items()}
# the overhead looks down into the house: lift the roofs out of it
for n in ("Quiet_Roof", "Red_Roof"):
    bpy.data.objects[n]["roof"] = True

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "house.blend"))
json.dump({"hang": [(a, w[0], w[1], al, cz, lg, placed[a][1]) for a, w, al, cz, lg in HANG], "views": VIEWS},
          open(os.path.join(OUT, "house.json"), "w"), indent=1)

sc.render.resolution_x = RES
sc.render.resolution_y = round(RES * 900 / 1440)
for name in RENDER:
    sc.camera = cams[name]
    roofs = [bpy.data.objects[n] for n in ("Quiet_Roof", "Red_Roof")]
    for r in roofs:
        r.hide_render = name == "overhead"
    sc.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("rendered", name, flush=True)
