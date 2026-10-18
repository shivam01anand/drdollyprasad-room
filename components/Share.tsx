"use client";

import { useRef, useState } from "react";
import { paintingProperties, track } from "@/lib/analytics";
import { pagePainting } from "@/lib/analytics-interactions";

/**
 * Share one painting's page: a phone's own share sheet (WhatsApp, Messages,
 * mail), or on a computer the link copied, said so for a moment.
 */
export default function Share({ title, path, className = "pill" }: { title: string; path: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  const share = async () => {
    const url = new URL(path, location.origin).toString();
    const w = pagePainting(new URL(url).pathname);
    const painting = w ? paintingProperties(w) : {};
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title, url });
        track("painting_shared", { ...painting, method: "native_share" });
        return;
      }
      await navigator.clipboard.writeText(url);
      track("painting_shared", { ...painting, method: "copy_link" });
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch { /* the sheet was dismissed, or the clipboard refused */ }
  };
  return (
    <button type="button" className={className} onClick={share} aria-live="polite">
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
