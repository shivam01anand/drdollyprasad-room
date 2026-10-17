"""Separate the original head as a loading fallback; preserve the painting body.

Run against the original published house, before replacing public/house/house.glb.
No arm, hand, brush, clothes or stool vertices are edited.
"""
from pathlib import Path
import json,math,sys,bpy,bmesh,numpy as np
from mathutils import Matrix,Vector
ROOT=Path(__file__).resolve().parents[2]
output=Path(sys.argv[sys.argv.index('--')+1]);output.mkdir(parents=True,exist_ok=True)
pose=json.loads((ROOT/'assets/figure/dolly-pose.json').read_text())
placement=json.loads((ROOT/'lib/room/dolly-head-placement.json').read_text())
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/house/house.glb'))
turn=Matrix.Rotation(math.radians(230),3,'Z');center=Vector(placement['head_center'])
side=turn@Vector(pose['side']);up=turn@Vector(pose['up']);face=turn@Vector(pose['face'])
body=bpy.data.objects['Figure_dollyBody'];original=[body.matrix_world@v.co for v in body.data.vertices]
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
bpy.ops.object.mode_set(mode='EDIT');bm=bmesh.from_edit_mesh(body.data)
for f in bm.faces:
    p=body.matrix_world@f.calc_center_median()-center
    f.select_set(p.dot(up)>placement['neck_cut'] and abs(p.dot(side))<.15 and abs(p.dot(face))<.2)
bmesh.update_edit_mesh(body.data);bpy.ops.mesh.separate(type='SELECTED');bpy.ops.object.mode_set(mode='OBJECT')
head=next(o for o in bpy.context.selected_objects if o!=body);head.name='Figure_dollyHeadFallback';head['headFallback']=True
for name in ['Figure_dollyHair','Figure_dollyBun','Figure_dollyFrizz','Figure_dollyBrows','Figure_dollyGlasses']:
    bpy.data.objects[name]['headFallback']=True
remaining=[body.matrix_world@v.co for v in body.data.vertices]
# Separating faces preserves all original positions and both texture/lightmap UVs.
assert len(body.data.uv_layers)==2 and len(head.data.uv_layers)==2
assert all(any((p-q).length<1e-7 for q in original) for p in remaining)
bpy.ops.wm.save_as_mainfile(filepath=str((output/'house-painter-head.blend').resolve()))
bpy.ops.export_scene.gltf(filepath=str(output/'house-painter-head.glb'),export_format='GLB',export_yup=True,export_extras=True,export_apply=True,export_lights=False,export_cameras=False,export_image_format='AUTO',export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_position_quantization=14,export_draco_normal_quantization=10,export_draco_texcoord_quantization=14)
print('Original head separated; painting body and both UV layers preserved',flush=True)
