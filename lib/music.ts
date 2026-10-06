/**
 * The studio's music: a quiet room at dusk. A warm drone on D — sine voices,
 * gently detuned, under a slow, breathing low-pass — and now and then a soft
 * bell-like note from the D-major pentatonic, struck so lightly it is more
 * felt than heard, ringing out into a long, dark reverb. Nothing above the
 * mid-range is ever loud. Synthesised here: nothing to download.
 *
 * A browser lets sound begin only from a visitor's gesture, so it starts on
 * the first touch, click or key (components/Studio.tsx), or from the music
 * control, with a fresh AudioContext made inside that gesture. The choice is
 * remembered.
 */

const KEY = "dp:music";
const D3 = 146.83;
/** the drone: Sa, Pa and Sa above — low enough to be warm, high enough for a phone's speaker */
const DRONE = [D3, D3 * 1.5, D3 * 2];
const DRONE_GAIN = [0.3, 0.12, 0.1];
/** the bell's notes: D-major pentatonic, from the A below middle C up */
const BELLS = [220.0, 246.94, 293.66, 329.63, 369.99, 440.0, 493.88, 587.33];
const LEVEL = 0.1;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let space: ConvolverNode | null = null;
let out: AudioNode | null = null;
let voices: { stop(): void }[] = [];
let bellTimer = 0;
let playing = false;
const listeners = new Set<(on: boolean) => void>();

/** the visitor's last choice; on unless they turned it off */
export function wanted() {
  try { return localStorage.getItem(KEY) !== "0"; } catch { return true; }
}

export const isPlaying = () => playing;
export function onChange(fn: (on: boolean) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
const emit = () => listeners.forEach((f) => f(playing));

/** a large, soft room: dark decaying noise, a little different in each ear */
function room(c: AudioContext, seconds = 5.5) {
  const sr = c.sampleRate, n = Math.floor(sr * seconds);
  const ir = c.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let a = 0, b = 0;
    for (let i = 0; i < n; i++) {
      // twice low-passed: a warm tail with no hiss in it
      a = a * 0.93 + (Math.random() * 2 - 1) * 0.07;
      b = b * 0.8 + a * 0.2;
      d[i] = b * 3.2 * Math.pow(1 - i / n, 3) * (i < sr * 0.02 ? i / (sr * 0.02) : 1);
    }
  }
  return ir;
}

/** the drone: each note two sine voices a breath apart, under a slowly breathing filter */
function drone(c: AudioContext, dest: AudioNode) {
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.4;
  const lfo = c.createOscillator(), lfoGain = c.createGain();
  lfo.frequency.value = 0.045;                 // one breath every ~22 s
  lfoGain.gain.value = 260;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();
  const swell = c.createGain();
  swell.gain.value = 0.85;
  const swellLfo = c.createOscillator(), swellDepth = c.createGain();
  swellLfo.frequency.value = 0.031;
  swellDepth.gain.value = 0.15;
  swellLfo.connect(swellDepth).connect(swell.gain);
  swellLfo.start();
  filter.connect(swell).connect(dest);
  const oscs: OscillatorNode[] = [lfo, swellLfo];
  DRONE.forEach((f, k) => {
    for (const cents of [-1.2, 1.2]) {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.detune.value = cents + (Math.random() - 0.5) * 0.6;
      const g = c.createGain();
      g.gain.value = DRONE_GAIN[k] * 0.5;
      o.connect(g).connect(filter);
      o.start();
      oscs.push(o);
    }
  });
  return { stop: () => oscs.forEach((o) => { try { o.stop(); } catch { /* stopped */ } }) };
}

/** a soft bell: a sine and quiet partials, a slow strike, a long ring */
function bell(c: AudioContext, at: number, f: number, dry: AudioNode, wet: AudioNode) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(0.85, at + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0008, at + 6.5);
  const tone = c.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 1400;
  g.connect(tone);
  tone.connect(dry);
  tone.connect(wet);
  for (const [ratio, amp] of [[1, 1], [2.76, 0.12], [2, 0.18]] as const) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = f * ratio;
    const a = c.createGain();
    a.gain.value = amp;
    o.connect(a).connect(g);
    o.start(at);
    o.stop(at + 7);
  }
}

function scheduleBells() {
  if (!ctx || !master || !space || !playing) return;
  // one, sometimes two notes a few beats apart, then a long rest
  const at = ctx.currentTime + 0.1;
  bell(ctx, at, BELLS[Math.floor(Math.random() * BELLS.length)], master, space);
  if (Math.random() < 0.35) bell(ctx, at + 1.6 + Math.random(), BELLS[Math.floor(Math.random() * BELLS.length)], master, space);
  bellTimer = window.setTimeout(scheduleBells, 7000 + Math.random() * 7000);
}

/** start, inside a gesture; fades in slowly */
export function start() {
  if (playing) return;
  try { localStorage.setItem(KEY, "1"); } catch { /* private mode */ }
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      // a gentle ceiling on everything: no edge, no peak
      const soft = ctx.createBiquadFilter();
      soft.type = "lowpass";
      soft.frequency.value = 2600;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -24;
      comp.ratio.value = 2.5;
      comp.attack.value = 0.05;
      comp.release.value = 0.6;
      space = ctx.createConvolver();
      space.buffer = room(ctx);
      const wet = ctx.createGain();
      wet.gain.value = 0.7;
      space.connect(wet).connect(master);
      master.connect(soft).connect(comp).connect(ctx.destination);
      out = comp;
      document.addEventListener("visibilitychange", onVisibility);
    }
    void ctx.resume();
    const droneBus = ctx.createGain();
    droneBus.connect(master!);
    droneBus.connect(space!);
    voices.push(drone(ctx, droneBus));
    const t = ctx.currentTime;
    master!.gain.cancelScheduledValues(t);
    master!.gain.setValueAtTime(master!.gain.value, t);
    master!.gain.linearRampToValueAtTime(LEVEL, t + 6);
    playing = true;
    clearTimeout(bellTimer);
    bellTimer = window.setTimeout(scheduleBells, 3500);
    emit();
  } catch {
    playing = false;
  }
}

/** stop, with a slow fade; remembered */
export function stop(remember = true) {
  if (remember) { try { localStorage.setItem(KEY, "0"); } catch { /* private mode */ } }
  clearTimeout(bellTimer);
  if (!ctx || !master || !playing) { playing = false; emit(); return; }
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(0, t + 1.5);
  playing = false;
  emit();
  const c = ctx, vs = voices;
  voices = [];
  window.setTimeout(() => { vs.forEach((v) => v.stop()); if (!playing) void c.suspend(); }, 1700);
}

export function toggle() { if (playing) stop(); else start(); }

function onVisibility() {
  if (!ctx) return;
  if (document.hidden) void ctx.suspend();
  else if (playing) void ctx.resume();
}

/** development: the music as a stream, to record and measure it */
export function debugStream() {
  if (!ctx || !out) return null;
  const d = ctx.createMediaStreamDestination();
  out.connect(d);
  return d.stream;
}
