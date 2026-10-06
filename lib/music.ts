/**
 * The studio's music: a tanpura, the drone that opens a raag and holds an
 * evening together. Four strings — Pa below, Sa, Sa, and Sa an octave down —
 * plucked in their slow cycle, each note blooming and fading through the
 * jawari's buzz, in a warm room. Synthesised here (Karplus–Strong strings, a
 * moving formant for the jawari, a generated reverb): nothing to download.
 *
 * It starts only from a visitor's gesture (Step inside, or the sound
 * control), with a fresh AudioContext made inside that gesture — one made
 * earlier can lag or never start. The choice is remembered.
 */

const KEY = "dp:music";
const SA = 146.83;                                  // D3: a low, warm Sa
const STRINGS = [SA * 0.75, SA, SA, SA / 2];        // Pa (A2), Sa, Sa, Sa (D2)
const CYCLE = 4.6;                                  // seconds for the four plucks
const OFFSETS = [0, 1.25, 2.3, 3.35];
const GAIN = [0.8, 1.0, 0.95, 1.15];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let wet: ConvolverNode | null = null;
let buffers: AudioBuffer[] = [];
let timer = 0;
let out: AudioNode | null = null;
let nextCycle = 0;
let playing = false;
const listeners = new Set<(on: boolean) => void>();

/** the visitor's last choice; on unless they turned it off */
export function wanted() {
  try { return localStorage.getItem(KEY) !== "0"; } catch { return true; }
}

export const isPlaying = () => playing;
export function onChange(fn: (on: boolean) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
const emit = () => listeners.forEach((f) => f(playing));

/** a plucked string with a long, slowly darkening decay (Karplus–Strong, two detuned voices) */
function pluck(c: AudioContext, f: number, seconds = 7.5) {
  const sr = c.sampleRate, n = Math.floor(sr * seconds);
  const buf = c.createBuffer(1, n, sr);
  const out = buf.getChannelData(0);
  for (const [detune, amp] of [[0.9994, 0.55], [1.0006, 0.45]] as const) {
    const period = sr / (f * detune);
    const N = Math.floor(period), frac = period - N;
    const line = new Float32Array(N + 2);
    // a soft pluck: filtered noise, the thumb's flesh rather than a pick
    let lp = 0;
    for (let i = 0; i < line.length; i++) { lp = lp * 0.55 + (Math.random() * 2 - 1) * 0.45; line[i] = lp; }
    let idx = 0, prev = 0;
    for (let i = 0; i < n; i++) {
      const a = line[idx], b = line[(idx + 1) % line.length];
      const s = a + (b - a) * frac;
      // the loss: each round a little darker, a very long ring
      const y = 0.4985 * (s + prev);
      prev = s;
      line[idx] = y;
      idx = (idx + 1) % line.length;
      out[i] += y * amp;
    }
  }
  // a gentle attack, so no click
  for (let i = 0; i < 240; i++) out[i] *= i / 240;
  return buf;
}

/** a warm room: decaying filtered noise, a little wider on the right */
function room(c: AudioContext, seconds = 3.2) {
  const sr = c.sampleRate, n = Math.floor(sr * seconds);
  const ir = c.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      lp = lp * 0.82 + (Math.random() * 2 - 1) * 0.18;
      d[i] = lp * Math.pow(1 - i / n, 2.6) * (ch ? 1.05 : 1);
    }
  }
  return ir;
}

function note(at: number, k: number) {
  if (!ctx || !master || !wet) return;
  const src = ctx.createBufferSource();
  src.buffer = buffers[k];
  // the jawari: a formant that sweeps up through the overtones and back as the note blooms
  const form = ctx.createBiquadFilter();
  form.type = "bandpass";
  form.Q.value = 3.2;
  form.frequency.setValueAtTime(700, at);
  form.frequency.exponentialRampToValueAtTime(2600, at + 1.6);
  form.frequency.exponentialRampToValueAtTime(900, at + 5.5);
  const body = ctx.createBiquadFilter();
  body.type = "lowpass";
  body.frequency.value = 3200;
  const g = ctx.createGain(), gf = ctx.createGain();
  g.gain.value = GAIN[k] * 0.55;
  gf.gain.value = GAIN[k] * 0.55;
  src.connect(body).connect(g);
  src.connect(form).connect(gf);
  for (const node of [g, gf]) { node.connect(master); node.connect(wet); }
  src.start(at);
  src.stop(at + 7.4);
}

function schedule() {
  if (!ctx) return;
  while (nextCycle < ctx.currentTime + 2.5) {
    OFFSETS.forEach((o, k) => note(nextCycle + o + (Math.random() - 0.5) * 0.04, k));
    nextCycle += CYCLE;
  }
}

/** start, inside a gesture; fades in */
export function start() {
  if (playing) return;
  try { localStorage.setItem(KEY, "1"); } catch { /* private mode */ }
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 3;
      wet = ctx.createConvolver();
      wet.buffer = room(ctx);
      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.55;
      wet.connect(wetGain).connect(comp);
      master.connect(comp).connect(ctx.destination);
      out = comp;
      buffers = STRINGS.map((f) => pluck(ctx!, f));
      document.addEventListener("visibilitychange", onVisibility);
    }
    void ctx.resume();
    nextCycle = ctx.currentTime + 0.15;
    master!.gain.cancelScheduledValues(ctx.currentTime);
    master!.gain.setValueAtTime(master!.gain.value, ctx.currentTime);
    master!.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 5);
    schedule();
    clearInterval(timer);
    timer = window.setInterval(schedule, 400);
    playing = true;
    emit();
  } catch {
    playing = false;
  }
}

/** stop, with a short fade; remembered */
export function stop(remember = true) {
  if (remember) { try { localStorage.setItem(KEY, "0"); } catch { /* private mode */ } }
  if (!ctx || !master || !playing) { playing = false; emit(); return; }
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(0, t + 1.2);
  clearInterval(timer);
  playing = false;
  emit();
  const c = ctx;
  window.setTimeout(() => { if (!playing) void c.suspend(); }, 1400);
}

export function toggle() { if (playing) stop(); else start(); }

function onVisibility() {
  if (!ctx) return;
  if (document.hidden) void ctx.suspend();
  else if (playing) { void ctx.resume(); nextCycle = Math.max(nextCycle, ctx.currentTime + 0.1); }
}

/** development: the music as a stream, to record and measure it */
export function debugStream() {
  if (!ctx || !out) return null;
  const d = ctx.createMediaStreamDestination();
  out.connect(d);
  return d.stream;
}
