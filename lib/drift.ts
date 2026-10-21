/**
 * Moving rows and the moving wall, by hand as well as by themselves
 * (Shubham, PR #11 review): every moving row or wall drifts gently on its own,
 * can be dragged with the mouse or swiped with a finger, lets a click or tap
 * open what is under it, and picks up its gentle motion again a moment after
 * it is let go. For anyone who has asked for reduced motion the rows and the
 * wall drift at half speed and a drag stops where it is let go, with no
 * coasting (lib/motion-rules; REDUCED_KEEPS_MOVING=false makes them still).
 * The mouse wheel: a sideways wheel or trackpad swipe, or Shift + wheel, moves
 * a row; a plain vertical wheel always scrolls the page.
 *
 * One clock per row (requestAnimationFrame), paused while off screen or in a
 * hidden tab. Transforms only, so nothing on the page shifts.
 */

import { REDUCED_KEEPS_MOVING, REDUCED_MIN_PX_S, REDUCED_SPEED, motionPaused } from "./motion-rules";

const HOLD_MS = 1400; // how long a let-go row rests before it drifts again
const RAMP_S = 1.6; // how long it takes to come back up to speed
const SLOP = 6; // px a pointer must travel before a press becomes a drag
const FLING = 1.6; // release velocity carried into the coast (Brand R1 #16: "fast scroll = fast")
const COAST_K = 0.9; // how fast a fling slows (1/s); coast distance is about v0 / COAST_K
const VMAX = 6000; // px/s
const NOTCH = 8; // a mouse-wheel notch of d px adds d * NOTCH px/s of coast
const VEL_WINDOW = 100; // ms of pointer samples the release velocity is measured over
const clampV = (v: number) => Math.max(-VMAX, Math.min(VMAX, v));

type Teardown = () => void;

/** where a CSS animation has got to, so the hand-over to script is seamless */
function at(el: HTMLElement) {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return { x: 0, y: 0 };
  const m = new DOMMatrix(t);
  return { x: m.m41, y: m.m42 };
}

function reducedMotion() {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/** under reduced motion: does it still move by itself (at REDUCED_SPEED), or stand still? */
/** the footer's "Pause movement" stops all of it */
const motionScale = (reduced: boolean) => (motionPaused() ? 0 : !reduced ? 1 : REDUCED_KEEPS_MOVING ? REDUCED_SPEED : 0);

/** shared pointer handling: decides drag vs click, keeps clicks from firing after a drag */
function grab(el: HTMLElement, h: {
  start(): void;
  move(dx: number, dy: number, e: PointerEvent): void;
  end(vx: number): void;
  /** mouse may drag both ways; touch drags sideways only (the page keeps its vertical scroll) */
  twoAxis?: boolean;
}): Teardown {
  let id: number | null = null;
  let sx = 0, sy = 0, dragging = false, abandoned = false, isTouch = false;
  let lastX = 0, lastT = 0;
  let samples: [number, number][] = []; // [time, x] of the last VEL_WINDOW ms
  let swallow = false;

  el.dataset.grab = "";
  const down = (e: PointerEvent) => {
    if (e.button !== 0 || id !== null) return;
    // a carousel inside another one (a roll inside the threads) handles its own gestures
    if ((e.target as Element).closest?.("[data-grab]") !== el) return;
    id = e.pointerId; sx = e.clientX; sy = e.clientY; dragging = false; abandoned = false;
    isTouch = e.pointerType !== "mouse";
    lastX = e.clientX; lastT = e.timeStamp || performance.now(); samples = [[lastT, lastX]];
  };
  const move = (e: PointerEvent) => {
    if (e.pointerId !== id || abandoned) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!dragging) {
      const two = h.twoAxis && !isTouch;
      if (Math.abs(dx) < SLOP && (!two || Math.abs(dy) < SLOP)) return;
      // a finger moving mostly up or down is scrolling the page: let it
      if (!two && Math.abs(dy) > Math.abs(dx)) { abandoned = true; return; }
      dragging = true;
      try { el.setPointerCapture(e.pointerId); } catch { /* the pointer may already be gone */ }
      el.classList.add("is-dragging");
      h.start();
    }
    // the event's own time, not when it was delivered: a late pointermove must not look like a rest (review #2 R2-3)
    const now = e.timeStamp || performance.now();
    lastX = e.clientX; lastT = now;
    samples.push([now, lastX]);
    while (samples.length > 2 && now - samples[0][0] > VEL_WINDOW) samples.shift();
    h.move(dx, h.twoAxis && !isTouch ? dy : 0, e);
  };
  const up = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = null;
    if (!dragging) return;
    dragging = false;
    el.classList.remove("is-dragging");
    swallow = true; // the click that follows a drag is not a click
    setTimeout(() => { swallow = false; }, 0);
    // a finger that rested before letting go does not fling; otherwise the speed over the last 100 ms
    // (not a running average, so a quick flick with a slow first frame is read in full)
    const [t0, x0] = samples[0];
    const span = lastT - t0;
    const vx = span >= 8 ? ((lastX - x0) / span) * 1000 : 0;
    // a rest is a pointer that held still: time since the last move (both on event time) AND no travel since it.
    // A fast drag (3+ samples, over 800 px/s) whose last move came in late always coasts.
    const tUp = e.timeStamp || performance.now();
    const still = Math.abs(e.clientX - lastX) < 2;
    const rested = still && tUp - lastT > 120 && !(samples.length >= 3 && Math.abs(vx) > 800 && tUp - lastT < 200);
    h.end(rested ? 0 : vx);
  };
  const click = (e: MouseEvent) => { if (swallow) { e.preventDefault(); e.stopPropagation(); swallow = false; } };
  const noDrag = (e: DragEvent) => e.preventDefault();

  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  el.addEventListener("click", click, true);
  el.addEventListener("dragstart", noDrag);
  return () => {
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
    el.removeEventListener("click", click, true);
    el.removeEventListener("dragstart", noDrag);
    delete el.dataset.grab;
  };
}

/** runs `tick` every frame while `el` is on screen and the tab is visible */
function clock(el: HTMLElement, tick: (dt: number, now: number) => void): Teardown {
  let raf = 0, last = 0, seen = false;
  const loop = (now: number) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    tick(dt, now);
    raf = requestAnimationFrame(loop);
  };
  const sync = () => {
    const run = seen && !document.hidden;
    if (run && !raf) { last = 0; raf = requestAnimationFrame(loop); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }, { rootMargin: "120px 0px" });
  io.observe(el);
  document.addEventListener("visibilitychange", sync);
  return () => { io.disconnect(); document.removeEventListener("visibilitychange", sync); cancelAnimationFrame(raf); raf = 0; };
}

/**
 * A row of `copies` identical sets inside `track`, drifting sideways inside
 * `view`. `seconds` is the time for one set to pass.
 */
export function driftRow(view: HTMLElement, track: HTMLElement, o: { seconds: number; copies: number; reverse?: boolean; pauseOnHover?: boolean }): Teardown {
  const dir = o.reverse ? 1 : -1;
  let loop = 1;
  let x = 0, v = 0, speed = 0;
  let holdUntil = 0, held = false, hover = false, focus = false;
  let reduced = reducedMotion();
  let lastWheel = 0;

  const measure = () => {
    loop = Math.max(1, track.scrollWidth / o.copies);
    speed = loop / o.seconds;
  };
  measure();
  x = at(track).x;
  const ro = new ResizeObserver(measure);
  ro.observe(track);

  const wrap = () => {
    if (focus) { x = Math.min(0, x); return; } // keep a focused card where it is
    while (x <= -loop) x += loop;
    while (x > 0) x -= loop;
  };
  const paint = () => { track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`; };

  const stopClock = clock(view, (dt, now) => {
    if (held) return;
    const scale = motionScale(reduced);
    // a row inside [data-hold] (e.g. the press row while its Gallery is open) waits
    const resting = now < holdUntil || hover || focus || scale === 0 || !!view.closest("[data-hold]");
    // R4 polish 4 (G10a, 1920): under reduced motion a short or slow row still visibly drifts (never under
    // REDUCED_MIN_PX_S), so a wide screen does not leave one row looking stopped at 4 px/s
    const target = resting ? 0 : dir * (scale > 0 && scale < 1 ? Math.max(speed * scale, REDUCED_MIN_PX_S) : speed * scale);
    // a fling coasts and slows gently (COAST_K); the drift returns over RAMP_S
    const k = Math.abs(v) > speed * 1.2 ? COAST_K : 1 / RAMP_S * 2.2;
    v += (target - v) * Math.min(1, dt * k);
    x += v * dt;
    wrap();
    paint();
  });

  let x0 = 0;
  const stopGrab = grab(view, {
    start() { held = true; x0 = x; v = 0; },
    move(dx) { x = x0 + dx; wrap(); x0 = x - dx; paint(); },
    // under reduced motion a drag stops where it is let go
    end(vx) { held = false; v = reduced ? 0 : clampV(vx * FLING); holdUntil = performance.now() + HOLD_MS; },
  });

  // the wheel: a trackpad's sideways swipe (or a sideways wheel) moves the row by exactly its own
  // distance (the trackpad brings its own momentum); Shift + a mouse wheel moves it and a notch
  // flings it, so turning the wheel fast goes fast. A plain vertical wheel is always the page's.
  const wheel = (e: WheelEvent) => {
    const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (!horiz && !e.shiftKey) return;
    let d = horiz ? e.deltaX : e.deltaY;
    d *= e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? view.clientWidth : 1;
    if (!d) return;
    e.preventDefault();
    x -= d; wrap(); paint();
    const now = performance.now();
    const notch = e.deltaMode !== 0 || Math.abs(d) >= 50; // a mouse-wheel notch, not a trackpad's stream
    if (reduced || !notch) v = 0;
    else {
      const same = now - lastWheel < 300 && Math.sign(v) === Math.sign(-d);
      v = clampV((same ? v : 0) - d * NOTCH);
    }
    lastWheel = now;
    holdUntil = now + HOLD_MS;
  };
  view.addEventListener("wheel", wheel, { passive: false });

  const enter = (e: PointerEvent) => { void e; /* CR-007: rows keep moving under the mouse */ };
  const leave = () => { hover = false; };
  view.addEventListener("pointerenter", enter);
  view.addEventListener("pointerleave", leave);

  // the keyboard: a focused card is brought fully into view and the row waits
  const fin = (e: FocusEvent) => {
    const t = e.target as HTMLElement;
    // a mouse press focuses the link too; only the keyboard's focus holds the row
    if (!t.matches?.(":focus-visible")) return;
    focus = true;
    const r = t.getBoundingClientRect(), b = view.getBoundingClientRect();
    if (r.left < b.left + 16) x += b.left + 16 - r.left;
    else if (r.right > b.right - 16) x -= r.right - (b.right - 16);
    wrap(); paint();
  };
  const fout = (e: FocusEvent) => { if (!view.contains(e.relatedTarget as Node)) { focus = false; holdUntil = performance.now() + HOLD_MS; } };
  view.addEventListener("focusin", fin);
  view.addEventListener("focusout", fout);

  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  const onMq = () => { reduced = mq.matches; };
  mq.addEventListener("change", onMq);

  view.classList.add("is-live");
  paint();
  return () => {
    stopClock(); stopGrab(); ro.disconnect(); mq.removeEventListener("change", onMq);
    view.removeEventListener("wheel", wheel);
    view.removeEventListener("pointerenter", enter);
    view.removeEventListener("pointerleave", leave);
    view.removeEventListener("focusin", fin);
    view.removeEventListener("focusout", fout);
    view.classList.remove("is-live");
  };
}

/**
 * The moving wall: columns drifting up and down (alternately), each list held
 * twice so it loops, while the whole wall eases left and right across `--drift`
 * over `swaySeconds`. Dragging moves the wall sideways and (with a mouse) the
 * columns up or down; after a moment it carries on from where it was left.
 */
const SETTLE_GLIDE_S = 1.2;
const SETTLE_MAX_PX = 48;
const LABEL = ".ncard,.ccard,.xcard,.qcard,.scard";
/**
 * R4 fix 4: the start offset (px, per column) that keeps a hero wall's label tiles whole at first view. Scores every
 * start y of each column over the next 6 s of drift: a label tile may not straddle the wall's top edge (or sit within
 * 12 px of it), the bottom edge, or the name box's edge (16 px margin); wholly behind the box is fine. Picks the best
 * score nearest the current position. Returns null outside a hero (no name box).
 */
function settleHero(cols: HTMLElement, st: { c: HTMLElement; down: boolean; dur: number; h: number; y: number }[], m: number): number[] | null {
  const wall = cols.parentElement, card = cols.closest(".wh")?.querySelector<HTMLElement>(".namecard");
  if (!wall || !card) return null;
  const W = wall.getBoundingClientRect(), C = card.getBoundingClientRect();
  if (!W.height) return null;
  const H = W.height, ct = C.top - W.top, cb = C.bottom - W.top, M = 16, TOP = 12;
  const times = [0, 1.5, 3, 4.5, 6], weight = [4, 2, 1.5, 1, 0.5];
  return st.map((s) => {
    const cr = s.c.getBoundingClientRect();
    const underCard = cr.left < C.right + M && cr.right > C.left - M;
    const base = cr.top - s.y - W.top; // the column's top in the wall, untransformed
    const tiles = Array.from(s.c.querySelectorAll<HTMLElement>(LABEL)).map((t) => {
      const r = t.getBoundingClientRect();
      return [base + r.top - cr.top, base + r.bottom - cr.top] as const; // position in the wall at y = 0
    });
    if (!tiles.length || s.h <= 1 || cr.right <= W.left || cr.left >= W.right) return 0; // nothing to place, or off screen
    const v = (s.down ? 1 : -1) * (s.h / s.dur) * (m || 0);
    const bad = (a: number, b: number) => {
      if (b <= 0 || a >= H) return 0;                         // out of view
      let k = 0;
      if (a < TOP) k += 1;                                       // under / against the header edge
      if (b > H) k += 0.5;                                       // crossing the faded bottom edge
      if (underCard && !(a >= ct && b <= cb) && b > ct - M && a < cb + M) k += 1; // half under the name box
      return k;
    };
    let best = 0, bestCost = Infinity;
    for (let y = -s.h; y < 0; y += 4) {
      // a column clear of the name box shows one of its labels whole at first view (hiding them all is not a fix)
      let cost = !underCard && !tiles.some(([a, b]) => a + y >= TOP && b + y <= H - 48) ? 6 : 0;
      for (let ti = 0; ti < times.length; ti++) {
        const off = y + v * times[ti];
        for (const [a, b] of tiles) cost += weight[ti] * bad(a + off, b + off);
      }
      // nearest to where it is now (mod one repeat), so the glide is short
      let d = y - s.y; d -= Math.round(d / s.h) * s.h;
      // R6 perf fix 3: never glide more than 48 px (an offset of half a repeat read as the wall jumping at 100-600x its drift)
      if (Math.abs(d) > SETTLE_MAX_PX) continue;
      cost += Math.abs(d) / 4000;
      if (cost < bestCost) { bestCost = cost; best = d; }
    }
    return best;
  });
}

export function driftWall(cols: HTMLElement, o: { swaySeconds?: number } = {}): Teardown {
  const sway = o.swaySeconds ?? 70;
  const columns = Array.from(cols.querySelectorAll<HTMLElement>(":scope > .col"));
  const st = columns.map((c) => ({ c, down: c.classList.contains("down"), dur: parseFloat(c.style.getPropertyValue("--dur")) || 95, h: 1, y: 0 }));
  let amp = 0; // px, negative
  let p = 0; // sway phase, 0..2 (0→1 out, 1→2 back)
  let x = 0, scale = 1, holdUntil = 0, held = false, hover = false;
  let reduced = reducedMotion();

  const measure = () => {
    const d = parseFloat(getComputedStyle(cols).getPropertyValue("--drift")) || 0;
    amp = (d / 100) * cols.offsetWidth;
    // one repeat's height from the content, not the box: the wall's grid stretches every column to the tallest one, so
    // scrollHeight / rep overstated the shorter columns' repeat (their labels then sat off their true period, and the
    // wrap jumped by the difference). R4 fix 4.
    for (const s of st) {
      const last = s.c.lastElementChild as HTMLElement | null, cs = getComputedStyle(s.c);
      const gap = parseFloat(cs.rowGap) || 0, pad = parseFloat(cs.paddingTop) || 0;
      const content = last ? last.getBoundingClientRect().bottom - s.c.getBoundingClientRect().top : s.c.scrollHeight;
      s.h = Math.max(1, (content - pad + gap) / (Number(s.c.dataset.rep) || 2));
    }
  };
  measure();
  // pick up exactly where the CSS animation had got to
  x = Math.max(amp, Math.min(0, at(cols).x));
  st.forEach((s) => { s.y = at(s.c).y; });
  if (amp) { const u = Math.acos(Math.max(-1, Math.min(1, 1 - (2 * x) / amp))) / Math.PI; p = u; }
  // R4 fix 4 (Brand P1-4): in a page hero, each column glides (0.8 s) to a start where its label tiles are whole:
  // >= 12 px below the header edge, clear of the name box by >= 16 px or wholly behind it, for the first few seconds
  const dy = settleHero(cols, st, motionScale(reduced));
  let settle = dy && dy.some((v) => v) ? SETTLE_GLIDE_S : 0;
  const ro = new ResizeObserver(measure);
  ro.observe(cols);

  const ease = (u: number) => (1 - Math.cos(Math.PI * u)) / 2;
  const wrapY = (s: (typeof st)[number]) => { while (s.y <= -s.h) s.y += s.h; while (s.y > 0) s.y -= s.h; };
  const paint = () => {
    cols.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    for (const s of st) s.c.style.transform = `translate3d(0,${s.y.toFixed(2)}px,0)`;
  };

  const stopClock = clock(cols, (dt, now) => {
    const m = motionScale(reduced);
    if (settle > 0 && dy) {
      // R6 perf fix 3: an eased glide (smoothstep), so it starts and lands at drift speed: <= 48 px over 1.2 s peaks at 60 px/s
      const sstep = (u: number) => u * u * (3 - 2 * u);
      const u0 = 1 - settle / SETTLE_GLIDE_S; settle -= dt;
      const u1 = Math.min(1, 1 - Math.max(0, settle) / SETTLE_GLIDE_S);
      const f = sstep(u1) - sstep(u0);
      st.forEach((s, i) => { s.y += dy[i] * f; wrapY(s); });
      if (held || m === 0) { paint(); return; }
    }
    if (held || m === 0) return;
    // a painting under the mouse holds the wall still while it is lifted (CR-005), then it eases off again
    if (now < holdUntil) return;
    scale = Math.min(1, scale + dt / RAMP_S);
    const k = scale * scale * (3 - 2 * scale) * m;
    p = (p + (dt * k) / sway) % 2;
    x = amp * ease(p < 1 ? p : 2 - p);
    for (const s of st) { s.y += (s.down ? 1 : -1) * (s.h / s.dur) * dt * k; wrapY(s); }
    paint();
  });

  let x0 = 0;
  const y0: number[] = [];
  const stopGrab = grab(cols, {
    twoAxis: true,
    start() { held = true; x0 = x; st.forEach((s, i) => { y0[i] = s.y; }); },
    move(dx, dy) {
      x = Math.max(amp, Math.min(0, x0 + dx));
      st.forEach((s, i) => { s.y = y0[i] + dy; wrapY(s); });
      paint();
    },
    end() {
      held = false;
      // carry on from where it was left, in the direction it was going
      const u = amp ? Math.acos(Math.max(-1, Math.min(1, 1 - (2 * x) / amp))) / Math.PI : 0;
      p = p < 1 ? u : 2 - u;
      scale = 0;
      holdUntil = performance.now() + HOLD_MS;
    },
  });

  // the mouse resting on a tile pauses the wall (touch never does: a finger is either tapping or dragging)
  const over = (e: PointerEvent) => { if (e.pointerType === "mouse") hover = false; };
  const out = (e: PointerEvent) => { if (!cols.contains(e.relatedTarget as Node)) hover = false; };
  cols.addEventListener("pointerover", over);
  cols.addEventListener("pointerout", out);

  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  const onMq = () => { reduced = mq.matches; };
  mq.addEventListener("change", onMq);

  cols.classList.add("is-live");
  paint();
  return () => {
    stopClock(); stopGrab(); ro.disconnect(); mq.removeEventListener("change", onMq);
    cols.removeEventListener("pointerover", over); cols.removeEventListener("pointerout", out);
    cols.classList.remove("is-live");
  };
}

/** a sideways swipe or drag on `el` calls `step(+1)` (next) or `step(-1)` (previous); a plain tap is left alone */
export function swipe(el: HTMLElement, step: (d: 1 | -1) => void): Teardown {
  let last = 0;
  return grab(el, {
    start() { last = 0; },
    move(dx) { last = dx; el.style.setProperty("--pull", `${Math.max(-60, Math.min(60, dx * 0.35))}px`); },
    end() {
      el.style.removeProperty("--pull");
      if (Math.abs(last) > 40) step(last < 0 ? 1 : -1);
    },
  });
}
