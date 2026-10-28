import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HIGHEST_NOTE,
  INTERVALS,
  LOWEST_NOTE,
  MAX_ATTEMPTS,
  dayNumber,
  evaluateGuess,
  gameStatus,
  hintsFor,
  noteName,
  puzzleForDay,
  shareText,
} from '../js/puzzle.js';

test('dayNumber starts at 1 on launch day and advances at local midnight', () => {
  assert.equal(dayNumber(new Date(2026, 9, 28, 0, 0)), 1);
  assert.equal(dayNumber(new Date(2026, 9, 28, 23, 59)), 1);
  assert.equal(dayNumber(new Date(2026, 9, 29, 0, 0)), 2);
  assert.equal(dayNumber(new Date(2027, 9, 28)), 366);
  assert.equal(dayNumber(new Date(2020, 0, 1)), 1);
});

test('puzzles are deterministic, in range, and never repeat on consecutive days', () => {
  let previous = null;
  const seen = new Set();
  for (let day = 1; day <= 730; day++) {
    const puzzle = puzzleForDay(day);
    assert.deepEqual(puzzle, puzzleForDay(day));
    assert.equal(Math.abs(puzzle.second - puzzle.first), puzzle.semitones);
    assert.equal(puzzle.second > puzzle.first, puzzle.ascending);
    for (const note of [puzzle.first, puzzle.second]) {
      assert.ok(note >= LOWEST_NOTE && note <= HIGHEST_NOTE, `note ${note} out of range`);
    }
    assert.notEqual(puzzle.semitones, previous);
    previous = puzzle.semitones;
    seen.add(puzzle.semitones);
  }
  assert.equal(seen.size, INTERVALS.length);
});

test('evaluateGuess marks same-family misses as close', () => {
  const puzzle = { day: 1, semitones: 7, ascending: true, first: 60, second: 67 };
  assert.equal(evaluateGuess(puzzle, 7), 'correct');
  assert.equal(evaluateGuess(puzzle, 12), 'close');
  assert.equal(evaluateGuess(puzzle, 4), 'wrong');
});

test('game status, hints and share text', () => {
  const puzzle = { day: 3, semitones: 3, ascending: false, first: 63, second: 60 };
  assert.equal(gameStatus(puzzle, [1, 4]), 'playing');
  assert.equal(gameStatus(puzzle, [1, 3]), 'won');
  assert.equal(gameStatus(puzzle, [1, 2, 4, 5]), 'lost');
  assert.equal(hintsFor(puzzle, 0).length, 0);
  assert.equal(hintsFor(puzzle, 3).length, 3);
  assert.match(hintsFor(puzzle, 3)[2], /imperfect consonance/);
  assert.equal(shareText(puzzle, [12, 4, 3]), `Musicle #3 3/${MAX_ATTEMPTS}\n🎹 ⬛🟨🟩`);
  assert.equal(shareText(puzzle, [1, 2, 4, 5]), `Musicle #3 X/${MAX_ATTEMPTS}\n🎹 ⬛⬛🟨⬛`);
});

test('noteName uses scientific pitch notation', () => {
  assert.equal(noteName(60), 'C4');
  assert.equal(noteName(69), 'A4');
  assert.equal(noteName(70), 'A♯4');
});
