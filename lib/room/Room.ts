import * as THREE from "three";
import gsap from "gsap";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import type * as CANNON from "cannon-es";

import { buildLibrary, textureList, type Library } from "./materials";
import { Rig } from "./rig";
import type { Dolly } from "./dolly";
import { loadHouse, loadHouseInfo, assemble, BakedLight, ROOF, type HouseInfo, type HouseParts } from "./house";
import { paintMaterial, flatRelief, galleryLight } from "./paint";
import { ReliefBuilder } from "./relief-builder";
import { activeVariant, NIGHT } from "./variants";
import { CHAPTERS, resolveWalk, isNarrow, startPose, messPose, duskAt, HERO_ID } from "../chapters";

export type RoomOpts = {
  manifestUrl: string;
  reducedMotion: boolean;
  /** 0…1, one step per asset */
  onProgress(p: number): void;
  onIntroFinished(): void;
  onArtwork(id: string): void;
  /** the painting under the pointer, or null — for the cursor's word */
  onHoverArt?(id: string | null): void;
  /** the physics engine failed to load: leave rearrange */
  onRearrangeError?(error: unknown): void;
};

type Tier = { small: boolean; dpr: number; msaa: number; ao: boolean; shadow: number; phone: boolean };

/** one quality decision, made once: weak machines get 1k textures, the 2k
 *  lightmaps, no AO and a low pixel ratio; phones the full set, sharp, without
 *  AO; everything else the full set with AO */
function pickTier(): Tier {
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const phone = innerWidth < 820 || matchMedia("(pointer: coarse)").matches;
  // only a genuinely weak machine gets the light set: a modern phone renders the house
  // sharp (iOS reports few cores and no memory, so those cannot mark it weak)
  const small = mem <= 2 || cores <= 2;
  // colour targets are HalfFloat and there are two of them: 4× MSAA at
  // DPR 1.5 alone is ~220 MB. Two samples look the same here at half that.
  return {
    small,
    phone,
    // a phone's screen is small and close: it needs its own pixels (the frames' thin
    // lines stair-step at 1.25×) and real antialiasing; it skips the screen-space AO
    dpr: Math.min(devicePixelRatio || 1, small ? 1.25 : phone ? 2 : 1.5),
    msaa: small ? 0 : phone ? 4 : 2,
    ao: !small && !phone,
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
  refreshExclusions() { this.excluded = undefined; }
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
const tmpR = new THREE.Vector3(), tmpU = new THREE.Vector3();
const tmpC = new THREE.Color();
/** the lamp's wicks, round the rim of its cup (scripts/house/build.py deepa) */
const DEEPA_WICK = 0.14;
/** a canvas's frame beyond its edge: the lip and the shadow gap (build.py float_frame) */
const FRAME = 0.025;
/** each wall's outward normal on the floor plane, three's (x, z) */
const SIDE_OUT: Record<string, [number, number]> = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };
// Reuse the welcome's full-resolution photo instead of downloading it twice.
const artworkTextureURL = (id: string) => id === HERO_ID ? `/art/large/${id}.jpg` : `/art/room/${id}.jpg`;


export class Room {
  rig!: Rig;
  private renderer?: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private composer?: EffectComposer;
  private ao?: RoomAO;
  /** the house's baked light: afternoon and evening (scripts/house) */
  private baked?: BakedLight;
  private bakeTw?: gsap.core.Tween;
  /** the evening, 0…1: all of it in dark mode; by day, as much as the walk
   *  has reached (each chapter's dusk). `v` is what is applied. */
  private eve = { mode: 0, walk: 0, v: -1 };
  /** how lit the lamps are, from the evening */
  private lampK = 0;
  private envMats?: THREE.MeshStandardMaterial[];
  /** afternoon → evening, for each colour the evening moves */
  private evePal?: Record<"sun" | "clear" | "top" | "horizon" | "bottom", [THREE.Color, THREE.Color]>;
  private canvas!: HTMLCanvasElement;
  private opts!: RoomOpts;
  private variant = activeVariant();
  private tier!: Tier;
  private lib?: Library;
  private owned: { dispose(): void }[] = [];

  /** everything static — it tilts as one in rearrange */
  private world = new THREE.Group();
  private ceiling = new THREE.Group();
  private info!: HouseInfo;
  private parts!: HouseParts;
  private dolly?: Dolly;

  private sun!: THREE.DirectionalLight;
  private hemi!: THREE.HemisphereLight;
  private ambient!: THREE.AmbientLight;
  private diya!: THREE.PointLight;
  private flame!: THREE.Mesh;
  private glow!: THREE.Sprite;
  /** the lamp by the arch: five wicks round its cup */
  private deepa?: { light: THREE.PointLight; flames: THREE.Mesh[]; glow: THREE.Sprite };
  private sky!: THREE.Mesh;

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
  private artQueue: THREE.Mesh[] = [];
  private artLoads = 0;
  private artPriority = -1;
  private reliefBuilder = new ReliefBuilder();
  /** One texture upload at rest; background work must not interrupt a glide. */
  private textureUploads: (() => void)[] = [];
  private viewRevision = 0;
  private viewport = { left: 0, top: 0, width: 0, height: 0 };
  private narrow = false;
  private renderSize = { w: 0, h: 0 };
  private resizeTimer = 0;
  private lastFlame = -Infinity;

  private abort = new AbortController();
  private disposed = false;
  private compiling?: Promise<unknown>;
  private released = false;
  private ready = false;
  private visible = true;
  private last = 0;
  private wake = 0;
  /** readings asked of the next frame drawn, each under its own name: how light it is behind a part of the screen */
  private lumaAsks = new Map<string, { rect: { x0: number; y0: number; x1: number; y1: number }; cb: (luma: number) => void }>();
  private readbackPending = false;
  private readbackPixels = new Uint8Array(0);
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

    /* every asset is counted, so the counter means something: the house
       (its plan, its model, two lightmaps), the room's surfaces, the paintings */
    const texList = textureList(this.tier.small);
    let total = 4 + texList.length + 12;
    let done = 0;
    const tick = () => { if (!this.disposed) opts.onProgress(Math.min(1, ++done / total)); };

    const texP = Promise.all(texList.map((t) =>
      this.loadTexture(t.url).then((tex) => { tick(); return [`${t.set}:${t.kind}`, tex] as const; })));
    const infoP = loadHouseInfo(this.abort.signal, tick);
    const houseP = loadHouse(this.tier.small, this.abort.signal, (u) => this.loadTexture(u), tick, infoP);
    // the works near the door load with the house; the gallery's after it has opened (lateArt)
    const artP = infoP.then((info) => {
      const ids = Object.keys(info.art).filter((id) => !info.art[id].late);
      total = 4 + texList.length + ids.length;
      return Promise.all(ids.map((id) =>
        this.loadTexture(artworkTextureURL(id)).then((tex) => { tick(); return [id, tex] as const; })));
    });
    // Photos, surfaces and geometry download together; none waits for GLB decode.
    const [house, texPairs, artPairs] = await Promise.all([houseP, texP, artP]);
    if (this.disposed) {
      texPairs.forEach(([, t]) => t.dispose());
      artPairs.forEach(([, t]) => t.dispose());
      house.lmDay.dispose(); house.lmNight?.dispose();
      return;
    }
    this.info = house.info;

    const aspect = (canvas.clientWidth || innerWidth) / Math.max(1, canvas.clientHeight || innerHeight);
    this.narrow = isNarrow(aspect);
    const walk = resolveWalk(this.info, this.narrow, aspect);
    this.rig = new Rig(walk.shots, startPose(this.info, this.narrow), messPose(this.info), aspect, opts.reducedMotion, walk.vias);
    this.scene.add(this.rig.pivot, this.world);

    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const lib = buildLibrary(new Map(texPairs), V, anisotropy, ROOF);
    this.lib = lib;
    this.owned.push(lib);

    // the house: architecture in its photographed materials, under its baked light
    this.baked = new BakedLight(house);
    this.owned.push(house.lmDay);
    if (house.lmNight) this.owned.push(house.lmNight);
    const edge = new THREE.MeshStandardMaterial({ color: 0x9e958a, roughness: 0.95 });
    this.owned.push(edge);
    this.parts = assemble(house, lib, this.baked, edge);
    for (const m of this.parts.ceilings) this.ceiling.add(m);
    for (const r of this.parts.roofs) this.ceiling.add(r);
    this.world.add(house.scene, this.ceiling);
    // the things that tumble live in the scene, not in the house that tilts under them
    house.scene.updateMatrixWorld(true);
    for (const pr of this.parts.props) this.scene.attach(pr.group);
    // the paintings
    const textures = new Map(artPairs);
    const flat = flatRelief();
    this.owned.push(flat);
    // a canvas waiting for its photograph: a warm ground, the same program as the painting
    const ground = new THREE.DataTexture(new Uint8Array([214, 202, 184, 255]), 1, 1);
    ground.colorSpace = THREE.SRGBColorSpace;
    ground.needsUpdate = true;
    this.owned.push(ground);
    for (const [id, mesh] of this.parts.art) {
      // a study (the canvas on her easel) is painted like the rest, but it is not a work to open
      const pickable = !this.info.art[id]?.study;
      if (this.info.art[id]?.late) {
        mesh.material = paintMaterial(ground, this.baked, galleryLight(this.info.art[id]), flat, this.info.art[id]?.lk);
        if (pickable) this.art.push(mesh);
        continue;
      }
      const tex = textures.get(id);
      if (!tex) throw new Error(`missing artwork ${id}`);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = anisotropy;
      tex.flipY = false;
      tex.needsUpdate = true;
      // paint, not a print: the varnish under its gallery light now, the brushwork's
      // relief read once the room is open (reliefs())
      mesh.material = paintMaterial(tex, this.baked, galleryLight(this.info.art[id]), flat, this.info.art[id]?.lk);
      if (pickable) this.art.push(mesh);
    }

    // development: ?bake=0 shows the live light for comparison
    if (process.env.NODE_ENV !== "production" && new URLSearchParams(location.search).get("bake") === "0") this.baked.bake.value = 0;

    this.buildSky();
    this.buildLights();
    this.buildItems();
    this.buildFrieze();
    this.buildPost();
    this.resize();
    this.syncBakeAO();
    await this.captureEnvironment();
    if (this.disposed) { this.release(); return; }
    this.applyEve();
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
    this.compiling = this.warm(this.composer!.readBuffer);
    try { await this.compiling; } finally { this.compiling = undefined; }
    if (this.disposed) { this.release(); return; }
    renderer.shadowMap.needsUpdate = true;
    this.composer!.render();
    this.ready = true;
    this.wake = 2;
    this.reliefs();
    this.lateArt();
    // Prepare her head while the welcome still covers the room, so its first
    // decode, sort and shader upload do not land on the visitor's first scroll.
    void this.lateFigure();
    if (process.env.NODE_ENV !== "production") (window as unknown as { __room?: Room }).__room = this;
  }

  /** Fit her real head after loading; the painting body and brush stay visible. */
  private async lateFigure() {
    try {
      const { Dolly } = await import("./dolly");
      if (this.disposed) return;
      const dolly = this.dolly = new Dolly(this.baked!.night, this.tier.dpr, () => this.invalidate());
      await dolly.load();
      if (this.disposed) { dolly.dispose(); return; }
      this.world.add(dolly.object);
      this.parts.figureHeads.forEach(head => { head.visible = false; });
      dolly.show(true);
      this.ao?.refreshExclusions();
      this.invalidate();
    } catch {
      this.dolly?.dispose();
      this.dolly = undefined;
      this.parts.figureHeads.forEach(head => { head.visible = true; });
    }
  }

  /** Keep three requests in flight, replacing each as it finishes. */
  private lateArt() {
    this.artQueue = this.art.filter((m) => this.info.art[m.userData.artId]?.late);
    this.pumpArt();
  }

  private pumpArt() {
    if (this.disposed) return;
    while (this.artLoads < 3 && this.artQueue.length) {
      const mesh = this.artQueue.shift()!;
      this.artLoads++;
      void this.loadTexture(artworkTextureURL(mesh.userData.artId)).then((tex) => {
        if (this.disposed) { tex.dispose(); return; }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(8, this.renderer!.capabilities.getMaxAnisotropy());
        tex.flipY = false;
        tex.needsUpdate = true;
        this.owned.push(tex);
        (mesh.material as THREE.MeshStandardMaterial).map = tex;
        this.textureUploads.push(() => this.renderer?.initTexture(tex));
        this.invalidate();
        void this.addRelief(mesh, 384);
      }).catch(() => { /* the warm ground stays */ }).finally(() => {
        this.artLoads--;
        this.pumpArt();
      });
    }
  }

  /** Menu jumps prioritize that wall and its neighbors before the camera arrives. */
  prepareChapter(index: number) {
    if (index === this.artPriority) return;
    this.artPriority = index;
    const wanted = [index, index + 1, index - 1, index + 2].flatMap((i) => CHAPTERS[i]?.labels ?? []);
    const rank = (mesh: THREE.Mesh) => {
      const at = wanted.indexOf(mesh.userData.artId);
      return at < 0 ? wanted.length : at;
    };
    this.artQueue.sort((a, b) => rank(a) - rank(b));
  }

  private async addRelief(mesh: THREE.Mesh, longest: number) {
    const material = mesh.material as THREE.MeshStandardMaterial;
    const image = material.map?.image as HTMLImageElement | undefined;
    if (!image?.width || this.disposed) return;
    try {
      const relief = await this.reliefBuilder.build(image, longest);
      if (this.disposed) { relief.dispose(); return; }
      this.owned.push(relief);
      this.textureUploads.push(() => {
        this.renderer?.initTexture(relief);
        material.normalMap = relief;
      });
      this.invalidate();
    } catch { /* a flat normal retains the painting if background work is cancelled */ }
  }

  /** each canvas's relief, read from its photograph one at a time in idle moments, off the load path */
  private reliefs() {
    const queue = this.art.filter((m) => !this.info.art[m.userData.artId]?.late);
    const idle = (fn: () => void) =>
      "requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 600 }) : setTimeout(fn, 40);
    const next = () => {
      if (this.disposed) return;
      const mesh = queue.shift();
      if (!mesh) return;
      void this.addRelief(mesh, this.tier.small ? 512 : 768).then(() => idle(next));
    };
    idle(next);
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

  /* --- light ------------------------------------------------------------ */

  private buildLights() {
    const V = this.variant;
    const sz = this.tier.shadow;

    /* the afternoon sun, from the west-south-west, where Blender put it. Its
       diffuse light is in the bake; live, it lights the things that move,
       glints on the brass, and stands in whenever the bake steps aside. */
    const to = new THREE.Vector3(...this.info.sun.toSun).normalize();
    const centre = new THREE.Vector3(0.6, 1.2, -0.6);
    this.sun = new THREE.DirectionalLight(V.sun.color, V.sun.intensity);
    this.sun.position.copy(centre).addScaledVector(to, 22);
    this.sun.target.position.copy(centre);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(sz, sz);
    this.sun.shadow.radius = 2.5;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.03;
    Object.assign(this.sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 4, far: 44 });
    this.scene.add(this.sun, this.sun.target);

    this.hemi = new THREE.HemisphereLight(V.hemi.sky, V.hemi.ground, V.hemi.intensity);
    this.ambient = new THREE.AmbientLight(V.ambient.color, V.ambient.intensity);
    this.scene.add(this.hemi, this.ambient);

    // the diya — in Vakratunda and The Aarti the flame is the only light
    // source and the only broken-out colour. It is the dark mode.
    // here the diya burns at the top of the brass lamp in the Quiet Room
    const a = new THREE.Vector3(...(this.info.anchors.diya ?? [-5.1, 1.04, -5.45]));
    this.diya = new THREE.PointLight(0xffa04a, 0, 9, 2);
    this.diya.position.set(a.x, a.y + 0.07, a.z);
    this.world.add(this.diya);

    this.flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.011, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffd08a, transparent: true, opacity: 0.9, toneMapped: false })
    );
    this.flame.scale.set(0.75, 1.9, 0.75);
    this.flame.position.set(a.x, a.y + 0.06, a.z);
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

    // the lamp at her openings, by the arch: a wick at each of five spouts
    const d = this.info.anchors.deepa;
    if (d) {
      const c = new THREE.Vector3(...d);
      const light = new THREE.PointLight(0xffa04a, 0, 4, 2);
      light.position.set(c.x, c.y + 0.06, c.z);
      const flames: THREE.Mesh[] = [];
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + 0.3;
        const f = new THREE.Mesh(this.flame.geometry, this.flame.material);
        f.scale.set(0.75, 1.9, 0.75);
        f.position.set(c.x + Math.cos(a) * DEEPA_WICK, c.y + 0.03, c.z + Math.sin(a) * DEEPA_WICK);
        f.userData.noAO = true;
        flames.push(f);
      }
      const glow = new THREE.Sprite(this.glow.material);
      glow.scale.setScalar(0.5);
      glow.position.set(c.x, c.y + 0.05, c.z);
      glow.userData.noAO = true;
      this.world.add(light, glow, ...flames);
      this.deepa = { light, flames, glow };
    }
  }

  /**
   * One evening for the whole house. Dark mode is all of it; by day the walk
   * brings some (the afternoon goes as you go in): the bake moves toward its
   * evening, the sun and sky go down, and the lamps come up a little behind.
   */
  private applyEve() {
    if (!this.sun || !this.renderer || !this.diya) return;
    const e = Math.max(this.eve.mode, this.eve.walk);
    if (e === this.eve.v) return;
    this.eve.v = e;
    const V = this.variant, r = this.renderer, L = THREE.MathUtils.lerp;
    const P = (this.evePal ??= {
      sun: [new THREE.Color(V.sun.color), new THREE.Color(NIGHT.sun.color)],
      clear: [new THREE.Color(V.clear), new THREE.Color(NIGHT.clear)],
      top: [new THREE.Color(0xcad8e4), new THREE.Color(0x0b1018)],
      horizon: [new THREE.Color(0xf6ead8), new THREE.Color(0x1a1612)],
      bottom: [new THREE.Color(0xe7d9c4), new THREE.Color(0x0d0b09)],
    });
    if (this.baked) this.baked.night.value = this.baked.nightMap.value ? e : 0;
    this.sun.intensity = L(V.sun.intensity, NIGHT.sun.intensity, e);
    this.sun.color.lerpColors(P.sun[0], P.sun[1], e);
    this.ambient.intensity = L(V.ambient.intensity, NIGHT.ambient, e);
    this.hemi.intensity = L(V.hemi.intensity, NIGHT.hemi, e);
    r.toneMappingExposure = L(V.exposure, NIGHT.exposure, e);
    r.setClearColor(tmpC.lerpColors(P.clear[0], P.clear[1], e), 1);
    this.lampK = THREE.MathUtils.smoothstep(e, 0.12, 0.85);
    this.diya.intensity = NIGHT.diya * this.lampK;
    (this.glow.material as THREE.SpriteMaterial).opacity = L(0.3, 0.95, this.lampK);
    if (this.deepa) this.deepa.light.intensity = NIGHT.deepa * this.lampK;
    this.envMats ??= this.envMaterials();
    for (const mat of this.envMats) mat.envMapIntensity = mat.userData.envFactor * L(V.env, NIGHT.env, e);
    const u = (this.sky.material as THREE.ShaderMaterial).uniforms;
    u.uTop.value.lerpColors(P.top[0], P.top[1], e);
    u.uHorizon.value.lerpColors(P.horizon[0], P.horizon[1], e);
    u.uBottom.value.lerpColors(P.bottom[0], P.bottom[1], e);
    this.invalidate();
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
   * The room's own light, captured once from its centre and given back to
   * it as image-based light: one bounce of the sun off the floor and the
   * plaster, and real reflections in the brass and aluminium.
   */
  private async captureEnvironment() {
    const r = this.renderer!;
    const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
    // every program first, in parallel and off the main thread, as the capture
    // (and the composer after it) will draw them: into a render target. Left
    // to the capture's six renders, they compile one by one and hold the page.
    this.compiling = this.warm(cubeRT);
    try { await this.compiling; } finally { this.compiling = undefined; }
    if (this.disposed) { cubeRT.dispose(); return; }
    const cam = new THREE.CubeCamera(0.05, 60, cubeRT);
    // the courtyard's afternoon, seen from its middle
    cam.position.set(3.6, 1.5, -3.0);
    this.scene.add(cam);
    const hide = [this.glow, this.flame, ...(this.deepa ? [this.deepa.glow, ...this.deepa.flames] : [])];
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

  /** compile the scene's programs in parallel for drawing into `target` */
  private warm(target: THREE.WebGLRenderTarget) {
    const r = this.renderer!;
    const was = r.getRenderTarget();
    r.setRenderTarget(target);
    const p = r.compileAsync(this.scene, this.rig.camera);
    r.setRenderTarget(was);
    return p;
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
  /* ---- the village-line frieze (BORDER_SPEC A): Kajal ink on the plaster above the paintings,
     drawn left to right once per room, the first time the walk arrives there ---- */
  private friezes: { key: string; reveal: { value: number } }[] = [];
  private friezeDrawn = new Set<string>();
  private buildFrieze() {
    const strips = this.info.frieze ?? [];
    if (!strips.length) return;
    const mask = new THREE.TextureLoader().load("/house/frieze.png");
    mask.colorSpace = THREE.SRGBColorSpace;
    mask.wrapS = THREE.RepeatWrapping;
    this.owned.push(mask);
    const REPEAT = 12;   // metres per repeat of the line
    const turn = { N: 0, S: Math.PI, E: -Math.PI / 2, W: Math.PI / 2 } as const;
    for (const f of strips) {
      const y0 = f.y0 ?? 2.7, y1 = f.y1 ?? 3.0, len = f.u1 - f.u0;
      const map = mask.clone();
      map.repeat.set(len / REPEAT, 1);
      map.needsUpdate = true;
      const reveal = { value: this.opts.reducedMotion ? 1 : 0 };
      const mat = new THREE.MeshBasicMaterial({ color: 0x211b18, map, transparent: true, depthWrite: false,
        opacity: this.narrow ? 0.8 : 0.55, polygonOffset: true, polygonOffsetFactor: -2, fog: false, toneMapped: false });
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uReveal = reveal;
        sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying float vStrip;")
          .replace("#include <uv_vertex>", "#include <uv_vertex>\nvStrip = uv.x;");
        sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uReveal;\nvarying float vStrip;")
          .replace("void main() {", "void main() {\n  if (vStrip > uReveal) discard;");
      };
      const geo = new THREE.PlaneGeometry(len, y1 - y0);
      const mesh = new THREE.Mesh(geo, mat);
      const u = (f.u0 + f.u1) / 2, y = (y0 + y1) / 2;
      if (f.side === "N" || f.side === "S") mesh.position.set(u, y, f.plane); else mesh.position.set(f.plane, y, u);
      mesh.rotation.y = turn[f.side];
      mesh.renderOrder = 2;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      mesh.userData.noAO = true;
      this.world.add(mesh);
      this.owned.push(geo, mat, map);
      this.friezes.push({ key: `${f.room}|${f.space}`, reveal });
    }
  }

  /** the walk has arrived in a room (a series, in one space of the house): draw its frieze, once per visit */
  drawFrieze(room: string | undefined, space: string | undefined) {
    const key = `${room}|${space}`;
    if (!room || this.friezeDrawn.has(key)) return;
    this.friezeDrawn.add(key);
    const mine = this.friezes.filter((f) => f.key === key);
    if (!mine.length || this.opts.reducedMotion) { mine.forEach((f) => (f.reveal.value = 1)); return; }
    gsap.to(mine.map((f) => f.reveal), { value: 1, duration: 2.4, ease: "power2.out", stagger: 0.35 });
  }

  private buildItems() {
    const box = new THREE.Box3();
    for (const s of this.parts.props) {
      const g = s.group as THREE.Group;
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
      // the house's walls as built (openings closed: things stay in their room),
      // a floor under everything and a lid over it
      for (const [x0, y0, z0, x1, y1, z1] of this.info.colliders)
        slab((x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      slab(14, 0.5, 14, 0.8, -0.5, -0.6);
      slab(14, 0.5, 14, 0.8, 4.9, -0.6);
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
    if (!d.active && !this.motion) {
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
    this.rig.playIntro(startPose(this.info, this.narrow), () => {
      this.opts.onIntroFinished();
    }, reduce ? 0 : 1.15);
  }

  /** where Twenty Paise is on screen before the camera moves — the
   *  preloader puts its photograph exactly there */
  heroRect() {
    const hero = this.art.find((m) => m.userData.artId === HERO_ID);
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

  scroll(p: number) { this.prepareChapter(Math.round(p * (CHAPTERS.length - 1))); this.rig?.scroll(p); }
  syncScroll(p: number) { this.prepareChapter(Math.round(p * (CHAPTERS.length - 1))); this.rig?.syncScroll(p); this.wake = 2; }

  /** stop drawing while an opaque section covers the room */
  setVisible(v: boolean) {
    if (v === this.visible) return;
    this.visible = v;
    if (v) this.wake = 2;
  }

  /** the baked light holds whenever the house is at rest — afternoon or
   *  evening; while it is shaken, things move, so the light is live */
  private bakeTarget() {
    if (process.env.NODE_ENV !== "production" && new URLSearchParams(location.search).get("bake") === "0") return 0;
    return this.rearranged ? 0 : 1;
  }

  /** contact shadow comes from the bake; screen-space AO keeps only a little, for moving things */
  private syncBakeAO() {
    if (this.ao && this.baked) this.ao.blendIntensity = 0.6 - 0.38 * this.baked.bake.value;
  }

  private fadeBake(instant = false) {
    const b = this.baked;
    if (!b) return;
    const d = instant || this.opts.reducedMotion ? 0 : 0.9;
    this.bakeTw?.kill();
    this.bakeTw = gsap.to(b.bake, {
      value: this.bakeTarget(), duration: d, ease: "power2.inOut",
      onUpdate: () => { this.syncBakeAO(); this.invalidate(); },
    });
  }

  setMode(mode: "light" | "dark", instant = false) {
    if (this.disposed || !this.renderer || !this.sun || (mode === this.mode && !instant)) return;
    this.mode = mode;
    this.fadeBake(instant);
    this.modeTl?.kill();
    const dur = instant || this.opts.reducedMotion ? 0 : 1.1;
    const tl = gsap.timeline({ onUpdate: () => this.applyEve(), onComplete: () => this.applyEve() });
    tl.to(this.eve, { mode: mode === "dark" ? 1 : 0, duration: dur, ease: "power2.inOut" });
    if (dur === 0) tl.progress(1);
    this.modeTl = tl;
    this.keepAlive(dur * 1000 + 50);
  }

  setState(state: "presentation" | "rearrange") {
    if (!this.rig?.isEnabled || !this.ready) return;
    const on = state === "rearrange";
    if (on === this.rearranged) return;
    this.rearranged = on;
    this.fadeBake();
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
    if (e.pointerType === "touch") this.tap = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
    if (!this.rearranged || this.drag.active || e.button !== 0) return;
    const d = this.drag;
    d.active = true; d.id = e.pointerId;
    d.x0 = e.clientX; d.y0 = e.clientY; d.sx = d.tx; d.sy = d.ty;
    try { this.canvas.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
  };

  private onPointerUp = (e: Event) => {
    const pe = e as PointerEvent, tp = this.tap;
    if (tp && pe.pointerId === tp.id && e.type === "pointerup") {
      this.tap = undefined;
      const still = Math.hypot(pe.clientX - tp.x, pe.clientY - tp.y) < 10 && performance.now() - tp.t < 500;
      if (still && this.rig.isEnabled && !this.rearranged) {
        const id = this.pick(pe);
        if (id) { this.tapOpened = performance.now(); this.opts.onArtwork(id); }
      }
    }
    const d = this.drag;
    if (!d.active) return;
    d.active = false;
    const id = (e as PointerEvent).pointerId;
    try { if (id !== undefined && this.canvas.hasPointerCapture(id)) this.canvas.releasePointerCapture(id); } catch { /* gone */ }
  };

  private onPointerLeave = () => {
    this.rig.dropPointer();
    if (this.hoverId) { this.hoverId = null; this.canvas.style.cursor = ""; this.opts.onHoverArt?.(null); }
  };

  private onTouch = () => { this.rig.touched(); };

  /** a finger looking round the room (Studio's touch handling) */
  look(nx: number, ny: number) { this.rig?.look(nx, ny); this.keepAlive(200); }
  endLook() { this.rig?.dropPointer(); this.keepAlive(1500); }

  /** a tap on a painting opens it, on the tap itself: a phone's click can be held back or lost */
  private tap?: { id: number; x: number; y: number; t: number };

  /* --- a phone shakes the room itself ------------------------------------ */

  /** the phone's own tilt, while the room is being shaken: where it was held is level */
  private motion?: { beta0: number | null; gamma0: number | null; lastShake: number };
  private onOrient = (e: DeviceOrientationEvent) => {
    const m = this.motion;
    if (!m || !this.rearranged || e.beta == null || e.gamma == null) return;
    if (m.beta0 == null || m.gamma0 == null) { m.beta0 = e.beta; m.gamma0 = e.gamma; }
    const d = this.drag;
    d.tx = THREE.MathUtils.clamp(((e.beta - m.beta0) / 40) * 0.5, -0.5, 0.5);
    d.ty = THREE.MathUtils.clamp((-(e.gamma - m.gamma0) / 40) * 0.3, -0.3, 0.3);
    this.bodies.forEach((b) => b.body?.wakeUp());
  };
  private onDeviceMotion = (e: DeviceMotionEvent) => {
    const m = this.motion, a = e.acceleration;
    if (!m || !this.rearranged || !a || a.x == null) return;
    const g = Math.hypot(a.x, a.y ?? 0, a.z ?? 0);
    const now = performance.now();
    if (g < 12 || now - m.lastShake < 320) return;
    m.lastShake = now;
    this.shake(Math.min(1.6, g / 12));
  };

  /** throw her things about: a kick for each, up and every way */
  shake(k = 1) {
    if (!this.physics || !this.rearranged) return;
    for (const b of this.bodies) {
      const B = b.body;
      if (!B) continue;
      B.wakeUp();
      B.velocity.x += (Math.random() - 0.5) * 3 * k;
      B.velocity.y += (1.4 + Math.random() * 2) * k;
      B.velocity.z += (Math.random() - 0.5) * 3 * k;
      B.angularVelocity.x += (Math.random() - 0.5) * 5 * k;
      B.angularVelocity.z += (Math.random() - 0.5) * 5 * k;
    }
    this.keepAlive(1600, true);
  }

  /** tilt and shake by the phone itself (once the visitor has allowed motion) */
  useMotion(on: boolean) {
    if (on && !this.motion) {
      this.motion = { beta0: null, gamma0: null, lastShake: 0 };
      addEventListener("deviceorientation", this.onOrient);
      addEventListener("devicemotion", this.onDeviceMotion);
    } else if (!on && this.motion) {
      this.motion = undefined;
      removeEventListener("deviceorientation", this.onOrient);
      removeEventListener("devicemotion", this.onDeviceMotion);
      this.drag.tx = this.drag.ty = 0;
    }
  }

  private pick(e: PointerEvent | MouseEvent) {
    this.ray.setFromCamera(this.toNDC(e), this.rig.camera);
    const hit = this.ray.intersectObjects(this.art, false)[0];
    return hit ? (hit.object.userData.artId as string) : null;
  }

  private lastPointer?: PointerEvent;
  private tapOpened = 0;
  private onClick = (e: MouseEvent) => {
    if (!this.rig.isEnabled || this.rearranged) return;
    // the click that follows a tap the room already answered
    if (performance.now() - this.tapOpened < 700) return;
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
      this.opts.onHoverArt?.(id);
    }
  }

  private onVisibility = () => {
    if (!document.hidden) { this.wake = 2; this.last = 0; }
  };

  private resize = () => {
    if (!this.renderer || !this.composer || this.disposed) return;
    const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight;
    clearTimeout(this.resizeTimer);
    if (w === this.renderSize.w && h === this.renderSize.h) return;
    // Phone browser bars resize the viewport repeatedly during a swipe. Keep
    // the existing buffers until that settles, rather than reallocating MSAA
    // targets in the middle of every glide. Width/orientation changes are immediate.
    if (this.tier.phone && w === this.renderSize.w) {
      this.resizeTimer = window.setTimeout(this.applyResize, 120);
    } else this.applyResize();
  };

  private applyResize = () => {
    if (this.disposed) return;
    if (!this.renderer || !this.composer) return;
    const w = this.canvas.clientWidth || innerWidth;
    const h = this.canvas.clientHeight || innerHeight;
    if (w === this.renderSize.w && h === this.renderSize.h) return;
    this.renderSize = { w, h };
    const rect = this.canvas.getBoundingClientRect();
    this.viewport = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    this.viewRevision++;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    const aspect = w / Math.max(1, h);
    this.rig.setAspect(aspect);
    this.narrow = isNarrow(aspect);
    const walk = resolveWalk(this.info, this.narrow, aspect);
    this.rig.setShots(walk.shots, walk.vias);
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
    if (this.visible && !this.rig.isMoving && this.textureUploads.length) {
      this.textureUploads.shift()!();
      draw = true;
    }
    if (draw) {
      this.viewRevision++;
      // One layout read per changed view, shared by all projected labels.
      // This also catches the held-card scale when returning from the collage.
      const rect = this.canvas.getBoundingClientRect();
      this.viewport = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }
    const walk = duskAt(this.rig.progress);
    if (Math.abs(walk - this.eve.walk) > 1e-4) {
      this.eve.walk = walk;
      this.applyEve();
      draw = true;
    }
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
      if (!this.modeTl?.isActive()) this.diya.intensity = NIGHT.diya * this.lampK * (0.9 + 0.1 * f);
      if (this.deepa) {
        this.deepa.flames.forEach((m, k) => {
          const g = 1 + 0.08 * Math.sin(t * 11.3 + k * 1.9) + 0.05 * Math.sin(t * 6.1 + k * 0.7);
          m.scale.set(0.75 / Math.sqrt(g), 1.9 * g, 0.75 / Math.sqrt(g));
        });
        if (!this.modeTl?.isActive()) this.deepa.light.intensity = NIGHT.deepa * this.lampK * (0.9 + 0.1 * f);
      }
      draw = true;
    }
    if (!draw || !this.visible) return;

    // the ceiling lifts away when the camera rises through it for the plan
    this.rig.camera.getWorldPosition(tmpV);
    // (a little under the beams, so the camera never grazes them on its way up)
    const ceilingOn = tmpV.y < ROOF - 0.35;
    if (this.ceiling.visible !== ceilingOn) {
      this.ceiling.visible = ceilingOn;
      this.renderer.shadowMap.needsUpdate = true;   // the roof casts too
    }
    this.dolly?.updateVisibility(this.rig.camera);
    this.composer.render(dt / 1000);
    if (this.lumaAsks.size) {
      const asks = [...this.lumaAsks.values()];
      this.lumaAsks.clear();
      for (const ask of asks) {
        void this.readLuma(ask.rect).then((l) => {
          if (!this.disposed && l !== null) ask.cb(l);
        }).catch(() => { /* keep the current ink if a context is being lost */ });
      }
    }
  }

  /**
   * How light the room is, as drawn, behind a part of the screen (CSS pixels): its mean luminance,
   * 0 to 1, read from the next frame drawn (`now`: draw one for it). The header chooses its ink by
   * it — the same wall sits behind the header on one screen and not on another.
   */
  readLumaBehind(name: string, rect: { x0: number; y0: number; x1: number; y1: number }, cb: (luma: number) => void, now = false) {
    this.lumaAsks.set(name, { rect, cb });
    if (now) this.wake = Math.max(this.wake, 1);
  }

  private async readLuma(r: { x0: number; y0: number; x1: number; y1: number }) {
    if (this.readbackPending || this.disposed) return null;
    const gl = this.renderer!.getContext();
    if (!(gl instanceof WebGL2RenderingContext)) return null;
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    const c = this.viewport;
    if (!c.width || !c.height) return null;
    const x0 = Math.max(0, Math.floor((r.x0 - c.left) / c.width * W)), x1 = Math.min(W, Math.ceil((r.x1 - c.left) / c.width * W));
    const y0 = Math.max(0, Math.floor((r.y0 - c.top) / c.height * H)), y1 = Math.min(H, Math.ceil((r.y1 - c.top) / c.height * H));
    if (x1 - x0 < 2 || y1 - y0 < 2) return null;
    const w = x1 - x0, h = y1 - y0;
    const bytes = w * h * 4;
    if (this.readbackPixels.length < bytes) this.readbackPixels = new Uint8Array(bytes);
    const px = this.readbackPixels.subarray(0, bytes);
    const buffer = gl.createBuffer();
    if (!buffer) return null;
    let sync: WebGLSync | null = null;
    this.readbackPending = true;
    try {
      // The same displayed pixels, read through a WebGL 2 pixel buffer. A fence
      // lets the GPU finish them without stopping the animation/main thread.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
      gl.bufferData(gl.PIXEL_PACK_BUFFER, bytes, gl.STREAM_READ);
      gl.readPixels(x0, H - y1, w, h, gl.RGBA, gl.UNSIGNED_BYTE, 0);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      if (!sync) return null;
      const fence = sync, deadline = performance.now() + 1000;
      const complete = await new Promise<boolean>((resolve) => {
        const poll = () => {
          if (this.disposed || gl.isContextLost() || performance.now() > deadline) { resolve(false); return; }
          const status = gl.clientWaitSync(fence, 0, 0);
          if (status === gl.TIMEOUT_EXPIRED) { setTimeout(poll, 4); return; }
          resolve(status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED);
        };
        setTimeout(poll, 0);
      });
      if (!complete) return null;
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
      gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, px);
      let sum = 0, n = 0;
      for (let i = 0; i < px.length; i += 16) { sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]; n++; }
      return n ? sum / n / 255 : null;
    } finally {
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      gl.deleteBuffer(buffer);
      if (sync) gl.deleteSync(sync);
      this.readbackPending = false;
    }
  }

  get introDone() { return this.rig?.isEnabled ?? false; }

  /** the camera's place on the walk, 0 at the first chapter, 1 at the last */
  get at() { return this.rig?.progress ?? 0; }
  /** Labels only need new projected positions when the camera or viewport changes. */
  get viewVersion() { return this.viewRevision; }
  /** the camera has arrived where the scroll put it, and the house is at rest */
  get landed() { return this.ready && !!this.rig && this.rig.isEnabled && this.rig.travel < 0.0015 && !this.rearranged; }

  /** every canvas on screen, framed, in CSS pixels (a label must cover none of them) */
  artRects() {
    const out: { x0: number; y0: number; x1: number; y1: number }[] = [];
    for (const id of Object.keys(this.info?.art ?? {})) {
      if (this.info?.art[id]?.study) continue;
      const r = this.artRect(id);
      if (r) out.push(r);
    }
    return out;
  }

  /** a thing w × h metres about a house anchor, facing the camera, on screen in CSS pixels; null if behind it */
  anchorRect(name: string, w: number, h: number) {
    const a = this.info?.anchors[name];
    if (!a || !this.rig || !this.canvas) return null;
    const cam = this.rig.camera;
    const right = tmpR.setFromMatrixColumn(cam.matrixWorld, 0).multiplyScalar(w / 2);
    const up = tmpU.setFromMatrixColumn(cam.matrixWorld, 1).multiplyScalar(h / 2);
    const r = this.viewport;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [i, j] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      tmpV.set(a[0], a[1], a[2]).addScaledVector(right, i).addScaledVector(up, j).project(cam);
      if (tmpV.z < -1 || tmpV.z > 1) return null;
      const x = r.left + (tmpV.x * 0.5 + 0.5) * r.width, y = r.top + (0.5 - tmpV.y * 0.5) * r.height;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    return { x0, y0, x1, y1 };
  }

  /** a canvas with its frame, on screen in CSS pixels; null unless wholly in front of the camera */
  artRect(id: string) {
    const a = this.info?.art[id];
    if (!a || !this.rig || !this.canvas) return null;
    const [nx, nz] = SIDE_OUT[a.side] ?? [0, 1];
    const hw = a.w / 2 + FRAME, hh = a.h / 2 + FRAME;
    const r = this.viewport;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const sx of [-1, 1])
      for (const sy of [-1, 1]) {
        // along the wall: the viewer's right is (nz, 0, -nx) when facing the canvas
        tmpV.set(a.centre[0] + nz * hw * sx, a.centre[1] + hh * sy, a.centre[2] - nx * hw * sx).project(this.rig.camera);
        if (tmpV.z < -1 || tmpV.z > 1) return null;
        const px = r.left + (tmpV.x * 0.5 + 0.5) * r.width, py = r.top + (0.5 - tmpV.y * 0.5) * r.height;
        x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      }
    return { x0, y0, x1, y1 };
  }

  /* --- teardown --------------------------------------------------------------- */

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.useMotion(false);
    this.ready = false;
    clearTimeout(this.resizeTimer);
    this.reliefBuilder.dispose();
    this.textureUploads.length = 0;
    this.dolly?.dispose();
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
