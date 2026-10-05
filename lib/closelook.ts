import { gsap } from "@/lib/motion";

/**
 * Looking closely at a painting. A click zooms to the brushwork under the
 * pointer; moving the pointer travels across the canvas; the wheel (or a
 * trackpad pinch) sets how close. A thin track at the edge shows the level
 * while it changes, then fades — a trace of the gesture, not a control.
 *
 * The image is scaled about a moving origin, so the point under the pointer
 * stays under it. The frame clips only while zoomed, so the lightbox's Flip
 * flight in and out is never cut.
 */
const MAX = 4, CLICK = 2.6;

export class CloseLook {
  private s = { scale: 1, ox: 50, oy: 50 };
  private hideBar = 0;
  private live: gsap.core.Tween[] = [];
  private pan?: gsap.core.Tween;
  private enabled = false;
  private wantHiRes = true;

  constructor(
    private frame: HTMLElement,
    private img: HTMLImageElement,
    private bar: HTMLElement,
    private reduce: boolean,
    /** called once, the first time the painting is looked at closely */
    private onFirstZoom: () => void,
  ) {
    frame.addEventListener("click", this.onClick);
    frame.addEventListener("pointermove", this.onMove);
    frame.addEventListener("wheel", this.onWheel, { passive: false });
  }

  get zoomed() { return this.s.scale > 1.01; }

  /** the lightbox allows closeness once its flight has landed */
  enable(on: boolean) { this.enabled = on; if (!on) this.reset(true); }

  reset(instant = false) {
    this.live.forEach((t) => t.kill()); this.live = [];
    this.pan?.kill();
    clearTimeout(this.hideBar);
    if (instant || this.reduce) {
      Object.assign(this.s, { scale: 1, ox: 50, oy: 50 });
      this.apply();
      this.frame.classList.remove("is-zoomed");
      this.bar.style.opacity = "0";
    } else {
      this.to(1, this.s.ox, this.s.oy);
    }
    this.wantHiRes = true;
  }

  dispose() {
    this.reset(true);
    this.frame.removeEventListener("click", this.onClick);
    this.frame.removeEventListener("pointermove", this.onMove);
    this.frame.removeEventListener("wheel", this.onWheel);
  }

  private at(e: { clientX: number; clientY: number }) {
    const r = this.frame.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)),
    };
  }

  private apply = () => {
    const { scale, ox, oy } = this.s;
    this.img.style.transformOrigin = `${ox}% ${oy}%`;
    this.img.style.transform = scale > 1.0005 ? `scale(${scale})` : "";
    const zoomed = scale > 1.01;
    this.frame.classList.toggle("is-zoomed", zoomed);
    const word = zoomed ? "Step back" : "Look closer";
    if (this.frame.dataset.cursor !== word) {
      this.frame.dataset.cursor = word;
      window.dispatchEvent(new Event("cursor:refresh"));
    }
    const k = (scale - 1) / (MAX - 1);
    this.bar.style.setProperty("--k", String(k));
    const label = this.bar.querySelector("span");
    if (label) label.textContent = `${scale.toFixed(1)}×`;
  };

  private to(scale: number, ox: number, oy: number, d = 0.7) {
    if (scale > 1.01 && this.wantHiRes) { this.wantHiRes = false; this.onFirstZoom(); }
    this.live.forEach((t) => t.kill());
    this.pan?.kill();
    this.live = [gsap.to(this.s, { scale, ox, oy, duration: this.reduce ? 0 : d, ease: "power3.out", onUpdate: this.apply })];
    this.showBar();
  }

  private showBar() {
    clearTimeout(this.hideBar);
    this.bar.style.opacity = "1";
    this.hideBar = window.setTimeout(() => { this.bar.style.opacity = "0"; }, 1100);
  }

  private onClick = (e: MouseEvent) => {
    if (!this.enabled) return;
    e.stopPropagation();
    const p = this.at(e);
    if (this.zoomed) this.to(1, this.s.ox, this.s.oy, 0.6);
    else this.to(CLICK, p.x, p.y);
  };

  private onMove = (e: PointerEvent) => {
    if (!this.enabled || !this.zoomed) return;
    const p = this.at(e);
    // the origin glides after the pointer, so travel across the canvas is smooth
    this.pan?.kill();
    this.pan = gsap.to(this.s, { ox: p.x, oy: p.y, duration: 0.45, ease: "power2.out", onUpdate: this.apply });
  };

  private onWheel = (e: WheelEvent) => {
    if (!this.enabled) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    // a trackpad pinch arrives as ctrl+wheel with small deltas
    const k = e.ctrlKey ? 0.012 : 0.0022;
    const next = Math.min(MAX, Math.max(1, this.s.scale * Math.exp(-e.deltaY * unit * k)));
    if (next === this.s.scale) return;
    e.preventDefault();
    const p = this.at(e);
    const from1 = !this.zoomed;
    this.to(next < 1.03 ? 1 : next, from1 ? p.x : this.s.ox, from1 ? p.y : this.s.oy, 0.35);
  };
}
