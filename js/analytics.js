// Usage metrics through Umami (script loaded in index.html, only counted on
// intervalgame.com). If the script is blocked or offline, these do nothing.
//
// Umami's free plan counts every event and every event property, so each
// action sends at most a couple of short properties.

import { MAX_ATTEMPTS, gameStatus } from './games.js?v=0e8950d8';
import { STRINGS } from './i18n.js?v=0e8950d8';

export function track(name, data) {
  try {
    window.umami?.track(name, data);
  } catch {
    // Analytics must never break the game.
  }
}

// Answers are reported by their English names so the dashboard reads the same
// whatever language the player uses.
function label(type, id) {
  if (type === 'harmony') return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][id - 1];
  return type === 'intervals' ? STRINGS.en.intervals[id - 1] : STRINGS.en.chords[id];
}

// One event per finished game, e.g. "daily-chords" { result: "3/4", miss: "Minor" }.
// For daily puzzles everyone gets the same answer, so the first wrong guess
// shows what it gets mistaken for; in practice the answer varies, so both go in.
export function trackFinishedGame(type, mode, puzzle, guesses, hard) {
  const [first] = guesses;
  const missed = first !== puzzle.answer;
  if (mode === 'practice') {
    track(`practice-${type}`, missed ? { confusion: `${label(type, puzzle.answer)} ← ${label(type, first)}` } : undefined);
    return;
  }
  const won = gameStatus(puzzle, guesses) === 'won';
  const result = `${won ? guesses.length : 'X'}/${MAX_ATTEMPTS}${hard ? '*' : ''}`;
  if (mode === 'archive') {
    track(`archive-${type}`, { result });
    return;
  }
  track(`daily-${type}`, missed ? { result, miss: label(type, first) } : { result });
}

// Installs and launches from the home screen.
export function trackAppUsage() {
  addEventListener('appinstalled', () => track('app-installed'));
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
    // The script loads after this module, so wait until it's there.
    addEventListener('load', () => track('opened-as-app'));
  }
}
