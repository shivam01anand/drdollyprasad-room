"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { motion, gsap, Flip, scrambleTo, reducedMotion } from "@/lib/motion";
import { BY_ID, LARGE, enquiry, quoted, type Work } from "@/lib/works";

export type LightboxHandle = { open(id: string, from: HTMLImageElement | null): void };
type Dims = Record<string, { w: number; h: number }>;

/**
 * One work, large. The card's own image flies into place (Flip), the veil
 * comes up behind it, the details decode in. Closing flies it back to the
 * card it came from. The file upgrades to the 1800 px version once it is in.
 */
const Lightbox = forwardRef<LightboxHandle, { dims: Dims; onOpenChange(open: boolean): void }>(
  function Lightbox({ dims, onOpenChange }, ref) {
    const root = useRef<HTMLDialogElement>(null);
    const veil = useRef<HTMLDivElement>(null);
    const img = useRef<HTMLImageElement>(null);
    const title = useRef<HTMLHeadingElement>(null);
    const meta = useRef<HTMLDListElement>(null);
    const ask = useRef<HTMLAnchorElement>(null);
    const closeBtn = useRef<HTMLButtonElement>(null);
    const cb = useRef(onOpenChange);
    cb.current = onOpenChange;
    const st = useRef<{ id: string | null; from: HTMLImageElement | null; anim: gsap.core.Animation[]; busy: boolean }>(
      { id: null, from: null, anim: [], busy: false });

    const kill = () => { st.current.anim.forEach((a) => a.kill()); st.current.anim = []; };
    const own = <T extends gsap.core.Animation>(a: T) => { st.current.anim.push(a); return a; };

    const fields = (w: Work): [string, string][] => [
      ["Series", w.series],
      ["Year", w.year ?? "—"],
      ["Medium", w.medium],
      ["Size", w.size ?? "Not stated"],
      ["Status", w.status === "Enquire" ? "On enquiry" : w.status],
    ];

    const open = (id: string, from: HTMLImageElement | null) => {
      const w = BY_ID.get(id);
      const r = root.current, i = img.current;
      if (!w || !r || !i || st.current.id) return;
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
      ask.current!.href = enquiry(w);
      ask.current!.textContent = w.status === "Sold" ? "Ask about her work →" : "Enquire about this work →";
      if (!r.open) r.showModal();

      if (from && !reduce) {
        const state = Flip.getState(from);
        from.style.visibility = "hidden";
        own(Flip.from(state, { targets: i, duration: 0.6, ease: "power1.inOut", absolute: true, scale: true }));
      } else {
        own(gsap.fromTo(i, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: reduce ? 0 : 0.6, ease: "power2.out" }));
      }
      own(gsap.fromTo(veil.current, { opacity: 0 }, { opacity: 1, duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.2 }));
      own(gsap.fromTo([title.current, meta.current], { autoAlpha: 1 }, { autoAlpha: 1, duration: 0 }));
      own(scrambleTo(title.current!, quoted(w.title), { anagram: true, speed: 0.6, duration: 1, delay: 0.4 }));
      dl.querySelectorAll<HTMLElement>("dd").forEach((dd, k) =>
        own(scrambleTo(dd, dd.dataset.v!, { anagram: true, speed: 0.6, duration: 1, delay: 0.45 + k * 0.05 })));
      own(gsap.fromTo(ask.current, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.7 }));

      if (LARGE.has(id)) {
        const hi = new Image();
        hi.src = `/art/large/${id}.jpg`;
        hi.decode().then(() => { if (st.current.id === id && img.current) img.current.src = hi.src; }).catch(() => {});
      }
      closeBtn.current?.focus({ preventScroll: true });
    };

    const close = () => {
      const r = root.current, i = img.current;
      if (!r || !i || !st.current.id || st.current.busy) return;
      st.current.busy = true;
      kill();
      const reduce = reducedMotion();
      const from = st.current.from;
      const finish = () => {
        if (r.open) r.close();
        if (from) from.style.visibility = "";
        gsap.set([i, veil.current, ask.current, title.current, meta.current], { clearProps: "all" });
        i.removeAttribute("src");
        const back = from?.closest<HTMLElement>("[tabindex], button, a");
        st.current.id = null;
        st.current.from = null;
        st.current.busy = false;
        cb.current(false);
        back?.focus({ preventScroll: true });
      };
      own(gsap.to(veil.current, { opacity: 0, duration: reduce ? 0 : 0.6 }));
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

    useImperativeHandle(ref, () => ({ open }), []);

    useEffect(() => () => {
      kill();
      if (st.current.from) st.current.from.style.visibility = "";
    }, []);

    return (
      <dialog className="lb" ref={root} aria-labelledby="lb-title" data-lenis-prevent=""
              onCancel={(e) => { e.preventDefault(); close(); }}>
        <div className="lb-veil" ref={veil} onClick={close} />
        <div className="lb-grid" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <figure className="lb-figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={img} alt="" />
          </figure>
          <div className="lb-text">
            <button type="button" className="lb-close lab" ref={closeBtn} onClick={close}>Close (X)</button>
            <h2 id="lb-title" className="lb-title" ref={title} />
            <dl className="lb-meta" ref={meta} />
            <a className="pill pill-solid" ref={ask} href="#">Enquire →</a>
          </div>
        </div>
      </dialog>
    );
  }
);

export default Lightbox;
