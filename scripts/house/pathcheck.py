"""
Does the camera ever pass through a wall?

    python3 scripts/house/pathcheck.py <build dir>/house.json

Replays the rig's motion between consecutive chapters — four channels (cam,
camRot, pivot, pivotRot), each eased with power3.inOut over 10 units and
started 0.5 apart, yaw unwrapped as the site unwraps it — and tests the eye
against every wall collider (Blender coordinates). A step with a passing pose
(lib/chapters.ts `via`) runs power2.in to it and power2.out from it, 5 units each.
"""
import json
import math
import sys

info = json.load(open(sys.argv[1]))
NARROW = len(sys.argv) > 2 and sys.argv[2] == "narrow"
ORDER = ["presence", "floral", "canopy", "easel", "bodhi", "faith", "street", "redwall",
         "gallery", "rupaya", "panels", "palms", "portraits", "doodhwala", "featured", "plan"]
VIA = {"easel": "easelvia", "bodhi": "threshold", "faith": "faithvia", "street": "streetvia", "redwall": "redvia", "gallery": "galleryvia"}
cams = {k: (info["cams"].get(f"n:{k}") if NARROW else None) or v for k, v in info["cams"].items() if not k.startswith("n:")}
if NARROW:   # views a portrait screen alone has (a passing pose only it needs)
    cams.update({k[2:]: v for k, v in info["cams"].items() if k.startswith("n:") and k[2:] not in cams})


def t3(p):
    return (p[0], p[2], -p[1])


def pose(c, prev_yaw=None):
    e, g = t3(c["eye"]), t3(c["target"])
    d = [g[i] - e[i] for i in range(3)]
    L = math.sqrt(sum(x * x for x in d))
    d = [x / L for x in d]
    yaw = math.atan2(-d[0], -d[2]) if abs(d[1]) < 0.999 else (prev_yaw or 0.0)
    if prev_yaw is not None:
        while yaw - prev_yaw > math.pi:
            yaw -= 2 * math.pi
        while yaw - prev_yaw < -math.pi:
            yaw += 2 * math.pi
    orbit = math.asin(max(-1, min(1, d[1])))
    return {"dist": L, "pivot": g, "yaw": yaw, "orbit": orbit}


def eye(p):
    o, y, d = p["orbit"], p["yaw"], p["dist"]
    off = (d * math.cos(o) * math.sin(y), -d * math.sin(o), d * math.cos(o) * math.cos(y))
    return tuple(p["pivot"][i] + off[i] for i in range(3))


def ease(x):
    x = max(0.0, min(1.0, x))
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def lerp(a, b, k):
    return a + (b - a) * k


boxes = [c for c in info["colliders"]]
openings = info.get("openings", [])


def in_opening(x, y, z):
    return any(o[0] - 0.05 < x < o[1] + 0.05 and o[2] - 0.05 < y < o[3] + 0.05 and o[4] < z < o[5] - 0.1 for o in openings)


def inside(e):
    x, y, z = e[0], -e[2], e[1]          # back to Blender
    if in_opening(x, y, z):
        return []
    hits = []
    for c in boxes:
        if c[0] + 0.02 < x < c[1] - 0.02 and c[2] + 0.02 < y < c[3] - 0.02 and c[4] < z < c[5]:
            hits.append(c)
    return hits


poses, vias, prev = [], [], None
for i, k in enumerate(ORDER):
    if i > 0:
        v = pose(cams[VIA[k]], prev) if k in VIA and VIA[k] in cams else None
        if v:
            prev = v["yaw"]
        vias.append(v)
    p = pose(cams[k], prev)
    prev = p["yaw"]
    poses.append(p)


def mix(a, b, v, x):
    """a channel's value at local time x (0…10 units): straight, or through a passing pose"""
    if v is None:
        k = ease(x / 10)
        return lambda f: lerp(f(a), f(b), k)
    x = max(0.0, min(10.0, x))
    if x < 5:
        k = (x / 5) ** 2
        return lambda f: lerp(f(a), f(v), k)
    k = 1 - (1 - (x - 5) / 5) ** 2
    return lambda f: lerp(f(v), f(b), k)


bad = 0
for i in range(len(poses) - 1):
    a, b, v = poses[i], poses[i + 1], vias[i]
    worst = []
    for s in range(0, 481):
        t = s / 480 * 11.5
        mc, mp, mr = mix(a, b, v, t - 0.0), mix(a, b, v, t - 1.0), mix(a, b, v, t - 1.5)
        p = {"dist": mc(lambda q: q["dist"]),
             "pivot": tuple(mp(lambda q, j=j: q["pivot"][j]) for j in range(3)),
             "yaw": mr(lambda q: q["yaw"]), "orbit": mr(lambda q: q["orbit"])}
        e = eye(p)
        if inside(e):
            worst.append((round(t, 2), tuple(round(v, 2) for v in (e[0], -e[2], e[1]))))
    name = f"{ORDER[i]} -> {ORDER[i + 1]}"
    if worst:
        bad += 1
        print(f"WALL  {name}: {len(worst)} samples, e.g. t={worst[0][0]} eye(b)={worst[0][1]} … t={worst[-1][0]} {worst[-1][1]}")
    else:
        print(f"ok    {name}")
print("passes" if not bad else f"{bad} transitions pass through walls")
