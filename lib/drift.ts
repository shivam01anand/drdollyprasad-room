/**
 * Moving rows and the moving wall, by hand as well as by themselves
 * (Shubham, PR #11 review): every moving row or wall drifts gently on its own,
 * can be dragged with the mouse or swiped with a finger, lets a click or tap
 * open what is under it, and picks up its gentle motion again a moment after
 * it is let go. For anyone who has asked for reduced motion nothing moves by
 * itself, but dragging still works.
 *
 * One clock per row (requestAnimationFrame), paused while off screen or in a
 * hidden tab. Transforms only, so nothing on the page shifts.
 */

const HOLD_MS = 1400; // how long a let-go row rests before it drifts again
const RAMP_S = 1.6; // how long it takes to come back up to speed
const SLOP = 6; // px a pointer must travel before a press becomes a drag

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
  let lastX = 0, lastT = 0, vx = 0;
  let swallow = false;

  el.dataset.grab = "";
  const down = (e: PointerEvent) => {
    if (e.button !== 0 || id !== null) return;
    // a carousel inside another one (a roll inside the threads) handles its own gestures
    if ((e.target as Element).closest?.("[data-grab]") !== el) return;
    id = e.pointerId; sx = e.clientX; sy = e.clientY; dragging = false; abandoned = false;
    isTouch = e.pointerType !== "mouse";
    lastX = e.clientX; lastT = performance.now(); vx = 0;
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
    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    vx = 0.75 * ((e.clientX - lastX) / dt) * 1000 + 0.25 * vx;
    lastX = e.clientX; lastT = now;
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
    h.end(performance.now() - lastT > 90 ? 0 : vx);
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
  let still = reducedMotion();

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
    const resting = now < holdUntil || hover || focus || still;
    const target = resting ? 0 : dir * speed;
    // a fling slows over about half a second; the drift returns over RAMP_S
    const k = Math.abs(v) > speed * 1.2 ? 3.2 : 1 / RAMP_S * 2.2;
    v += (target - v) * Math.min(1, dt * k);
    x += v * dt;
    wrap();
    paint();
  });

  let x0 = 0;
  const stopGrab = grab(view, {
    start() { held = true; x0 = x; v = 0; },
    move(dx) { x = x0 + dx; wrap(); x0 = x - dx; paint(); },
    end(vx) { held = false; v = Math.max(-2600, Math.min(2600, vx)); holdUntil = performance.now() + HOLD_MS; },
  });

  // a trackpad's sideways swipe moves the row too
  const wheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    x -= e.deltaX; wrap(); paint(); v = 0;
    holdUntil = performance.now() + HOLD_MS;
  };
  view.addEventListener("wheel", wheel, { passive: false });

  const enter = (e: PointerEvent) => { if (o.pauseOnHover && e.pointerType === "mouse") hover = true; };
  const leave = () => { hover = false; };
  view.addEventListener("pointerenter", enter);
  view.addEventListener("pointerleave", leave);

  // the keyboard: a focused card is brought fully into view and the row waits
  const fin = (e: FocusEvent) => {
    focus = true;
    const t = e.target as HTMLElement;
    const r = t.getBoundingClientRect(), b = view.getBoundingClientRect();
    if (r.left < b.left + 16) x += b.left + 16 - r.left;
    else if (r.right > b.right - 16) x -= r.right - (b.right - 16);
    wrap(); paint();
  };
  const fout = (e: FocusEvent) => { if (!view.contains(e.relatedTarget as Node)) { focus = false; holdUntil = performance.now() + HOLD_MS; } };
  view.addEventListener("focusin", fin);
  view.addEventListener("focusout", fout);

  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  const onMq = () => { still = mq.matches; };
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
export function driftWall(cols: HTMLElement, o: { swaySeconds?: number } = {}): Teardown {
  const sway = o.swaySeconds ?? 70;
  const columns = Array.from(cols.querySelectorAll<HTMLElement>(":scope > .col"));
  const st = columns.map((c) => ({ c, down: c.classList.contains("down"), dur: parseFloat(c.style.getPropertyValue("--dur")) || 95, h: 1, y: 0 }));
  let amp = 0; // px, negative
  let p = 0; // sway phase, 0..2 (0→1 out, 1→2 back)
  let x = 0, scale = 1, holdUntil = 0, held = false;
  let still = reducedMotion();

  const measure = () => {
    const d = parseFloat(getComputedStyle(cols).getPropertyValue("--drift")) || 0;
    amp = (d / 100) * cols.offsetWidth;
    for (const s of st) s.h = Math.max(1, s.c.scrollHeight / 2);
  };
  measure();
  // pick up exactly where the CSS animation had got to
  x = Math.max(amp, Math.min(0, at(cols).x));
  st.forEach((s) => { s.y = at(s.c).y; });
  if (amp) { const u = Math.acos(Math.max(-1, Math.min(1, 1 - (2 * x) / amp))) / Math.PI; p = u; }
  const ro = new ResizeObserver(measure);
  ro.observe(cols);

  const ease = (u: number) => (1 - Math.cos(Math.PI * u)) / 2;
  const wrapY = (s: (typeof st)[number]) => { while (s.y <= -s.h) s.y += s.h; while (s.y > 0) s.y -= s.h; };
  const paint = () => {
    cols.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    for (const s of st) s.c.style.transform = `translate3d(0,${s.y.toFixed(2)}px,0)`;
  };

  const stopClock = clock(cols, (dt, now) => {
    if (held || still) return;
    if (now < holdUntil) return;
    scale = Math.min(1, scale + dt / RAMP_S);
    const k = scale * scale * (3 - 2 * scale);
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

  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  const onMq = () => { still = mq.matches; };
  mq.addEventListener("change", onMq);

  cols.classList.add("is-live");
  paint();
  return () => { stopClock(); stopGrab(); ro.disconnect(); mq.removeEventListener("change", onMq); cols.classList.remove("is-live"); };
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
