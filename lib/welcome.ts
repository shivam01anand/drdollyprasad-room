/** the works the studio's welcome can show, one per visit in turn: her oil and charcoal canvases.
 *  [id, title, width / height]. The files are small WebPs (public/art/welcome, under 60 KB each). */
export const WELCOME_WORKS: [string, string, number][] = [
  ["rickshaw-puller-and-coin", "Twenty Paise", 0.765],
  ["rickshaw-rest-framed", "Ek Rupaya", 0.747],
  ["mother-and-child", "Aanchal", 0.746],
];

/** Runs in the page as it is parsed (app/studio/page.tsx), before the painting is fetched, so the
 *  painting chosen for this visit is the only one downloaded and is on screen at first paint
 *  (components/Preloader renders the empty frame it fills). */
export const welcomeScript = (v: string) => `(function(){var W=${JSON.stringify(WELCOME_WORKS)},n=0;
try{n=+(localStorage.getItem("dp:visit")||0)||0;localStorage.setItem("dp:visit",String(n+1))}catch(e){}
var w=W[n%W.length],f=document.querySelector(".pre-art");if(!f)return;
f.style.setProperty("--ar",String(w[2]));f.setAttribute("data-work",w[0]);
var s="/art/welcome/"+w[0]+".webp${v ? `?v=${v}` : ""}";f.querySelectorAll("img").forEach(function(i){i.src=s});
var t=f.querySelector(".pre-title");if(t)t.textContent="\\u201C"+w[1]+"\\u201D"})();`;
