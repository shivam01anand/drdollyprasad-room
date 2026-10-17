"""Rebake the artist's corner against the published UVs, keeping other rooms intact.

blender -b scripts/house/work/v17/house.blend -P scripts/figure/rebake_scan_corner.py -- \
  --scan /path/to/isolated.ply --out review/scan-corner

Uses the published GLB's lightmap layout, the source house's lights/materials,
and a shadow-only hull of the selected scan. Never exports that hull as her body.
"""
from pathlib import Path
import argparse
import json
import math
import sys
import time
import bpy
import bmesh
import numpy as np
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
from splat import read_ply, values, colour

parser = argparse.ArgumentParser()
parser.add_argument('--scan', type=Path, required=True)
parser.add_argument('--out', type=Path, required=True)
parser.add_argument('--samples', type=int, default=96)
parser.add_argument('--preview-only', action='store_true')
parser.add_argument('--only-night', action='store_true')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
args.out.mkdir(parents=True, exist_ok=True)
placement = json.loads((ROOT / 'lib/room/dolly-placement.json').read_text())
published = json.loads((ROOT / 'public/house/house.json').read_text())
scene = bpy.context.scene
start = time.time()


def log(message):
    print(f'[scan corner {time.time()-start:.1f}s] {message}', flush=True)


def flat(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*rgb, 1)
    mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .9
    return mat


def srgb_to_linear(rgb):
    return np.where(rgb <= .04045, rgb / 12.92, ((rgb + .055) / 1.055) ** 2.4)


original = set(bpy.data.objects)
materials = {m.name: m for m in bpy.data.materials}
for obj in original:
    if obj.name.startswith(('Figure_', 'Wall_', 'Floor_', 'Ceil_', 'Deco_laneDoor')):
        obj.hide_render = True
    if obj.name.startswith(('Deco_wooden_stool_01_', 'Art_in-progress')):
        obj.hide_render = True
        for child in obj.children_recursive:
            child.hide_render = True

bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/house/house.glb'))
imported = set(bpy.data.objects) - original
surfaces = []
for obj in list(imported):
    if obj.type == 'MESH' and obj.name.startswith(('Static_', 'Ceil_', 'Art_in-progress')):
        # Imported glTF coordinates already convert back to Blender coordinates.
        world = obj.matrix_world.copy()
        obj.parent = None
        obj.matrix_world = Matrix.Identity(4)
        obj.data.transform(world)
        for slot in obj.material_slots:
            if slot.material:
                name = slot.material.name.split('#export')[0]
                if name in materials:
                    slot.material = materials[name]
        surfaces.append(obj)
    elif obj.type != 'EMPTY':
        bpy.data.objects.remove(obj, do_unlink=True)

# Split only by existing faces; all retained vertices and lightmap UVs stay exact.
# The bounds include the floor, west/north walls, easel and nearby ceiling.
low, high = np.array([-.8, 1.8, -.2]), np.array([5.8, 6.5, 3.7])
targets = []
for obj in surfaces:
    selected = []
    for face in obj.data.polygons:
        points = np.array([obj.data.vertices[i].co[:] for i in face.vertices])
        selected.append(bool((points.max(axis=0) >= low).all() and (points.min(axis=0) <= high).all()))
    if not any(selected):
        continue
    if not all(selected):
        rest = obj.copy()
        rest.data = obj.data.copy()
        scene.collection.objects.link(rest)
        for item, remove_selected in [(rest, True), (obj, False)]:
            bm = bmesh.new()
            bm.from_mesh(item.data)
            bm.faces.ensure_lookup_table()
            remove = [f for f in bm.faces if selected[f.index] == remove_selected]
            bmesh.ops.delete(bm, geom=remove, context='FACES')
            bm.to_mesh(item.data)
            bm.free()
    obj.data.uv_layers.active_index = 1 if obj.name.startswith('Art_') else 0
    targets.append(obj)

yaw = math.radians(placement['yaw_degrees'])
rotation = Matrix.Rotation(yaw, 4, 'Y') @ Matrix.Rotation(math.pi, 4, 'X')
scale = placement['scale']
offset = Vector(placement['studio_seat']) - rotation.to_3x3() @ (Vector(placement['source_seat']) * scale)
to_blender = Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
transform = to_blender @ Matrix.Translation(offset) @ rotation @ Matrix.Scale(scale, 4)
scan = read_ply(args.scan)
points = values(scan, 'xyz')
rgb = colour(scan)
proxies = []
for i, (lo, hi) in enumerate([(-.26,-.04),(-.04,.23),(.23,.44),(.44,.6)]):
    use = (points[:,1] >= lo) & (points[:,1] < hi)
    subset = points[use]
    _, indices = np.unique(np.floor(subset / .025).astype(int), axis=0, return_index=True)
    mesh = bpy.data.meshes.new(f'Scan_shadow_{i}')
    mesh.from_pydata(subset[indices].tolist(), [], [])
    bm = bmesh.new()
    bm.from_mesh(mesh)
    hull = bmesh.ops.convex_hull(bm, input=list(bm.verts), use_existing_faces=False)
    unused = {v for v in hull['geom_interior'] + hull['geom_unused'] if isinstance(v, bmesh.types.BMVert)}
    bmesh.ops.delete(bm, geom=list(unused), context='VERTS')
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(mesh.name, mesh)
    scene.collection.objects.link(obj)
    obj.matrix_world = transform
    obj.visible_camera = False
    obj.data.materials.append(flat(mesh.name, srgb_to_linear(np.median(rgb[use], axis=0))))
    proxies.append(obj)

# Same broad, low cushioned seat as Dolly.buildSeat in the website.
wood = flat('scan_seat_wood', srgb_to_linear(np.array([.396,.267,.18])))
linen = flat('scan_seat_linen', srgb_to_linear(np.array([.745,.694,.588])))
seat_position = Vector((placement['studio_seat'][0], -placement['studio_seat'][2], 0))
seat_rotation = Matrix.Rotation(yaw, 4, 'Z')


def box(name, size, position, material):
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.location = seat_position + seat_rotation.to_3x3() @ Vector(position)
    obj.rotation_euler.z = yaw
    obj.data.materials.append(material)
    bevel = obj.modifiers.new('soft edges', 'BEVEL')
    bevel.width, bevel.segments = min(.015, size[2]/4), 2
    return obj


w, d = placement['seat_width'], placement['seat_depth']
box('Scan_seat_frame', (w,d,.08), (0,0,.385), wood)
box('Scan_seat_cushion', (w-.04,d-.04,.07), (0,0,.425), linen)
for x in [-1,1]:
    for z in [-1,1]:
        box('Scan_seat_leg', (.055,.055,.35), (x*(w/2-.07),z*(d/2-.07),.175), wood)

scene.render.engine = 'CYCLES'
scene.cycles.samples = args.samples
scene.cycles.use_adaptive_sampling = False
scene.cycles.diffuse_bounces = 6
scene.cycles.max_bounces = 10
scene.cycles.sample_clamp_indirect = 8
preferences = bpy.context.preferences.addons['cycles'].preferences
try:
    preferences.compute_device_type = 'METAL'
    preferences.get_devices()
    for device in preferences.devices:
        device.use = device.type == 'METAL'
    scene.cycles.device = 'GPU'
except (TypeError, RuntimeError):
    scene.cycles.device = 'CPU'

if args.preview_only:
    scene.camera = bpy.data.objects['Cam_easel']
    scene.render.resolution_x, scene.render.resolution_y = 1440, 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = str(args.out / 'easel-background.png')
    scene.cycles.use_denoising = True
    bpy.ops.render.render(write_still=True)
    log('Rendered the studio and seat; scan composited separately for placement review')
    sys.exit(0)

base_dir = ROOT / 'scripts/house/work/v17/final'
resolution = np.load(base_dir / 'lm-day.npy', mmap_mode='r').shape[0]
image = bpy.data.images.new('Scan_corner_light', resolution, resolution, alpha=False, float_buffer=True)
for obj in targets:
    for slot in obj.material_slots:
        mat = slot.material
        if not mat or not mat.use_nodes:
            continue
        nt = mat.node_tree
        node = nt.nodes.new('ShaderNodeTexImage')
        node.image = image
        nt.nodes.active = node

lights = {obj.name: obj for obj in original if obj.type == 'LIGHT'}
energies = {name: obj.data.energy for name,obj in lights.items()}
background = scene.world.node_tree.nodes['Background']
day_sky = background.inputs['Strength'].default_value
log(f'{len(targets)} existing-UV targets, {resolution}px, {args.samples} samples')


def bake(tag):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in targets:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = targets[0]
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT','INDIRECT'}, use_clear=True, margin=8)
    pixels = np.empty(resolution*resolution*4, dtype=np.float32)
    image.pixels.foreach_get(pixels)
    patch = pixels.reshape(resolution,resolution,4)[::-1,:,:3].copy()
    coverage = patch.sum(axis=2) > 1e-6
    np.save(args.out / f'mask-{tag}.npy', coverage)
    original_light = np.load(base_dir / f'lm-{tag}.npy')
    np.save(args.out / f'lm-{tag}.npy', np.where(coverage[:,:,None],patch,original_light))
    log(f'{tag}: {int(coverage.sum()):,} texels replaced; other rooms retained')


if not args.only_night:
    bake('day')
for name, obj in lights.items():
    if name == 'Sun': obj.data.energy = 0
    elif name.startswith('Fill_'): obj.data.energy = energies[name] * .12
    elif name.startswith('L_'): obj.data.energy = energies[name] * 1.6
    elif name.startswith('N_'): obj.data.energy = float(obj.data.get('night',100))
background.inputs['Strength'].default_value = day_sky * .08
anchors = json.loads((Path(bpy.data.filepath).parent / 'house.json').read_text())['anchors']
for name,power,radius in [('diya',38,.04),('lantern',26,.04),('deepa',34,.08)]:
    position = list(anchors[name][:3])
    if name == 'deepa': position[2] += .05
    data = bpy.data.lights.new(f'Scan_night_{name}', 'POINT')
    data.energy, data.shadow_soft_size, data.color = power, radius, (1,.62,.3)
    obj = bpy.data.objects.new(data.name,data)
    scene.collection.objects.link(obj)
    obj.location = position
bake('night')
log('Finished both corner lightmaps. Denoise and merge only the covered texels before publishing.')
