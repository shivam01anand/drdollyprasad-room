"""
Bake the house's light and export it for the site.

    blender -b <house.blend> -P scripts/house/export.py -- <out dir> [--res=4096] [--spp=160] [--only=day|night]

1. Apply every modifier; join the static surfaces by material role (walls,
   floors, the timber ceilings apart, so the plan view can lift them), keeping
   the far ground at its own lightmap density.
2. Lay one lightmap atlas over the static surfaces and the canvases (UV "LM").
3. Bake the diffuse light twice into it: DAY (afternoon sun, sky, gallery
   lights low, rooms' fill) and NIGHT (the diya lit: a dark sky, the gallery
   lights up, the brass lamp and the courtyard lantern glowing).
4. Export house.glb: the static surfaces with only their LM UVs, the canvases
   with their own UVs and LM, the props and foliage with their own materials
   (textures shrunk to 512, WebP), Draco-compressed, custom properties kept.

Out: house.glb, lm-day.npy, lm-night.npy, lm.json (atlas facts).
"""
import json
import math
import os
import sys
import time

import bpy
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]
opt = dict(a.split("=", 1) for a in argv[1:] if "=" in a)
RES = int(opt.get("--res", 4096))
SPP = int(opt.get("--spp", 160))
ONLY = opt.get("--only")
os.makedirs(OUT, exist_ok=True)
t0 = time.time()
sc = bpy.context.scene


def log(*a):
    print(f"[export {time.time() - t0:7.1f}s]", *a, flush=True)


# ------------------------------------------------------------------ 1. flatten
bpy.ops.object.select_all(action="DESELECT")
cutters = [o for o in bpy.data.objects if o.name.startswith("cutter")]
# the openings are cut by booleans that need their cutters: apply first, then remove them
for o in cutters:
    o.hide_set(False)
    o.hide_viewport = False
for o in [o for o in bpy.data.objects if o.type == "MESH" and o.modifiers and not o.name.startswith("cutter")]:
    before = len(o.data.polygons)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.convert(target="MESH")
for o in cutters:
    bpy.data.objects.remove(o, do_unlink=True)
walls = {o.name: len(o.data.polygons) for o in bpy.data.objects if o.name in ("Wall_AanganW", "Wall_QuietS", "Wall_RedW")}
log("modifiers applied; cut walls:", walls)


def kind(o):
    n = o.name
    if n.startswith("Art_"):
        return "art"
    if n.startswith(("Wall_", "Floor_", "Ceil_")) or n.startswith("Deco_laneDoor"):
        return "static"
    if n.startswith("Foliage_"):
        return "foliage"
    return "prop"


static = [o for o in bpy.data.objects if o.type == "MESH" and kind(o) == "static"]
groups = {}
for o in static:
    m = o.material_slots[0].material.name if o.material_slots else "role:wall"
    ceil = o.name.startswith("Ceil_")
    lm = float(o.get("lm", 1.0))
    groups.setdefault((m, ceil, lm), []).append(o)
merged = []
for (m, ceil, lm), objs in groups.items():
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    o = objs[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    role = m.split(":", 1)[1] if m.startswith("role:") else "wall"
    o.name = f"{'Ceil' if ceil else 'Static'}_{role}" + (f"_lm{lm:g}" if lm != 1 else "")
    o["role"] = role
    o["lm"] = lm
    merged.append(o)
arts = [o for o in bpy.data.objects if o.type == "MESH" and kind(o) == "art"]
for o in arts:
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
targets = merged + arts
log(f"{len(merged)} static surfaces, {len(arts)} canvases")

# ------------------------------------------------------------------ 2. lightmap UVs
for o in targets:
    if "LM" not in o.data.uv_layers:
        o.data.uv_layers.new(name="LM")
bpy.ops.object.select_all(action="DESELECT")
for o in targets:
    o.select_set(True)
    o.data.uv_layers.active = o.data.uv_layers["LM"]
bpy.context.view_layer.objects.active = targets[0]
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(55), island_margin=0.0, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
bpy.ops.uv.average_islands_scale()
bpy.ops.object.mode_set(mode="OBJECT")
for o in targets:
    k = float(o.get("lm", 1.0))
    # a canvas is looked at closely: twice the room's density
    if o in arts:
        k = 2.0
    if k != 1:
        uv = np.zeros(len(o.data.loops) * 2, np.float32)
        o.data.uv_layers["LM"].data.foreach_get("uv", uv)
        o.data.uv_layers["LM"].data.foreach_set("uv", uv * k)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.select_all(action="SELECT")
bpy.ops.uv.pack_islands(rotate=True, margin_method="FRACTION", margin=4.0 / RES * 2, scale=True)
bpy.ops.object.mode_set(mode="OBJECT")
log("lightmap UVs packed")

# ------------------------------------------------------------------ 3. bake
LM = bpy.data.images.new("Lightmap", RES, RES, alpha=False, float_buffer=True)


def attach_target():
    for o in targets:
        for slot in o.material_slots:
            m = slot.material
            if not m or not m.use_nodes:
                continue
            nt = m.node_tree
            node = nt.nodes.get("LM_TARGET")
            if not node:
                uvn = nt.nodes.new("ShaderNodeUVMap")
                uvn.uv_map = "LM"
                node = nt.nodes.new("ShaderNodeTexImage")
                node.name = "LM_TARGET"
                nt.links.new(uvn.outputs["UV"], node.inputs["Vector"])
            node.image = LM
            nt.nodes.active = node


attach_target()
sc.render.engine = "CYCLES"
sc.cycles.samples = SPP
sc.cycles.use_adaptive_sampling = False
sc.cycles.diffuse_bounces = 6
sc.cycles.max_bounces = 10
sc.cycles.sample_clamp_indirect = 8.0
sc.render.bake.margin = 8
sc.render.bake.margin_type = "EXTEND"
lights = {o.name: o for o in bpy.data.objects if o.type == "LIGHT"}
bg = sc.world.node_tree.nodes["Background"]
day_sky = bg.inputs["Strength"].default_value
day_energy = {n: o.data.energy for n, o in lights.items()}
anchors = json.load(open(os.path.join(os.path.dirname(bpy.data.filepath), "house.json")))["anchors"]


def lamp(name, pos, energy, radius=0.04, color=(1.0, 0.62, 0.3)):
    d = bpy.data.lights.new(name, "POINT")
    d.energy = energy
    d.shadow_soft_size = radius
    d.color = color
    o = bpy.data.objects.new(name, d)
    sc.collection.objects.link(o)
    o.location = pos
    return o


def bake(tag):
    log(f"baking {tag}: {RES}² at {SPP} spp")
    bpy.ops.object.select_all(action="DESELECT")
    for o in targets:
        o.select_set(True)
    bpy.context.view_layer.objects.active = targets[0]
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, use_clear=True, margin=8)
    px = np.empty(RES * RES * 4, np.float32)
    LM.pixels.foreach_get(px)
    np.save(os.path.join(OUT, f"lm-{tag}.npy"), px.reshape(RES, RES, 4)[::-1, :, :3].copy())
    log(f"{tag} baked")


if ONLY in (None, "day"):
    bake("day")
if ONLY in (None, "night"):
    # evening: the sun gone, a deep sky, the gallery lights warm, the lamps lit
    for n, o in lights.items():
        if n == "Sun":
            o.data.energy = 0.0
        elif n.startswith("Fill_"):
            o.data.energy = day_energy[n] * 0.12
        elif n.startswith("L_"):
            o.data.energy = day_energy[n] * 1.6
        elif n.startswith("N_"):
            o.data.energy = float(o.data.get("night", 100.0))
    bg.inputs["Strength"].default_value = day_sky * 0.08
    night = []
    if "diya" in anchors:
        night.append(lamp("Night_diya", anchors["diya"], 38))
    if "lantern" in anchors:
        night.append(lamp("Night_lantern", anchors["lantern"], 26))
    if "deepa" in anchors:
        x, y, z = anchors["deepa"][:3]
        night.append(lamp("Night_deepa", (x, y, z + 0.05), 34, radius=0.08))
    # light from the rooms into the courtyard, and the courtyard's own low glow
    bake("night")
    for o in night:
        bpy.data.objects.remove(o, do_unlink=True)
    for n, o in lights.items():
        o.data.energy = day_energy[n]
    bg.inputs["Strength"].default_value = day_sky

json.dump({"res": RES, "spp": SPP}, open(os.path.join(OUT, "lm.json"), "w"))

# ------------------------------------------------------------------ 4. export
# static surfaces: the site builds their materials and lays their texture UVs itself;
# they keep only the lightmap UVs, which become TEXCOORD_0
for o in merged:
    for name in [l.name for l in o.data.uv_layers if l.name != "LM"]:
        o.data.uv_layers.remove(o.data.uv_layers[name])
    o.data.uv_layers["LM"].name = "UVMap"
# canvases: UVMap (the painting) then LM (TEXCOORD_1)
for o in arts:
    names = [l.name for l in o.data.uv_layers]
    assert names[0] == "UVMap" and "LM" in names, names


def stand_in(name):
    """an untextured material with the same name: the site supplies the real one"""
    m = bpy.data.materials.get(f"{name}#export")
    if not m:
        m = bpy.data.materials.new(f"{name}#export")
        m.use_nodes = False
        m["site"] = name
    return m


for o in targets:
    for slot in o.material_slots:
        if slot.material:
            slot.material = stand_in(slot.material.name)
# props and foliage: their textures, shrunk
for im in bpy.data.images:
    if im.name in ("Lightmap",) or im.source != "FILE":
        continue
    used_by_site = any(s in (im.filepath or "") for s in ("/public/tex/", "/images-final/"))
    if used_by_site:
        continue
    w, h = im.size
    cap = 1024 if any(k in im.name for k in ("banana", "bougainvillea", "peepal", "jute")) else 512
    if max(w, h) > cap:
        s = cap / max(w, h)
        im.scale(max(1, int(w * s)), max(1, int(h * s)))
    # whatever the importer made of it, the exporter must be able to read it back
    try:
        im.pack()
    except RuntimeError as e:
        log("could not pack", im.name, e)
for o in list(bpy.data.objects):
    if o.type in ("LIGHT", "CAMERA"):
        bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, "house.glb"),
    export_format="GLB",
    # WebP cannot hold the single-channel roughness maps the importer makes
    export_image_format="AUTO",
    export_jpeg_quality=82,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=14,
    export_yup=True,
    export_extras=True,
    export_apply=True,
    export_lights=False,
    export_cameras=False,
)
log("exported", os.path.getsize(os.path.join(OUT, "house.glb")) / 1e6, "MB")
