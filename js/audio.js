// Piano synthesized with the Web Audio API (additive synthesis), no audio files.

const NOTE_DURATION = 2.4;
const MELODIC_GAP = 0.9;

// Relative amplitude of each partial.
const PARTIALS = [1, 0.55, 0.3, 0.2, 0.12, 0.08, 0.05, 0.03];
// String inharmonicity: upper partials are slightly sharp.
const INHARMONICITY = 0.0004;

let ctx = null;
let master = null;
let currentBus = null;

function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const compressor = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(compressor);
    compressor.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

// Each playback gets its own bus so the previous one can be silenced.
function newBus() {
  const c = audio();
  if (currentBus) {
    const old = currentBus;
    old.gain.setTargetAtTime(0, c.currentTime, 0.03);
    setTimeout(() => old.disconnect(), 500);
  }
  currentBus = c.createGain();
  currentBus.connect(master);
  return currentBus;
}

function playNote(bus, midi, when) {
  const c = ctx;
  const freq = midiToFrequency(midi);

  const envelope = c.createGain();
  envelope.gain.setValueAtTime(0, when);
  envelope.gain.linearRampToValueAtTime(0.32, when + 0.006);
  envelope.gain.exponentialRampToValueAtTime(0.1, when + 0.5);
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + NOTE_DURATION);

  // The timbre darkens as the note decays.
  const filter = c.createBiquadFilter();
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

    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = partialFreq;

    const gain = c.createGain();
    gain.gain.setValueAtTime(amplitude, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + NOTE_DURATION / (1 + i * 0.45));

    osc.connect(gain);
    gain.connect(filter);
    osc.start(when);
    osc.stop(when + NOTE_DURATION + 0.05);
  });

  // Hammer attack: a short burst of filtered noise.
  const noiseLength = Math.floor(c.sampleRate * 0.03);
  const buffer = c.createBuffer(1, noiseLength, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < noiseLength; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / noiseLength);
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = c.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = Math.min(freq * 4, 6000);
  const noiseGain = c.createGain();
  noiseGain.gain.value = 0.05;
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(bus);
  noise.start(when);
}

// Plays the notes one after the other. Returns the duration in seconds.
export function playMelodic(first, second) {
  const bus = newBus();
  const start = ctx.currentTime + 0.05;
  playNote(bus, first, start);
  playNote(bus, second, start + MELODIC_GAP);
  return MELODIC_GAP + NOTE_DURATION * 0.6;
}

// Plays both notes at the same time. Returns the duration in seconds.
export function playHarmonic(first, second) {
  const bus = newBus();
  const start = ctx.currentTime + 0.05;
  playNote(bus, first, start);
  playNote(bus, second, start);
  return NOTE_DURATION * 0.6;
}
