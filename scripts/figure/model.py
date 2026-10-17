"""
Her, in 3D, at her easel, as her photographs show her painting (assets/figure/at-the-easel.jpg and
IMG_1199, October 2026): a woman of her build and years made with MPFB (MakeHuman for Blender, CC0
assets in assets/mpfb), in her colours (scripts/figure/textures.py) — her dusty-pink fleece hoodie
with its hood down on her back, charcoal trousers, her dark hair drawn back into a low bun with loose
hairs over it, her sunglasses pushed up on her head — seated on a round stool close to her canvas,
leaning in, her elbow down and her forearm rising, the brush held as a pen is held and rising to
the canvas, her left hand in her lap.

    blender -b -P scripts/figure/model.py -- <out dir> [--touch=x,y,z]

Her own frame: she sits on a stool whose seat centre is at the origin's floor point, facing -y
(the canvas is in front of her, at -y). `--touch` is where the brush meets the canvas, in this
frame (scripts/house/build.py places the stool so that it is so). Writes <out>/dolly-3d.blend with
the posed meshes, every one named Figure_dolly*, the rig applied and gone.
"""
import math
import os
import sys
import json

import bpy
import bmesh
import numpy as np
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService

argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]
opt = dict(a.split("=", 1) for a in argv[1:] if "=" in a)
TOUCH = Vector(tuple(float(v) for v in opt.get("--touch", "-0.2,-0.44,1.139").split(",")))   # (her right is -x)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PACK = os.path.join(ROOT, "assets", "mpfb", "pack")
TEX = os.path.join(ROOT, "assets", "figure", "tex")
SEAT = 0.437                                 # her stool's seat (Poly Haven wooden_stool_01)
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# ------------------------------------------------------------------ her
macro = TargetService.get_default_macro_info_dict()
macro.update({"gender": 0.0, "age": 0.79, "muscle": 0.42, "weight": 0.55, "height": 0.46, "proportions": 0.55,
              "cupsize": 0.55, "firmness": 0.35})
macro["race"] = {"asian": 0.55, "african": 0.25, "caucasian": 0.2}
body = HumanService.create_human(macro_detail_dict=macro, scale=0.1)
rig = HumanService.add_builtin_rig(body, "default")          # first, so all she wears bends with her
HumanService.set_character_skin(os.path.join(PACK, "skins/old_asian_female/old_asian_female.mhmat"), body, skin_type="GAMEENGINE")
worn = {}
for kind, rel in (("Eyebrows", "eyebrows/eyebrow010/eyebrow010.mhclo"),
                  ("Clothes", "clothes/female_elegantsuit01/female_elegantsuit01.mhclo"),  # (its blouse, in her fleece: her hoodie)
                  ("Clothes", "clothes/female_casualsuit01/female_casualsuit01.mhclo")):
    worn[rel.split("/")[1]] = HumanService.add_mhclo_asset(os.path.join(PACK, rel), body, asset_type=kind, subdiv_levels=0,
                                                         material_type="GAMEENGINE")
print("height", round(body.dimensions.z, 3), flush=True)


def loose_parts(bm):
    bm.verts.ensure_lookup_table()
    seen, parts = set(), []
    for v in bm.verts:
        if v.index in seen:
            continue
        stack, comp = [v], []
        seen.add(v.index)
        while stack:
            x = stack.pop()
            comp.append(x)
            for e in x.link_edges:
                y = e.other_vert(x)
                if y.index not in seen:
                    seen.add(y.index)
                    stack.append(y)
        parts.append(comp)
    return parts


def keep_part(o, pick):
    """keep one loose part of a garment (the blouse of a blouse and skirt; the trousers of a suit)"""
    bm = bmesh.new()
    bm.from_mesh(o.data)
    parts = loose_parts(bm)
    keep = pick(parts)
    bmesh.ops.delete(bm, geom=[v for p in parts if p is not keep for v in p], context="VERTS")
    bm.to_mesh(o.data)
    bm.free()


keep_part(worn["female_elegantsuit01"], lambda ps: max(ps, key=len))                     # the blouse, not the skirt

keep_part(worn["female_casualsuit01"], lambda ps: min(ps, key=lambda p: min(v.co.z for v in p)))   # the jeans, not the t-shirt


def retexture(o, png, normal=True):
    """her colours on a garment (or her skin): every image node's colour image swapped for hers"""
    img = bpy.data.images.load(os.path.join(TEX, png), check_existing=True)
    for m in o.data.materials:
        for n in m.node_tree.nodes:
            if n.type == "TEX_IMAGE" and n.image and "normal" not in n.image.name.lower():
                n.image = img
            if n.type == "BSDF_PRINCIPLED":
                n.inputs["Roughness"].default_value = 0.85
        if not normal:
            for l in list(m.node_tree.links):
                if l.to_socket.name == "Normal":
                    m.node_tree.links.remove(l)


retexture(body, "skin.png")
retexture(worn["female_elegantsuit01"], "top.png")
retexture(worn["female_casualsuit01"], "trousers.png")
for m in body.data.materials:
    for n in m.node_tree.nodes:
        if n.type == "BSDF_PRINCIPLED":
            n.inputs["Roughness"].default_value = 0.6

# ------------------------------------------------------------------ the pose
bpy.context.view_layer.objects.active = rig
rb = rig.data.bones


def W(name, end="head"):
    b = rb[name]
    return rig.matrix_world @ (b.head_local if end == "head" else b.tail_local)


hipL, hipR = W("upperleg01.L"), W("upperleg01.R")
hips = (hipL + hipR) / 2
shin = (W("lowerleg01.L") - W("foot.L")).length
thigh = (hipL - W("lowerleg01.L")).length
ankle_z = W("foot.L").z
# seated: her hip joints a hand above the seat, over its back half; her whole self lowered to it
drop = hips.z - (SEAT + 0.085)
rig.location = (0, 0.05 - hips.y, -drop)
bpy.context.view_layer.update()
hipL, hipR = W("upperleg01.L"), W("upperleg01.R")


def empty(name, loc):
    e = bpy.data.objects.new(name, None)
    sc.collection.objects.link(e)
    e.location = loc
    return e


def ik(bone, target, pole, chain, pole_angle=0.0):
    c = rig.pose.bones[bone].constraints.new("IK")
    c.target = target
    c.pole_target = pole
    c.pole_angle = pole_angle
    c.chain_count = chain
    c.use_stretch = False
    return c


knee_z = ankle_z + shin
for side, hip in (("L", hipL), ("R", hipR)):
    sx = 1 if side == "L" else -1
    # the knee forward, a little lower than the hip; the ankle under it, the foot flat
    fwd = math.sqrt(max(0.01, thigh ** 2 - (hip.z - knee_z) ** 2))
    a = empty(f"ankle.{side}", (hip.x + sx * 0.035, hip.y - fwd - 0.03, ankle_z))
    p = empty(f"knee.{side}", (hip.x + sx * 0.06, hip.y - fwd - 0.45, knee_z + 0.05))
    ik(f"lowerleg02.{side}", a, p, 4, pole_angle=-math.pi / 2)
    toe = empty(f"toe.{side}", (hip.x + sx * 0.05, hip.y - fwd - 0.6, 0.02))
    t = rig.pose.bones[f"foot.{side}"].constraints.new("DAMPED_TRACK")
    t.target = toe

def rot_world(name, axis, angle):
    """turn a pose bone about a world axis through its own head, on top of its pose"""
    pb = rig.pose.bones[name]
    M = rig.matrix_world @ pb.matrix
    piv = M.translation.copy()
    new = Matrix.Translation(piv) @ Matrix.Rotation(angle, 4, Vector(axis)) @ Matrix.Translation(-piv) @ M
    pb.matrix = rig.matrix_world.inverted() @ new
    bpy.context.view_layer.update()


def P(name, end="head"):
    """a bone's head (or tail) as posed, in the world"""
    b = rig.pose.bones[name]
    return rig.matrix_world @ (b.head if end == "head" else b.tail)


# her left hand in her lap
wL = empty("wrist.L.goal", (hipL.x - 0.02, hipL.y - 0.24, SEAT + 0.2))
eL = empty("elbow.L.pole", W("upperarm01.L") + Vector((0.4, 0.25, -0.3)))
ik("lowerarm02.L", wL, eL, 4, pole_angle=-math.pi / 2)
# her right arm up to the canvas as a painter's is: the elbow down at her side, the forearm rising
shoulderR = W("upperarm01.R")
BRUSH_FRONT = 0.12                                           # (the brush beyond her fingertips, to its tip)
aim = Vector((0.30, -1.0, 0.80)).normalized()                # (the brush's line, as in her photograph: on and up, toward her left)
wrist_goal = TOUCH - aim * (BRUSH_FRONT + 0.09)
wR = empty("wrist.R.goal", wrist_goal)
eR = empty("elbow.R.pole", shoulderR + Vector((-0.15, -0.05, -0.6)))
ik("lowerarm02.R", wR, eR, 4, pole_angle=-math.pi / 2)
bpy.context.view_layer.update()

# a painter's lean toward her canvas, her shoulders a little rounded
rot_world("spine03", (1, 0, 0), math.radians(10))         # (about +x, a positive turn brings her forward, to -y)
rot_world("spine01", (1, 0, 0), math.radians(5))
rot_world("neck01", (1, 0, 0), math.radians(6))


def curl(sd, f, degs):
    """a finger bent into the palm joint by joint, about the axis its own length and the palm's facing give"""
    across = (P(f"finger5-1.{sd}") - P(f"finger2-1.{sd}")).normalized()
    along = (P(f"finger3-1.{sd}") - P(f"wrist.{sd}")).normalized()
    palm = along.cross(across).normalized() * (1 if sd == "R" else -1)      # (the way her palm faces)
    for j, deg in zip((1, 2, 3), degs):
        y = (P(f"{f}-{j}.{sd}", "tail") - P(f"{f}-{j}.{sd}")).normalized()
        rot_world(f"{f}-{j}.{sd}", y.cross(palm).normalized(), math.radians(deg))


# her right hand holds the brush as a pen is held: index over it, the middle finger under it, the
# thumb against it, the ring and little fingers folded in
for f, degs in (("finger2", (28, 38, 22)), ("finger3", (42, 52, 30)), ("finger4", (62, 72, 38)), ("finger5", (68, 74, 38))):
    curl("R", f, degs)
# the thumb turned in across her palm to meet the index finger's last joint
base_, tip_ = P("finger1-1.R"), P("finger1-3.R", "tail")
goal_ = P("finger2-3.R")
ax_ = (tip_ - base_).cross(goal_ - base_)
if ax_.length > 1e-6:
    rot_world("finger1-1.R", ax_.normalized(), (tip_ - base_).angle(goal_ - base_) * 0.75)
curl_thumb = ((P("finger2-1.R") - P("wrist.R")).cross(P("finger5-1.R") - P("finger2-1.R"))).normalized()
for j, deg in ((2, 18), (3, 14)):
    y = (P(f"finger1-{j}.R", "tail") - P(f"finger1-{j}.R")).normalized()
    rot_world(f"finger1-{j}.R", y.cross(curl_thumb).normalized(), math.radians(deg))
for f in ("finger2", "finger3", "finger4", "finger5"):           # (her left hand lies open, a little curled)
    curl("L", f, (14, 18, 10))


def grip():
    """the brush's line in her hand: from the web between thumb and index, through where they meet"""
    web = (P("finger2-1.R") + P("finger1-2.R")) / 2
    pinch = (P("finger1-3.R", "tail") + P("finger2-3.R", "tail")) / 2
    return web, pinch, (pinch - web).normalized()


# her hand turned in the world so the brush lies along that line, and her arm moved until its tip is
# where she paints (her hand then a little below her eyes, the brush rising from it)
def hand_to(Rw):
    """her right hand turned to Rw, in the world (its head stays at her wrist; its scale as it was)"""
    pb = rig.pose.bones["wrist.R"]
    loc, _r, scl = (rig.matrix_world @ pb.matrix).decompose()
    new = Matrix.Translation(loc) @ Rw.to_4x4() @ Matrix.Diagonal((scl.x, scl.y, scl.z, 1.0))
    pb.matrix = rig.matrix_world.inverted() @ new
    bpy.context.view_layer.update()


web, pinch, d0 = grip()
R0 = (rig.matrix_world @ rig.pose.bones["wrist.R"].matrix).decompose()[1].to_matrix()
Rw = d0.rotation_difference(aim).to_matrix() @ R0
target = TOUCH - aim * BRUSH_FRONT
for it in range(10):
    hand_to(Rw)
    web, pinch, d_ = grip()
    wR.location = wR.location + (target - pinch)
    bpy.context.view_layer.update()
hand_to(Rw)
web, pinch, d_ = grip()
BRUSH = (web, pinch, (TOUCH - web).normalized())
print("grip: the brush's tip misses the canvas point by %.1f mm; its line %.0f deg off the one asked" % (
    ((pinch + d_ * BRUSH_FRONT) - TOUCH).length * 1000, math.degrees(d_.angle(aim))), flush=True)

# where her neck and back are, as posed (her hood is laid on her back by them, after the pose is set)
NECK, CHEST, MID = P("neck01"), P("spine01"), P("spine03")
SH_L, SH_R = P("shoulder01.L"), P("shoulder01.R")

# her head up to the brush's tip
head = P("head")
look = (TOUCH - head)
yaw = math.atan2(-look.x, -look.y)                     # toward her right, where the brush is
pitch = math.atan2(look.z, math.hypot(look.x, look.y))
rot_world("neck01", (0, 0, 1), -yaw * 0.35)
rot_world("head", (0, 0, 1), -yaw * 0.35)
rot_world("head", (1, 0, 0), -pitch * 0.45)               # (a negative turn about +x lifts her face)
bpy.context.view_layer.update()

# ------------------------------------------------------------------ her head, as posed
headM = rig.matrix_world @ rig.pose.bones["head"].matrix
# her head's turn since rest, applied to the rest directions: her face (-y) and up (+z)
turn = headM.to_3x3() @ (rig.matrix_world @ rb["head"].matrix_local).to_3x3().inverted()
up = (turn @ Vector((0, 0, 1))).normalized()
face = (turn @ Vector((0, -1, 0))).normalized()
side = up.cross(face).normalized()                               # (her left)

# ------------------------------------------------------------------ set: the pose made permanent
# (her skin under her clothes is kept for now: what of it to keep is decided below)
for md in list(body.modifiers):
    if md.type == "MASK" and md.name.startswith("Delete."):
        body.modifiers.remove(md)
bpy.ops.object.select_all(action="DESELECT")
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode="POSE")
bpy.ops.pose.select_all(action="SELECT")
bpy.ops.pose.visual_transform_apply()
for pb in rig.pose.bones:
    for c in list(pb.constraints):
        pb.constraints.remove(c)
bpy.ops.object.mode_set(mode="OBJECT")
bpy.context.view_layer.update()
meshes = [o for o in sc.objects if o.type == "MESH"]
for o in meshes:
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    mw = o.matrix_world.copy()
    # her build is in shape keys: fold them in, so the pose can be applied
    if o.data.shape_keys:
        bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
    for md in list(o.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=md.name)
        except RuntimeError as e:
            print("modifier", o.name, md.name, e, flush=True)
            o.modifiers.remove(md)
    o.parent = None
    o.matrix_world = mw
for o in list(sc.objects):
    if o.type in ("ARMATURE", "EMPTY"):
        bpy.data.objects.remove(o, do_unlink=True)

def world_mesh(objs):
    verts, polys = [], []
    for o in objs:
        base = len(verts)
        verts += [o.matrix_world @ v.co for v in o.data.vertices]
        polys += [[base + i for i in p.vertices] for p in o.data.polygons]
    return verts, polys


# what she wears over her skin: her skin kept whole a hand's breadth in from every opening of it (her
# collar, her cuffs, her hems), so no cut edge of it shows there; the rest of what is under her clothes
# is gone (MakeHuman's own cut follows the mesh, and shows in the gap at her collar)
top_o, trs_o = worn["female_elegantsuit01"], worn["female_casualsuit01"]
H = headM.translation                                             # (the top of her neck)
groups = {body.vertex_groups[n].index for n in ("Delete.female_elegantsuit01", "Delete.female_casualsuit01")}
covered = {v.index for v in body.data.vertices if any(g.group in groups and g.weight > 0.5 for g in v.groups)}
opening = []
for o in (top_o, trs_o):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    opening += [o.matrix_world @ v.co for v in bm.verts if v.is_boundary]
    bm.free()
kd = KDTree(len(opening))
for i, p_ in enumerate(opening):
    kd.insert(p_, i)
kd.balance()
deep = {v.index for v in body.data.vertices if v.index in covered and kd.find(body.matrix_world @ v.co)[2] > 0.05}
# and of what is kept, where the pose has pushed it through the cloth (a ray in along her skin's own
# normal meets the cloth: she is outside it) or the cloth lies on it (out, it meets the cloth at once):
# gone too, the cloth there is all that is seen. Where the cloth stands off her (her collar), her skin
# goes on down inside it.
cloth = BVHTree.FromPolygons(*world_mesh([top_o, trs_o]))
Mb, Mbi, N3 = body.matrix_world.copy(), body.matrix_world.inverted(), body.matrix_world.to_3x3()
pokes, tucked = set(), 0
for v in body.data.vertices:
    p_ = Mb @ v.co
    n_ = (N3 @ v.normal).normalized()
    through = cloth.ray_cast(p_ + n_ * 0.0005, -n_, 0.025)[0]
    if v.index in covered:
        if through is not None or cloth.ray_cast(p_, n_, 0.0015)[0] is not None:
            pokes.add(v.index)
    elif through is not None and (p_ - H).length < 0.2 and (p_ - H).dot(up) < -0.02:
        # her neck where it meets her collar: under it, not gone (a hole there would show)
        v.co = Mbi @ (through - n_ * 0.004)
        tucked += 1
bm = bmesh.new()
bm.from_mesh(body.data)
bm.verts.ensure_lookup_table()
bmesh.ops.delete(bm, geom=[f for f in bm.faces if all(v.index in deep for v in f.verts)
                           or any(v.index in pokes for v in f.verts)], context="FACES_ONLY")
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
bm.to_mesh(body.data)
bm.free()
print("her skin:", len(covered), "points under her clothes,", len(deep), "of them gone, and", len(pokes), "at the cloth;", tucked, "at her collar tucked", flush=True)

# ------------------------------------------------------------------ her hair, drawn back
# her own: a close shell over her scalp (MakeHuman's own scalp region, its edge her hairline), its
# strands running back to her bun, low at the back of her head. (MakeHuman's hair is cards, for loose
# styles; hers is drawn tight.) Made from her head as posed.
H = headM.translation
gi = body.vertex_groups["scalp"].index
scalp = {v.index for v in body.data.vertices if any(g.group == gi and g.weight > 0.5 for g in v.groups)}
sv = [body.matrix_world @ body.data.vertices[i].co for i in scalp]
A = np.array([[2 * v.x, 2 * v.y, 2 * v.z, 1.0] for v in sv])
sol = np.linalg.lstsq(A, np.array([v.length_squared for v in sv]), rcond=None)[0]
C = Vector(sol[:3])                                               # the middle of her skull: a sphere through her scalp
R = math.sqrt(sol[3] + C.length_squared)
with open(os.path.join(OUT, "dolly-pose.json"), "w") as pose_file:
    json.dump({"head_origin": list(H), "skull_center": list(C), "skull_radius": R,
               "face": list(face), "up": list(up), "side": list(side),
               "neck": list(NECK), "brush_contact": list(TOUCH),
               "brush_grip": list(pinch), "brush_direction": list(d_)}, pose_file, indent=2)
BUN = (-face * math.cos(math.radians(24)) - up * math.sin(math.radians(24))).normalized()   # (low at the back)
f1 = (up - BUN * up.dot(BUN)).normalized()
f2 = BUN.cross(f1)
bm = bmesh.new()
bm.from_mesh(body.data)
bm.transform(body.matrix_world)
bm.verts.ensure_lookup_table()
bmesh.ops.delete(bm, geom=[f for f in bm.faces if not all(v.index in scalp for v in f.verts)], context="FACES_ONLY")
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
for e in [e for e in bm.edges if not e.link_faces]:
    bm.edges.remove(e)
keep = set(max(loose_parts(bm), key=len))                         # (her scalp, not a stray island)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v not in keep], context="VERTS")
bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, use_grid_fill=True)
# her hairline: the mesh's steps smoothed out along it, each point kept on her head
head_t = BVHTree.FromPolygons(*world_mesh([body]))
edge_v = [v for v in bm.verts if v.is_boundary]
nb = {v: [e.other_vert(v) for e in v.link_edges if e.is_boundary] for v in edge_v}
for _ in range(8):
    new = {v: v.co * 0.5 + (nb[v][0].co + nb[v][1].co) * 0.25 for v in edge_v if len(nb[v]) == 2}
    for v, c in new.items():
        v.co = head_t.find_nearest(c)[0]
for e in bm.edges:
    e.smooth = True
    e.seam = False
for _ in range(2):
    bmesh.ops.smooth_vert(bm, verts=[v for v in bm.verts if not v.is_boundary], factor=0.5,
                          use_axis_x=True, use_axis_y=True, use_axis_z=True)
bm.normal_update()
# how far in from her hairline each point is (along the scalp)
far = {v: (0.0 if v.is_boundary else 1e9) for v in bm.verts}
todo = [v for v in bm.verts if v.is_boundary]
while todo:
    nxt = []
    for v in todo:
        for e in v.link_edges:
            w = e.other_vert(v)
            dd = far[v] + e.calc_length()
            if dd < far[w] - 1e-6:
                far[w] = dd
                nxt.append(w)
    todo = nxt
# as full as her hair is, drawn back: a few millimetres at her hairline, over her crown and at her
# sides a good deal more, a soft unevenness in it (it is wavy, and not pulled tight)
for v in bm.verts:
    k = min(1.0, far[v] / 0.025)
    q = v.co - C
    wave = 1 + 0.18 * math.sin(q.x * 61 + q.z * 23) * math.sin(q.y * 47 - q.z * 31)
    v.co = v.co + v.normal * (0.0018 + 0.0125 * k * k * (3 - 2 * k) * wave)
# (what came with her skin goes: its UVs, its weights)
for lay in list(bm.loops.layers.uv.values()):
    bm.loops.layers.uv.remove(lay)
for lay in list(bm.verts.layers.deform.values()):
    bm.verts.layers.deform.remove(lay)
uv = bm.loops.layers.uv.new("UVMap")
lm = bm.loops.layers.uv.new("LM")
for f in bm.faces:
    us = []
    for lp in f.loops:
        d = (lp.vert.co - C).normalized()
        along = math.acos(max(-1.0, min(1.0, d.dot(BUN))))      # from her bun out to her hairline
        across = math.atan2(d.dot(f2), d.dot(f1))                 # round it (the seam under her bun)
        us.append([along * 1.4, across / (2 * math.pi) * 14])
        # its light, laid out flat round her bun in one piece, with no seam anywhere on her head
        lp[lm].uv = (R * along * math.cos(across), R * along * math.sin(across))      # (in metres over her head)
    vs_ = [u[1] for u in us]
    if max(vs_) - min(vs_) > 7:
        for u in us:
            if u[1] < 0:
                u[1] += 14
    for lp, u in zip(f.loops, us):
        lp[uv].uv = u
me = bpy.data.meshes.new("Figure_dollyHair")
bm.to_mesh(me)
bm.free()
for poly in me.polygons:
    poly.use_smooth = True
hair = bpy.data.objects.new("Figure_dollyHair", me)
sc.collection.objects.link(hair)
bpy.ops.object.select_all(action="DESELECT")
hair.select_set(True)
bpy.context.view_layer.objects.active = hair
bpy.ops.mesh.customdata_custom_splitnormals_clear()               # (her skin's own normals came with it)
# the loose hairs over it: a second layer a little above, mostly air, strands along the same flow
frizz = bpy.data.objects.new("Figure_dollyFrizz", me.copy())
sc.collection.objects.link(frizz)
for v in frizz.data.vertices:
    v.co = v.co + v.normal * 0.006
print("skull: centre", tuple(round(c, 3) for c in C), "radius %.3f;" % R, "scalp", len(scalp), "points; hair", len(me.polygons), "faces", flush=True)

# her scalp under her hair darkened on her skin, softly: a hairline, not an edge

def raster(mask, tri):
    W_ = mask.shape[0]
    P = np.array([(u * W_ - 0.5, v * W_ - 0.5) for u, v in tri])
    x0, y0 = np.floor(P.min(0)).astype(int)
    x1, y1 = np.ceil(P.max(0)).astype(int)
    x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, W_ - 1), min(y1, W_ - 1)
    if x1 < x0 or y1 < y0:
        return
    gx, gy = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
    (ax_, ay_), (bx_, by_), (cx_, cy_) = P
    den = (by_ - cy_) * (ax_ - cx_) + (cx_ - bx_) * (ay_ - cy_)
    if abs(den) < 1e-12:
        return
    l1 = ((by_ - cy_) * (gx - cx_) + (cx_ - bx_) * (gy - cy_)) / den
    l2 = ((cy_ - ay_) * (gx - cx_) + (ax_ - cx_) * (gy - cy_)) / den
    inside_ = (l1 >= -0.02) & (l2 >= -0.02) & (1 - l1 - l2 >= -0.02)
    mask[gy[inside_], gx[inside_]] = 1.0


def blur(a, sigma):
    r = int(sigma * 3)
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    a = np.apply_along_axis(lambda m: np.convolve(m, k, mode="same"), 0, a)
    return np.apply_along_axis(lambda m: np.convolve(m, k, mode="same"), 1, a)


skin_im = next(m for m in bpy.data.images if m.name.startswith("skin"))
skin_im.scale(1024, 1024)
W_ = 1024
px = np.empty(W_ * W_ * 4, np.float32)
skin_im.pixels.foreach_get(px)
px = px.reshape(W_, W_, 4)
uvl = body.data.uv_layers.active.data
mask = np.zeros((W_, W_), np.float32)
for poly in body.data.polygons:
    if all(v in scalp for v in poly.vertices):
        t_ = [tuple(uvl[li].uv) for li in poly.loop_indices]
        for k in range(1, len(t_) - 1):
            raster(mask, (t_[0], t_[k], t_[k + 1]))
mask = np.clip(blur(mask, 2.5) * 1.15, 0, 1)
roots = np.array([0.11, 0.075, 0.058])                          # (her hair's roots on her skin)
px[..., :3] = px[..., :3] * (1 - mask[..., None] * 0.92) + roots * mask[..., None] * 0.92
skin_im.pixels.foreach_set(px.ravel())
print("scalp painted:", int((mask > 0.5).sum()), "texels", flush=True)

# lighter for the web: what is under her clothes is gone; the rest at half its faces, her shape kept
bpy.ops.object.select_all(action="DESELECT")
body.select_set(True)
bpy.context.view_layer.objects.active = body
dec = body.modifiers.new("lighter", "DECIMATE")
dec.ratio = 0.45
bpy.ops.object.modifier_apply(modifier=dec.name)

# ------------------------------------------------------------------ her bun, her sunglasses
# made on her head as it is now, against its surface: her hair's outermost layer, found by rays
tree = BVHTree.FromPolygons(*world_mesh([hair, body]))


def on_head(direction, lift=0.0):
    """the outer surface of her hair (or her head) along a direction from its middle, and its normal"""
    d = direction.normalized()
    loc, nrm, _i, _d = tree.ray_cast(C + d * 0.4, -d)
    if nrm.dot(d) < 0:
        nrm = -nrm
    return loc + nrm * lift, nrm


def tube(name, pts, radius, mat, closed=False, m=10, uv_len=0.06):
    """a tube along points (radius a number, or a function of 0..1 along it), its UVs along its length"""
    n = len(pts)
    rad = radius if callable(radius) else (lambda t: radius)
    nx = (lambda i: pts[(i + 1) % n]) if closed else (lambda i: pts[min(i + 1, n - 1)])
    pv = (lambda i: pts[(i - 1) % n]) if closed else (lambda i: pts[max(i - 1, 0)])
    T = [(nx(i) - pv(i)).normalized() for i in range(n)]
    N = [T[0].orthogonal().normalized()]
    for i in range(1, n):                                         # (carried along, so it does not twist)
        v = N[-1] - T[i] * N[-1].dot(T[i])
        N.append(v.normalized())
    s_ = [0.0]
    for i in range(1, n):
        s_.append(s_[-1] + (pts[i] - pts[i - 1]).length)
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    rings = []
    for i in range(n):
        B = T[i].cross(N[i])
        r = rad(i / (n - 1))
        rings.append([bm.verts.new(pts[i] + (N[i] * math.cos(2 * math.pi * j / m) + B * math.sin(2 * math.pi * j / m)) * r)
                      for j in range(m)])
    for i in range(n if closed else n - 1):
        a, b = rings[i], rings[(i + 1) % n]
        for j in range(m):
            f = bm.faces.new((a[j], b[j], b[(j + 1) % m], a[(j + 1) % m]))
            u0, u1 = s_[i] / uv_len, (s_[i + 1] if i + 1 < n else s_[-1] + (pts[0] - pts[-1]).length) / uv_len
            for lp, (u, v) in zip(f.loops, ((u0, j / m), (u1, j / m), (u1, (j + 1) / m), (u0, (j + 1) / m))):
                lp[uv].uv = (u, v)
    if not closed:                                                # its ends closed
        for ring, c in ((rings[0], pts[0]), (rings[-1], pts[-1])):
            mid = bm.verts.new(c)
            for j in range(m):
                f = bm.faces.new((ring[j], ring[(j + 1) % m], mid))
                for lp in f.loops:
                    lp[uv].uv = (0.0, 0.5)
    bm.normal_update()
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    for poly in me.polygons:
        poly.use_smooth = True
    o = bpy.data.objects.new(name, me)
    sc.collection.objects.link(o)
    return o


def material(name, rgb=None, rough=0.5, metal=0.0, image=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    if image:
        t = m.node_tree.nodes.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(os.path.join(TEX, image), check_existing=True)
        m.node_tree.links.new(t.outputs["Color"], b.inputs["Base Color"])
        if t.image.depth == 32 and "frizz" in image:                  # (an image with holes in it: its alpha too)
            m.node_tree.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
    else:
        b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


# her bun: her hair wound round on itself, low at the back of her head where its strands meet: a low
# dome, a soft spiral groove in it, its strands following the spiral; its rim sunk into her hair
P_b, N_b = on_head(BUN)
ax = (BUN + N_b).normalized()
e1 = (up - ax * up.dot(ax)).normalized()
e2 = ax.cross(e1)
base = P_b - ax * 0.011
RB, HB, PITCH, GROOVE = 0.041, 0.035, 0.0115, 0.0016
NR, NP = 22, 120


def bun_point(i, j):
    rho = RB * (1 - i / NR)                                       # (ring 0 its rim, ring NR its middle)
    ph = 2 * math.pi * j / NP
    h = HB * math.sqrt(max(0.0, 1 - (rho / RB) ** 2))
    # a hand-wound coil, not a turned one: its groove deeper and shallower as it goes, its outline
    # not quite round, its crown leaning a little to one side
    g = GROOVE * (0.5 + 0.5 * math.cos(2 * math.pi * rho / PITCH - ph)) * min(1.0, i / 3) * min(1.0, (NR - i) / 4)
    g *= 0.7 + 0.3 * math.sin(5 * ph + 2 * rho / PITCH)
    rr = rho * (1 + 0.05 * math.sin(3 * ph + 1.3) + 0.03 * math.sin(5 * ph + 0.4))
    return base + (e1 * math.cos(ph) + e2 * math.sin(ph)) * rr + ax * (h - g) + e2 * h * 0.12 - e1 * h * 0.06


def bun_uv(i, j):
    # its strands along the spiral: round it (4 lengths of the image a turn), and out across it
    rho = RB * (1 - i / NR)
    ph = 2 * math.pi * j / NP
    return (ph / (2 * math.pi) * 4, rho / PITCH - ph / (2 * math.pi))


bm = bmesh.new()
uvb = bm.loops.layers.uv.new("UVMap")
lmb = bm.loops.layers.uv.new("LM")
rings = [[bm.verts.new(bun_point(i, j)) for j in range(NP)] for i in range(NR)]
tip = bm.verts.new(bun_point(NR, 0))
# its light laid out round its middle, by the distance over it from there (so its steep rim has room)
over = [0.0] * (NR + 1)
for i in range(NR - 1, -1, -1):
    over[i] = over[i + 1] + (bun_point(i, 0) - bun_point(i + 1, 0)).length
for i in range(NR):
    for j in range(NP):
        j1 = j + 1
        if i < NR - 1:
            f = bm.faces.new((rings[i][j], rings[i][j1 % NP], rings[i + 1][j1 % NP], rings[i + 1][j]))
            ij = ((i, j), (i, j1), (i + 1, j1), (i + 1, j))
        else:
            f = bm.faces.new((rings[i][j], rings[i][j1 % NP], tip))
            ij = ((i, j), (i, j1), (NR, j + 0.5))
        for lp, (a_, b_) in zip(f.loops, ij):
            lp[uvb].uv = bun_uv(a_, b_)
            ph = 2 * math.pi * b_ / NP
            lp[lmb].uv = (over[a_] * math.cos(ph), over[a_] * math.sin(ph))
bm.normal_update()
me = bpy.data.meshes.new("Figure_dollyBun")
bm.to_mesh(me)
bm.free()
mat_hair = material("figure:hair", rough=0.68, image="hair.png")
hair.data.materials.append(mat_hair)
frizz.data.materials.append(material("figure:frizz", rough=0.6, image="frizz.png"))
me.materials.append(mat_hair)
for poly in me.polygons:
    poly.use_smooth = True
bun = bpy.data.objects.new("Figure_dollyBun", me)
sc.collection.objects.link(bun)
# her sunglasses, pushed up on her head: the front on her hair above her brow, the lenses each lying on
# it, the arms back along the sides of her head into her hair
mat_lens = material("figure:lens", (0.02, 0.02, 0.025), rough=0.08)
mat_frame = material("figure:frame", (0.015, 0.014, 0.013), rough=0.35)
P0, N0 = on_head(up * math.cos(math.radians(34)) + face * math.sin(math.radians(34)))
X0 = (side - N0 * side.dot(N0)).normalized()
g_parts = []
inner = {}
for sx in (-1, 1):
    Pl, Nl = on_head(P0 + X0 * sx * 0.035 - C, lift=0.0045)
    Xl = (X0 - Nl * X0.dot(Nl)).normalized()
    Zl = Xl.cross(Nl).normalized() * (1 if (Xl.cross(Nl)).dot(-face) > 0 else -1)   # (the frame's top edge, now toward her crown)
    outline = []
    for k in range(40):
        a = 2 * math.pi * k / 40
        c_, s2 = math.cos(a), math.sin(a)
        outline.append(Pl + Xl * 0.026 * math.copysign(abs(c_) ** 0.6, c_) + Zl * 0.02 * math.copysign(abs(s2) ** 0.6, s2))
    # the lens: a thin dark pane inside the rim
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    top_ = [bm.verts.new(p + Nl * 0.0008) for p in outline]
    bot_ = [bm.verts.new(p - Nl * 0.0012) for p in outline]
    for f in (bm.faces.new(top_), bm.faces.new(list(reversed(bot_)))):
        for lp in f.loops:
            lp[uvl].uv = (0.5, 0.5)
    for k in range(40):
        f = bm.faces.new((top_[k], top_[(k + 1) % 40], bot_[(k + 1) % 40], bot_[k]))
        for lp in f.loops:
            lp[uvl].uv = (0.5, 0.5)
    bm.normal_update()
    me = bpy.data.meshes.new(f"lens{sx}")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat_lens)
    lens = bpy.data.objects.new(f"lens{sx}", me)
    sc.collection.objects.link(lens)
    g_parts.append(lens)
    g_parts.append(tube(f"rim{sx}", outline, 0.0021, mat_frame, closed=True, m=8))
    inner[sx] = Pl - Xl * sx * 0.026 + Zl * 0.012                     # (where the bridge meets it)
    hinge = Pl + Xl * sx * 0.027 + Zl * 0.012
    # the arm: from the hinge back along the side of her head, a finger's breadth above her ear
    d0 = (hinge - C).normalized()
    d1 = (side * sx * 0.8 - face * 0.5 + up * 0.1).normalized()
    path, length = [hinge], 0.0
    for k in range(1, 17):
        t = k / 16
        d = (d0 * (1 - t) + d1 * t).normalized()
        p, _n = on_head(d, lift=0.0028)
        length += (p - path[-1]).length
        if length > 0.125:
            break
        path.append(p)
    g_parts.append(tube(f"arm{sx}", path, 0.0019, mat_frame, m=8))
mid = (inner[-1] + inner[1]) / 2
mid_s, _n = on_head(mid - C, lift=0.006)
g_parts.append(tube("bridge", [inner[-1], (inner[-1] + mid_s) / 2, mid_s, (inner[1] + mid_s) / 2, inner[1]], 0.0022, mat_frame, m=8))
bpy.ops.object.select_all(action="DESELECT")
for o in g_parts:
    o.select_set(True)
bpy.context.view_layer.objects.active = g_parts[0]
bpy.ops.object.join()
glasses = g_parts[0]
glasses.name = "Figure_dollyGlasses"
print("bun at", tuple(round(c, 3) for c in base), "%.0f deg below her head's level;" % math.degrees(math.asin(-ax.dot(up))),
      "glasses at", tuple(round(c, 3) for c in P0), flush=True)

# ------------------------------------------------------------------ her hood, down on her back
# her fleece hoodie's hood, lying down: a U of doubled fleece from the back of her neckline down her
# shoulder blades, bunched thickest where it folds at her neck, a seam down its middle, its edge a
# lip of cloth on her back. Laid over the sweatshirt by rays, in her back's own frame.
side_b = (SH_L - SH_R).normalized()
down_b = (MID - NECK).normalized()
back_b = side_b.cross(down_b).normalized()                       # (out of her back)
side_b = down_b.cross(back_b).normalized()
cloth_t = BVHTree.FromPolygons(*world_mesh([top_o]))
skin_t = BVHTree.FromPolygons(*world_mesh([top_o, body]))
bm_ = bmesh.new()
bm_.from_mesh(top_o.data)
bm_.transform(top_o.matrix_world)
neckline = [v.co.copy() for v in bm_.verts if v.is_boundary and (v.co - NECK).length < 0.14]
bm_.free()
nc = sum(neckline, Vector()) / len(neckline)
O = max(neckline, key=lambda q: (q - nc).dot(back_b))            # the back of her neckline
DH, HW = 0.25, 0.155


def hood_w(v):
    """its half-width down her back (v: 0 at her neckline, 1 at its point; above 0, round her neck)"""
    if v < 0.05:
        return HW * (0.62 + 0.38 * min(1.0, max(0.0, (v + 0.14) / 0.19)))
    return HW * max(0.0, 1 - ((v - 0.05) / 0.95) ** 2.4) ** 0.5


def hood_t(u, v):
    """how far it stands off her back: a roll at her neck, flatter as it goes down, its middle seam"""
    sm = min(1.0, max(0.0, (v - 0.12) / 0.78))
    T = 0.013 + 0.03 * (1 - sm * sm * (3 - 2 * sm))
    seam = 0.0035 * math.exp(-((u * hood_w(v)) / 0.011) ** 2)
    return T * max(0.0, 1 - u * u) ** 0.5 + 0.009 - seam


NU, NV = 24, 22
VS = [-0.14 + (1.0 + 0.14) * k / NV for k in range(NV + 1)]
bmh = bmesh.new()
uvh = bmh.loops.layers.uv.new("UVMap")
lmh = bmh.loops.layers.uv.new("LM")
top_, low_, sd_ = [], [], []
for v in VS:
    row_t, row_l, row_s = [], [], []
    w_ = max(hood_w(v), 0.004)
    for i in range(NU + 1):
        u = -1 + 2 * i / NU
        sx, dd = u * w_, v * DH
        q = O + side_b * sx + down_b * dd
        hit = (cloth_t if v >= 0 else skin_t).ray_cast(q + back_b * 0.3, -back_b, 0.6)
        if hit[0] is None:
            hit = skin_t.ray_cast(q + back_b * 0.3, -back_b, 0.6)
        b_ = hit[0] if hit[0] is not None else q
        nrm = hit[1] if hit[1] is not None else back_b
        if nrm.dot(back_b) < 0:
            nrm = -nrm
        n_ = (nrm + back_b).normalized()
        row_t.append(bmh.verts.new(b_ + n_ * hood_t(u, v)))
        row_l.append(bmh.verts.new(b_ + n_ * 0.0012))
        row_s.append((sx, dd))
    top_.append(row_t); low_.append(row_l); sd_.append(row_s)


def face4(vs4, sd4):
    f = bmh.faces.new(vs4)
    for lp, (a_, b2) in zip(f.loops, sd4):
        lp[uvh].uv = (a_ / 0.08, b2 / 0.08)
        lp[lmh].uv = (a_, b2)
    return f


for k in range(NV):
    for i in range(NU):
        face4((top_[k][i], top_[k][i + 1], top_[k + 1][i + 1], top_[k + 1][i]),
              (sd_[k][i], sd_[k][i + 1], sd_[k + 1][i + 1], sd_[k + 1][i]))
# its edge: a wall of cloth down to her back, all round
ring = [(0, i) for i in range(NU + 1)] + [(k, NU) for k in range(1, NV + 1)] + \
       [(NV, i) for i in range(NU - 1, -1, -1)] + [(k, 0) for k in range(NV - 1, 0, -1)]
for (k0, i0), (k1, i1) in zip(ring, ring[1:] + ring[:1]):
    a0, a1 = sd_[k0][i0], sd_[k1][i1]
    face4((top_[k0][i0], low_[k0][i0], low_[k1][i1], top_[k1][i1]), (a0, (a0[0], a0[1] + 0.01), (a1[0], a1[1] + 0.01), a1))
bmesh.ops.remove_doubles(bmh, verts=bmh.verts[:], dist=1e-5)
for _ in range(2):
    bmesh.ops.smooth_vert(bmh, verts=[v for v in bmh.verts if not v.is_boundary], factor=0.4,
                          use_axis_x=True, use_axis_y=True, use_axis_z=True)
bmh.normal_update()
meh = bpy.data.meshes.new("Figure_dollyHood")
bmh.to_mesh(meh)
bmh.free()
for poly in meh.polygons:
    poly.use_smooth = True
hood = bpy.data.objects.new("Figure_dollyHood", meh)
sc.collection.objects.link(hood)
meh.materials.append(material("figure:hood", rough=0.95, image="fleece.png"))
print("hood: from", tuple(round(c, 3) for c in O), "down", tuple(round(c, 2) for c in down_b), flush=True)

# ------------------------------------------------------------------ the brush: in her grip, to the canvas
web, pinch, d = BRUSH
mat_wood = bpy.data.materials.new("figure:brushWood")
mat_wood.use_nodes = True
mat_wood.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.42, 0.2, 0.07, 1)
mat_ferrule = bpy.data.materials.new("figure:ferrule")
mat_ferrule.use_nodes = True
pfe = mat_ferrule.node_tree.nodes["Principled BSDF"]
pfe.inputs["Base Color"].default_value = (0.62, 0.6, 0.56, 1)
pfe.inputs["Metallic"].default_value = 1.0
pfe.inputs["Roughness"].default_value = 0.3
mat_bristle = bpy.data.materials.new("figure:bristle")
mat_bristle.use_nodes = True
mat_bristle.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.25, 0.42, 0.08, 1)   # wet with her green


def rod(p0, p1, r0, r1, mat):
    p0, p1 = Vector(p0), Vector(p1)
    v = p1 - p0
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=r0, radius2=r1, depth=v.length, location=(p0 + p1) / 2)
    o = bpy.context.active_object
    o.rotation_euler = v.to_track_quat("Z", "Y").to_euler()
    o.data.materials.append(mat)
    return o


start = web - d * 0.075                                       # (its end, past the web of her hand)
tip = TOUCH
L = (tip - start).length
b_parts = [rod(start, start + d * (L - 0.035), 0.0042, 0.0034, mat_wood),
           rod(start + d * (L - 0.035), start + d * (L - 0.016), 0.0036, 0.0033, mat_ferrule),
           rod(start + d * (L - 0.016), tip, 0.0034, 0.0008, mat_bristle)]
bpy.ops.object.select_all(action="DESELECT")
for p in b_parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = b_parts[0]
bpy.ops.object.join()
b_parts[0].name = "Figure_dollyBrush"

# ------------------------------------------------------------------ for the web: hair cut out, the rest opaque
def alpha_mode(o, clip):
    for m in o.data.materials:
        nt = m.node_tree
        bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if not bsdf:
            continue
        for l in list(nt.links):
            if l.to_node == bsdf and l.to_socket.name == "Alpha":
                src = l.from_socket
                nt.links.remove(l)
                if clip:
                    # the glTF exporter reads a rounded alpha as a cut-out (alphaMode MASK)
                    r = nt.nodes.new("ShaderNodeMath")
                    r.operation = "ROUND"
                    nt.links.new(src, r.inputs[0])
                    nt.links.new(r.outputs[0], bsdf.inputs["Alpha"])
        bsdf.inputs["Alpha"].default_value = 1.0


for o in sc.objects:
    if o.type == "MESH":
        alpha_mode(o, clip=o in (worn["eyebrow010"], frizz))

# ------------------------------------------------------------------ names, and out
names = {body.name: "Figure_dollyBody", worn["eyebrow010"].name: "Figure_dollyBrows",
         worn["female_elegantsuit01"].name: "Figure_dollyTop", worn["female_casualsuit01"].name: "Figure_dollyTrousers"}
for o in list(sc.objects):
    if o.name in names:
        o.name = names[o.name]
        for m in o.data.materials:
            m.name = "figure:" + o.name[len("Figure_dolly"):].lower()


def overlap(me, layer, n=512):
    """the share of a UV layout's area that more than one face claims (texel centres strictly inside)"""
    cnt = np.zeros((n, n), np.uint16)
    uvd = me.uv_layers[layer].data
    for poly in me.polygons:
        t_ = [tuple(uvd[li].uv) for li in poly.loop_indices]
        for k in range(1, len(t_) - 1):
            P = np.array([t_[0], t_[k], t_[k + 1]]) * n - 0.5
            x0, y0 = np.maximum(np.floor(P.min(0)).astype(int), 0)
            x1, y1 = np.minimum(np.ceil(P.max(0)).astype(int), n - 1)
            if x1 < x0 or y1 < y0:
                continue
            gx, gy = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
            (ax_, ay_), (bx_, by_), (cx_, cy_) = P
            den = (by_ - cy_) * (ax_ - cx_) + (cx_ - bx_) * (ay_ - cy_)
            if abs(den) < 1e-12:
                continue
            l1 = ((by_ - cy_) * (gx - cx_) + (cx_ - bx_) * (gy - cy_)) / den
            l2 = ((cy_ - ay_) * (gx - cx_) + (ax_ - cx_) * (gy - cy_)) / den
            inside_ = (l1 > 1e-3) & (l2 > 1e-3) & (1 - l1 - l2 > 1e-3)
            cnt[gy[inside_], gx[inside_]] += 1
    return float((cnt > 1).sum()) / max(1, int((cnt > 0).sum()))


for o in (body, worn["female_elegantsuit01"], worn["female_casualsuit01"]):
    me = o.data
    me.uv_layers.active = me.uv_layers[0]
    lay = me.uv_layers.new(name="LM", do_init=True)
    ov = overlap(me, "LM")
    print("light layout:", o.name, "%.1f%% overlapping" % (ov * 100), flush=True)
    if ov > 0.02:                                                 # (shared pieces: export.py lays its own)
        me.uv_layers.remove(lay)
    me.uv_layers.active = me.uv_layers[0]
tris = 0
for o in sc.objects:
    if o.type == "MESH":
        o.data.calc_loop_triangles()
        tris += len(o.data.loop_triangles)
        print("part", o.name, len(o.data.loop_triangles), "tris", flush=True)
print("total", tris, "tris; brush tip", tuple(round(c, 3) for c in tip), "in her grip at", tuple(round(c, 3) for c in pinch), flush=True)
# self-contained: every part's place folded into its vertices (an appended object's world matrix is
# not there until the scene is evaluated, its own transform is), every image in the file at the size
# the web is given (the copy in assets/figure must not lean on paths beside the one it was made in)
bpy.ops.object.select_all(action="DESELECT")
for o in sc.objects:
    if o.type == "MESH":
        o.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.data.orphans_purge(do_recursive=True)                       # (the images hers replaced)

for im in bpy.data.images:
    if im.source != "FILE":
        continue
    w, h = im.size
    if max(w, h) > 1024:
        k = 1024 / max(w, h)
        im.scale(round(w * k), round(h * k))
    im.pack()
    print("image", im.name, tuple(im.size), flush=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "dolly-3d.blend"))
