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
    /** also follow two fingers (pinch) and one finger (pan) on a touch screen */
    private touch = false,
  ) {
    frame.addEventListener("click", this.onClick);
    frame.addEventListener("pointermove", this.onMove);
    frame.addEventListener("wheel", this.onWheel, { passive: false });
    if (touch) {
      frame.addEventListener("touchstart", this.onTouchStart, { passive: false });
      frame.addEventListener("touchmove", this.onTouchMove, { passive: false });
      frame.addEventListener("touchend", this.onTouchEnd);
    }
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
    this.frame.removeEventListener("touchstart", this.onTouchStart);
    this.frame.removeEventListener("touchmove", this.onTouchMove);
    this.frame.removeEventListener("touchend", this.onTouchEnd);
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
    if (!this.enabled || this.pinched) return;
    e.stopPropagation();
    const p = this.at(e);
    if (this.zoomed) this.to(1, this.s.ox, this.s.oy, 0.6);
    else this.to(CLICK, p.x, p.y);
  };

  private onMove = (e: PointerEvent) => {
    if (!this.enabled || !this.zoomed || e.pointerType === "touch") return;
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

  /* touch: two fingers set how close, about the point between them; one finger
     drags the canvas while close; a tap still zooms or steps back (onClick) */
  private pinch?: { d: number; scale: number };
  private drag?: { x: number; y: number; ox: number; oy: number };
  private pinched = false;

  private onTouchStart = (e: TouchEvent) => {
    if (!this.enabled) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = [e.touches[0], e.touches[1]];
      this.pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), scale: this.s.scale };
      this.drag = undefined;
      this.pinched = true;
      if (!this.zoomed) {
        const p = this.at({ clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 });
        this.s.ox = p.x; this.s.oy = p.y;
      }
    } else if (e.touches.length === 1 && this.zoomed) {
      const t = e.touches[0];
      this.drag = { x: t.clientX, y: t.clientY, ox: this.s.ox, oy: this.s.oy };
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (!this.enabled) return;
    if (this.pinch && e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = [e.touches[0], e.touches[1]];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const next = Math.min(MAX, Math.max(1, this.pinch.scale * (d / this.pinch.d)));
      if (next > 1.01 && this.wantHiRes) { this.wantHiRes = false; this.onFirstZoom(); }
      this.live.forEach((t) => t.kill()); this.pan?.kill();
      this.s.scale = next;
      this.apply();
      this.showBar();
    } else if (this.drag && e.touches.length === 1 && this.zoomed) {
      e.preventDefault();
      const t = e.touches[0], r = this.frame.getBoundingClientRect(), k = this.s.scale - 1 || 1;
      if (Math.abs(t.clientX - this.drag.x) + Math.abs(t.clientY - this.drag.y) > 8) this.pinched = true;
      // the canvas follows the finger: moving right reveals what is to the left
      this.s.ox = Math.min(100, Math.max(0, this.drag.ox - ((t.clientX - this.drag.x) / r.width) * 100 / k));
      this.s.oy = Math.min(100, Math.max(0, this.drag.oy - ((t.clientY - this.drag.y) / r.height) * 100 / k));
      this.apply();
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length < 2 && this.pinch) {
      this.pinch = undefined;
      if (this.s.scale < 1.03) this.to(1, this.s.ox, this.s.oy, 0.3);
      // the lifted fingers must not count as a tap
      window.setTimeout(() => { this.pinched = false; }, 350);
    }
    if (e.touches.length === 0) {
      if (this.drag && this.pinched) window.setTimeout(() => { this.pinched = false; }, 350);
      this.drag = undefined;
    }
  };

  /** a drag is not a tap: true while a pinch has just ended */
  get busy() { return this.pinched; }
}
