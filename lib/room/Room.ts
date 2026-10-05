import * as THREE from "three";
import gsap from "gsap";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type * as CANNON from "cannon-es";

import { buildShell, buildCanopy, ROOM, type Anchors, type Tag } from "./shell";
import { buildSitters, type Spawn } from "./objects";
import { buildLibrary, textureList, worldUV, metricUV, ramTexture, type Library, type Role } from "./materials";
import { HANG, HERO, faceOffset, type Hung } from "./hang";
import { Rig } from "./rig";
import { activeVariant, NIGHT } from "./variants";
import { START, MESS, resolvePoses, isNarrow } from "../chapters";

export type RoomOpts = {
  manifestUrl: string;
  reducedMotion: boolean;
  /** 0…1, one step per asset */
  onProgress(p: number): void;
  onIntroFinished(): void;
  onArtwork(id: string): void;
  /** the physics engine failed to load: leave rearrange */
  onRearrangeError?(error: unknown): void;
};

type Tier = { small: boolean; dpr: number; msaa: number; ao: boolean; shadow: number };

/** one quality decision, made once: phones and small machines get 1k
 *  textures, no AO and a lower pixel ratio; everything else the full set */
function pickTier(): Tier {
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const small = innerWidth < 820 || matchMedia("(pointer: coarse)").matches || mem <= 4 || cores <= 4;
  // colour targets are HalfFloat and there are two of them: 4× MSAA at
  // DPR 1.5 alone is ~220 MB. Two samples look the same here at half that.
  return {
    small,
    dpr: Math.min(devicePixelRatio || 1, small ? 1.25 : 1.5),
    msaa: small ? 0 : 2,
    ao: !small,
    shadow: small ? 1024 : 2048,
  };
}

/**
 * Ambient occlusion at half resolution, blind to the few things that are
 * light rather than matter (the haze in the window shaft, the flame's glow).
 */
class RoomAO extends GTAOPass {
  private excluded?: THREE.Object3D[];
  private was: boolean[] = [];
  setSize(w: number, h: number) {
    super.setSize(Math.max(1, Math.floor(w / 2)), Math.max(1, Math.floor(h / 2)));
  }
  overrideVisibility() {
    if (!this.excluded) {
      this.excluded = [];
      this.scene.traverse((o) => {
        if (o.userData.noAO || (o as THREE.Points).isPoints || (o as THREE.Line).isLine) this.excluded!.push(o);
      });
    }
    this.excluded.forEach((o, i) => { this.was[i] = o.visible; o.visible = false; });
  }
  restoreVisibility() {
    this.excluded?.forEach((o, i) => { o.visible = this.was[i]; });
  }
  dispose() {
    super.dispose();
    // r169's disposer leaves these two behind
    this.gtaoMaterial.dispose();
    this.blendMaterial.dispose();
  }
}

/** a moving object: where it rests, and (once the room is first shaken)
 *  its rigid body */
type Body = {
  body?: CANNON.Body;
  mass: number;
  group: THREE.Group;
  /** collider centre in the group's own frame */
  offset: THREE.Vector3;
  restPos: THREE.Vector3;
  restQuat: THREE.Quaternion;
  restRot: THREE.Euler;
  half: THREE.Vector3;
};

const tmpV = new THREE.Vector3();

export class Room {
  rig!: Rig;
  private renderer?: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private composer?: EffectComposer;
  private ao?: RoomAO;
  private canvas!: HTMLCanvasElement;
  private opts!: RoomOpts;
  private variant = activeVariant();
  private tier!: Tier;
  private lib?: Library;
  private owned: { dispose(): void }[] = [];

  /** everything static — it tilts as one in rearrange */
  private world = new THREE.Group();
  private ceiling = new THREE.Group();
  private anchors!: Anchors;

  private sun!: THREE.DirectionalLight;
  private door!: THREE.DirectionalLight;
  private front!: THREE.RectAreaLight;
  private hemi!: THREE.HemisphereLight;
  private ambient!: THREE.AmbientLight;
  private diya!: THREE.PointLight;
  private flame!: THREE.Mesh;
  private glow!: THREE.Sprite;
  private shaft!: THREE.Mesh;
  private sky!: THREE.Mesh;

  sitters: Spawn[] = [];
  private bodies: Body[] = [];
  private C?: typeof CANNON;
  private physics?: CANNON.World;
  private roomBody?: CANNON.Body;
  private physicsLoading?: Promise<void>;
  private physicsOn = false;
  private rearranged = false;
  private settleUntil = 0;
  private drag = { active: false, id: -1, x0: 0, y0: 0, sx: 0, sy: 0, tx: 0, ty: 0, rx: 0, ry: 0 };

  private art: THREE.Mesh[] = [];
  private narrow = false;
  private lastFlame = -Infinity;

  private abort = new AbortController();
  private disposed = false;
  private compiling?: Promise<unknown>;
  private released = false;
  private ready = false;
  private visible = true;
  private last = 0;
  private wake = 0;
  private aliveUntil = 0;
  private shadowsUntil = 0;
  private mode: "light" | "dark" = "light";
  private modeTl?: gsap.core.Timeline;
  private dropTl?: gsap.core.Timeline;
  private resetTl?: gsap.core.Timeline;
  private introPlayed = false;
  private hoverDirty = false;
  private hoverId: string | null = null;
  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2();

  /* ======================================================================
     load and build
     ====================================================================== */

  async init(canvas: HTMLCanvasElement, opts: RoomOpts) {
    this.canvas = canvas;
    this.opts = opts;
    this.tier = pickTier();
    const V = this.variant;

    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, stencil: false, powerPreference: "high-performance",
    });
    this.renderer = renderer;
    renderer.setPixelRatio(this.tier.dpr);
    renderer.setSize(canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight, false);
    // Khronos PBR Neutral: base colours come through as painted, which is
    // the whole point in a room that exists to show paintings
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = V.exposure;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.setClearColor(V.clear, 1);

    const { root, ceiling, anchors } = buildShell();
    this.anchors = anchors;
    const aspect = (canvas.clientWidth || innerWidth) / Math.max(1, canvas.clientHeight || innerHeight);
    this.narrow = isNarrow(aspect);
    this.rig = new Rig(resolvePoses(anchors, this.narrow), START, MESS, aspect, opts.reducedMotion);
    this.scene.add(this.rig.pivot, this.world);

    /* every asset is counted, so the counter means something */
    const texList = textureList(this.tier.small);
    const ids = [...new Set(HANG.map((h) => h.id))];
    const total = 1 + texList.length + ids.length;
    let done = 0;
    const tick = () => { if (!this.disposed) opts.onProgress(++done / total); };

    const manifestP = fetch(opts.manifestUrl, { signal: this.abort.signal })
      .then((r) => { if (!r.ok) throw new Error(`manifest ${r.status}`); return r.json(); })
      .then((m: { room: { id: string; ratio: number }[] }) => { tick(); return m; });
    const texP = Promise.all(texList.map((t) =>
      this.loadTexture(t.url).then((tex) => { tick(); return [`${t.set}:${t.kind}`, tex] as const; })));
    const artP = Promise.all(ids.map((id) =>
      this.loadTexture(`/art/room/${id}.jpg`).then((tex) => { tick(); return [id, tex] as const; })));

    const [manifest, texPairs, artPairs] = await Promise.all([manifestP, texP, artP]);
    if (this.disposed) {
      texPairs.forEach(([, t]) => t.dispose());
      artPairs.forEach(([, t]) => t.dispose());
      return;
    }

    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const lib = buildLibrary(new Map(texPairs), V, anisotropy, ROOM.h);
    this.lib = lib;
    this.owned.push(lib);
    this.carveRam(lib);

    // the shell, merged by material into a handful of draw calls
    this.mergeStatic(root, ceiling);
    this.world.add(this.ceiling);

    // the paintings
    const ratios = new Map(manifest.room.map((r) => [r.id, r.ratio]));
    const textures = new Map(artPairs);
    const frames = new THREE.Group();
    for (const h of HANG) {
      const tex = textures.get(h.id);
      const ratio = ratios.get(h.id);
      if (!tex || !ratio) throw new Error(`missing artwork ${h.id}`);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = anisotropy;
      this.hangWork(h, tex, ratio, frames);
    }
    this.mergeStatic(frames, null);

    // the sitters
    this.sitters = buildSitters();
    for (const s of this.sitters) {
      this.mergeLocal(s.group);
      this.scene.add(s.group);
    }

    this.buildSky();
    this.buildLights();
    this.buildItems();
    this.buildPost();
    this.resize();
    this.captureEnvironment();
    if (V.startDark) this.setMode("dark", true);

    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("lostpointercapture", this.onPointerUp);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("touchstart", this.onTouch, { passive: true });
    canvas.addEventListener("click", this.onClick);
    addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.onVisibility);

    // compile every program and warm every pass while the panel still covers
    // the room, so the first visible frame costs nothing. three polls the
    // programs from a timer, so teardown waits for this to settle.
    this.compiling = renderer.compileAsync(this.scene, this.rig.camera);
    try { await this.compiling; } finally { this.compiling = undefined; }
    if (this.disposed) { this.release(); return; }
    renderer.shadowMap.needsUpdate = true;
    this.composer!.render();
    this.ready = true;
    this.wake = 2;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __room?: Room }).__room = this;
  }

  private loadTexture(url: string) {
    return new Promise<THREE.Texture>((resolve, reject) => {
      new THREE.TextureLoader().load(
        url,
        (t) => {
          if (this.disposed) { t.dispose(); reject(new Error("disposed")); return; }
          resolve(t);
        },
        undefined,
        () => reject(new Error(`failed to load ${url}`))
      );
    });
  }

  /** the sandstone round the niche, with राम cut into it */
  private carveRam(lib: Library) {
    const m = lib.get("ram");
    const tex = ramTexture(6);
    tex.channel = 1;
    this.owned.push(tex);
    m.normalMap = null;
    m.bumpMap = tex;
    m.bumpScale = 1.0;
    m.aoMap = tex;
    m.aoMapIntensity = 0.65;
    m.needsUpdate = true;
  }

  /**
   * Merge tagged static meshes by material and shadow flags. Static geometry
   * is baked into world space, its UVs laid in metres; anything under
   * `ceiling` goes into its own group so it can be lifted for the plan view.
   */
  private mergeStatic(root: THREE.Object3D, ceiling: THREE.Object3D | null) {
    const lib = this.lib!;
    root.updateMatrixWorld(true);
    type Bucket = { role: Role; cast: boolean; receive: boolean; ceil: boolean; geos: THREE.BufferGeometry[] };
    const buckets = new Map<string, Bucket>();
    const isCeil = (o: THREE.Object3D) => {
      for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p === ceiling) return true;
      return false;
    };
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      const t = m.userData?.tag as Tag | undefined;
      if (!m.isMesh || !t) return;
      let g = m.geometry.clone();
      g.applyMatrix4(m.matrixWorld);
      if (g.index) g = g.toNonIndexed();
      this.layUV(g, t, m.geometry);
      for (const name of Object.keys(g.attributes))
        if (!["position", "normal", "uv", "uv1"].includes(name)) g.deleteAttribute(name);
      g.clearGroups();
      const ceil = !!ceiling && isCeil(m);
      const key = `${t.role}|${t.cast}|${t.receive}|${ceil}`;
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { role: t.role, cast: t.cast, receive: t.receive, ceil, geos: [] }));
      b.geos.push(g);
    });
    root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose(); });
    for (const b of buckets.values()) {
      const geo = mergeGeometries(b.geos, false);
      b.geos.forEach((g) => g.dispose());
      if (!geo) continue;
      geo.computeBoundingSphere();
      geo.computeBoundingBox();
      const mesh = new THREE.Mesh(geo, lib.get(b.role));
      mesh.name = `Merged_${b.role}`;
      mesh.castShadow = b.cast;
      mesh.receiveShadow = b.receive;
      (b.ceil ? this.ceiling : this.world).add(mesh);
    }
  }

  /** a moving object: merged by material in its own frame */
  private mergeLocal(group: THREE.Group) {
    const lib = this.lib!;
    group.updateMatrixWorld(true);
    const inv = group.matrixWorld.clone().invert();
    const buckets = new Map<Role, THREE.BufferGeometry[]>();
    const meshes: THREE.Mesh[] = [];
    group.traverse((o) => {
      const m = o as THREE.Mesh;
      const t = m.userData?.tag as Tag | undefined;
      if (!m.isMesh || !t) return;
      meshes.push(m);
      let g = m.geometry.clone();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
      if (g.index) g = g.toNonIndexed();
      this.layUV(g, t, m.geometry);
      for (const name of Object.keys(g.attributes))
        if (!["position", "normal", "uv"].includes(name)) g.deleteAttribute(name);
      g.clearGroups();
      const list = buckets.get(t.role) ?? [];
      list.push(g);
      buckets.set(t.role, list);
    });
    meshes.forEach((m) => { m.geometry.dispose(); m.removeFromParent(); });
    group.clear();
    for (const [role, geos] of buckets) {
      const geo = mergeGeometries(geos, false);
      geos.forEach((g) => g.dispose());
      if (!geo) continue;
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, lib.get(role));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  }

  private layUV(g: THREE.BufferGeometry, t: Tag, source: THREE.BufferGeometry) {
    const lib = this.lib!;
    const tile = lib.tile(t.role), rot = lib.rotate(t.role);
    if (t.uv.kind === "keep") {
      // the carving keeps the geometry's own 0…1 layout on the second
      // channel; the stone itself is laid in metres like everything else
      const uv = g.getAttribute("uv");
      if (uv) g.setAttribute("uv1", uv.clone());
      worldUV(g, tile, rot);
    } else if (t.uv.kind === "world") {
      worldUV(g, tile, rot);
    } else {
      metricUV(g, t.uv.su, t.uv.sv, tile, rot);
    }
    void source;
  }

  /* --- the paintings ---------------------------------------------------- */

  private hangWork(h: Hung, tex: THREE.Texture, ratio: number, frames: THREE.Group) {
    const w = h.h * ratio;
    const holder = new THREE.Group();
    const HX = ROOM.w / 2, HZ = ROOM.d / 2;
    if (h.lean) {
      // standing on the floor, leaning back against the plinth
      holder.position.set(h.lean.x, 0, h.lean.z + 0.1);
      holder.rotation.set(-h.lean.tilt, h.lean.yaw, 0, "YXZ");
    } else if (h.wall === "back") {
      holder.position.set(h.along, h.y, -HZ);
    } else if (h.wall === "left") {
      holder.position.set(-HX, h.y, h.along);
      holder.rotation.y = Math.PI / 2;
    } else {
      holder.position.set(HX, h.y, h.along);
      holder.rotation.y = -Math.PI / 2;
    }
    const lift = h.lean ? h.h / 2 + h.fw : 0;
    const back = h.lean ? 0 : faceOffset(h) - h.fd + 0.012;

    // the canvas
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86, metalness: 0, envMapIntensity: 0.5 });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h.h), mat);
    plane.position.set(0, lift, back + h.fd - 0.012);
    plane.name = `Art_${h.id}`;
    plane.userData.artId = h.id;
    plane.receiveShadow = true;
    plane.castShadow = false;
    holder.add(plane);

    // the frame: one moulding, extruded, its lip overlapping the canvas edge
    const ow = w / 2 + h.fw, oh = h.h / 2 + h.fw, lip = 0.006;
    const shape = new THREE.Shape();
    shape.moveTo(-ow, -oh); shape.lineTo(ow, -oh); shape.lineTo(ow, oh); shape.lineTo(-ow, oh); shape.closePath();
    const hole = new THREE.Path();
    const iw = w / 2 - lip, ih = h.h / 2 - lip;
    hole.moveTo(-iw, -ih); hole.lineTo(-iw, ih); hole.lineTo(iw, ih); hole.lineTo(iw, -ih); hole.closePath();
    shape.holes.push(hole);
    const bevel = Math.min(0.006, h.fw * 0.2);
    const fg = new THREE.ExtrudeGeometry(shape, {
      depth: h.fd - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
      bevelSegments: 2, curveSegments: 1,
    });
    const frame = new THREE.Mesh(fg);
    frame.position.set(0, lift, back + bevel);
    holder.add(frame);
    frame.userData.tag = { role: "frame", uv: { kind: "metric", su: 1, sv: 1 }, cast: true, receive: true } satisfies Tag;

    // a dark backing board, so a leaning canvas has a back
    if (h.lean) {
      const board = new THREE.Mesh(new THREE.BoxGeometry(w + h.fw * 2 - 0.01, h.h + h.fw * 2 - 0.01, 0.012));
      board.position.set(0, lift, 0.006);
      board.userData.tag = { role: "canvasBack", uv: { kind: "world" }, cast: true, receive: true } satisfies Tag;
      holder.add(board);
    }

    // the canvas plane stays its own mesh; the frame joins the merge
    holder.updateMatrixWorld(true);
    this.world.add(holder);
    holder.remove(frame);
    frame.applyMatrix4(holder.matrixWorld);
    frames.add(frame);
    if (h.lean) {
      const board = holder.children.find((c) => c !== plane);
      if (board) { holder.remove(board); board.applyMatrix4(holder.matrixWorld); frames.add(board); }
    }
    this.art.push(plane);
  }

  /* --- light ------------------------------------------------------------ */

  private buildLights() {
    const V = this.variant;
    const sz = this.tier.shadow;

    // the sun, through the grille: the one hard shape of light in the room
    this.sun = new THREE.DirectionalLight(V.sun.color, V.sun.intensity);
    this.sun.position.set(V.sun.pos[0], V.sun.pos[1], V.sun.pos[2]);
    this.sun.target.position.set(0, 0.8, 0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(sz, sz);
    this.sun.shadow.radius = 2.5;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;
    Object.assign(this.sun.shadow.camera, { left: -5.5, right: 5.5, top: 5.5, bottom: -5.5, near: 0.5, far: 24 });
    this.scene.add(this.sun, this.sun.target);

    /* the open door: lower, warmer, softer, and dappled by a tree no one
       sees — the canopy exists only in this light's shadow map */
    this.door = new THREE.DirectionalLight(V.door.color, V.door.intensity);
    this.door.position.set(-9.6, 5.6, 2.9);
    this.door.target.position.set(-1.2, 0.4, 1.2);
    this.door.castShadow = true;
    this.door.shadow.mapSize.set(1024, 1024);
    this.door.shadow.radius = 5;
    this.door.shadow.bias = -0.0005;
    this.door.shadow.normalBias = 0.03;
    Object.assign(this.door.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 26 });
    this.scene.add(this.door, this.door.target);
    const canopy = buildCanopy();
    this.scene.add(canopy);

    /* the open side of the room, as one large soft window: no shadow, no
       hard edge, an even wash on the walls that face it — which is to say
       on every painting */
    RectAreaLightUniformsLib.init();
    this.front = new THREE.RectAreaLight(V.front.color, V.front.intensity, ROOM.w - 0.9, ROOM.h + 0.4);
    this.front.position.set(0, ROOM.h / 2 + 0.25, ROOM.d / 2 + 4.5);
    this.front.lookAt(0, ROOM.h / 2 - 0.25, -ROOM.d / 2);
    this.world.add(this.front);

    this.hemi = new THREE.HemisphereLight(V.hemi.sky, V.hemi.ground, V.hemi.intensity);
    this.ambient = new THREE.AmbientLight(V.ambient.color, V.ambient.intensity);
    this.scene.add(this.hemi, this.ambient);

    // the diya — in Vakratunda and The Aarti the flame is the only light
    // source and the only broken-out colour. It is the dark mode.
    const a = this.anchors.diya;
    this.diya = new THREE.PointLight(0xffa04a, 0, 9, 2);
    this.diya.position.set(a.x, a.y + 0.07, a.z + 0.06);
    this.world.add(this.diya);

    const lib = this.lib!;
    const dish = new THREE.Mesh(
      new THREE.LatheGeometry([
        new THREE.Vector2(0.001, 0), new THREE.Vector2(0.045, 0.004), new THREE.Vector2(0.058, 0.02),
        new THREE.Vector2(0.056, 0.027), new THREE.Vector2(0.038, 0.022), new THREE.Vector2(0.001, 0.02),
      ], 32),
      lib.get("clay")
    );
    dish.position.copy(a);
    dish.castShadow = true;
    this.world.add(dish);
    this.owned.push(dish.geometry);

    this.flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.011, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffd08a, transparent: true, opacity: 0.9, toneMapped: false })
    );
    this.flame.scale.set(0.75, 1.9, 0.75);
    this.flame.position.set(a.x, a.y + 0.045, a.z);
    this.flame.userData.noAO = true;
    this.world.add(this.flame);
    this.owned.push(this.flame.geometry, this.flame.material as THREE.Material);

    const gc = document.createElement("canvas");
    gc.width = gc.height = 64;
    const g2 = gc.getContext("2d")!;
    const grad = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,190,110,1)");
    grad.addColorStop(0.25, "rgba(255,150,60,0.35)");
    grad.addColorStop(1, "rgba(255,120,40,0)");
    g2.fillStyle = grad;
    g2.fillRect(0, 0, 64, 64);
    const glowTex = new THREE.CanvasTexture(gc);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, transparent: true, opacity: 0.3, depthWrite: false,
      blending: THREE.AdditiveBlending, toneMapped: false,
    }));
    this.glow.scale.setScalar(0.22);
    this.glow.position.copy(this.flame.position);
    this.glow.userData.noAO = true;
    this.world.add(this.glow);
    this.owned.push(glowTex, this.glow.material);

    // haze in the shaft — her canvases are atmospheric, never optically clean
    this.buildShaft();
  }

  /** a soft sky: what the grille, the door and the open side look out on */
  private buildSky() {
    const geo = new THREE.SphereGeometry(60, 32, 16);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: new THREE.Color(0xcad8e4) },
        uHorizon: { value: new THREE.Color(0xf6ead8) },
        uBottom: { value: new THREE.Color(0xe7d9c4) },
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww;
        }`,
      fragmentShader: `
        uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uBottom;
        varying vec3 vDir;
        void main() {
          float h = vDir.y;
          vec3 c = h > 0.0
            ? mix(uHorizon, uTop, pow(smoothstep(0.0, 0.9, h), 0.75))
            : mix(uHorizon, uBottom, smoothstep(0.0, 0.25, -h));
          gl_FragColor = vec4(c, 1.0);
        }`,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const sky = new THREE.Mesh(geo, mat);
    sky.renderOrder = -1;
    sky.frustumCulled = false;
    sky.userData.noAO = true;
    this.sky = sky;
    this.scene.add(sky);
    this.owned.push(geo, mat);
  }

  /**
   * Haze in the shaft — her canvases are atmospheric, never optically clean.
   * The window opening is swept along the light into a box; each pixel
   * measures how far its line of sight runs through that box, so the haze
   * thickens where you look along the beam and thins across it.
   */
  private buildShaft() {
    const w = ROOM.window, V = this.variant;
    const dir = new THREE.Vector3(-V.sun.pos[0], -V.sun.pos[1], -V.sun.pos[2]).normalize();
    const start = new THREE.Vector3(ROOM.w / 2 + 0.05, w.sill + w.h / 2, w.z);
    // the beam ends where it meets the floor
    const len = Math.min(6, start.y / Math.max(0.05, -dir.y));
    const scale = new THREE.Vector3(w.w * 0.95, w.h * 0.9, len);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0, 0.5);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: V.haze },
        uColor: { value: new THREE.Color(0xffe2b8) },
        uScale: { value: scale },
      },
      vertexShader: `
        varying vec3 vP;
        varying vec3 vCam;
        void main() {
          vP = position;
          vCam = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float uOpacity; uniform vec3 uColor; uniform vec3 uScale;
        varying vec3 vP; varying vec3 vCam;
        void main() {
          vec3 rd = normalize(vP - vCam);
          vec3 inv = 1.0 / rd;
          vec3 t0 = (vec3(-0.5, -0.5, 0.0) - vCam) * inv;
          vec3 t1 = (vec3(0.5, 0.5, 1.0) - vCam) * inv;
          vec3 tn3 = min(t0, t1), tf3 = max(t0, t1);
          float tn = max(max(max(tn3.x, tn3.y), tn3.z), 0.0);
          float tf = min(min(tf3.x, tf3.y), tf3.z);
          if (tf <= tn) discard;
          // path length in metres, and the falloff at the middle of the path
          float metres = length((tf - tn) * rd * uScale);
          vec3 m = vCam + rd * (tn + tf) * 0.5;
          float along = smoothstep(0.0, 0.08, m.z) * pow(max(1.0 - m.z, 0.0), 1.3);
          float core = (1.0 - smoothstep(0.22, 0.5, abs(m.x))) * (1.0 - smoothstep(0.24, 0.5, abs(m.y)));
          gl_FragColor = vec4(uColor * uOpacity * metres * along * core, 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(start);
    m.lookAt(start.clone().add(dir));
    m.scale.copy(scale);
    m.userData.noAO = true;
    m.castShadow = false;
    m.receiveShadow = false;
    m.renderOrder = 2;
    this.shaft = m;
    this.world.add(m);
    this.owned.push(geo, mat);
  }

  /**
   * The room's own light, captured once from its centre and given back to
   * it as image-based light: one bounce of the sun off the floor and the
   * plaster, and real reflections in the brass and aluminium.
   */
  private captureEnvironment() {
    const r = this.renderer!;
    const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
    const cam = new THREE.CubeCamera(0.05, 60, cubeRT);
    cam.position.set(0, 1.45, 0.3);
    this.scene.add(cam);
    const hide = [this.shaft, this.glow, this.flame];
    hide.forEach((o) => (o.visible = false));
    r.shadowMap.needsUpdate = true;
    cam.update(r, this.scene);
    hide.forEach((o) => (o.visible = true));
    this.scene.remove(cam);
    const pmrem = new THREE.PMREMGenerator(r);
    const env = pmrem.fromCubemap(cubeRT.texture);
    pmrem.dispose();
    cubeRT.dispose();
    this.owned.push(env);
    /* r169 ignores a material's envMapIntensity when the map comes from
       scene.environment, so each material gets the map itself and keeps its
       own strength as a factor of the variant's */
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material;
      for (const mat of Array.isArray(m) ? m : m ? [m] : []) {
        if (!(mat instanceof THREE.MeshStandardMaterial) || mat.userData.envFactor !== undefined) continue;
        mat.userData.envFactor = mat.envMapIntensity;
        mat.envMap = env.texture;
        mat.envMapIntensity = mat.userData.envFactor * this.variant.env;
        mat.needsUpdate = true;
      }
    });
  }

  private envMaterials() {
    const set = new Set<THREE.MeshStandardMaterial>();
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material;
      for (const mat of Array.isArray(m) ? m : m ? [m] : [])
        if (mat instanceof THREE.MeshStandardMaterial && typeof mat.userData.envFactor === "number") set.add(mat);
    });
    return [...set];
  }

  private buildPost() {
    const r = this.renderer!;
    const size = r.getSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, {
      type: THREE.HalfFloatType,
      samples: this.tier.msaa,
    });
    this.composer = new EffectComposer(r, target);
    this.composer.setPixelRatio(this.tier.dpr);
    this.composer.addPass(new RenderPass(this.scene, this.rig.camera));
    /* contact shadow: without it nothing sits in the room — the plinth
       line, the underside of every pot and the frame rebates would be lit
       exactly like open wall */
    if (this.tier.ao) {
      const ao = new RoomAO(this.scene, this.rig.camera, size.x, size.y);
      ao.output = GTAOPass.OUTPUT.Default;
      ao.updateGtaoMaterial({ radius: 0.32, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 12, screenSpaceRadius: false });
      ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      ao.blendIntensity = 0.6;
      this.composer.addPass(ao);
      this.ao = ao;
    }
    this.composer.addPass(new OutputPass());
  }

  /* --- physics ------------------------------------------------------------ */

  /** where every object rests, and its collider's centre — measured once */
  private buildItems() {
    const box = new THREE.Box3();
    for (const s of this.sitters) {
      const g = s.group;
      box.makeEmpty();
      g.updateMatrixWorld(true);
      const inv = g.matrixWorld.clone().invert();
      g.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        m.geometry.computeBoundingBox();
        box.union(m.geometry.boundingBox!.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld)));
      });
      const restPos = g.position.clone();
      restPos.y = s.restY;
      // the box is in the group's unscaled frame; bodies live in world units
      this.bodies.push({
        mass: s.mass, group: g,
        offset: box.getCenter(new THREE.Vector3()).multiply(g.scale),
        half: box.getSize(new THREE.Vector3()).multiplyScalar(0.5).multiply(g.scale),
        restPos, restQuat: g.quaternion.clone(), restRot: g.rotation.clone(),
      });
    }
  }

  /**
   * The physics, loaded the first time the room is shaken — nobody who
   * never shakes it downloads the engine.
   */
  private ensurePhysics() {
    if (this.physics) return Promise.resolve();
    this.physicsLoading ??= import("cannon-es").then((C) => {
      if (this.disposed) return;
      this.C = C;
      // the original's tuning: floaty gravity, low friction, little bounce
      const w = new C.World({ gravity: new C.Vec3(0, -6, 0) });
      w.broadphase = new C.SAPBroadphase(w);
      (w.solver as CANNON.GSSolver).iterations = 20;
      w.allowSleep = true;
      w.defaultContactMaterial.friction = 0.1;
      w.defaultContactMaterial.restitution = 0.1;

      // the room is ONE static body that tilts with the visible room
      const room = new C.Body({ mass: 0 });
      const slab = (hx: number, hy: number, hz: number, x: number, y: number, z: number) =>
        room.addShape(new C.Box(new C.Vec3(hx, hy, hz)), new C.Vec3(x, y, z));
      const HX = ROOM.w / 2, HZ = ROOM.d / 2, H = ROOM.h;
      slab(HX + 1, 0.5, HZ + 1, 0, -0.5, 0);                          // floor
      slab(HX + 1, 0.5, HZ + 1, 0, H + 0.5, 0);                        // ceiling
      slab(0.5, H / 2 + 0.5, HZ + 1, -HX - 0.5, H / 2, 0);             // left
      slab(0.5, H / 2 + 0.5, HZ + 1, HX + 0.5, H / 2, 0);              // right
      slab(HX + 1, H / 2 + 0.5, 0.5, 0, H / 2, -HZ - 0.5);             // back
      slab(HX + 1, H / 2 + 0.5, 0.5, 0, H / 2, HZ + 0.5);              // an invisible front stop
      const p = ROOM.plinth;
      slab(ROOM.w / 2, p.h / 2, p.d / 2, 0, p.h / 2, -HZ + p.d / 2);   // the plinth
      w.addBody(room);
      this.roomBody = room;

      for (const b of this.bodies) {
        b.body = new C.Body({
          mass: b.mass,
          shape: new C.Box(new C.Vec3(Math.max(b.half.x, 0.01), Math.max(b.half.y, 0.01), Math.max(b.half.z, 0.01))),
          sleepSpeedLimit: 0.15,
          sleepTimeLimit: 0.6,
          linearDamping: 0.05,
          angularDamping: 0.12,
        });
        this.placeBody(b);
        w.addBody(b.body);
      }
      this.physics = w;
    }).catch((error) => {
      this.physicsLoading = undefined;
      throw error;
    });
    return this.physicsLoading;
  }

  /** put a body where its object is (the collider centre is offset) */
  private placeBody(b: Body) {
    if (!b.body) return;
    const g = b.group;
    tmpV.copy(b.offset).applyQuaternion(g.quaternion);
    b.body.position.set(g.position.x + tmpV.x, g.position.y + tmpV.y, g.position.z + tmpV.z);
    b.body.quaternion.set(g.quaternion.x, g.quaternion.y, g.quaternion.z, g.quaternion.w);
    b.body.velocity.setZero();
    b.body.angularVelocity.setZero();
    b.body.previousPosition.copy(b.body.position);
    b.body.interpolatedPosition.copy(b.body.position);
    b.body.previousQuaternion.copy(b.body.quaternion);
    b.body.interpolatedQuaternion.copy(b.body.quaternion);
    b.body.aabbNeedsUpdate = true;
    b.body.updateInertiaWorld(true);
  }

  private stepPhysics(dt: number, now: number) {
    const d = this.drag, w = this.physics!, room = this.roomBody!;
    const f = dt / 16.667;
    const k = 1 - Math.pow(0.9, f);
    d.rx += (d.tx - d.rx) * k;
    d.ry += (d.ty - d.ry) * k;
    if (!d.active) {
      const decay = Math.pow(0.95, f);
      d.tx *= decay; d.ty *= decay;
    }
    this.world.rotation.set(d.rx, 0, d.ry);
    room.quaternion.setFromEuler(d.rx, 0, d.ry);
    room.aabbNeedsUpdate = true;
    // a static body that moves does not wake what rests on it: while the
    // room is still easing level, keep everything awake, or a pot that fell
    // asleep against a tilted wall stays stuck in the air
    if (Math.abs(d.tx - d.rx) + Math.abs(d.ty - d.ry) > 1e-4 || Math.abs(d.rx) + Math.abs(d.ry) > 2e-3)
      for (const b of this.bodies) b.body?.wakeUp();
    w.step(1 / 60, dt / 1000, 3);
    for (const b of this.bodies) {
      if (!b.body) continue;
      const q = b.body.interpolatedQuaternion, p = b.body.interpolatedPosition;
      b.group.quaternion.set(q.x, q.y, q.z, q.w);
      tmpV.copy(b.offset).applyQuaternion(b.group.quaternion);
      b.group.position.set(p.x - tmpV.x, p.y - tmpV.y, p.z - tmpV.z);
    }
    // leaving rearrange: let everything come to rest on a level floor
    if (!this.rearranged) {
      const level = Math.abs(d.rx) + Math.abs(d.ry) < 2e-3;
      const asleep = this.bodies.every((b) => !b.body || b.body.sleepState === this.C!.Body.SLEEPING);
      if ((level && asleep) || now > this.settleUntil) {
        d.rx = d.ry = d.tx = d.ty = 0;
        this.world.rotation.set(0, 0, 0);
        room.quaternion.set(0, 0, 0, 1);
        room.aabbNeedsUpdate = true;
        this.physicsOn = false;
        this.shadowsUntil = now + 50;
      }
    }
  }

  /* ======================================================================
     public API — the page script and the 3D code evolve separately
     ====================================================================== */

  /**
   * The room is shown and the camera moves in on one painting. Objects come
   * down into the room as the panel lifts — "They come to me … then sit
   * quietly". The original drops its furniture with bounce.out from two
   * metres; so does this.
   */
  playIntro() {
    if (this.introPlayed || !this.ready) return;
    this.introPlayed = true;
    const reduce = this.opts.reducedMotion;
    if (!reduce) {
      let seed = 5;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
      const tl = gsap.timeline({ onUpdate: () => this.invalidate(true), onComplete: () => this.settle() });
      this.bodies.forEach((b, i) => {
        const g = b.group, at = 0.2 + i * 0.07;
        tl.fromTo(g.position, { y: b.restPos.y + 2 }, { y: b.restPos.y, duration: 1.2, ease: "bounce.out" }, at);
        tl.fromTo(g.rotation,
          { x: b.restRot.x + rnd() * 0.5, z: b.restRot.z + rnd() * 0.5 },
          { x: b.restRot.x, z: b.restRot.z, duration: 1.2, ease: "power2.out" }, at);
      });
      this.dropTl = tl;
      const ms = tl.duration() * 1000 + 120;
      this.keepAlive(ms, true);
    }
    this.rig.playIntro(START, () => this.opts.onIntroFinished(), reduce ? 0 : 1.15);
  }

  /** where Twenty Paise is on screen before the camera moves — the
   *  preloader puts its photograph exactly there */
  heroRect() {
    const hero = this.art.find((m) => m.userData.artId === HERO.id);
    if (!hero || !this.renderer) return null;
    this.rig.pivot.updateMatrixWorld(true);
    hero.updateMatrixWorld(true);
    const p = hero.geometry.getAttribute("position");
    const r = this.canvas.getBoundingClientRect();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < p.count; i++) {
      tmpV.fromBufferAttribute(p, i).applyMatrix4(hero.matrixWorld).project(this.rig.camera);
      const x = r.left + (tmpV.x * 0.5 + 0.5) * r.width;
      const y = r.top + (-tmpV.y * 0.5 + 0.5) * r.height;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
  }

  scroll(p: number) { this.rig?.scroll(p); }
  syncScroll(p: number) { this.rig?.syncScroll(p); this.wake = 2; }

  /** stop drawing while an opaque section covers the room */
  setVisible(v: boolean) {
    if (v === this.visible) return;
    this.visible = v;
    if (v) this.wake = 2;
  }

  setMode(mode: "light" | "dark", instant = false) {
    if (this.disposed || !this.renderer || !this.sun || (mode === this.mode && !instant)) return;
    this.mode = mode;
    const V = this.variant, dark = mode === "dark", r = this.renderer;
    this.modeTl?.kill();
    const dur = instant || this.opts.reducedMotion ? 0 : 0.9;
    const tl = gsap.timeline({ defaults: { duration: dur, ease: "power2.inOut" },
      onUpdate: () => this.invalidate(), onComplete: () => this.invalidate() });
    const sunColor = new THREE.Color(dark ? NIGHT.sun.color : V.sun.color);
    const clear = r.getClearColor(new THREE.Color());
    const clearTo = new THREE.Color(dark ? NIGHT.clear : V.clear);
    const mixed = new THREE.Color();
    const prox = { k: 0 };
    tl.to(this.sun, { intensity: dark ? NIGHT.sun.intensity : V.sun.intensity }, 0)
      .to(this.sun.color, { r: sunColor.r, g: sunColor.g, b: sunColor.b }, 0)
      .to(this.door, { intensity: dark ? NIGHT.door : V.door.intensity }, 0)
      .to(this.front, { intensity: dark ? NIGHT.front : V.front.intensity }, 0)
      .to(this.ambient, { intensity: dark ? NIGHT.ambient : V.ambient.intensity }, 0)
      .to(this.hemi, { intensity: dark ? NIGHT.hemi : V.hemi.intensity }, 0)

      .to(r, { toneMappingExposure: dark ? NIGHT.exposure : V.exposure }, 0)
      .to((this.shaft.material as THREE.ShaderMaterial).uniforms.uOpacity, { value: dark ? NIGHT.haze : V.haze }, 0)
      .to(this.diya, { intensity: dark ? NIGHT.diya : 0, duration: dur * 1.2 }, dark ? dur * 0.25 : 0)
      .to(this.glow.material as THREE.SpriteMaterial, { opacity: dark ? 0.95 : 0.3 }, dark ? dur * 0.2 : 0)
      .to(prox, { k: 1, onUpdate: () => r.setClearColor(mixed.copy(clear).lerp(clearTo, prox.k), 1) }, 0);
    for (const mat of this.envMaterials())
      tl.to(mat, { envMapIntensity: mat.userData.envFactor * (dark ? NIGHT.env : V.env) }, 0);
    const u = (this.sky.material as THREE.ShaderMaterial).uniforms;
    const sky = dark
      ? { t: 0x0b1018, h: 0x1a1612, b: 0x0d0b09 }
      : { t: 0xcad8e4, h: 0xf6ead8, b: 0xe7d9c4 };
    for (const [k, hex] of [["uTop", sky.t], ["uHorizon", sky.h], ["uBottom", sky.b]] as const) {
      const c = new THREE.Color(hex);
      tl.to(u[k].value, { r: c.r, g: c.g, b: c.b }, 0);
    }
    if (dur === 0) tl.progress(1);
    this.modeTl = tl;
    this.keepAlive(dur * 1300 + 50);
  }

  setState(state: "presentation" | "rearrange") {
    if (!this.rig?.isEnabled || !this.ready) return;
    const on = state === "rearrange";
    if (on === this.rearranged) return;
    this.rearranged = on;
    this.rig.setMess(on);
    this.keepAlive(1000);
    if (on) {
      this.resetTl?.kill();
      this.ensurePhysics().then(() => {
        if (this.disposed || !this.rearranged || this.resetTl?.isActive()) return;
        this.bodies.forEach((b) => { this.placeBody(b); b.body?.wakeUp(); });
        this.physicsOn = true;
      }).catch((error) => {
        if (!this.disposed) this.opts.onRearrangeError?.(error);
      });
    } else {
      this.drag.active = false;
      this.drag.tx = this.drag.ty = 0;
      this.settleUntil = performance.now() + 4000;
      this.bodies.forEach((b) => b.body?.wakeUp());
    }
  }

  /** everything hops back to where it stood, as in the original */
  reset() {
    if (!this.ready) return;
    this.physicsOn = false;
    this.drag.tx = this.drag.ty = this.drag.rx = this.drag.ry = 0;
    this.world.rotation.set(0, 0, 0);
    this.roomBody?.quaternion.set(0, 0, 0, 1);
    if (this.roomBody) this.roomBody.aabbNeedsUpdate = true;
    this.resetTl?.kill();
    const tl = gsap.timeline({ onUpdate: () => this.invalidate(true), onComplete: () => {
      this.invalidate(true);
      this.bodies.forEach((b) => this.placeBody(b));
      // still shaking: hand the objects back to the physics where they landed
      if (this.rearranged && this.physics) { this.bodies.forEach((b) => b.body?.wakeUp()); this.physicsOn = true; }
    } });
    this.bodies.forEach((b, i) => {
      const g = b.group, at = i * 0.035;
      const from = g.quaternion.clone();
      const q = { t: 0 };
      tl.to(g.position, { x: b.restPos.x, z: b.restPos.z, duration: 0.95, ease: "power2.inOut" }, at)
        .to(g.position, { y: Math.max(g.position.y, b.restPos.y) + 0.55, duration: 0.35, ease: "power2.out" }, at)
        .to(g.position, { y: b.restPos.y, duration: 0.6, ease: "bounce.out" }, at + 0.35)
        .to(q, { t: 1, duration: 0.95, ease: "power2.inOut",
                 onUpdate: () => { g.quaternion.slerpQuaternions(from, b.restQuat, q.t); } }, at);
    });
    this.resetTl = tl;
    if (this.opts.reducedMotion) tl.progress(1);
    this.invalidate(true);
    this.keepAlive(tl.duration() * 1000 + 100, true);
  }

  /** put every object down, whatever state an interrupted tween left */
  private settle() {
    this.dropTl?.progress(1);
    for (const b of this.bodies) {
      b.group.position.copy(b.restPos);
      b.group.quaternion.copy(b.restQuat);
      this.placeBody(b);
    }
    this.shadowsUntil = performance.now() + 50;
    this.wake = 2;
  }

  /** something visible changed: draw the next two frames (and shadows) */
  private invalidate(shadows = false) {
    this.wake = Math.max(this.wake, 2);
    if (shadows && this.renderer) this.renderer.shadowMap.needsUpdate = true;
  }

  /** render every frame for `ms`; with `shadows`, re-render shadow maps too */
  private keepAlive(ms: number, shadows = false) {
    const t = performance.now() + ms;
    this.aliveUntil = Math.max(this.aliveUntil, t);
    if (shadows) this.shadowsUntil = Math.max(this.shadowsUntil, t);
  }

  /* --- input ---------------------------------------------------------------- */

  private toNDC(e: PointerEvent | MouseEvent) {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    return this.ndc;
  }

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== "touch") {
      const n = this.toNDC(e);
      this.rig.pointer(n.x, n.y);
      this.hoverDirty = true;
    }
    const d = this.drag;
    if (!d.active || e.pointerId !== d.id || !this.rearranged) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    d.tx = THREE.MathUtils.clamp(d.sx + THREE.MathUtils.clamp(dy / 100, -1, 1) * 0.5, -0.5, 0.5);
    d.ty = THREE.MathUtils.clamp(d.sy - THREE.MathUtils.clamp(dx / 100, -1, 1) * 0.3, -0.3, 0.3);
    this.bodies.forEach((b) => b.body?.wakeUp());
  };

  private onPointerDown = (e: PointerEvent) => {
    if (!this.rearranged || this.drag.active || e.button !== 0) return;
    const d = this.drag;
    d.active = true; d.id = e.pointerId;
    d.x0 = e.clientX; d.y0 = e.clientY; d.sx = d.tx; d.sy = d.ty;
    try { this.canvas.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
  };

  private onPointerUp = (e: Event) => {
    const d = this.drag;
    if (!d.active) return;
    d.active = false;
    const id = (e as PointerEvent).pointerId;
    try { if (id !== undefined && this.canvas.hasPointerCapture(id)) this.canvas.releasePointerCapture(id); } catch { /* gone */ }
  };

  private onPointerLeave = () => {
    this.rig.dropPointer();
    if (this.hoverId) { this.hoverId = null; this.canvas.style.cursor = ""; }
  };

  private onTouch = () => { this.rig.touched(); };

  private pick(e: PointerEvent | MouseEvent) {
    this.ray.setFromCamera(this.toNDC(e), this.rig.camera);
    const hit = this.ray.intersectObjects(this.art, false)[0];
    return hit ? (hit.object.userData.artId as string) : null;
  }

  private lastPointer?: PointerEvent;
  private onClick = (e: MouseEvent) => {
    if (!this.rig.isEnabled || this.rearranged) return;
    const id = this.pick(e);
    if (id) this.opts.onArtwork(id);
  };

  private updateHover() {
    this.hoverDirty = false;
    if (!this.rig.isEnabled || this.rearranged) return;
    // hover is resolved from the last known pointer position in NDC
    this.ray.setFromCamera(this.ndc, this.rig.camera);
    const hit = this.ray.intersectObjects(this.art, false)[0];
    const id = hit ? (hit.object.userData.artId as string) : null;
    if (id !== this.hoverId) {
      this.hoverId = id;
      this.canvas.style.cursor = id ? "pointer" : this.rearranged ? "grab" : "";
    }
  }

  private onVisibility = () => {
    if (!document.hidden) { this.wake = 2; this.last = 0; }
  };

  private resize = () => {
    if (!this.renderer || !this.composer) return;
    const w = this.canvas.clientWidth || innerWidth;
    const h = this.canvas.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    const aspect = w / Math.max(1, h);
    this.rig.setAspect(aspect);
    if (isNarrow(aspect) !== this.narrow) {
      this.narrow = !this.narrow;
      this.rig.setShots(resolvePoses(this.anchors, this.narrow));
    }
    this.wake = 2;
  };

  /* ======================================================================
     the frame — called once per tick by the page's single loop
     ====================================================================== */

  renderFrame(now: number) {
    if (!this.ready || this.disposed || !this.composer || !this.renderer) return;
    const dt = this.last ? Math.min(50, Math.max(0, now - this.last)) : 16.667;
    this.last = now;

    let draw = this.rig.update(dt);
    if (this.physicsOn) {
      const d = this.drag;
      const tilting = d.active || Math.abs(d.tx) + Math.abs(d.ty) + Math.abs(d.rx) + Math.abs(d.ry) > 1e-4;
      const awake = this.bodies.some((b) => b.body && b.body.sleepState !== this.C!.Body.SLEEPING);
      if (tilting || awake || !this.rearranged) {
        this.stepPhysics(dt, now);
        draw = true;
        this.renderer.shadowMap.needsUpdate = true;
      }
    }
    if (now < this.shadowsUntil) this.renderer.shadowMap.needsUpdate = true;
    if (now < this.aliveUntil) draw = true;
    if (this.wake > 0) { draw = true; this.wake--; }
    if (this.hoverDirty) this.updateHover();
    // in the dark the flame is all the room has, so it lives — at 24 Hz,
    // a flame's own rate, not the display's; by day it is a still point
    if (this.mode === "dark" && this.visible && !this.opts.reducedMotion && now - this.lastFlame >= 1000 / 24) {
      this.lastFlame = now;
      const t = now / 1000;
      const f = 1 + 0.07 * Math.sin(t * 13.1) + 0.05 * Math.sin(t * 7.3 + 1.7) + 0.03 * Math.sin(t * 23.9 + 0.4);
      this.flame.scale.set(0.75 / Math.sqrt(f), 1.9 * f, 0.75 / Math.sqrt(f));
      if (!this.modeTl?.isActive()) this.diya.intensity = NIGHT.diya * (0.9 + 0.1 * f);
      draw = true;
    }
    if (!draw || !this.visible) return;

    // the ceiling lifts away when the camera rises through it for the plan
    this.rig.camera.getWorldPosition(tmpV);
    const ceilingOn = tmpV.y < ROOM.h - 0.03;
    if (this.ceiling.visible !== ceilingOn) {
      this.ceiling.visible = ceilingOn;
      this.renderer.shadowMap.needsUpdate = true;   // the roof casts too
    }
    this.composer.render(dt / 1000);
  }

  get introDone() { return this.rig?.isEnabled ?? false; }

  /* --- teardown --------------------------------------------------------------- */

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.ready = false;
    this.abort.abort();
    this.modeTl?.kill();
    this.dropTl?.kill();
    this.resetTl?.kill();
    this.rig?.dispose();

    const c = this.canvas;
    if (c) {
      c.removeEventListener("pointermove", this.onPointerMove);
      c.removeEventListener("pointerdown", this.onPointerDown);
      c.removeEventListener("pointerup", this.onPointerUp);
      c.removeEventListener("pointercancel", this.onPointerUp);
      c.removeEventListener("lostpointercapture", this.onPointerUp);
      c.removeEventListener("pointerleave", this.onPointerLeave);
      c.removeEventListener("touchstart", this.onTouch);
      c.removeEventListener("click", this.onClick);
    }
    removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    // three is still polling shader programs: free GPU resources after
    if (this.compiling) return;
    this.release();
  }

  /** free every GPU resource — once, and never while programs compile */
  private release() {
    if (this.released) return;
    this.released = true;

    const seen = new Set<object>();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry && !seen.has(m.geometry)) { seen.add(m.geometry); m.geometry.dispose(); }
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      for (const mat of mats) {
        if (seen.has(mat)) continue;
        seen.add(mat);
        const map = (mat as THREE.MeshStandardMaterial).map;
        if (map && this.art.some((a) => a.material === mat)) map.dispose();
        mat.dispose();
      }
      const light = o as THREE.DirectionalLight;
      if (light.isLight && light.shadow?.map) light.shadow.map.dispose();
    });
    this.owned.forEach((x) => x.dispose());
    this.composer?.passes.forEach((p) => (p as { dispose?: () => void }).dispose?.());
    this.composer?.dispose();
    this.renderer?.dispose();
    const g = window as unknown as { __room?: Room };
    if (g.__room === this) delete g.__room;
  }
}
