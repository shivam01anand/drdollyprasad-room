"""Denoise a baked lightmap with OpenImageDenoise (Blender's compositor).
    blender -b -P scripts/bake/denoise.py -- <bake dir>
Reads lightmap.npy, writes lightmap.npy (denoised) and keeps lightmap-raw.npy.
Uncovered texels (black, between islands) are filled first so the denoiser
never pulls black into an island's edge.
"""
import os, sys
import bpy
import numpy as np
d = sys.argv[sys.argv.index("--") + 1]
raw = np.load(os.path.join(d, "lightmap.npy")).astype(np.float32)
np.save(os.path.join(d, "lightmap-raw.npy"), raw)
H, W, _ = raw.shape
sc = bpy.context.scene
img = bpy.data.images.new("LM", W, H, alpha=True, float_buffer=True)
rgba = np.concatenate([raw[::-1], np.ones((H, W, 1), np.float32)], axis=2)
img.pixels.foreach_set(rgba.ravel())
# a compositor that is only Image -> Denoise -> output
if hasattr(sc, "compositing_node_group"):
    tree = bpy.data.node_groups.new("Denoise", "CompositorNodeTree")
    sc.compositing_node_group = tree
    out = tree.nodes.new("NodeGroupOutput")
    tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    out_sock = out.inputs[0]
else:
    sc.use_nodes = True
    tree = sc.node_tree
    tree.nodes.clear()
    out = tree.nodes.new("CompositorNodeComposite")
    out_sock = out.inputs["Image"]
n_img = tree.nodes.new("CompositorNodeImage"); n_img.image = img
dn = tree.nodes.new("CompositorNodeDenoise")
for k in ("use_hdr",):
    if hasattr(dn, k): setattr(dn, k, True)
if "HDR" in dn.inputs: dn.inputs["HDR"].default_value = True
tree.links.new(n_img.outputs["Image"], dn.inputs["Image"])
tree.links.new(dn.outputs["Image"], out_sock)
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = W, H, 100
sc.render.image_settings.file_format = "OPEN_EXR"
sc.render.image_settings.color_depth = "32"
sc.view_settings.view_transform = "Standard"
cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam")); sc.collection.objects.link(cam); sc.camera = cam
sc.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE"
out_path = os.path.join(d, "denoised.exr")
sc.render.filepath = out_path
bpy.ops.render.render(write_still=True)
res = bpy.data.images.load(out_path)
px = np.empty(W * H * 4, np.float32); res.pixels.foreach_get(px)
den = px.reshape(H, W, 4)[::-1, :, :3]
cov = (raw.sum(axis=2) > 1e-6)[..., None]
np.save(os.path.join(d, "lightmap.npy"), np.where(cov, den, 0).astype(np.float32))
print("denoised", W, H, float(np.abs(den - raw)[cov[..., 0]].mean()))
