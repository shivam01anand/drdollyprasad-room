import { BY_ID } from "./works";
import { paintingProperties, track } from "./analytics";

export function pagePainting(pathname = location.pathname) {
  const id = pathname.match(/^\/work\/([^/]+)\/?$/)?.[1];
  return id ? BY_ID.get(id) : undefined;
}

function selectedPainting(url?: URL) {
  const id = url?.searchParams.get("work") || url?.hash.match(/^#work=([^&]+)/)?.[1] ||
    document.querySelector<HTMLDialogElement>("dialog[open][data-painting-id]")?.dataset.paintingId;
  return (id && BY_ID.get(id)) || pagePainting();
}

function sourceOf(element: Element) {
  return element.closest<HTMLElement>("[data-analytics-source]")?.dataset.analyticsSource ||
    (element.closest("header") ? "header" : element.closest("footer") ? "footer" :
      element.closest(".lb") ? "studio_lightbox" : element.closest(".prevnext") ? "previous_next" : element.closest(".wp-side") ? "painting_details" :
        element.closest(".card") ? "painting_card" : element.closest(".collage") ? "home_collage" : "page_content");
}

/** Link intent covers server-rendered cards, client navigation and newly added paintings. */
export function observeAnalyticsInteractions() {
  const click = (event: MouseEvent) => {
    if (event.button > 1) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest<HTMLAnchorElement>("a[href]");
    if (!anchor) {
      const button = target.closest<HTMLButtonElement>("button, summary");
      if (button && !button.closest("form, [data-analytics-manual]")) {
        const label = button.getAttribute("aria-label") || button.getAttribute("title") || button.textContent?.trim();
        if (label) track("control_clicked", { control: label.slice(0, 120), source: sourceOf(button) });
      }
      return;
    }
    let destination: URL;
    try { destination = new URL(anchor.href, location.href); } catch { return; }
    const source = sourceOf(anchor);
    const w = selectedPainting(destination);
    const painting = w ? paintingProperties(w) : {};
    const contact = { ...painting, source, from_path: location.pathname };
    if (destination.protocol === "mailto:") {
      track("enquiry_handoff", { ...contact, method: "email" });
    } else if (["wa.me", "api.whatsapp.com", "web.whatsapp.com"].includes(destination.hostname)) {
      track("enquiry_handoff", { ...contact, method: "whatsapp" });
    } else if (destination.origin === location.origin) {
      const clicked = pagePainting(destination.pathname);
      if (clicked) track("painting_clicked", { ...paintingProperties(clicked), source, from_path: location.pathname });
      else if (destination.pathname === "/enquire") track("enquiry_clicked", { ...contact, method: "form" });
      else if (destination.pathname === "/studio") track("studio_clicked", contact);
      else track("navigation_clicked", { source, destination_path: destination.pathname, destination_section: destination.hash.slice(1, 100) });
    } else if (destination.protocol === "https:" || destination.protocol === "http:") {
      track("outbound_link_clicked", {
        ...painting, source,
        destination_host: destination.hostname,
        destination_path: destination.pathname,
        channel: /(^|\.)instagram\.com$/.test(destination.hostname) ? "instagram" : "external",
      });
    }
  };
  const video = (event: Event) => {
    if (!(event.target instanceof HTMLVideoElement)) return;
    track(event.type === "ended" ? "video_completed" : "video_played", {
      video_title: event.target.getAttribute("aria-label") || "Exhibition interview",
      video_path: new URL(event.target.currentSrc || event.target.querySelector("source")?.src || location.href).pathname,
    });
  };
  document.addEventListener("click", click, true);
  document.addEventListener("auxclick", click, true);
  document.addEventListener("play", video, true);
  document.addEventListener("ended", video, true);
  return () => {
    document.removeEventListener("click", click, true);
    document.removeEventListener("auxclick", click, true);
    document.removeEventListener("play", video, true);
    document.removeEventListener("ended", video, true);
  };
}
