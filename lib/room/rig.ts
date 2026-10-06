import * as THREE from "three";
import gsap from "gsap";

/**
 * Camera rig — a pivot Group with the camera as its child, exactly the
 * original's arrangement. A pose is four triples (pivot position, pivot
 * rotation, and the camera's position and rotation in pivot space) that GSAP
 * tweens; update() copies them onto the real objects every frame. Rotating
 * the pivot while dollying the camera gives orbit-like arcs for free.
 *
 * The pivot rotates yaw-then-pitch (YXZ), so any pose is a plain "stand
 * here, look there" with a level horizon.
 */

export type V3 = [number, number, number];
export type Pose = { cam: V3; camRot: V3; pivot: V3; pivotRot: V3 };
const KEYS = ["cam", "camRot", "pivot", "pivotRot"] as const;

/**
 * Look at `target` from `dist` metres away. yaw 0 looks toward the back wall
 * (−z), π/2 toward the left wall (−x), −π/2 toward the right wall (+x).
 * `orbit` lifts the camera over the target (−π/2 is straight down);
 * `pitch` tilts the view about the camera itself.
 */
export function aim(target: V3, yaw: number, dist: number, pitch = 0, orbit = 0): Pose {
  return { cam: [0, 0, dist], camRot: [pitch, 0, 0], pivot: [...target] as V3, pivotRot: [orbit, yaw, 0] };
}

export const clonePose = (p: Pose): Pose => ({
  cam: [...p.cam] as V3, camRot: [...p.camRot] as V3,
  pivot: [...p.pivot] as V3, pivotRot: [...p.pivotRot] as V3,
});

function assign(dst: Pose, src: Pose) {
  for (const k of KEYS) { dst[k][0] = src[k][0]; dst[k][1] = src[k][1]; dst[k][2] = src[k][2]; }
}

/** frame-rate independent approach: `k` is the fraction covered per 60 Hz frame */
const follow = (x: number, target: number, k: number, dt: number) =>
  x + (target - x) * (1 - Math.pow(1 - k, dt / 16.667));

export class Rig {
  readonly pivot = new THREE.Group();
  readonly camera: THREE.PerspectiveCamera;
  /** the live pose every timeline writes into */
  readonly pose: Pose;

  private shots: Pose[];
  /** for each step between chapters, a pose it passes through without stopping, or null */
  private vias: (Pose | null)[];
  private scrollTl: gsap.core.Timeline;
  private introTl?: gsap.core.Timeline;
  private messTl?: gsap.core.Tween;
  private enabled = false;
  private reduced: boolean;

  // David Lee's chain: the scroll fraction approaches its target with a
  // ~100 ms time constant, the camera's own progress follows that at 10 % a
  // frame. The copy lands before the camera does, and that lag is the weight.
  private scrollTarget = 0;
  private scrollSmooth = 0;
  private camProgress = 0;
  private lastProgress = -1;

  private ptr = { x: 0, y: 0, on: false };
  private ptrSmooth = { x: 0, y: 0 };
  private touch = false;

  /** rearrange: the dollhouse view, blended in by one scalar */
  private mess: Pose;
  private messK = { v: 0 };

  private lastMatrix = new THREE.Matrix4();

  constructor(shots: Pose[], start: Pose, mess: Pose, aspect: number, reduced: boolean, vias: (Pose | null)[] = []) {
    this.shots = shots.map(clonePose);
    this.vias = vias.map((v) => (v ? clonePose(v) : null));
    this.mess = clonePose(mess);
    this.reduced = reduced;
    this.pivot.rotation.order = "YXZ";
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.05, 120);
    this.pivot.add(this.camera);
    // the camera waits at the establishing shot, so nothing is ever seen
    // from a pose it then has to jump away from
    this.pose = clonePose(reduced ? shots[0] : start);
    this.scrollTl = this.buildScrollTimeline();
    this.setAspect(aspect);
    this.apply();
  }

  setAspect(aspect: number) {
    // keep the horizontal field of a 4:3 frame on narrow viewports
    // (capped: on a phone held upright the 4:3 rule asks for 93°, which is
    // mostly ceiling and floor)
    this.camera.fov = aspect > 4 / 3
      ? 40
      : Math.min(62, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(20)) / (aspect / (4 / 3)))));
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /**
   * The room is shown, then the camera moves in on one painting. The
   * establishing shot is square-on to the hero so the painting the
   * preloader showed is exactly where the room has it; the move in is one
   * unbroken dolly with a small rise, position leading and rotation
   * following by a few hundredths, as the original does.
   */
  playIntro(start: Pose, onDone: () => void, delay = 0) {
    this.introTl?.kill();
    if (this.reduced) {
      assign(this.pose, this.shots[0]);
      this.enabled = true;
      onDone();
      return;
    }
    assign(this.pose, start);
    const end = this.shots[0];
    const tl = gsap.timeline({ delay, onComplete: () => { this.enabled = true; onDone(); } });
    KEYS.forEach((k, i) =>
      tl.to(this.pose[k], { 0: end[k][0], 1: end[k][1], 2: end[k][2], duration: 2.6, ease: "power2.inOut" }, i * 0.04)
    );
    this.introTl = tl;
  }

  /** finish the intro immediately — a backgrounded tab, or a reload mid-way */
  finishIntro() {
    if (this.introTl && this.introTl.progress() < 1) this.introTl.progress(1);
  }

  /**
   * The paused timeline scroll drives. Explicit from-values make it
   * independent of wherever the pose happens to be when it is built, so it
   * can be rebuilt mid-page (a phone turned on its side) without a jump.
   */
  private buildScrollTimeline() {
    // the original's 10 s segments and 0.5 s key offsets; each segment ends
    // before the next begins, so a chapter's centre is exactly its framing
    const seg = 10, offset = 0.5, span = seg + offset * (KEYS.length - 1);
    const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.inOut", duration: seg, immediateRender: false } });
    const v3 = (p: Pose, k: (typeof KEYS)[number]) => ({ 0: p[k][0], 1: p[k][1], 2: p[k][2] });
    this.shots.slice(1).forEach((s, i) => {
      const from = this.shots[i], via = this.vias[i];
      KEYS.forEach((k, j) => {
        const at = i * span + j * offset;
        if (!via) { tl.fromTo(this.pose[k], v3(from, k), v3(s, k), at); return; }
        // through a doorway without stopping in it: gathering speed to the passing
        // pose, carrying it through, easing out on the far side
        tl.fromTo(this.pose[k], v3(from, k), { ...v3(via, k), ease: "power2.in", duration: seg / 2 }, at);
        tl.fromTo(this.pose[k], v3(via, k), { ...v3(s, k), ease: "power2.out", duration: seg / 2 }, at + seg / 2);
      });
    });
    return tl;   // (shots − 1) · 11.5 s
  }

  /** new framings (portrait ↔ landscape): rebuild and land where scroll is */
  setShots(shots: Pose[], vias: (Pose | null)[] = []) {
    this.shots = shots.map(clonePose);
    this.vias = vias.map((v) => (v ? clonePose(v) : null));
    this.scrollTl.kill();
    this.scrollTl = this.buildScrollTimeline();
    if (this.enabled) {
      this.scrollTl.progress(this.camProgress);
      this.lastProgress = this.camProgress;
    }
  }

  /** 0 at the first chapter's shot, 1 at the last */
  scroll(progress: number) {
    this.scrollTarget = Math.min(1, Math.max(0, progress));
  }

  /** after a resize or a restored scroll position, land without easing */
  syncScroll(progress: number) {
    this.scrollTarget = this.scrollSmooth = this.camProgress = Math.min(1, Math.max(0, progress));
    if (!this.enabled) return;
    if (this.reduced) { this.lastProgress = -1; return; }   // update() cuts to the chapter
    this.scrollTl.progress(this.camProgress);
    this.lastProgress = this.camProgress;
  }

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

  /** how much a look turns the head: a mouse's small sway, or a finger's wider glance */
  private lookGain = 1;
  /** a walking pace: no step from one wall to the next is quicker than this */
  private static STEP_S = 2.6;

  setMess(on: boolean) {
    this.messTl?.kill();
    this.messTl = gsap.to(this.messK, { v: on ? 1 : 0, duration: this.reduced ? 0 : 0.9, ease: "power1.inOut" });
  }

  /** advance one frame; returns true if the camera moved */
  update(dt: number) {
    if (this.enabled && this.reduced) {
      // no travel: each chapter is a still view, changed in a cut
      const last = this.shots.length - 1;
      const index = Math.round(this.scrollTarget * last);
      if (index / last !== this.lastProgress) {
        assign(this.pose, this.shots[index]);
        this.scrollSmooth = this.camProgress = this.lastProgress = index / last;
      }
    } else if (this.enabled) {
      // the camera walks: it follows the scroll softly, and never faster than one
      // step in STEP_S as it arrives (a long jump — the list of stops — covers the
      // walls on the way quickly, so it is there in a few seconds, not a crawl)
      this.scrollSmooth = follow(this.scrollSmooth, this.scrollTarget, 0.08, dt);
      const want = follow(this.camProgress, this.scrollSmooth, 0.05, dt) - this.camProgress;
      const step = 1 / Math.max(1, this.shots.length - 1);
      const far = Math.abs(this.scrollSmooth - this.camProgress);
      // all but the last wall of a long jump goes quickly; the arrival is always at a walk
      const vmax = Math.max(step / Rig.STEP_S, far - step * 0.6) * (dt / 1000);
      this.camProgress += THREE.MathUtils.clamp(want, -vmax, vmax);
      if (Math.abs(this.camProgress - this.scrollTarget) < 1e-5) this.camProgress = this.scrollTarget;
      if (this.camProgress !== this.lastProgress) {
        this.scrollTl.progress(this.camProgress);
        this.lastProgress = this.camProgress;
      }
    }
    const tx = this.ptr.on ? this.ptr.x : 0, ty = this.ptr.on ? this.ptr.y : 0;
    this.ptrSmooth.x = follow(this.ptrSmooth.x, tx, this.ptr.on ? 0.15 : 0.06, dt);
    this.ptrSmooth.y = follow(this.ptrSmooth.y, ty, this.ptr.on ? 0.15 : 0.06, dt);
    if (Math.abs(this.ptrSmooth.x - tx) < 1e-5) this.ptrSmooth.x = tx;
    if (Math.abs(this.ptrSmooth.y - ty) < 1e-5) this.ptrSmooth.y = ty;
    this.apply();

    // update the pivot too: a pivot-only move must still count as motion
    this.camera.updateWorldMatrix(true, false);
    const moved = !this.lastMatrix.equals(this.camera.matrixWorld);
    if (moved) this.lastMatrix.copy(this.camera.matrixWorld);
    return moved;
  }

  private apply() {
    const p = this.pose, m = this.mess, k = this.messK.v;
    const mix = (a: number, b: number) => a + (b - a) * k;
    // parallax, added after the pose; scaled down on close-ups so a shot
    // 60 cm from a padlock does not swing by a fifth of a metre
    const dist = mix(p.cam[2], m.cam[2]);
    const amt = THREE.MathUtils.clamp(dist / 2.6, 0.2, 1) * (1 - k * 0.6);
    const e = this.ptrSmooth.x * amt * this.lookGain, t = this.ptrSmooth.y * amt * this.lookGain;
    this.pivot.position.set(mix(p.pivot[0], m.pivot[0]), mix(p.pivot[1], m.pivot[1]), mix(p.pivot[2], m.pivot[2]));
    this.pivot.rotation.set(mix(p.pivotRot[0], m.pivotRot[0]), mix(p.pivotRot[1], m.pivotRot[1]), mix(p.pivotRot[2], m.pivotRot[2]));
    // the head turns; the body barely moves (a finger's wider look must not walk the camera into a wall)
    const shift = 0.2 / this.lookGain;
    this.camera.position.set(mix(p.cam[0], m.cam[0]) - shift * e, mix(p.cam[1], m.cam[1]) + shift * t, dist);
    this.camera.rotation.set(mix(p.camRot[0], m.camRot[0]) - 0.1 * t, mix(p.camRot[1], m.camRot[1]) - 0.1 * e, mix(p.camRot[2], m.camRot[2]));
  }

  get progress() { return this.camProgress; }
  /** how far the camera still has to travel to where the scroll says (pointer drift aside) */
  get travel() { return Math.abs(this.camProgress - this.scrollTarget); }
  get isEnabled() { return this.enabled; }
  /** how far the camera has travelled from the scroll target — 0 once it has landed */
  get settling() { return Math.abs(this.camProgress - this.scrollTarget) + Math.abs(this.ptrSmooth.x) + Math.abs(this.ptrSmooth.y); }

  dispose() {
    this.introTl?.kill();
    this.messTl?.kill();
    this.scrollTl.kill();
  }
}
