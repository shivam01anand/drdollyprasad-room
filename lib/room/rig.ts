import * as THREE from "three";
import gsap from "gsap";

/**
 * Camera rig: a pivot Group with the camera as its child. A pose is four triples (pivot position,
 * pivot rotation, and the camera's position and rotation in pivot space), a lens and a view offset
 * (where on the screen the projection centre sits: the middle of the band between header and dock).
 *
 * Art direction V3 (29 Oct 2026): the visitor is always at one stop. A move to the next stop is
 * one short tween of the whole pose (a truck along the wall, or a turn of at most a quarter in the
 * same room); anything else is a cut under the page's veil. Scroll does not drive the camera.
 *
 * The pivot rotates yaw-then-pitch (YXZ), so any pose is a plain "stand here, look there" with a
 * level horizon.
 */

export type V3 = [number, number, number];
/** off: the view window's shift, as fractions of the screen: [0.5 - band centre x / W, 0.5 - band centre y / H] */
export type Pose = { cam: V3; camRot: V3; pivot: V3; pivotRot: V3; fov?: number; off?: [number, number] };
const KEYS = ["cam", "camRot", "pivot", "pivotRot"] as const;

/**
 * Look at `target` from `dist` metres away. yaw 0 looks toward the back wall (−z), π/2 toward the
 * left wall (−x), −π/2 toward the right wall (+x). `orbit` lifts the camera over the target (−π/2
 * is straight down); `pitch` tilts the view about the camera itself.
 */
export function aim(target: V3, yaw: number, dist: number, pitch = 0, orbit = 0): Pose {
  return { cam: [0, 0, dist], camRot: [pitch, 0, 0], pivot: [...target] as V3, pivotRot: [orbit, yaw, 0] };
}

export const clonePose = (p: Pose): Pose => ({
  cam: [...p.cam] as V3, camRot: [...p.camRot] as V3,
  pivot: [...p.pivot] as V3, pivotRot: [...p.pivotRot] as V3,
  ...(p.fov === undefined ? {} : { fov: p.fov }),
  ...(p.off === undefined ? {} : { off: [...p.off] as [number, number] }),
});

export const fieldOfView = (aspect: number) => aspect > 4 / 3 ? 40
  : Math.min(62, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(20)) / (aspect / (4 / 3)))));

function assign(dst: Pose, src: Pose) {
  for (const k of KEYS) { dst[k][0] = src[k][0]; dst[k][1] = src[k][1]; dst[k][2] = src[k][2]; }
}

/** frame-rate independent approach: `k` is the fraction covered per 60 Hz frame */
const follow = (x: number, target: number, k: number, dt: number) =>
  x + (target - x) * (1 - Math.pow(1 - k, dt / 16.667));

export class Rig {
  readonly pivot = new THREE.Group();
  readonly camera: THREE.PerspectiveCamera;
  /** the live pose every tween writes into */
  readonly pose: Pose;

  private shots: Pose[];
  private enabled = false;
  private reduced: boolean;
  private baseFov = 40;
  private lens = { fov: 40, ox: 0, oy: 0 };
  private appliedLens = { fov: -1, ox: NaN, oy: NaN, aspect: -1 };
  /** the stop index, as a float while a move runs (the afternoon follows it) */
  private at = { i: 0 };
  private moveTl?: gsap.core.Timeline;

  private ptr = { x: 0, y: 0, on: false };
  private ptrSmooth = { x: 0, y: 0 };
  private touch = false;
  /** how much a look turns the head: a mouse's small sway, or a finger's wider glance */
  private lookGain = 1;

  /** rearrange: the dollhouse view, blended in by one scalar */
  private mess: Pose;
  private messK = { v: 0 };
  private messTl?: gsap.core.Tween;

  private lastMatrix = new THREE.Matrix4();
  private lastProjection = new THREE.Matrix4();

  constructor(shots: Pose[], mess: Pose, aspect: number, reduced: boolean) {
    this.shots = shots.map(clonePose);
    this.mess = clonePose(mess);
    this.reduced = reduced;
    this.baseFov = fieldOfView(aspect);
    this.pivot.rotation.order = "YXZ";
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.05, 120);
    this.pivot.add(this.camera);
    this.pose = clonePose(shots[0]);
    this.setLens(shots[0]);
    this.setAspect(aspect);
    this.apply();
  }

  private setLens(p: Pose) {
    this.lens.fov = p.fov ?? this.baseFov;
    this.lens.ox = p.off?.[0] ?? 0;
    this.lens.oy = p.off?.[1] ?? 0;
  }

  setAspect(aspect: number) {
    this.baseFov = fieldOfView(aspect);
    this.camera.aspect = aspect;
    this.appliedLens.aspect = -1;
    this.applyLens();
  }

  /** the house opens already framed on the first stop, under the welcome's crossfade */
  playIntro(onDone: () => void) {
    const i = Math.round(this.at.i);
    assign(this.pose, this.shots[i]);
    this.setLens(this.shots[i]);
    this.enabled = true;
    onDone();
  }

  /** new framings (a phone turned, a window resized): land on the stop at once */
  setShots(shots: Pose[], index?: number) {
    this.moveTl?.kill();
    this.moveTl = undefined;
    this.shots = shots.map(clonePose);
    const i = Math.max(0, Math.min(shots.length - 1, index ?? Math.round(this.at.i)));
    this.at.i = i;
    assign(this.pose, this.shots[i]);
    this.setLens(this.shots[i]);
  }

  /**
   * One stop, by a short tween of the whole pose (a truck along a wall, or a turn in the same
   * room). The yaw takes the short way round. `onArrive` fires when the tween completes.
   */
  goTo(index: number, duration: number, onArrive: () => void) {
    this.moveTl?.kill();
    const to = this.shots[index];
    if (!to) { onArrive(); return; }
    if (!this.enabled || this.reduced || duration <= 0) { this.jumpTo(index); onArrive(); return; }
    const end = clonePose(to);
    let yaw = end.pivotRot[1];
    const from = this.pose.pivotRot[1];
    while (yaw - from > Math.PI) yaw -= 2 * Math.PI;
    while (yaw - from < -Math.PI) yaw += 2 * Math.PI;
    end.pivotRot[1] = yaw;
    const ease = "power2.inOut";
    const tl = gsap.timeline({ onComplete: () => {
      this.moveTl = undefined;
      // settle exactly (and unwrap nothing further): the stored shot is the truth
      assign(this.pose, to);
      this.setLens(to);
      this.at.i = index;
      onArrive();
    } });
    for (const k of KEYS) tl.to(this.pose[k], { 0: end[k][0], 1: end[k][1], 2: end[k][2], duration, ease }, 0);
    tl.to(this.lens, { fov: end.fov ?? this.baseFov, ox: end.off?.[0] ?? 0, oy: end.off?.[1] ?? 0, duration, ease }, 0);
    tl.to(this.at, { i: index, duration, ease }, 0);
    this.moveTl = tl;
  }

  /** a cut: straight to a stop (under the veil) */
  jumpTo(index: number) {
    this.moveTl?.kill();
    this.moveTl = undefined;
    const s = this.shots[index];
    if (!s) return;
    assign(this.pose, s);
    this.setLens(s);
    this.at.i = index;
  }

  /** a stop-to-stop tween is running */
  get stepping() { return !!this.moveTl; }
  /** a stop's framing, for working out what is where on screen */
  shot(i: number): Pose | undefined { return this.shots[i]; }
  get count() { return this.shots.length; }
  get fovBase() { return this.baseFov; }

  pointer(nx: number, ny: number) {
    if (this.touch || this.reduced) return;
    this.ptr.x = nx; this.ptr.y = ny; this.ptr.on = true;
  }
  /** a finger looking round: the same sway as the pointer's, wider; let go and it eases back */
  look(nx: number, ny: number) {
    if (this.reduced) return;
    this.ptr.x = THREE.MathUtils.clamp(nx, -1, 1); this.ptr.y = THREE.MathUtils.clamp(ny, -1, 1); this.ptr.on = true;
  }
  dropPointer() { this.ptr.on = false; }
  touched() { this.touch = true; this.ptr.on = false; this.lookGain = 2.6; }

  setMess(on: boolean) {
    this.messTl?.kill();
    this.messTl = gsap.to(this.messK, { v: on ? 1 : 0, duration: this.reduced ? 0 : 0.9, ease: "power1.inOut" });
  }

  /** advance one frame; returns true if the camera moved */
  update(dt: number) {
    const tx = this.ptr.on ? this.ptr.x : 0, ty = this.ptr.on ? this.ptr.y : 0;
    this.ptrSmooth.x = follow(this.ptrSmooth.x, tx, this.ptr.on ? 0.15 : 0.06, dt);
    this.ptrSmooth.y = follow(this.ptrSmooth.y, ty, this.ptr.on ? 0.15 : 0.06, dt);
    if (Math.abs(this.ptrSmooth.x - tx) < 1e-5) this.ptrSmooth.x = tx;
    if (Math.abs(this.ptrSmooth.y - ty) < 1e-5) this.ptrSmooth.y = ty;
    this.apply();

    // update the pivot too: a pivot-only move must still count as motion
    this.camera.updateWorldMatrix(true, false);
    const moved = !this.lastMatrix.equals(this.camera.matrixWorld) || !this.lastProjection.equals(this.camera.projectionMatrix);
    if (moved) {
      this.lastMatrix.copy(this.camera.matrixWorld);
      this.lastProjection.copy(this.camera.projectionMatrix);
    }
    return moved;
  }

  /** the lens and the band's offset, applied only when they change */
  private applyLens() {
    const a = this.appliedLens, l = this.lens, c = this.camera;
    if (a.fov === l.fov && a.ox === l.ox && a.oy === l.oy && a.aspect === c.aspect) return;
    a.fov = l.fov; a.ox = l.ox; a.oy = l.oy; a.aspect = c.aspect;
    c.fov = l.fov;
    // the projection centre at the band's middle: a window over the full frame, shifted (ratios only)
    if (l.ox || l.oy) c.setViewOffset(c.aspect, 1, l.ox * c.aspect, l.oy, c.aspect, 1);
    else c.clearViewOffset();
    c.updateProjectionMatrix();
  }

  private apply() {
    const p = this.pose, m = this.mess, k = this.messK.v;
    const mix = (a: number, b: number) => a + (b - a) * k;
    // parallax, added after the pose; scaled down on close-ups so a shot 60 cm from a padlock does
    // not swing by a fifth of a metre
    const dist = mix(p.cam[2], m.cam[2]);
    const amt = THREE.MathUtils.clamp(dist / 2.6, 0.2, 1) * (1 - k * 0.6);
    // (a mouse's sway is half what it was: the wall holds still under its names, 29 Oct)
    const sway = this.touch ? 1 : 0.5;
    const e = this.ptrSmooth.x * amt * this.lookGain * sway, t = this.ptrSmooth.y * amt * this.lookGain * sway;
    this.pivot.position.set(mix(p.pivot[0], m.pivot[0]), mix(p.pivot[1], m.pivot[1]), mix(p.pivot[2], m.pivot[2]));
    this.pivot.rotation.set(mix(p.pivotRot[0], m.pivotRot[0]), mix(p.pivotRot[1], m.pivotRot[1]), mix(p.pivotRot[2], m.pivotRot[2]));
    // the head turns; the body barely moves (a finger's wider look must not walk the camera into a wall)
    const shift = 0.2 / this.lookGain;
    this.camera.position.set(mix(p.cam[0], m.cam[0]) - shift * e, mix(p.cam[1], m.cam[1]) + shift * t, dist);
    this.camera.rotation.set(mix(p.camRot[0], m.camRot[0]) - 0.1 * t, mix(p.camRot[1], m.camRot[1]) - 0.1 * e, mix(p.camRot[2], m.camRot[2]));
    this.applyLens();
  }

  /** 0 at the first stop, 1 at the last (fractional during a move) */
  get progress() { return this.at.i / Math.max(1, this.shots.length - 1); }
  /** the stop index, fractional during a move */
  get index() { return this.at.i; }
  get travel() { return this.moveTl ? 1 : 0; }
  get isEnabled() { return this.enabled; }
  get isMoving() { return !!this.moveTl; }
  /** how far the camera is from rest (pointer drift aside) */
  get settling() { return (this.moveTl ? 1 : 0) + Math.abs(this.ptrSmooth.x) + Math.abs(this.ptrSmooth.y); }

  dispose() {
    this.moveTl?.kill();
    this.messTl?.kill();
  }
}
