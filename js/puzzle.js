// Pure game logic (no DOM), so it can be tested in Node.

export const MAX_ATTEMPTS = 4;

// Date of puzzle #1 (in the player's local calendar).
export const LAUNCH = { year: 2026, month: 10, day: 28 };

// Range of notes used in puzzles (MIDI): C3 to G5.
export const LOWEST_NOTE = 48;
export const HIGHEST_NOTE = 79;

export const INTERVALS = [
  { semitones: 1, family: 'dissonant' },
  { semitones: 2, family: 'dissonant' },
  { semitones: 3, family: 'imperfect' },
  { semitones: 4, family: 'imperfect' },
  { semitones: 5, family: 'perfect' },
  { semitones: 6, family: 'dissonant' },
  { semitones: 7, family: 'perfect' },
  { semitones: 8, family: 'imperfect' },
  { semitones: 9, family: 'imperfect' },
  { semitones: 10, family: 'dissonant' },
  { semitones: 11, family: 'dissonant' },
  { semitones: 12, family: 'perfect' },
];

const DAY_MS = 86_400_000;

export function intervalBySemitones(semitones) {
  return INTERVALS.find((i) => i.semitones === semitones);
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

function rngForDay(day) {
  return mulberry32(Math.imul(day, 0x9e3779b9) ^ 0x85ebca6b);
}

// Builds the puzzle deterministically: everyone gets the same interval on
// the same day, and it never repeats on consecutive days.
export function puzzleForDay(day) {
  let previous = null;
  let semitones;
  let rand;
  for (let d = 1; d <= day; d++) {
    rand = rngForDay(d);
    const options = INTERVALS.map((i) => i.semitones).filter((s) => s !== previous);
    semitones = options[Math.floor(rand() * options.length)];
    previous = semitones;
  }

  return { day, ...placeNotes(semitones, rand) };
}

// Random puzzle for practice mode, avoiding the previous interval.
export function randomPuzzle(previous = null, rand = Math.random) {
  const options = INTERVALS.map((i) => i.semitones).filter((s) => s !== previous);
  return { day: null, ...placeNotes(options[Math.floor(rand() * options.length)], rand) };
}

function placeNotes(semitones, rand) {
  const ascending = rand() < 0.7;
  const low = LOWEST_NOTE + Math.floor(rand() * (HIGHEST_NOTE - semitones - LOWEST_NOTE + 1));
  const high = low + semitones;
  return {
    semitones,
    ascending,
    first: ascending ? low : high,
    second: ascending ? high : low,
  };
}

// 'correct' = right; 'close' = wrong but same family; 'wrong' = wrong.
export function evaluateGuess(puzzle, guess) {
  if (guess === puzzle.semitones) return 'correct';
  const family = intervalBySemitones(puzzle.semitones).family;
  return intervalBySemitones(guess).family === family ? 'close' : 'wrong';
}

// Hints unlocked progressively with each miss, as translation keys + params.
export function hintsFor(puzzle, misses) {
  const hints = [];
  if (misses >= 1) hints.push({ key: 'hintTogether' });
  if (misses >= 2) hints.push({ key: puzzle.semitones <= 6 ? 'hintSmall' : 'hintLarge' });
  if (misses >= 3) hints.push({ key: 'hintFamily', family: intervalBySemitones(puzzle.semitones).family });
  return hints;
}

export function gameStatus(puzzle, guesses) {
  if (guesses.includes(puzzle.semitones)) return 'won';
  if (guesses.length >= MAX_ATTEMPTS) return 'lost';
  return 'playing';
}

const EMOJI = { correct: '🟩', close: '🟨', wrong: '⬛' };

export function shareText(puzzle, guesses) {
  const status = gameStatus(puzzle, guesses);
  const score = status === 'won' ? guesses.length : 'X';
  const squares = guesses.map((g) => EMOJI[evaluateGuess(puzzle, g)]).join('');
  return `Musicle #${puzzle.day} ${score}/${MAX_ATTEMPTS}\n🎹 ${squares}`;
}
