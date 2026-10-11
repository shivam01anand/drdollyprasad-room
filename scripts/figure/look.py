"""render a figure .blend from a few sides: blender -b <file.blend> -P look.py -- <out dir> [name]"""
import bpy, sys, os, math
from mathutils import Vector
argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]; NAME = argv[1] if len(argv) > 1 else "look"
sc = bpy.context.scene
sc.render.engine = "CYCLES"; sc.cycles.samples = 32; sc.cycles.use_denoising = True
prefs = bpy.context.preferences.addons["cycles"].preferences; prefs.compute_device_type = "METAL"; prefs.get_devices()
for d in prefs.devices: d.use = True
sc.cycles.device = "GPU"
sc.render.resolution_x, sc.render.resolution_y = 640, 800
sc.view_settings.view_transform = "AgX"
world = bpy.data.worlds.new("w"); sc.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.75, 0.72, 0.68, 1); world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.8
for name, loc, rot, e in (("key", (2.0, -2.5, 3.0), (0.9, 0, 0.6), 600), ("rim", (-2.0, 2.5, 2.5), (-0.9, 0, 3.6), 300)):
    l = bpy.data.lights.new(name, "AREA"); l.energy = e; l.size = 1.5
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 1.0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
meshes = [o for o in sc.objects if o.type == "MESH" and o.visible_get()]
lo = Vector((min(min((o.matrix_world @ Vector(c))[i] for c in o.bound_box) for o in meshes) for i in range(3)))
hi = Vector((max(max((o.matrix_world @ Vector(c))[i] for c in o.bound_box) for o in meshes) for i in range(3)))
ctr = (lo + hi) / 2; size = max(hi - lo)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 50
views = [v for v in (argv[2].split(",") if len(argv) > 2 else ["front", "back", "side", "threequarter"])]
dirs = {"front": Vector((0, -1, 0.12)), "back": Vector((0, 1, 0.25)), "side": Vector((1, 0, 0.1)), "threequarter": Vector((0.8, 0.9, 0.35)),
        "left": Vector((-1, 0, 0.1))}
for v in views:
    d = dirs[v].normalized()
    cam.location = ctr + d * size * 2.1
    cam.rotation_euler = (ctr - cam.location).to_track_quat("-Z", "Y").to_euler()
    sc.render.filepath = os.path.join(OUT, f"{NAME}-{v}.png")
    bpy.ops.render.render(write_still=True)
print("rendered", views)
