/**
 * The studio's music: warm, unhurried and in a major key. A canon's progression in D — the
 * bass stepping down D, C♯, B, A, G, F♯ and back up through G and A — under a soft string
 * pad, and over it a felt piano that rolls the chords and now and then sings a short phrase in
 * the major pentatonic (the notes of Raga Bhupali). Every note is consonant with its chord; the
 * piano chooses its phrases afresh each time round, and sometimes rests. A medium room, not a
 * cathedral. Synthesised here: nothing to download.
 *
 * A browser lets sound begin only from a visitor's gesture, so it starts on the first touch,
 * click or key (components/Studio.tsx), or from the music control, with a fresh AudioContext
 * made inside that gesture. The choice is remembered.
 */

const KEY = "dp:music";
const D3 = 146.83;
/** a pitch, in semitones from D3 */
const hz = (semi: number) => D3 * Math.pow(2, semi / 12);
/** seconds a chord lasts */
const BAR = 7;
/** low: it sits under the room, it never leads (on by default, from the first gesture) */
const LEVEL = 0.2;

/** the progression: the bass (semitones from D3, an octave below sounding with it), the pad's
 *  voicing, and the chord's pitch classes (0 = D) for the piano */
type Chord = { bass: number; pad: number[]; pcs: number[] };
const PROG: Chord[] = [
  { bass: -12, pad: [4, 7, 12, 14], pcs: [0, 4, 7, 2] },     // D (add 9)
  { bass: -13, pad: [2, 7, 11, 14], pcs: [7, 11, 2] },       // A / C♯
  { bass: -15, pad: [4, 7, 9, 12], pcs: [9, 0, 4, 7] },      // Bm7
  { bass: -17, pad: [4, 7, 11, 16], pcs: [4, 7, 11] },       // F♯m / A
  { bass: -19, pad: [5, 9, 12, 14], pcs: [5, 9, 0, 2] },     // G6
  { bass: -20, pad: [4, 7, 12, 14], pcs: [0, 4, 7, 2] },     // D / F♯
  { bass: -19, pad: [5, 9, 12, 16], pcs: [5, 9, 0, 4] },     // Gmaj7
  { bass: -17, pad: [7, 11, 14, 19], pcs: [7, 11, 2] },      // A
];
/** the major pentatonic on D (Bhupali): D E F♯ A B */
const PENTA = [0, 2, 4, 7, 9];

type Rng = () => number;
function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** a room: a few early reflections, then a decaying warm tail, a little different in each ear */
function room(c: BaseAudioContext, seconds = 2.6) {
  const sr = c.sampleRate, n = Math.floor(sr * seconds);
  const ir = c.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let a = 0, b = 0;
    for (let i = 0; i < n; i++) {
      a = a * 0.55 + (Math.random() * 2 - 1) * 0.45;
      b = b * 0.45 + a * 0.55;
      const env = Math.pow(1 - i / n, 2.6) * (i < sr * 0.012 ? i / (sr * 0.012) : 1);
      d[i] = b * env * 0.9;
    }
    // early reflections off near walls
    for (const [ms, g] of [[11, 0.5], [19, 0.35], [29, 0.28], [41, 0.2]] as const) {
      const k = Math.floor(sr * (ms + ch * 1.7) / 1000);
      if (k < n) d[k] += g;
    }
  }
  return ir;
}

type Bus = { out: GainNode; wet: GainNode; stop(at: number): void };

/** the mix: a bus into a soft ceiling and a gentle compressor, with a send to the room */
function chain(c: BaseAudioContext, dest: AudioNode) {
  const master = c.createGain();
  master.gain.value = 0;
  const air = c.createBiquadFilter();
  air.type = "lowpass";
  air.frequency.value = 7200;
  air.Q.value = 0.5;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 2.5;
  comp.attack.value = 0.02;
  comp.release.value = 0.4;
  const verb = c.createConvolver();
  verb.buffer = room(c);
  const wetIn = c.createGain();
  wetIn.gain.value = 1;
  const wetOut = c.createGain();
  wetOut.gain.value = 0.42;
  wetIn.connect(verb).connect(wetOut).connect(master);
  master.connect(air).connect(comp).connect(dest);
  return { master, wetIn, comp };
}

/** the pad: each voice a triangle and two sawtooths a breath apart, warm under a low-pass;
 *  it swells in over the first seconds of its chord and lets go into the next */
function pad(c: BaseAudioContext, at: number, len: number, voicing: number[], bus: Bus) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(1, at + 2.6);
  g.gain.setValueAtTime(1, at + len);
  g.gain.linearRampToValueAtTime(0, at + len + 3.4);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 0.6;
  lp.frequency.setValueAtTime(820, at);
  lp.frequency.linearRampToValueAtTime(1350, at + len * 0.6);
  lp.frequency.linearRampToValueAtTime(900, at + len + 3);
  lp.connect(g);
  g.connect(bus.out);
  const send = c.createGain();
  send.gain.value = 0.32;
  g.connect(send).connect(bus.wet);
  const end = at + len + 3.6;
  for (const semi of voicing) {
    for (const [type, cents, amp] of [["triangle", -4, 0.05], ["sawtooth", 5, 0.019], ["sawtooth", -9, 0.014]] as const) {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.value = hz(semi);
      o.detune.value = cents;
      const a = c.createGain();
      a.gain.value = amp;
      o.connect(a).connect(lp);
      o.start(at);
      o.stop(end);
    }
  }
}

/** the bass: a sine on the root with its octave over it, so a small speaker hears it too */
function bass(c: BaseAudioContext, at: number, len: number, semi: number, bus: Bus) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(1, at + 1.4);
  g.gain.setValueAtTime(1, at + len);
  g.gain.linearRampToValueAtTime(0, at + len + 2.4);
  g.connect(bus.out);
  const send = c.createGain();
  send.gain.value = 0.12;
  g.connect(send).connect(bus.wet);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 520;
  lp.connect(g);
  for (const [mult, type, amp] of [[1, "sine", 0.045], [2, "triangle", 0.05]] as const) {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = hz(semi) * mult;
    const a = c.createGain();
    a.gain.value = amp;
    o.connect(a).connect(lp);
    o.start(at);
    o.stop(at + len + 2.6);
  }
}

/** a felt piano's note: a soft hammer, a few partials, the brightness dying faster than the tone */
function key(c: BaseAudioContext, at: number, semi: number, vel: number, bus: Bus) {
  const f = hz(semi);
  const ring = 2.4 + Math.max(0, 26 - semi) * 0.06;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vel, at + 0.008);
  g.gain.exponentialRampToValueAtTime(vel * 0.42, at + 0.32);
  g.gain.exponentialRampToValueAtTime(0.0001, at + ring);
  const tone = c.createBiquadFilter();
  tone.type = "lowpass";
  tone.Q.value = 0.4;
  tone.frequency.setValueAtTime(Math.min(6000, f * 9), at);
  tone.frequency.exponentialRampToValueAtTime(Math.max(600, f * 2.8), at + 0.9);
  const pan = c.createStereoPanner();
  pan.pan.value = Math.max(-0.45, Math.min(0.45, (semi - 18) / 22));
  g.connect(tone).connect(pan);
  pan.connect(bus.out);
  const send = c.createGain();
  send.gain.value = 0.4;
  pan.connect(send).connect(bus.wet);
  for (const [n, amp] of [[1, 1], [2, 0.36], [3, 0.12], [4, 0.05], [5, 0.025]] as const) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = f * n * Math.pow(1.0004, n * n);      // a piano's strings stretch a little
    const a = c.createGain();
    a.gain.value = amp;
    o.connect(a).connect(g);
    o.start(at);
    o.stop(at + ring + 0.05);
  }
}

/** the notes of a chord (or the pentatonic) within a range, ascending */
function notes(pcs: number[], lo: number, hi: number) {
  const out: number[] = [];
  for (let s = lo; s <= hi; s++) if (pcs.includes(((s % 12) + 12) % 12)) out.push(s);
  return out;
}

/** what the piano plays over one chord: a roll up or down, a short phrase, a single note, or rest */
function phrase(chord: Chord, t: number, rnd: Rng, prev: { note: number; quiet: number }, bus: Bus, c: BaseAudioContext) {
  const tones = notes(chord.pcs, 12, 26);
  const scale = notes(PENTA, 12, 28);
  const nearest = (pool: number[], to: number) => pool.reduce((a, b) => (Math.abs(b - to) < Math.abs(a - to) ? b : a), pool[0]);
  if (prev.quiet > 0) { prev.quiet--; return; }
  const r = rnd();
  if (r < 0.1) { prev.quiet = 1; return; }                           // a breath
  if (r < 0.42) {
    // a roll through the chord, up (mostly) or down
    const up = rnd() < 0.7;
    const run = (up ? tones : [...tones].reverse()).slice(0, 4 + Math.floor(rnd() * 2));
    const step = 0.5 + rnd() * 0.22;
    run.forEach((s, k) => key(c, t + 0.25 + k * step, s, (k === 0 ? 0.75 : 0.55) * (0.85 + rnd() * 0.15), bus));
    prev.note = run[run.length - 1];
    return;
  }
  if (r < 0.82) {
    // a phrase: from a chord tone near the last note, stepwise through the pentatonic, home on a chord tone
    let s = nearest(tones, prev.note);
    let at = t + 0.3 + rnd() * 0.3;
    const len = 3 + Math.floor(rnd() * 3);
    for (let k = 0; k < len; k++) {
      const last = k === len - 1;
      key(c, at, s, (k === 0 ? 0.72 : 0.58) * (0.85 + rnd() * 0.15), bus);
      const dur = last ? 1.6 : [0.48, 0.48, 0.72, 0.96][Math.floor(rnd() * 4)];
      at += dur;
      if (at > t + BAR - 0.4) break;
      const i = scale.indexOf(nearest(scale, s));
      const move = rnd() < 0.75 ? (rnd() < 0.5 ? -1 : 1) : (rnd() < 0.5 ? -2 : 2);
      s = scale[Math.max(0, Math.min(scale.length - 1, i + move))];
      if (k === len - 2) s = nearest(tones, s);                       // the last note rests on the chord
    }
    prev.note = s;
    return;
  }
  // one note, held: the chord's top
  const s = tones[tones.length - 1 - Math.floor(rnd() * 2)];
  key(c, t + 0.4, s, 0.6, bus);
  prev.note = s;
}

type Parts = { pad?: boolean; bass?: boolean; keys?: boolean };

/** the song from bar `from.bar` at time `from.t`, scheduled up to `until` */
function compose(c: BaseAudioContext, bus: Bus, pos: { t: number; bar: number }, until: number, rnd: Rng,
  prev: { note: number; quiet: number }, parts: Parts = {}) {
  const { pad: withPad = true, bass: withBass = true, keys: withKeys = true } = parts;
  const keysBus: Bus = withKeys ? bus : { ...bus, out: c.createGain(), wet: c.createGain() };
  while (pos.t < until) {
    const chord = PROG[pos.bar % PROG.length];
    if (withPad) pad(c, pos.t, BAR, chord.pad, bus);
    if (withBass) bass(c, pos.t, BAR, chord.bass, bus);
    // the first time round the piano only rolls the chords; after that it sings as well
    if (pos.bar < 2) {
      const tones = notes(chord.pcs, 12, 26);
      tones.slice(0, 4).forEach((s, k) => key(c, pos.t + 0.6 + k * 0.62, s, 0.5, keysBus));
      prev.note = tones[3] ?? prev.note;
    } else {
      phrase(chord, pos.t, rnd, prev, keysBus, c);
    }
    pos.t += BAR;
    pos.bar++;
  }
}

let ctx: AudioContext | null = null;
let mix: ReturnType<typeof chain> | null = null;
let live: { bus: Bus; timer: number } | null = null;
let playing = false;
const listeners = new Set<(on: boolean) => void>();

/** the visitor's last choice; on unless they turned it off */
export function wanted() {
  try { return localStorage.getItem(KEY) !== "0"; } catch { return true; }
}

export const isPlaying = () => playing;
/** the browser may have left the context suspended (a start before any real gesture): a later gesture wakes it */
export function wake() {
  if (!ctx || !playing) return false;
  if (ctx.state === "suspended") void ctx.resume();
  return ctx.state === "running";
}
export function onChange(fn: (on: boolean) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
const emit = () => listeners.forEach((f) => f(playing));

/** a bus for one playing: what it scheduled is let go together when it stops */
function newBus(c: BaseAudioContext, m: NonNullable<typeof mix>): Bus {
  const out = c.createGain(), wet = c.createGain();
  out.connect(m.master);
  wet.connect(m.wetIn);
  return {
    out, wet,
    stop(at: number) {
      out.gain.setValueAtTime(out.gain.value, at);
      out.gain.linearRampToValueAtTime(0, at + 1.2);
      wet.gain.setValueAtTime(wet.gain.value, at);
      wet.gain.linearRampToValueAtTime(0, at + 1.2);
      window.setTimeout(() => { out.disconnect(); wet.disconnect(); }, 1500);
    },
  };
}

/** start, inside a gesture; fades in slowly */
export function start() {
  if (playing) return;
  try { localStorage.setItem(KEY, "1"); } catch { /* private mode */ }
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      mix = chain(ctx, ctx.destination);
      document.addEventListener("visibilitychange", onVisibility);
    }
    void ctx.resume();
    const c = ctx, m = mix!;
    const bus = newBus(c, m);
    const rnd = seeded((Math.random() * 2 ** 31) | 0);
    const pos = { t: c.currentTime + 0.15, bar: 0 };
    const prev = { note: 19, quiet: 0 };
    // a few seconds ahead at a time, so a hidden tab costs nothing and a stop lets go quickly
    const ahead = () => compose(c, bus, pos, c.currentTime + 4, rnd, prev);
    ahead();
    live = { bus, timer: window.setInterval(ahead, 1000) };
    const t = c.currentTime;
    m.master.gain.cancelScheduledValues(t);
    m.master.gain.setValueAtTime(m.master.gain.value, t);
    m.master.gain.linearRampToValueAtTime(LEVEL, t + 5);
    playing = true;
    emit();
  } catch {
    playing = false;
  }
}

/** stop, with a slow fade; remembered */
export function stop(remember = true) {
  if (remember) { try { localStorage.setItem(KEY, "0"); } catch { /* private mode */ } }
  if (!ctx || !mix || !playing) { playing = false; emit(); return; }
  const c = ctx, t = c.currentTime;
  mix.master.gain.cancelScheduledValues(t);
  mix.master.gain.setValueAtTime(mix.master.gain.value, t);
  mix.master.gain.linearRampToValueAtTime(0, t + 1.5);
  if (live) {
    clearInterval(live.timer);
    live.bus.stop(t + 0.3);
    live = null;
  }
  playing = false;
  emit();
  window.setTimeout(() => { if (!playing) void c.suspend(); }, 1800);
}

export function toggle() { if (playing) stop(); else start(); }

function onVisibility() {
  if (!ctx) return;
  if (document.hidden) void ctx.suspend();
  else if (playing) void ctx.resume();
}

/** development: the music as a stream, to record and measure it */
export function debugStream() {
  if (!ctx || !mix) return null;
  const d = ctx.createMediaStreamDestination();
  mix.comp.connect(d);
  return d.stream;
}

/** development: `seconds` of the music rendered offline, as a 16-bit stereo WAV in base64 */
export async function renderPreview(seconds = 60, seed = 7, parts: Parts = {}) {
  const sr = 44100;
  const c = new OfflineAudioContext(2, Math.ceil(sr * seconds), sr);
  const m = chain(c, c.destination);
  m.master.gain.setValueAtTime(0, 0);
  m.master.gain.linearRampToValueAtTime(LEVEL, 5);
  m.master.gain.setValueAtTime(LEVEL, seconds - 4);
  m.master.gain.linearRampToValueAtTime(0, seconds);
  const out = c.createGain(), wet = c.createGain();
  out.connect(m.master);
  wet.connect(m.wetIn);
  const bus: Bus = { out, wet, stop() { /* offline: nothing to let go */ } };
  compose(c, bus, { t: 0.15, bar: 0 }, seconds, seeded(seed), { note: 19, quiet: 0 }, parts);
  const buf = await c.startRendering();
  const n = buf.length, data = new DataView(new ArrayBuffer(44 + n * 4));
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) data.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); data.setUint32(4, 36 + n * 4, true); str(8, "WAVE"); str(12, "fmt ");
  data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 2, true);
  data.setUint32(24, sr, true); data.setUint32(28, sr * 4, true); data.setUint16(32, 4, true); data.setUint16(34, 16, true);
  str(36, "data"); data.setUint32(40, n * 4, true);
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  for (let i = 0; i < n; i++) {
    data.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true);
    data.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true);
  }
  let bin = "";
  const bytes = new Uint8Array(data.buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
