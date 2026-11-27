/**
 * For a strip that moves by itself (the wall, a marquee): its pictures are lazy, so the page opens on
 * the ones in view only. Once everything else has loaded, fetch the rest in the background, so nothing
 * drifts into view empty. Returns the cleanup.
 */
export function loadRestWhenSettled(el: HTMLElement): () => void {
  let timer = 0;
  const rest = () => {
    timer = window.setTimeout(() => el.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => { img.loading = "eager"; }), 600);
  };
  if (document.readyState === "complete") rest();
  else window.addEventListener("load", rest, { once: true });
  return () => { window.removeEventListener("load", rest); window.clearTimeout(timer); };
}
