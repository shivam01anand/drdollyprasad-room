"""
Bake the room's light (Blender / Cycles).

    blender -b -P scripts/bake/bake.py -- <scene.json> <out dir> <atlas px> <samples>

scene.json comes from the room itself (Room.exportForBake, development only),
so every surface is the one the site draws, vertex for vertex. This script:

1. rebuilds each surface with its photographed albedo, normal and roughness;
2. recreates the light: the sun through the grille, the door light dappled by
   the canopy, the open side as one large soft window, and the sky;
3. lays one lightmap atlas over every surface that receives light (density
   per mesh: far ground and courtyard take less), and
4. path-traces the diffuse light (direct + indirect, no albedo) into it.

Out: lightmap.npy (float32, H×W×3, linear), lm-uv.bin (Float32 per vertex,
in export order), lm.json (offsets per mesh). encode.py turns them into the
files the site loads.
"""
import base64
import json
import math
import os
import sys
import time

import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

argv = sys.argv[sys.argv.index("--") + 1:]
SCENE, OUT = argv[0], argv[1]
RES = int(argv[2]) if len(argv) > 2 else 2048
SAMPLES = int(argv[3]) if len(argv) > 3 else 256
PUBLIC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public")
os.makedirs(OUT, exist_ok=True)
t0 = time.time()


def log(*a):
    print(f"[bake {time.time() - t0:6.1f}s]", *a, flush=True)


data = json.load(open(SCENE))

# three is y-up, Blender z-up: (x, y, z) -> (x, -z, y)
def v3(p):
    return Vector((p[0], -p[2], p[1]))


def f32(s, n):
    return np.frombuffer(base64.b64decode(s), dtype=np.float32).reshape(-1, n)


def lin(c):
    return (c[0], c[1], c[2], 1.0)


# --------------------------------------------------------------------- scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
try:
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = "GPU"
    log("devices:", [d.name for d in prefs.devices if d.use])
except Exception as e:  # noqa: BLE001
    log("GPU unavailable, CPU bake:", e)
scene.cycles.samples = SAMPLES
scene.cycles.use_adaptive_sampling = False
scene.cycles.max_bounces = 8
scene.cycles.diffuse_bounces = 6
scene.cycles.glossy_bounces = 2
scene.cycles.transmission_bounces = 2
scene.cycles.sample_clamp_indirect = 6.0
scene.render.bake.margin = 6
scene.render.bake.margin_type = "EXTEND"

# ------------------------------------------------------------------ textures
_images = {}


def image(rel, colour=True):
    key = (rel, colour)
    if key in _images:
        return _images[key]
    path = os.path.join(PUBLIC, rel.lstrip("/"))
    img = bpy.data.images.load(path, check_existing=True)
    img.colorspace_settings.name = "sRGB" if colour else "Non-Color"
    _images[key] = img
    return img


_materials = {}
LM_IMAGE = bpy.data.images.new("Lightmap", RES, RES, alpha=False, float_buffer=True)


def material(m):
    """one Blender material per role (or per painting), with the bake target node"""
    specs = data["specs"]
    key = m["art"] if m["role"] == "art" else m["role"]
    if key in _materials:
        return _materials[key]
    mat = bpy.data.materials.new(f"M_{key}")
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        if n.type != "OUTPUT_MATERIAL":
            nt.nodes.remove(n)
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    uv0 = nt.nodes.new("ShaderNodeUVMap")
    uv0.uv_map = "UVMap"
    tint = nt.nodes.new("ShaderNodeRGB")
    tint.outputs[0].default_value = lin(m["color"])
    bsdf.inputs["Roughness"].default_value = m["roughness"]
    bsdf.inputs["Metallic"].default_value = m["metalness"]

    def tex(rel, colour):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = image(rel, colour)
        nt.links.new(uv0.outputs["UV"], t.inputs["Vector"])
        return t

    if m["role"] == "art":
        t = tex(f"/art/room/{m['art']}.jpg", True)
        nt.links.new(t.outputs["Color"], bsdf.inputs["Base Color"])
    else:
        s = specs.get(m["role"], {})
        st = s.get("set")
        if st:
            diff = tex(f"/tex/{st}_diff.webp", True)
            mul = nt.nodes.new("ShaderNodeMix")
            mul.data_type = "RGBA"
            mul.blend_type = "MULTIPLY"
            mul.inputs["Factor"].default_value = 1.0
            nt.links.new(diff.outputs["Color"], mul.inputs[6])
            nt.links.new(tint.outputs[0], mul.inputs[7])
            nt.links.new(mul.outputs[2], bsdf.inputs["Base Color"])
        else:
            nt.links.new(tint.outputs[0], bsdf.inputs["Base Color"])
        nset = st or s.get("detail")
        if nset:
            nor = tex(f"/tex/{nset}_nor.webp", False)
            nm = nt.nodes.new("ShaderNodeNormalMap")
            nm.uv_map = "UVMap"
            nm.inputs["Strength"].default_value = s.get("normal", 1.0) if st else 0.45
            nt.links.new(nor.outputs["Color"], nm.inputs["Color"])
            nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
            arm = tex(f"/tex/{nset}_arm.webp", False)
            sep = nt.nodes.new("ShaderNodeSeparateColor")
            nt.links.new(arm.outputs["Color"], sep.inputs["Color"])
            rmul = nt.nodes.new("ShaderNodeMath")
            rmul.operation = "MULTIPLY"
            rmul.inputs[1].default_value = m["roughness"]
            nt.links.new(sep.outputs["Green"], rmul.inputs[0])
            nt.links.new(rmul.outputs[0], bsdf.inputs["Roughness"])
    # the bake target: the shared atlas, on the lightmap UVs
    uvl = nt.nodes.new("ShaderNodeUVMap")
    uvl.uv_map = "LM"
    lm = nt.nodes.new("ShaderNodeTexImage")
    lm.image = LM_IMAGE
    lm.name = "LM_TARGET"
    nt.links.new(uvl.outputs["UV"], lm.inputs["Vector"])
    nt.nodes.active = lm
    _materials[key] = mat
    return mat


# -------------------------------------------------------------------- meshes
def build(m):
    P = f32(m["position"], 3)
    N = f32(m["normal"], 3)
    UV = f32(m["uv"], 2) if m["uv"] else None
    n = len(P)
    # weld coincident corners so islands are connected; corner i of face f is
    # always original vertex 3f+i, so per-loop data maps back one to one
    keys = np.round(P / 1e-5).astype(np.int64)
    _, first, inverse = np.unique(keys, axis=0, return_index=True, return_inverse=True)
    inverse = inverse.reshape(-1)
    verts = [tuple(v3(P[i])) for i in first]
    faces = [tuple(inverse[3 * f + k] for k in range(3)) for f in range(n // 3)]
    me = bpy.data.meshes.new(m["name"])
    me.from_pydata(verts, [], faces)
    me.update()
    loop_vert = np.zeros(len(me.loops), dtype=np.int64)
    me.loops.foreach_get("vertex_index", loop_vert)
    # face order and corner order are preserved: loop l is original vertex l
    assert len(me.loops) == n, (m["name"], len(me.loops), n)
    assert np.array_equal(loop_vert, inverse), m["name"]
    normals = [tuple(v3(N[i]).normalized()) for i in range(n)]
    me.normals_split_custom_set(normals)
    uv0 = me.uv_layers.new(name="UVMap")
    if UV is not None:
        uv0.data.foreach_set("uv", UV.reshape(-1))
    if m["kind"] == "bake":
        me.uv_layers.new(name="LM")
    ob = bpy.data.objects.new(m["name"], me)
    scene.collection.objects.link(ob)
    ob.data.materials.append(material(m))
    if m["kind"] == "canopy":
        ob.visible_camera = False
        ob.visible_glossy = False
        mat = bpy.data.materials.new("M_canopy")
        mat.use_nodes = True
        mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.08, 0.12, 0.06, 1)
        ob.data.materials[0] = mat
    return ob


bakes, others = [], []
for m in data["meshes"]:
    ob = build(m)
    (bakes if m["kind"] == "bake" else others).append((ob, m))
log(f"built {len(bakes)} bake targets, {len(others)} casters")

# --------------------------------------------------------------------- light
L = data["lights"]


def sun(spec, angle_deg, name):
    d = bpy.data.lights.new(name, "SUN")
    d.color = spec["color"]
    d.energy = spec["intensity"]
    d.angle = math.radians(angle_deg)
    ob = bpy.data.objects.new(name, d)
    scene.collection.objects.link(ob)
    direction = (v3(spec["to"]) - v3(spec["from"])).normalized()
    ob.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return ob


sun(L["sun"], 0.6, "Sun")
sun(L["door"], 1.5, "Door")

f = L["front"]
area = bpy.data.lights.new("Front", "AREA")
area.shape = "RECTANGLE"
area.size, area.size_y = f["width"], f["height"]
area.color = f["color"]
# three's RectAreaLight intensity is radiance; Blender's area power is flux
area.energy = f["intensity"] * math.pi * f["width"] * f["height"]
fo = bpy.data.objects.new("Front", area)
scene.collection.objects.link(fo)
fo.location = v3(f["position"])
q = Quaternion((f["quaternion"][3], f["quaternion"][0], f["quaternion"][1], f["quaternion"][2]))
fwd3 = q @ Vector((0, 0, -1))
up3 = q @ Vector((0, 1, 0))
fwd, up = v3(fwd3), v3(up3)
x = fwd.cross(up).normalized()  # local X = Y × Z, with Z = -forward
rot = Matrix((x, up.normalized(), -fwd.normalized())).transposed()
fo.rotation_euler = rot.to_euler()

# the sky the openings look out on: the site's own gradient
world = bpy.data.worlds.new("Sky")
scene.world = world
world.use_nodes = True
wn = world.node_tree
bg = wn.nodes["Background"]
geo = wn.nodes.new("ShaderNodeTexCoord")
sep = wn.nodes.new("ShaderNodeSeparateXYZ")
wn.links.new(geo.outputs["Generated"], sep.inputs[0])
ramp = wn.nodes.new("ShaderNodeValToRGB")
# generated z runs -1 (down) … 1 (up) for the world; map to 0 … 1
mapz = wn.nodes.new("ShaderNodeMapRange")
mapz.inputs["From Min"].default_value = -1.0
mapz.inputs["From Max"].default_value = 1.0
wn.links.new(sep.outputs["Z"], mapz.inputs["Value"])
wn.links.new(mapz.outputs["Result"], ramp.inputs["Fac"])


def srgb(h):
    c = [((h >> s) & 255) / 255 for s in (16, 8, 0)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)


ramp.color_ramp.elements[0].position = 0.38
ramp.color_ramp.elements[0].color = srgb(0xE7D9C4)
ramp.color_ramp.elements[1].position = 0.95
ramp.color_ramp.elements[1].color = srgb(0xCAD8E4)
mid = ramp.color_ramp.elements.new(0.5)
mid.color = srgb(0xF6EAD8)
wn.links.new(ramp.outputs["Color"], bg.inputs["Color"])
bg.inputs["Strength"].default_value = float(os.environ.get("SKY", "0.9"))

# ------------------------------------------------------------- lightmap UVs
bpy.ops.object.select_all(action="DESELECT")
for ob, _ in bakes:
    ob.select_set(True)
    ob.data.uv_layers.active = ob.data.uv_layers["LM"]
bpy.context.view_layer.objects.active = bakes[0][0]
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.0, area_weight=0.0,
                         correct_aspect=True, scale_to_bounds=False)
bpy.ops.uv.average_islands_scale()
bpy.ops.object.mode_set(mode="OBJECT")
# density per mesh: far ground and courtyard take a fraction of the texels
for ob, m in bakes:
    k = float(m.get("lm", 1))
    if k != 1:
        uv = np.zeros(len(ob.data.loops) * 2, dtype=np.float32)
        ob.data.uv_layers["LM"].data.foreach_get("uv", uv)
        ob.data.uv_layers["LM"].data.foreach_set("uv", uv * k)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.select_all(action="SELECT")
bpy.ops.uv.pack_islands(rotate=True, margin_method="FRACTION", margin=3.0 / RES * 2, scale=True)
bpy.ops.object.mode_set(mode="OBJECT")
log("lightmap UVs packed")

# --------------------------------------------------------------------- bake
bpy.ops.object.select_all(action="DESELECT")
for ob, _ in bakes:
    ob.select_set(True)
bpy.context.view_layer.objects.active = bakes[0][0]
log(f"baking {RES}² at {SAMPLES} samples …")
bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, use_clear=True, margin=6)
log("baked")

px = np.empty(RES * RES * 4, dtype=np.float32)
LM_IMAGE.pixels.foreach_get(px)
np.save(os.path.join(OUT, "lightmap.npy"), px.reshape(RES, RES, 4)[::-1, :, :3].copy())

# the lightmap UVs, back in the site's vertex order (Blender's v matches three's flipY)
offsets, chunks, at = {}, [], 0
for ob, m in bakes:
    uv = np.zeros(len(ob.data.loops) * 2, dtype=np.float32)
    ob.data.uv_layers["LM"].data.foreach_get("uv", uv)
    chunks.append(uv)
    offsets[m["name"]] = {"offset": at, "count": m["count"], "runtime": m["runtimeName"], "index": m["index"]}
    at += uv.size
np.concatenate(chunks).astype(np.float32).tofile(os.path.join(OUT, "lm-uv.bin"))
json.dump({"res": RES, "samples": SAMPLES, "meshes": offsets}, open(os.path.join(OUT, "lm.json"), "w"), indent=1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "bake.blend"))
log("done")
