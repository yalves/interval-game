// Pure game logic (no DOM), so it can be tested in Node.

export const APP_NAME = 'Interval Game';
export const MAX_ATTEMPTS = 4;
export const HARD_MODE_LISTENS = 3;

// Date of puzzle #1 (in the player's local calendar).
export const LAUNCH = { year: 2026, month: 10, day: 28 };

// Range of notes used in puzzles (MIDI): C3 to G5.
export const LOWEST_NOTE = 48;
export const HIGHEST_NOTE = 79;

const DAY_MS = 86_400_000;

// Family of each simple interval; a compound interval shares the family of
// the simple interval an octave below it.
const INTERVAL_FAMILIES = {
  1: 'dissonant',
  2: 'dissonant',
  3: 'imperfect',
  4: 'imperfect',
  5: 'perfect',
  6: 'dissonant',
  7: 'perfect',
  8: 'imperfect',
  9: 'imperfect',
  10: 'dissonant',
  11: 'dissonant',
  12: 'perfect',
};

export const INTERVALS = Array.from({ length: 24 }, (_, i) => {
  const semitones = i + 1;
  return {
    id: semitones,
    semitones,
    family: INTERVAL_FAMILIES[semitones > 12 ? semitones - 12 : semitones],
    compound: semitones > 12,
  };
});

// Chords are grouped by their third: that's what makes them sound major or minor.
export const CHORDS = [
  { id: 'major', offsets: [0, 4, 7], family: 'majorThird' },
  { id: 'minor', offsets: [0, 3, 7], family: 'minorThird' },
  { id: 'diminished', offsets: [0, 3, 6], family: 'minorThird' },
  { id: 'augmented', offsets: [0, 4, 8], family: 'majorThird' },
  { id: 'sus2', offsets: [0, 2, 7], family: 'suspended' },
  { id: 'sus4', offsets: [0, 5, 7], family: 'suspended' },
  { id: 'dominant7', offsets: [0, 4, 7, 10], family: 'majorThird' },
  { id: 'major7', offsets: [0, 4, 7, 11], family: 'majorThird' },
  { id: 'minor7', offsets: [0, 3, 7, 10], family: 'minorThird' },
];

// Harmony: the diatonic chords of a key. Natural minor, as in the usual
// "campo harmônico menor natural": i ii° III iv v VI VII.
export const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };

// The answer is the degree of the second chord (the first is always I).
// Degrees are grouped by harmonic function.
export const DEGREES = [
  { id: 2, family: 'subdominant' },
  { id: 3, family: 'tonic' },
  { id: 4, family: 'subdominant' },
  { id: 5, family: 'dominant' },
  { id: 6, family: 'tonic' },
  { id: 7, family: 'dominant' },
];

// Tonic range for harmony puzzles, so every chord stays within the samples.
const LOWEST_TONIC = 53;
const HIGHEST_TONIC = 62;

export function triad(tonic, mode, degree) {
  const scale = SCALES[mode];
  const note = (step) => tonic + scale[step % 7] + 12 * Math.floor(step / 7);
  return [note(degree - 1), note(degree + 1), note(degree + 3)];
}

export function chordQuality(mode, degree) {
  const [root, third, fifth] = triad(0, mode, degree);
  if (third - root === 4) return 'major';
  return fifth - root === 6 ? 'diminished' : 'minor';
}

export const GAME_TYPES = {
  intervals: {
    id: 'intervals',
    emoji: '🎹',
    seedSalt: 0,
    options: INTERVALS,
    dailyPool: INTERVALS.filter((i) => !i.compound).map((i) => i.id),
    // How the notes are played by default; a hint unlocks the other way.
    playback: 'melodic',
  },
  chords: {
    id: 'chords',
    emoji: '🎶',
    seedSalt: 0x27d4eb2f,
    options: CHORDS,
    dailyPool: CHORDS.map((c) => c.id),
    playback: 'harmonic',
  },
  harmony: {
    id: 'harmony',
    emoji: '🎼',
    seedSalt: 0x165667b1,
    options: DEGREES,
    dailyPool: DEGREES.map((d) => d.id),
    // 'harmonic' plays the two chords; 'melodic' plays just their bass notes.
    playback: 'harmonic',
  },
};

export function optionById(type, id) {
  return GAME_TYPES[type].options.find((o) => o.id === id);
}

// Spelling: which letter each note is written with. A major 7th from G♯ is
// written A♭→G, not G♯→G (that would be a diminished octave).

const NATURALS = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
// Letter steps from the first note for each interval size (simple intervals).
const INTERVAL_STEPS = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 5, 9: 5, 10: 6, 11: 6, 12: 7 };
const CHORD_STEPS = { sus2: [0, 1, 4], sus4: [0, 3, 4] };

function spell(midi, letter) {
  const pitchClass = ((midi % 12) + 12) % 12;
  let accidental = pitchClass - NATURALS[((letter % 7) + 7) % 7];
  if (accidental > 6) accidental -= 12;
  if (accidental < -6) accidental += 12;
  return { letter: ((letter % 7) + 7) % 7, accidental, octave: Math.floor((midi - accidental) / 12) - 1 };
}

function letterSteps(puzzle) {
  if (puzzle.type === 'harmony') {
    const second = puzzle.answer - 1;
    return [0, 2, 4, second, second + 2, second + 4];
  }
  if (puzzle.type === 'intervals') {
    const steps = puzzle.answer > 12 ? INTERVAL_STEPS[puzzle.answer - 12] + 7 : INTERVAL_STEPS[puzzle.answer];
    return [0, puzzle.ascending ? steps : -steps];
  }
  const { offsets } = optionById(puzzle.type, puzzle.answer);
  return CHORD_STEPS[puzzle.answer] ?? offsets.map((_, i) => i * 2);
}

// Spells the puzzle's notes as { letter (0 = C … 6 = B), accidental (-2…2), octave },
// trying each way of writing the first note and keeping the one with fewest accidentals.
// For harmony, the whole scale counts, so the key is written the usual way (B♭ major, not A♯).
export function spellNotes(puzzle) {
  let notes = puzzle.notes;
  let steps = letterSteps(puzzle);
  if (puzzle.type === 'harmony') {
    notes = [...notes, ...SCALES[puzzle.mode].map((offset) => puzzle.tonic + offset)];
    steps = [...steps, 0, 1, 2, 3, 4, 5, 6];
  }
  const candidates = [0, 1, 2, 3, 4, 5, 6]
    .map((letter) => spell(notes[0], letter))
    .filter((s) => Math.abs(s.accidental) <= 1)
    .map((start) => notes.map((midi, i) => spell(midi, start.letter + steps[i])));
  const cost = (spelling) => spelling.reduce((sum, s) => sum + Math.abs(s.accidental) + (Math.abs(s.accidental) > 1 ? 3 : 0), 0);
  return candidates.reduce((best, c) => (cost(c) < cost(best) ? c : best)).slice(0, puzzle.notes.length);
}

export function isBlackKey(midi) {
  return [1, 3, 6, 8, 10].includes(midi % 12);
}

// Puzzle number for the given local date (the first day is #1).
export function dayNumber(date = new Date()) {
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const launch = Date.UTC(LAUNCH.year, LAUNCH.month - 1, LAUNCH.day);
  return Math.max(1, Math.round((today - launch) / DAY_MS) + 1);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngForDay(type, day) {
  return mulberry32(Math.imul(day, 0x9e3779b9) ^ 0x85ebca6b ^ GAME_TYPES[type].seedSalt);
}

// Places the answer on the keyboard: picks the starting note (and direction,
// or for harmony the key: `keyMode` is 'major', 'minor' or 'both').
function place(type, answer, rand, { ascendingChance = 0.5, keyMode = 'both' } = {}) {
  if (type === 'harmony') {
    const mode = keyMode === 'both' ? (rand() < 0.5 ? 'major' : 'minor') : keyMode;
    const tonic = LOWEST_TONIC + Math.floor(rand() * (HIGHEST_TONIC - LOWEST_TONIC + 1));
    const chords = [triad(tonic, mode, 1), triad(tonic, mode, answer)];
    return { type, answer, mode, tonic, chords, notes: chords.flat() };
  }
  if (type === 'intervals') {
    const ascending = rand() < ascendingChance;
    const low = LOWEST_NOTE + Math.floor(rand() * (HIGHEST_NOTE - answer - LOWEST_NOTE + 1));
    const high = low + answer;
    return { type, answer, ascending, notes: ascending ? [low, high] : [high, low] };
  }
  const { offsets } = optionById(type, answer);
  const top = offsets.at(-1);
  const root = LOWEST_NOTE + Math.floor(rand() * (HIGHEST_NOTE - top - LOWEST_NOTE + 1));
  return { type, answer, root, notes: offsets.map((o) => root + o) };
}

// Builds the daily puzzle deterministically: everyone gets the same answer on
// the same day, and it never repeats on consecutive days.
export function puzzleForDay(type, day) {
  const pool = GAME_TYPES[type].dailyPool;
  let previous = null;
  let answer;
  let rand;
  for (let d = 1; d <= day; d++) {
    rand = rngForDay(type, d);
    const options = pool.filter((id) => id !== previous);
    answer = options[Math.floor(rand() * options.length)];
    previous = answer;
  }
  return { day, ...place(type, answer, rand, { ascendingChance: 0.7 }) };
}

// Random puzzle for practice. `weights` (id → number) favors some answers;
// `direction` is 'up', 'down' or 'both' (intervals only); `keyMode` is
// 'major', 'minor' or 'both' (harmony only).
export function randomPuzzle(
  type,
  { pool = GAME_TYPES[type].dailyPool, previous = null, weights = null, direction = 'both', keyMode = 'both', rand = Math.random } = {},
) {
  const candidates = pool.length > 1 ? pool.filter((id) => id !== previous) : pool;
  const weightOf = (id) => (weights ? weights[id] ?? 1 : 1);
  let target = rand() * candidates.reduce((sum, id) => sum + weightOf(id), 0);
  let answer = candidates.at(-1);
  for (const id of candidates) {
    target -= weightOf(id);
    if (target < 0) {
      answer = id;
      break;
    }
  }
  const ascendingChance = { up: 1, down: 0, both: 0.5 }[direction];
  return { day: null, ...place(type, answer, rand, { ascendingChance, keyMode }) };
}

// The notes a given option would produce from the same starting point as the
// puzzle (used to compare answers after the game).
export function notesFor(puzzle, optionId) {
  if (puzzle.type === 'harmony') return triad(puzzle.tonic, puzzle.mode, optionId);
  if (puzzle.type === 'intervals') {
    const first = puzzle.notes[0];
    return [first, puzzle.ascending ? first + optionId : first - optionId];
  }
  return optionById(puzzle.type, optionId).offsets.map((o) => puzzle.root + o);
}

// What to play, as groups of notes sounding together, `gap` seconds apart.
// `optionId` plays another answer from the same starting point.
export function soundFor(puzzle, playback, optionId = puzzle.answer) {
  if (puzzle.type === 'harmony') {
    const chords = [puzzle.chords[0], notesFor(puzzle, optionId)];
    if (playback === 'melodic') return { groups: chords.map((chord) => [chord[0] - 12]), gap: 0.9 };
    return { groups: chords, gap: 1.3 };
  }
  const notes = notesFor(puzzle, optionId);
  if (playback === 'melodic') return { groups: notes.map((n) => [n]), gap: notes.length > 2 ? 0.55 : 0.9 };
  return { groups: [notes], gap: 0 };
}

// 'correct' = right; 'close' = wrong but same family; 'wrong' = wrong.
export function evaluateGuess(puzzle, guess) {
  if (guess === puzzle.answer) return 'correct';
  const family = optionById(puzzle.type, puzzle.answer).family;
  return optionById(puzzle.type, guess).family === family ? 'close' : 'wrong';
}

// Hints unlocked progressively with each miss, as translation keys + params.
export function hintsFor(puzzle, misses) {
  const answer = optionById(puzzle.type, puzzle.answer);
  const hints = [];
  if (puzzle.type === 'harmony') {
    if (misses >= 1) hints.push({ key: 'hintBass' }, { key: puzzle.mode === 'major' ? 'hintMajorKey' : 'hintMinorKey' });
    if (misses >= 2) hints.push({ key: 'hintQuality', quality: chordQuality(puzzle.mode, puzzle.answer) });
  } else if (puzzle.type === 'intervals') {
    if (misses >= 1) hints.push({ key: 'hintTogether' });
    if (misses >= 2) {
      const size = answer.compound ? 'hintCompound' : answer.semitones <= 6 ? 'hintSmall' : 'hintLarge';
      hints.push({ key: size });
    }
  } else {
    if (misses >= 1) hints.push({ key: 'hintArpeggio' });
    if (misses >= 2) hints.push({ key: answer.offsets.length === 4 ? 'hintSeventh' : 'hintTriad' });
  }
  if (misses >= 3) hints.push({ key: 'hintFamily', family: answer.family });
  return hints;
}

export function gameStatus(puzzle, guesses) {
  if (guesses.includes(puzzle.answer)) return 'won';
  if (guesses.length >= MAX_ATTEMPTS) return 'lost';
  return 'playing';
}

const EMOJI = {
  normal: { correct: '🟩', close: '🟨', wrong: '⬛' },
  highContrast: { correct: '🟧', close: '🟦', wrong: '⬛' },
};

export function shareText(puzzle, guesses, { title = APP_NAME, hard = false, highContrast = false } = {}) {
  const status = gameStatus(puzzle, guesses);
  const score = status === 'won' ? guesses.length : 'X';
  const emoji = EMOJI[highContrast ? 'highContrast' : 'normal'];
  const squares = guesses.map((g) => emoji[evaluateGuess(puzzle, g)]).join('');
  return `${title} #${puzzle.day} ${score}/${MAX_ATTEMPTS}${hard ? '*' : ''}\n${GAME_TYPES[puzzle.type].emoji} ${squares}`;
}
