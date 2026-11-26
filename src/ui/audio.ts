// Audio stays in the UI so the combat engine and saves are independent of playback.
type Music = 'hub' | 'explore' | 'combat' | 'boss';

const themes = {
  hub: { beat: .76, roots: [45, 41, 48, 43], motif: [0, null, 7, null, 3, null, null, 7], rhythm: 0 },
  explore: { beat: .64, roots: [45, 46, 41, 43], motif: [0, null, 7, 3, null, 10, null, 7], rhythm: 1 },
  combat: { beat: .50, roots: [45, 45, 41, 43], motif: [0, 7, null, 3, 12, null, 10, 7], rhythm: 2 },
  boss: { beat: .44, roots: [45, 46, 42, 44], motif: [12, 6, 3, null, 0, 1, 6, 3], rhythm: 3 },
} satisfies Record<Music, { beat: number; roots: number[]; motif: (number | null)[]; rhythm: number }>;

type Tone = [from: number, to: number, duration: number, level: number, wave?: OscillatorType, delay?: number];
const cues = {
  select: [[430, 620, .055, .08, 'triangle']],
  card: [[280, 460, .10, .11, 'triangle']],
  hit: [[145, 55, .18, .24, 'triangle'], [710, 175, .08, .055, 'sawtooth']],
  heavy: [[105, 38, .26, .29, 'triangle'], [880, 130, .12, .075, 'sawtooth']],
  hurt: [[100, 43, .27, .29, 'triangle'], [185, 90, .19, .11, 'sawtooth']],
  guard: [[330, 290, .16, .18, 'triangle'], [790, 730, .28, .09]],
  mimic: [[330, 660, .28, .14, 'triangle'], [660, 330, .34, .10, 'sine', .08], [990, 880, .32, .07, 'sine', .14]],
  echo: [[650, 330, .20, .13, 'triangle'], [650, 330, .26, .08, 'sine', .13]],
  seal: [[820, 105, .33, .15, 'triangle'], [98, 70, .38, .13]],
  erosion: [[180, 76, .37, .14, 'triangle'], [186, 80, .33, .09, 'sine', .045]],
  phase: [[277, 220, .14, .11, 'triangle'], [220, 185, .22, .13, 'triangle', .095]],
  absorb: [[220, 440, .28, .15, 'triangle'], [523, 660, .34, .13, 'sine', .13], [784, 784, .48, .08, 'sine', .26]],
  victory: [[330, 330, .31, .18, 'triangle'], [440, 440, .36, .16, 'triangle', .13], [523, 523, .45, .15, 'sine', .26], [659, 659, .64, .14, 'triangle', .39]],
  defeat: [[294, 262, .25, .15, 'triangle'], [247, 196, .31, .14, 'triangle', .16], [147, 110, .61, .17, 'sine', .35]],
} satisfies Record<string, Tone[]>;

type Cue = keyof typeof cues;
type PlayingMusic = { theme: Music; source: AudioBufferSourceNode; gain: GainNode; start: number };
const volumeKey = 'mirror-protocol-audio-enabled';
const sampleRate = 22050;
const tau = 2 * Math.PI;
const musicLevel = .46;
const fadeIn = .44;

function hz(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

// Render one seamless four-bar loop on demand, then reuse it for the session.
function makeLoop(ctx: AudioContext, theme: Music) {
  const { beat, roots, motif, rhythm } = themes[theme];
  const bar = beat * 4;
  const buffer = ctx.createBuffer(1, Math.round(bar * roots.length * sampleRate), sampleRate);
  const samples = buffer.getChannelData(0);
  const note = (start: number, length: number, frequency: number, level: number, texture = 0) => {
    const first = Math.round(start * sampleRate);
    const count = Math.round(length * sampleRate);
    const phaseStep = tau * frequency / sampleRate;
    const attack = texture ? length * .32 : Math.min(.025, length * .15);
    const release = length * (texture ? .4 : .68);
    for (let i = 0; i < count && first + i < samples.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.min(1, t / attack, (length - t) / release);
      const phase = i * phaseStep;
      const harmonic = texture ? .22 * Math.sin(phase * 2.003) + .12 * Math.sin(phase * 3) : .20 * Math.sin(phase * 2);
      samples[first + i] += (Math.sin(phase) + harmonic) * envelope * level;
    }
  };
  roots.forEach((root, index) => {
    const start = index * bar;
    note(start, bar, hz(root - 12), .19, 1);
    note(start, bar, hz(root + (theme === 'boss' ? 6 : 7)), .075, 1);
    motif.forEach((interval, step) => {
      if (interval !== null) {
        const at = start + step * beat / 2;
        note(at, beat * .43, hz(root + 12 + interval), rhythm === 0 ? .065 : .085);
        if (step < 7) note(at + beat * .67, beat * .26, hz(root + 12 + interval), .026);
      }
    });
    for (let step = 0; step < 8; step++) {
      if (rhythm >= 2 && (step % 2 === 0 || (rhythm === 3 && step === 7))) {
        note(start + step * beat / 2, beat * .36, hz(root - 17), step % 4 === 0 ? .21 : .10);
      }
      if (rhythm && step % 2 === 1) {
        note(start + step * beat / 2, .042, hz(root + 36) * 1.061, rhythm >= 2 ? .048 : .027);
      }
    }
  });
  return buffer;
}

export function readSoundEnabled() {
  try { return localStorage.getItem(volumeKey) !== 'false'; } catch { return true; }
}

let enabled = readSoundEnabled();
let visible = true;
let scene: Music | null = 'hub';
let context: AudioContext | undefined;
let master: GainNode;
let resumePending = false;
let playing: PlayingMusic | undefined;
const loops = new Map<Music, AudioBuffer>();

function syncMusic() {
  if (!context) return;
  const next = enabled && visible && context.state === 'running' ? scene : null;
  if (playing?.theme === next || (!playing && !next)) return;
  const now = context.currentTime;
  if (playing) {
    const { source, gain, start } = playing;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(musicLevel * Math.min(1, (now - start) / fadeIn), now);
    gain.gain.linearRampToValueAtTime(0, now + .24);
    source.stop(now + .26);
    playing = undefined;
  }
  if (!next) return;

  let buffer = loops.get(next);
  if (!buffer) {
    buffer = makeLoop(context, next);
    loops.set(next, buffer);
  }
  const gain = context.createGain();
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(gain).connect(master);
  source.onended = () => { source.disconnect(); gain.disconnect(); };
  const start = context.currentTime;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(musicLevel, start + fadeIn);
  source.start(start);
  playing = { theme: next, source, gain, start };
}

export function activateAudio() {
  if (!enabled || !visible) return;
  if (!context) {
    const Audio = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Audio) return;
    try { context = new Audio(); } catch { return; }
    master = context.createGain();
    master.gain.value = .65;
    master.connect(context.destination);
    context.addEventListener('statechange', syncMusic);
  }
  if (context.state === 'running') {
    syncMusic();
  } else if (!resumePending && context.state !== 'closed') {
    resumePending = true;
    void context.resume().then(syncMusic).catch(() => {}).finally(() => { resumePending = false; });
  }
}

function updateMaster() {
  if (!context) return;
  const now = context.currentTime;
  master.gain.setTargetAtTime(enabled && visible ? .65 : 0, now, .015);
  syncMusic();
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
  try { localStorage.setItem(volumeKey, String(value)); } catch { /* Playback still works for this session. */ }
  updateMaster();
  if (enabled) activateAudio();
}

export function setAudioVisible(value: boolean) {
  visible = value;
  updateMaster();
  if (visible && context) activateAudio();
}

export function setMusic(value: Music | null) {
  scene = value;
  syncMusic();
}

export function playSound(cue: Cue, offset = 0) {
  const ctx = context;
  if (!enabled || !visible || !ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime + offset;
  for (const [from, to, duration, level, wave = 'sine', delay = 0] of cues[cue] as Tone[]) {
    const start = now + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(master);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + duration + .01);
  }
}
