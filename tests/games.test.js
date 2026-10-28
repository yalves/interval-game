import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CHORDS,
  GAME_TYPES,
  HIGHEST_NOTE,
  LOWEST_NOTE,
  MAX_ATTEMPTS,
  dayNumber,
  evaluateGuess,
  gameStatus,
  hintsFor,
  notesFor,
  puzzleForDay,
  randomPuzzle,
  shareText,
  soundFor,
  spellNotes,
  chordQuality,
  triad,
} from '../js/games.js';

const inRange = (note) => note >= LOWEST_NOTE && note <= HIGHEST_NOTE;

test('dayNumber starts at 1 on launch day and advances at local midnight', () => {
  assert.equal(dayNumber(new Date(2026, 9, 28, 0, 0)), 1);
  assert.equal(dayNumber(new Date(2026, 9, 28, 23, 59)), 1);
  assert.equal(dayNumber(new Date(2026, 9, 29, 0, 0)), 2);
  assert.equal(dayNumber(new Date(2027, 9, 28)), 366);
  assert.equal(dayNumber(new Date(2020, 0, 1)), 1);
});

test('daily interval puzzles never change once published', () => {
  // [semitones, ascending, first note] for days 1..400, recorded at launch.
  const expected = JSON.parse(readFileSync(new URL('./fixtures/daily-intervals.json', import.meta.url)));
  expected.forEach(([semitones, ascending, first], i) => {
    const puzzle = puzzleForDay('intervals', i + 1);
    assert.deepEqual([puzzle.answer, puzzle.ascending ? 1 : 0, puzzle.notes[0]], [semitones, ascending, first], `day ${i + 1}`);
  });
});

for (const type of Object.keys(GAME_TYPES)) {
  test(`${type}: daily puzzles are deterministic, in range, varied and never repeat on consecutive days`, () => {
    let previous = null;
    const seen = new Set();
    for (let day = 1; day <= 730; day++) {
      const puzzle = puzzleForDay(type, day);
      assert.deepEqual(puzzle, puzzleForDay(type, day));
      assert.ok(puzzle.notes.every(inRange));
      assert.deepEqual(notesFor(puzzle, puzzle.answer), type === 'harmony' ? puzzle.chords[1] : puzzle.notes);
      assert.notEqual(puzzle.answer, previous);
      previous = puzzle.answer;
      seen.add(puzzle.answer);
    }
    assert.equal(seen.size, GAME_TYPES[type].dailyPool.length);
  });
}

test('the two game types get different daily answers', () => {
  const intervals = Array.from({ length: 30 }, (_, d) => puzzleForDay('intervals', d + 1).answer);
  const chords = Array.from({ length: 30 }, (_, d) => puzzleForDay('chords', d + 1).answer);
  assert.ok(chords.every((id) => CHORDS.some((c) => c.id === id)));
  assert.notDeepEqual(intervals, chords);
});

test('randomPuzzle respects pool, previous answer, direction and weights', () => {
  for (let i = 0; i < 300; i++) {
    const puzzle = randomPuzzle('intervals', { pool: [3, 4, 15], previous: 4, direction: 'down' });
    assert.ok([3, 15].includes(puzzle.answer));
    assert.equal(puzzle.ascending, false);
    assert.equal(puzzle.notes[0] - puzzle.notes[1], puzzle.answer);
    assert.ok(puzzle.notes.every(inRange));
  }
  const counts = { 1: 0, 2: 0 };
  for (let i = 0; i < 2000; i++) counts[randomPuzzle('intervals', { pool: [1, 2], weights: { 1: 1, 2: 9 } }).answer]++;
  assert.ok(counts[2] > counts[1] * 4, JSON.stringify(counts));
  assert.equal(randomPuzzle('chords', { pool: ['sus2'], previous: 'sus2' }).answer, 'sus2');
});

test('evaluateGuess marks same-family misses as close', () => {
  const interval = { type: 'intervals', day: 1, answer: 7, ascending: true, notes: [60, 67] };
  assert.equal(evaluateGuess(interval, 7), 'correct');
  assert.equal(evaluateGuess(interval, 12), 'close');
  assert.equal(evaluateGuess(interval, 19), 'close');
  assert.equal(evaluateGuess(interval, 4), 'wrong');

  const chord = { type: 'chords', day: 1, answer: 'minor', root: 60, notes: [60, 63, 67] };
  assert.equal(evaluateGuess(chord, 'diminished'), 'close');
  assert.equal(evaluateGuess(chord, 'major'), 'wrong');
  assert.deepEqual(notesFor(chord, 'major7'), [60, 64, 67, 71]);
});

test('hints', () => {
  const minorThird = { type: 'intervals', answer: 3, ascending: false, notes: [63, 60] };
  assert.deepEqual(hintsFor(minorThird, 0), []);
  assert.deepEqual(hintsFor(minorThird, 3), [{ key: 'hintTogether' }, { key: 'hintSmall' }, { key: 'hintFamily', family: 'imperfect' }]);
  assert.equal(hintsFor({ ...minorThird, answer: 16 }, 2)[1].key, 'hintCompound');
  const chord = { type: 'chords', answer: 'dominant7', root: 60, notes: [60, 64, 67, 70] };
  assert.deepEqual(hintsFor(chord, 3), [{ key: 'hintArpeggio' }, { key: 'hintSeventh' }, { key: 'hintFamily', family: 'majorThird' }]);
});

test('game status and share text', () => {
  const puzzle = { type: 'intervals', day: 3, answer: 3, ascending: false, notes: [63, 60] };
  assert.equal(gameStatus(puzzle, [1, 4]), 'playing');
  assert.equal(gameStatus(puzzle, [1, 3]), 'won');
  assert.equal(gameStatus(puzzle, [1, 2, 4, 5]), 'lost');
  assert.equal(shareText(puzzle, [12, 4, 3]), `Musicle #3 3/${MAX_ATTEMPTS}\n🎹 ⬛🟨🟩`);
  assert.equal(shareText(puzzle, [1, 2, 4, 5]), `Musicle #3 X/${MAX_ATTEMPTS}\n🎹 ⬛⬛🟨⬛`);
  assert.equal(shareText(puzzle, [4, 3], { hard: true, highContrast: true }), `Musicle #3 2/${MAX_ATTEMPTS}*\n🎹 🟦🟧`);
  const chord = { type: 'chords', day: 2, answer: 'major', root: 60, notes: [60, 64, 67] };
  assert.equal(shareText(chord, ['major'], { title: 'Musicle Chords' }), `Musicle Chords #2 1/${MAX_ATTEMPTS}\n🎶 🟩`);
});

test('spellNotes writes notes the way the interval or chord is named', () => {
  const name = (spelling) => spelling.map(({ letter, accidental, octave }) => `${'CDEFGAB'[letter]}${{ '-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: 'x' }[accidental]}${octave}`).join(' ');
  const interval = (first, semitones, ascending = true) => ({ type: 'intervals', answer: semitones, ascending, notes: [first, ascending ? first + semitones : first - semitones] });
  const chord = (answer, root) => ({ type: 'chords', answer, root, notes: notesFor({ type: 'chords', root }, answer) });

  assert.equal(name(spellNotes(interval(68, 11))), 'Ab4 G5'); // major 7th, not G#→G
  assert.equal(name(spellNotes(interval(60, 6))), 'C4 F#4'); // tritone as augmented 4th
  assert.equal(name(spellNotes(interval(61, 3, false))), 'C#4 A#3');
  assert.equal(name(spellNotes(interval(60, 15))), 'C4 Eb5'); // minor 10th
  assert.equal(name(spellNotes(interval(71, 12))), 'B4 B5');
  assert.equal(name(spellNotes(chord('augmented', 70))), 'Bb4 D5 F#5');
  assert.equal(name(spellNotes(chord('diminished', 61))), 'C#4 E4 G4');
  assert.equal(name(spellNotes(chord('major', 63))), 'Eb4 G4 Bb4');
  assert.equal(name(spellNotes(chord('dominant7', 67))), 'G4 B4 D5 F5');
  assert.equal(name(spellNotes(chord('sus4', 62))), 'D4 G4 A4');
  assert.equal(name(spellNotes(chord('major7', 66))), 'Gb4 Bb4 Db5 F5'); // fewer accidentals than F#maj7

  // Every puzzle in the first two years spells with at most one accidental per note.
  for (const type of Object.keys(GAME_TYPES)) {
    for (let day = 1; day <= 730; day++) {
      const spelled = spellNotes(puzzleForDay(type, day));
      assert.ok(spelled.every((s) => Math.abs(s.accidental) <= 1), `${type} day ${day}: ${name(spelled)}`);
    }
  }
});

test('harmony: diatonic chords, sounds, hints and families', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((d) => chordQuality('major', d)), ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished']);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((d) => chordQuality('minor', d)), ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major']);
  assert.deepEqual(triad(60, 'major', 7), [71, 74, 77]);
  assert.deepEqual(triad(57, 'minor', 6), [65, 69, 72]);

  const puzzle = { type: 'harmony', day: 1, answer: 5, mode: 'major', tonic: 60, chords: [[60, 64, 67], [67, 71, 74]], notes: [60, 64, 67, 67, 71, 74] };
  assert.deepEqual(soundFor(puzzle, 'harmonic'), { groups: [[60, 64, 67], [67, 71, 74]], gap: 1.3 });
  assert.deepEqual(soundFor(puzzle, 'melodic'), { groups: [[48], [55]], gap: 0.9 });
  assert.deepEqual(soundFor(puzzle, 'harmonic', 4).groups[1], [65, 69, 72]);
  assert.equal(evaluateGuess(puzzle, 7), 'close'); // both dominant
  assert.equal(evaluateGuess(puzzle, 6), 'wrong');
  assert.deepEqual(hintsFor(puzzle, 3), [
    { key: 'hintBass' },
    { key: 'hintMajorKey' },
    { key: 'hintQuality', quality: 'major' },
    { key: 'hintFamily', family: 'dominant' },
  ]);
  assert.equal(hintsFor({ ...puzzle, mode: 'minor' }, 1)[1].key, 'hintMinorKey');
  assert.equal(shareText(puzzle, [5], { title: 'Musicle Harmony' }), `Musicle Harmony #1 1/${MAX_ATTEMPTS}\n🎼 🟩`);

  // The key is spelled the usual way: B♭ major (not A♯), with E♭ in its IV chord.
  const name = (spelling) => spelling.map(({ letter, accidental }) => `${'CDEFGAB'[letter]}${{ '-1': 'b', 0: '', 1: '#' }[accidental]}`).join(' ');
  const bFlat = { type: 'harmony', answer: 4, mode: 'major', tonic: 58, chords: [triad(58, 'major', 1), triad(58, 'major', 4)] };
  assert.equal(name(spellNotes({ ...bFlat, notes: bFlat.chords.flat() })), 'Bb D F Eb G Bb');
  const cSharpMinor = { type: 'harmony', answer: 7, mode: 'minor', tonic: 61, chords: [triad(61, 'minor', 1), triad(61, 'minor', 7)] };
  assert.equal(name(spellNotes({ ...cSharpMinor, notes: cSharpMinor.chords.flat() })), 'C# E G# B D# F#');
});
