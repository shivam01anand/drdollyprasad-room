"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { motion, gsap, Flip, scrambleTo, reducedMotion } from "@/lib/motion";
import { BY_ID, LARGE, enquiry, quoted, type Work } from "@/lib/works";
import { XL } from "@/lib/xl";
import { ROOMS, hang, type Room } from "@/lib/rooms";
import { CloseLook } from "@/lib/closelook";

export type LightboxHandle = { open(id: string, from: HTMLImageElement | null): void };
type Dims = Record<string, { w: number; h: number }>;

/**
 * One work, large. The card's own image flies into place (Flip), the veil
 * comes up behind it, the details decode in. Closing flies it back to the
 * card it came from. The file upgrades to the 1800 px version once it is in.
 *
 * Two more ways to look, after Pascale Canal's viewer: a click goes close
 * to the brushwork (lib/closelook), and where she has stated the size the
 * work can be seen hanging in a room, at that size.
 */
const Lightbox = forwardRef<LightboxHandle, { dims: Dims; onOpenChange(open: boolean): void }>(
  function Lightbox({ dims, onOpenChange }, ref) {
    const root = useRef<HTMLDialogElement>(null);
    const veil = useRef<HTMLDivElement>(null);
    /** the paper the work is shown on: a card over the house, not a page in place of it */
    const card = useRef<HTMLDivElement>(null);
    const img = useRef<HTMLImageElement>(null);
    const title = useRef<HTMLHeadingElement>(null);
    const meta = useRef<HTMLDListElement>(null);
    const ask = useRef<HTMLAnchorElement>(null);
    const closeBtn = useRef<HTMLButtonElement>(null);
    const frame = useRef<HTMLDivElement>(null);
    const bar = useRef<HTMLDivElement>(null);
    const views = useRef<HTMLDivElement>(null);
    const roomBox = useRef<HTMLDivElement>(null);
    const roomPhoto = useRef<HTMLImageElement>(null);
    const roomArt = useRef<HTMLDivElement>(null);
    const roomImg = useRef<HTMLImageElement>(null);
    const roomCap = useRef<HTMLParagraphElement>(null);
    const hint = useRef<HTMLParagraphElement>(null);
    const look = useRef<CloseLook | null>(null);
    const view = useRef<string>("work");
    const cb = useRef(onOpenChange);
    cb.current = onOpenChange;
    const st = useRef<{ id: string | null; from: HTMLImageElement | null; anim: gsap.core.Animation[]; busy: boolean; at: number }>(
      { id: null, from: null, anim: [], busy: false, at: 0 });

    const kill = () => { st.current.anim.forEach((a) => a.kill()); st.current.anim = []; };
    const own = <T extends gsap.core.Animation>(a: T) => { st.current.anim.push(a); return a; };

    const fields = (w: Work): [string, string][] => [
      ["Series", w.series],
      ["Year", w.year ?? "—"],
      ["Medium", w.medium],
      // a size only where she has stated one
      ...(w.size ? [["Size", w.size] as [string, string]] : []),
      ["Status", w.status === "Enquire" ? "On enquiry" : w.status],
    ];

    /** where this work sits in a room; null when she has not stated its size */
    const placeIn = (w: Work, room: Room) => {
      const d = dims[w.id];
      return w.inches && d ? hang(room, w.inches, d.w / d.h) : null;
    };

    const setArt = (el: HTMLElement, pos: NonNullable<ReturnType<typeof placeIn>>) => {
      el.style.left = `${pos.left}%`; el.style.top = `${pos.top}%`;
      el.style.width = `${pos.width}%`; el.style.height = `${pos.height}%`;
      el.style.setProperty("--s", String(pos.width / 100));
    };

    /** painting, or a room: a quiet crossfade inside the figure */
    const show = (which: string, instant = false) => {
      const w = st.current.id ? BY_ID.get(st.current.id) : null;
      const fr = frame.current!, rb = roomBox.current!;
      if (!w) return;
      view.current = which;
      views.current?.querySelectorAll<HTMLButtonElement>("button").forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.view === which)));
      const room = ROOMS.find((r) => r.id === which);
      const reduce = reducedMotion() || instant;
      look.current?.reset(true);
      if (!room) {
        own(gsap.to(rb, { autoAlpha: 0, duration: reduce ? 0 : 0.25, onComplete: () => { rb.hidden = true; fr.hidden = false;
          own(gsap.fromTo(fr, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduce ? 0 : 0.45 })); } }));
        return;
      }
      const pos = placeIn(w, room)!;
      roomPhoto.current!.src = room.src;
      rb.style.aspectRatio = `${room.w} / ${room.h}`;
      setArt(roomArt.current!, pos);
      roomImg.current!.src = img.current!.currentSrc || img.current!.src;
      roomCap.current!.textContent = `Shown to scale · ${w.size}`;
      const swap = () => { fr.hidden = true; rb.hidden = false;
        own(gsap.fromTo(rb, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduce ? 0 : 0.5, ease: "power1.out" })); };
      if (fr.hidden) { own(gsap.to(rb, { autoAlpha: 0, duration: reduce ? 0 : 0.2, onComplete: swap })); }
      else own(gsap.to(fr, { autoAlpha: 0, duration: reduce ? 0 : 0.25, onComplete: swap }));
    };

    /** the view buttons: the painting, then each room it can be seen in */
    const buildViews = (w: Work, src: string) => {
      const v = views.current!;
      const rooms = ROOMS.filter((r) => placeIn(w, r));
      v.replaceChildren();
      v.hidden = rooms.length === 0;
      if (!rooms.length) return;
      const btn = (id: string, label: string) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "lb-view"; b.dataset.view = id;
        b.setAttribute("aria-pressed", String(id === "work")); b.setAttribute("aria-label", label); b.title = label;
        b.addEventListener("click", (e) => { e.stopPropagation(); if (view.current !== id) show(id); });
        return b;
      };
      const self = btn("work", "The painting");
      const im = document.createElement("img"); im.src = src; im.alt = ""; self.append(im);
      v.append(self);
      rooms.forEach((r) => {
        const b = btn(r.id, `In a room: ${r.label.toLowerCase()}`);
        const ph = document.createElement("img"); ph.src = r.thumb; ph.alt = "";
        const art = document.createElement("span"); art.className = "lb-view-art";
        const ai = document.createElement("img"); ai.src = src; ai.alt = ""; art.append(ai);
        setArt(art, placeIn(w, r)!);
        b.append(ph, art);
        v.append(b);
      });
    };

    const open = (id: string, from: HTMLImageElement | null) => {
      const w = BY_ID.get(id);
      const r = root.current, i = img.current;
      if (!w || !r || !i || st.current.id) return;
      st.current.at = performance.now();
      motion();
      kill();
      const reduce = reducedMotion();
      st.current.id = id;
      st.current.from = from;
      cb.current(true);

      const d = dims[id];
      if (d) { i.width = d.w; i.height = d.h; }
      i.src = from?.currentSrc || `/art/works/${id}.jpg`;
      i.alt = `${w.title} — ${w.medium.toLowerCase()}`;
      i.dataset.flipId = id;
      title.current!.textContent = "";
      const dl = meta.current!;
      dl.replaceChildren(...fields(w).flatMap(([k, v]) => {
        const dt = document.createElement("dt"); dt.textContent = k;
        const dd = document.createElement("dd"); dd.textContent = ""; dd.dataset.v = v;
        return [dt, dd];
      }));
      // every look starts at the painting itself
      frame.current!.hidden = false; roomBox.current!.hidden = true; view.current = "work";
      gsap.set([frame.current, roomBox.current], { clearProps: "opacity,visibility" });
      buildViews(w, i.src);
      if (hint.current) hint.current.textContent = matchMedia("(pointer: coarse)").matches
        ? "Tap to look closer" : "Click to look closer · scroll to zoom";
      ask.current!.href = enquiry(w);
      ask.current!.textContent = w.status === "Sold" ? "Ask about her work →" : "Enquire about this work →";
      if (!r.open) r.showModal();

      look.current?.enable(false);
      const landed = () => { if (st.current.id === id) look.current?.enable(true); };
      if (from && !reduce) {
        const state = Flip.getState(from);
        from.style.visibility = "hidden";
        own(Flip.from(state, { targets: i, duration: 0.6, ease: "power1.inOut", absolute: true, scale: true, onComplete: landed }));
      } else {
        own(gsap.fromTo(i, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: reduce ? 0 : 0.6, ease: "power2.out",
          onComplete: () => { gsap.set(i, { clearProps: "transform" }); landed(); } }));
      }
      own(gsap.fromTo(veil.current, { opacity: 0 }, { opacity: 1, duration: reduce ? 0 : 0.45 }));
      own(gsap.fromTo(card.current, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: reduce ? 0 : 0.5, ease: "power2.out" }));
      own(gsap.fromTo([title.current, meta.current], { autoAlpha: 1 }, { autoAlpha: 1, duration: 0 }));
      own(scrambleTo(title.current!, quoted(w.title), { anagram: true, speed: 0.6, duration: 1, delay: 0.4 }));
      dl.querySelectorAll<HTMLElement>("dd").forEach((dd, k) =>
        own(scrambleTo(dd, dd.dataset.v!, { anagram: true, speed: 0.6, duration: 1, delay: 0.45 + k * 0.05 })));
      own(gsap.fromTo(ask.current, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.7 }));

      if (LARGE.has(id)) {
        const hi = new Image();
        hi.src = `/art/large/${id}.jpg`;
        hi.decode().then(() => {
          if (st.current.id !== id || !img.current) return;
          if (!img.current.src.includes("/art/xl/")) img.current.src = hi.src;
          if (roomImg.current) roomImg.current.src = hi.src;
        }).catch(() => {});
      }
      // focus moves to the close, ringed only when the work was opened from the keyboard
      r.classList.toggle("by-pointer", !byKey.current);
      closeBtn.current?.focus({ preventScroll: true });
    };

    const close = () => {
      const r = root.current, i = img.current;
      if (!r || !i || !st.current.id || st.current.busy) return;
      st.current.busy = true;
      kill();
      look.current?.enable(false);
      if (view.current !== "work") {
        roomBox.current!.hidden = true; frame.current!.hidden = false; view.current = "work";
        gsap.set([frame.current, roomBox.current], { clearProps: "opacity,visibility" });
      }
      const reduce = reducedMotion();
      const from = st.current.from;
      const finish = () => {
        if (r.open) r.close();
        if (from) from.style.visibility = "";
        gsap.set([i, veil.current, card.current, ask.current, title.current, meta.current, r.querySelector(".lb-grid")],
          { clearProps: "all" });
        i.removeAttribute("src");
        const back = from?.closest<HTMLElement>("[tabindex], button, a");
        st.current.id = null;
        st.current.from = null;
        st.current.busy = false;
        cb.current(false);
        back?.focus({ preventScroll: true });
      };
      own(gsap.to(veil.current, { opacity: 0, duration: reduce ? 0 : 0.5 }));
      own(gsap.to(card.current, { autoAlpha: 0, y: 10, duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.1, ease: "power1.in" }));
      own(gsap.to([title.current, meta.current, ask.current], { autoAlpha: 0, duration: reduce ? 0 : 0.3 }));
      const visible = !!from && from.isConnected && (() => {
        const b = from.getBoundingClientRect();
        return b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth;
      })();
      if (from && visible && !reduce) {
        own(Flip.fit(i, from, { duration: 0.45, delay: 0.15, ease: "power1.inOut", onComplete: finish }) as gsap.core.Tween);
      } else {
        own(gsap.to(i, { autoAlpha: 0, duration: reduce ? 0 : 0.4, onComplete: finish }));
      }
    };

    /** was the last input a key? (a dialog opened by a click focuses its close without a ring) */
    const byKey = useRef(false);
    useEffect(() => {
      const key = () => { byKey.current = true; root.current?.classList.remove("by-pointer"); };
      const ptr = () => { byKey.current = false; };
      document.addEventListener("keydown", key, true);
      document.addEventListener("pointerdown", ptr, true);
      return () => { document.removeEventListener("keydown", key, true); document.removeEventListener("pointerdown", ptr, true); };
    }, []);

    /** a click on the backdrop closes — but not the tap that opened it: on a touch
     *  screen its click arrives after the work is open, wherever the work now isn't */
    const backdrop = () => { if (performance.now() - st.current.at > 450) close(); };

    useImperativeHandle(ref, () => ({ open }), []);

    // on a phone, a pull down from the top of the sheet puts the work away
    useEffect(() => {
      const r = root.current;
      const grid = r?.querySelector<HTMLElement>(".lb-grid");
      if (!r || !grid) return;
      let y0 = -1, dy = 0, pulling = false;
      const start = (e: TouchEvent) => {
        y0 = -1;
        if (e.touches.length !== 1 || frame.current?.classList.contains("is-zoomed") || grid.scrollTop > 0) return;
        y0 = e.touches[0].clientY; dy = 0; pulling = false;
      };
      const move = (e: TouchEvent) => {
        if (y0 < 0) return;
        dy = e.touches[0].clientY - y0;
        if (!pulling && dy > 10 && grid.scrollTop <= 0) pulling = true;
        if (!pulling) return;
        e.preventDefault();
        gsap.set([grid, card.current], { y: Math.max(0, dy) * 0.55 });
        gsap.set(veil.current, { opacity: Math.max(0.4, 1 - dy / 520) });
      };
      const end = () => {
        if (y0 < 0) return;
        y0 = -1;
        if (!pulling) return;
        pulling = false;
        if (dy <= 110) gsap.to([grid, card.current], { y: 0, duration: 0.25, ease: "power2.out" });
        if (dy > 110) close();
        else gsap.to(veil.current, { opacity: 1, duration: 0.25 });
      };
      grid.addEventListener("touchstart", start, { passive: true });
      grid.addEventListener("touchmove", move, { passive: false });
      grid.addEventListener("touchend", end);
      grid.addEventListener("touchcancel", end);
      return () => {
        grid.removeEventListener("touchstart", start);
        grid.removeEventListener("touchmove", move);
        grid.removeEventListener("touchend", end);
        grid.removeEventListener("touchcancel", end);
      };
      // close reads only refs
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const l = new CloseLook(frame.current!, img.current!, bar.current!, reducedMotion(), () => {
        // closeness wants the largest file there is
        const id = st.current.id;
        if (!id || !XL.has(id)) return;
        const hi = new Image();
        hi.src = `/art/xl/${id}.jpg`;
        hi.decode().then(() => { if (st.current.id === id && img.current) img.current.src = hi.src; }).catch(() => {});
      });
      look.current = l;
      return () => {
        l.dispose();
        look.current = null;
        kill();
        if (st.current.from) st.current.from.style.visibility = "";
      };
    }, []);

    return (
      <dialog className="lb" ref={root} aria-labelledby="lb-title" data-lenis-prevent=""
              onCancel={(e) => { e.preventDefault(); close(); }}>
        <div className="lb-veil" ref={veil} onClick={backdrop} />
        <div className="lb-card" ref={card} aria-hidden="true" />
        <div className="lb-grid">
          <figure className="lb-figure">
            <div className="lb-frame" ref={frame} data-cursor="Look closer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={img} alt="" />
              <div className="lb-zoombar" ref={bar} aria-hidden="true"><i /><span /></div>
            </div>
            <div className="lb-room" ref={roomBox} hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="lb-room-photo" ref={roomPhoto} alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="lb-room-art" ref={roomArt}><img ref={roomImg} alt="" /></div>
              <p className="lb-room-cap lab" ref={roomCap} />
            </div>
          </figure>
          <div className="lb-text">
            <button type="button" className="lb-close lab" ref={closeBtn} onClick={close} aria-label="Close">
              <span className="lb-close-word" aria-hidden="true">Close (X)</span>
              <svg className="lb-close-x" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg>
            </button>
            <h2 id="lb-title" className="lb-title" ref={title} />
            <dl className="lb-meta" ref={meta} />
            <div className="lb-views" ref={views} role="group" aria-label="Ways to see this work" hidden />
            <p className="lab lb-hint" ref={hint} />
            <a className="pill pill-solid" ref={ask} href="#">Enquire →</a>
          </div>
        </div>
      </dialog>
    );
  }
);

export default Lightbox;
