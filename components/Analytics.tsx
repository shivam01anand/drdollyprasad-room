"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BY_ID } from "@/lib/works";
import { analyticsUrl, initAnalytics, paintingProperties, track } from "@/lib/analytics";
import { observeAnalyticsInteractions, pagePainting } from "@/lib/analytics-interactions";

/** Independent of either visual layout, so the website and /studio share a visitor/session. */
export default function Analytics() {
  const path = usePathname();
  useEffect(() => {
    const stop = observeAnalyticsInteractions();
    // Start a separate SDK chunk after the app hydrates; record early actions in a small queue.
    const timer = window.setTimeout(() => { void initAnalytics(); }, 0);
    return () => { clearTimeout(timer); stop(); };
  }, []);

  useEffect(() => {
    if (!path) return;
    const w = pagePainting(path);
    const query = new URLSearchParams(location.search);
    const enquiryWork = path === "/enquire" ? BY_ID.get(query.get("work") || "") : undefined;
    const pageType = w ? "painting" : path === "/" ? "home" : path.split("/").filter(Boolean)[0] || "other";
    const page = {
      page_view_id: crypto.randomUUID(),
      page_type: pageType,
      page_path: path,
      page_url: analyticsUrl(location.href),
      $pathname: path,
      $current_url: analyticsUrl(location.href),
      ...(w ? paintingProperties(w) : {}),
    };
    track("$pageview", page);
    if (w) track("painting_viewed", { ...page, surface: "painting_page" });
    if (path === "/enquire") track("enquiry_viewed", { ...page, ...(enquiryWork ? paintingProperties(enquiryWork) : {}) });
    if (path === "/works") track("works_viewed", page);
    if (/^\/series\/[^/]+/.test(path)) track("collection_viewed", { ...page, collection_slug: path.split("/")[2] });
    if (path === "/studio") track("studio_viewed", page);

    const start = performance.now();
    let visibleAt: number | null = document.hidden ? null : start;
    let activeMs = 0;
    let maxScroll = 0;
    let scrollTimer = 0;
    let left = false;
    const milestones = new Set<number>();
    const scroll = () => {
      // The studio already reports settled chapters; never add work to its animation loop.
      if (path === "/studio" || scrollTimer) return;
      scrollTimer = window.setTimeout(() => {
        scrollTimer = 0;
        const height = document.documentElement.scrollHeight - innerHeight;
        const percent = height > 0 ? Math.min(100, Math.round(scrollY / height * 100)) : 100;
        maxScroll = Math.max(maxScroll, percent);
        for (const mark of [25, 50, 75, 100]) if (percent >= mark && !milestones.has(mark)) {
          milestones.add(mark);
          track("page_scrolled", { ...page, scroll_percent: mark });
        }
      }, 250);
    };
    const activity = (reason: string) => {
      if (left) return;
      const now = performance.now();
      track("page_engagement", {
        ...page,
        reason,
        duration_seconds: Math.round((now - start) / 1000),
        visible_seconds: Math.round((activeMs + (visibleAt === null ? 0 : now - visibleAt)) / 1000),
        max_scroll_percent: maxScroll,
      });
    };
    const visibility = () => {
      if (document.hidden) {
        if (visibleAt !== null) activeMs += performance.now() - visibleAt;
        visibleAt = null;
        activity("tab_hidden");
      } else visibleAt ??= performance.now();
    };
    const hide = () => { activity("page_left"); left = true; };
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("pagehide", hide);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      activity("navigation");
      clearTimeout(scrollTimer);
      removeEventListener("scroll", scroll);
      removeEventListener("pagehide", hide);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [path]);

  return null;
}
