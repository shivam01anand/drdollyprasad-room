"""Render painting-pose backgrounds for local 3D head composition checks."""
from pathlib import Path
import json,sys,math,bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
out=Path(sys.argv[sys.argv.index('--')+1]);out.mkdir(parents=True,exist_ok=True)
placement=json.loads((ROOT/'lib/room/dolly-head-placement.json').read_text())
for obj in list(bpy.data.objects):
    if obj.name.startswith('Figure_'):bpy.data.objects.remove(obj,do_unlink=True)
with bpy.data.libraries.load(str((out/'house-painter-head.blend').resolve()),link=False) as (available,loaded):
    loaded.objects=[n for n in available.objects if n.startswith('Figure_')]
for obj in loaded.objects:
    bpy.context.scene.collection.objects.link(obj)
    if obj.get('headFallback'):obj.hide_render=True
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for device in prefs.devices:device.use=device.type=='METAL'
scene.cycles.device='GPU'
scene.render.image_settings.file_format='PNG';scene.render.resolution_percentage=100
scene.camera=bpy.data.objects['Cam_easel']
shots={}
def render(name,width,height):
    scene.render.resolution_x=width;scene.render.resolution_y=height;bpy.context.view_layer.update()
    camera=scene.camera;matrix=camera.calc_matrix_camera(bpy.context.evaluated_depsgraph_get(),x=width,y=height)
    shots[name]={'camera':list(map(list,camera.matrix_world)),'focal':float(matrix[1][1]*height/2)}
    scene.render.filepath=str(out/f'{name}-background.png');bpy.ops.render.render(write_still=True)
render('studio',960,600)
center=Vector(placement['head_center']);face=Vector(placement['gaze']);up=Vector((0,0,1));side=up.cross(face).normalized()
for obj in scene.objects:
    if obj.type=='MESH' and not obj.name.startswith('Figure_'):obj.hide_render=True
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
light=bpy.data.lights.new('Head_review_key','AREA');light.energy=50;light.size=.8
lamp=bpy.data.objects.new(light.name,light);scene.collection.objects.link(lamp);lamp.location=center+face*.7-side*.4+up*.7;lamp.rotation_euler=(center-lamp.location).to_track_quat('-Z','Y').to_euler()
scene.camera.data.sensor_fit='VERTICAL';scene.camera.data.angle_y=math.radians(34)
for name,direction in [('face',face),('profile',side)]:
    scene.camera.location=center+direction*.57+up*.025;scene.camera.rotation_euler=(center-scene.camera.location).to_track_quat('-Z','Y').to_euler()
    render(name,700,800)
(out/'review-cameras.json').write_text(json.dumps(shots,indent=2))
print('Painting pose backgrounds ready',flush=True)
