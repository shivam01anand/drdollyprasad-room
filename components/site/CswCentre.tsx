"use client";
import { useEffect, useRef } from "react";

/** phones: bring the current collection into view in the switcher's scroll row, once, without smooth scrolling */
export default function CswCentre() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const row = ref.current?.closest(".csw")?.querySelector<HTMLElement>(".csw-in");
    const cur = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!row || !cur || row.scrollWidth <= row.clientWidth) return;
    // the same as scrollIntoView({inline:"center", block:"nearest"}), but it can never move the page itself
    const r = row.getBoundingClientRect(), c = cur.getBoundingClientRect();
    row.scrollLeft += c.left + c.width / 2 - (r.left + r.width / 2);
  }, []);
  return <span ref={ref} hidden />;
}
