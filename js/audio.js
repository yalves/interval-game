// Audio engine: recorded instruments (sampled, pitch-shifted to the nearest
// note) with a synthesized piano as fallback when samples can't load.

const NOTE_DURATION = 2.4;
const TARGET_RMS = 0.12;
const SAMPLE_LOAD_TIMEOUT = 3000;

const NOTE_INDEX = { C: 0, Cs: 1, D: 2, Ds: 3, E: 4, F: 5, Fs: 6, G: 7, Gs: 8, A: 9, As: 10, B: 11 };

// Salamander Grand Piano (Alexander Holm) and nylon guitar from
// tonejs-instruments (Freesound #11573), both CC-BY 3.0. See CREDITS.md.
export const INSTRUMENTS = {
  piano: ['C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4', 'C5', 'Ds5', 'Fs5', 'A5'],
  guitar: ['B2', 'D3', 'Fs3', 'A3', 'Cs4', 'E4', 'Gs4', 'B4', 'Ds5', 'Fs5', 'A5'],
  synth: [],
};

// Relative amplitude of each partial of the synthesized piano.
const PARTIALS = [1, 0.55, 0.3, 0.2, 0.12, 0.08, 0.05, 0.03];
// String inharmonicity: upper partials are slightly sharp.
const INHARMONICITY = 0.0004;

let ctx = null;
let master = null;
let currentBus = null;
let instrument = 'piano';
let volume = 0.8;
const sampleSets = {};

function sampleUrl(name, note) {
  return `samples/${name}/${note}.mp3`;
}

function noteToMidi(note) {
  return (Number(note.at(-1)) + 1) * 12 + NOTE_INDEX[note.slice(0, -1)];
}

function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const compressor = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(compressor);
    compressor.connect(ctx.destination);
    playThroughSilentSwitch();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// iPhones mute web audio when the ring/silent switch is off. Asking for a
// "playback" audio session (Safari 17+) or keeping a silent <audio> element
// playing (older iOS) routes sound like a media app instead.
function playThroughSilentSwitch() {
  if (navigator.audioSession) {
    try {
      navigator.audioSession.type = 'playback';
    } catch {
      // Not supported: nothing to do.
    }
    return;
  }
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS) return;
  const element = document.createElement('audio');
  element.src = URL.createObjectURL(silentWav());
  element.loop = true;
  element.setAttribute('playsinline', '');
  element.play().catch(() => {});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) element.pause();
    else element.play().catch(() => {});
  });
}

function silentWav() {
  const samples = 4000;
  const view = new DataView(new ArrayBuffer(44 + samples));
  const text = (offset, value) => [...value].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples, true);
  text(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, 8000, true); // sample rate
  view.setUint32(28, 8000, true); // byte rate
  view.setUint16(32, 1, true); // block align
  view.setUint16(34, 8, true); // bits per sample
  text(36, 'data');
  view.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) view.setUint8(44 + i, 128);
  return new Blob([view], { type: 'audio/wav' });
}

export function setVolume(value) {
  volume = value;
  if (master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
}

export function setInstrument(name) {
  instrument = name in INSTRUMENTS ? name : 'piano';
  prefetch();
}

// Downloads the current instrument's samples ahead of time (decoding needs an
// AudioContext, which browsers only allow after the first tap).
export function prefetch() {
  for (const note of INSTRUMENTS[instrument]) fetch(sampleUrl(instrument, note)).catch(() => {});
}

function loadSamples(name) {
  sampleSets[name] ??= Promise.all(
    INSTRUMENTS[name].map(async (note) => {
      const response = await fetch(sampleUrl(name, note));
      if (!response.ok) throw new Error(`Sample ${note} failed to load`);
      const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
      return [noteToMidi(note), { buffer, gain: normalizingGain(buffer) }];
    }),
  )
    .then((entries) => new Map(entries))
    .catch((error) => {
      delete sampleSets[name];
      throw error;
    });
  return sampleSets[name];
}

// Recorded notes vary a lot in loudness; scale each to the same RMS level.
function normalizingGain(buffer) {
  const data = buffer.getChannelData(0);
  const length = Math.min(data.length, buffer.sampleRate);
  let sum = 0;
  for (let i = 0; i < length; i++) sum += data[i] * data[i];
  return TARGET_RMS / Math.max(Math.sqrt(sum / length), 0.005);
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

export function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

// Each playback gets its own bus so the previous one can be silenced.
function newBus() {
  if (currentBus) {
    const old = currentBus;
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    setTimeout(() => old.disconnect(), 500);
  }
  currentBus = ctx.createGain();
  currentBus.connect(master);
  return currentBus;
}

function playSample(samples, bus, midi, when) {
  let nearest = null;
  for (const key of samples.keys()) {
    if (nearest === null || Math.abs(key - midi) < Math.abs(nearest - midi)) nearest = key;
  }
  const { buffer, gain } = samples.get(nearest);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = 2 ** ((midi - nearest) / 12);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(gain, when);
  envelope.gain.setTargetAtTime(0, when + NOTE_DURATION, 0.15);
  source.connect(envelope);
  envelope.connect(bus);
  source.start(when);
  source.stop(when + NOTE_DURATION + 1);
}

function playSynthNote(bus, midi, when) {
  const freq = midiToFrequency(midi);

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, when);
  envelope.gain.linearRampToValueAtTime(0.32, when + 0.006);
  envelope.gain.exponentialRampToValueAtTime(0.1, when + 0.5);
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + NOTE_DURATION);

  // The timbre darkens as the note decays.
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.5;
  filter.frequency.setValueAtTime(Math.min(freq * 10, 14000), when);
  filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 2.5, 500), when + NOTE_DURATION);

  filter.connect(envelope);
  envelope.connect(bus);

  PARTIALS.forEach((amplitude, i) => {
    const n = i + 1;
    const partialFreq = freq * n * Math.sqrt(1 + INHARMONICITY * n * n);
    if (partialFreq > 16000) return;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = partialFreq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(amplitude, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + NOTE_DURATION / (1 + i * 0.45));

    osc.connect(gain);
    gain.connect(filter);
    osc.start(when);
    osc.stop(when + NOTE_DURATION + 0.05);
  });

  // Hammer attack: a short burst of filtered noise.
  const noiseLength = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < noiseLength; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / noiseLength);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = Math.min(freq * 4, 6000);
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.05;
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(bus);
  noise.start(when);
}

// Plays groups of notes (each group sounds together), `gap` seconds apart.
// Returns roughly how long it sounds, in seconds.
export function playGroups(groups, gap) {
  audio();
  const bus = newBus();
  const schedule = (voice) => {
    const start = ctx.currentTime + 0.05;
    groups.forEach((group, i) => group.forEach((note) => voice(bus, note, start + i * gap)));
  };

  if (INSTRUMENTS[instrument].length === 0) {
    schedule(playSynthNote);
  } else {
    withTimeout(loadSamples(instrument), SAMPLE_LOAD_TIMEOUT)
      .then((samples) => schedule((...args) => playSample(samples, ...args)))
      .catch(() => schedule(playSynthNote));
  }
  return (groups.length - 1) * gap + NOTE_DURATION * 0.6;
}

// Plays the notes one after another ('melodic') or together ('harmonic').
export function playNotes(notes, mode) {
  return mode === 'melodic' ? playGroups(notes.map((n) => [n]), notes.length > 2 ? 0.55 : 0.9) : playGroups([notes], 0);
}
