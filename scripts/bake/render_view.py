"""Debug: render a site camera in the bake scene (Cycles), to compare with the site.
    blender -b scripts/bake/work/<bake>/bake.blend -P scripts/bake/render_view.py -- <cam.json> <out.png> [samples]
"""
import json, sys, math
import bpy
from mathutils import Matrix
argv = sys.argv[sys.argv.index("--") + 1:]
cam = json.load(open(argv[0])); out = argv[1]; spp = int(argv[2]) if len(argv) > 2 else 64
e = cam["m"]
M3 = Matrix(((e[0], e[4], e[8], e[12]), (e[1], e[5], e[9], e[13]), (e[2], e[6], e[10], e[14]), (0, 0, 0, 1)))
C = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))  # y-up -> z-up
sc = bpy.context.scene
cd = bpy.data.cameras.new("SiteCam")
cd.sensor_fit = "VERTICAL"
cd.angle_y = math.radians(cam["fov"])
ob = bpy.data.objects.new("SiteCam", cd)
sc.collection.objects.link(ob)
ob.matrix_world = C @ M3
sc.camera = ob
sc.render.resolution_x, sc.render.resolution_y = 960, round(960 / cam["aspect"])
sc.cycles.samples = spp
sc.view_settings.view_transform = "Khronos PBR Neutral" if "Khronos PBR Neutral" in [v.identifier for v in sc.view_settings.bl_rna.properties["view_transform"].enum_items] else "Standard"
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print("rendered", out)
