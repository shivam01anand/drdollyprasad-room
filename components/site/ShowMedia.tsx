"use client";

import { useState } from "react";
import Gallery from "./Gallery";
import { dims } from "@/lib/images";
import type { Photo } from "@/lib/site";

const sm = (src: string) => src.replace("/site/ex/", "/site/ex/sm/");

/**
 * One exhibition's photographs, calmly (CR-005, replacing the slideshow's tabs,
 * arrows and timer): one photograph large in its thin black frame, and a small
 * strip of four under it. A photograph in the strip takes the large place; the
 * large one opens full screen with every photograph of the show (Gallery). When
 * a show has more than four, a last place in the strip says how many more.
 */
export default function ShowMedia({ photos, label }: { photos: Photo[]; label: string }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const strip = photos.slice(0, 4);
  const rest = photos.length - strip.length;
  const p = photos[i];
  return (
    <div className="sm-media">
      <button type="button" className="sm-hero" onClick={() => setOpen(i)} aria-label={`Open full screen: ${p.alt}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={p.src} src={p.src} alt={p.alt} loading="lazy" decoding="async" {...dims(p.src)} />
      </button>
      <p className="sm-cap">{p.alt}</p>
      {photos.length > 1 && (
        <div className="sm-strip" role="group" aria-label={`${label}: photographs`}>
          {strip.map((x, k) => (
            <button key={x.src} type="button" aria-current={k === i || undefined} onClick={() => setI(k)}
                    aria-label={`Show photograph ${k + 1}: ${x.alt}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sm(x.src)} alt="" loading="lazy" decoding="async" {...dims(sm(x.src))} />
            </button>
          ))}
          {rest > 0 && (
            <button type="button" className="sm-more" onClick={() => setOpen(strip.length)}
                    aria-label={`See all ${photos.length} photographs`}>
              +{rest}
            </button>
          )}
        </div>
      )}
      {open !== null && (
        <Gallery label={label} start={open} onClose={() => setOpen(null)} shots={photos.map((x) => ({ src: x.src, alt: x.alt, line: x.alt }))} />
      )}
    </div>
  );
}
