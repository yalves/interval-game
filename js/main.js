import {
  INTERVALS,
  MAX_ATTEMPTS,
  dayNumber,
  evaluateGuess,
  gameStatus,
  hintsFor,
  intervalBySemitones,
  isBlackKey,
  noteName,
  puzzleForDay,
  shareText,
} from './puzzle.js';
import { playHarmonic, playMelodic } from './audio.js';

const STATE_KEY = 'musicle:state';
const STATS_KEY = 'musicle:stats';
const HELP_SEEN_KEY = 'musicle:help-seen';

const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // No storage (e.g. private mode): the game still works, it just doesn't persist.
    }
  },
};

const $ = (selector) => document.querySelector(selector);

const day = dayNumber();
const puzzle = puzzleForDay(day);
let guesses = loadGuesses();
let selected = null;
let comparing = null;

function loadGuesses() {
  const saved = storage.get(STATE_KEY, null);
  if (saved && saved.day === day && Array.isArray(saved.guesses)) return saved.guesses;
  return [];
}

function status() {
  return gameStatus(puzzle, guesses);
}

function misses() {
  return guesses.filter((g) => g !== puzzle.semitones).length;
}

// Statistics

function loadStats() {
  return {
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: Array(MAX_ATTEMPTS).fill(0),
    lastPlayedDay: null,
    lastWonDay: null,
    ...storage.get(STATS_KEY, {}),
  };
}

function recordResult() {
  const stats = loadStats();
  if (stats.lastPlayedDay === day) return;
  stats.played += 1;
  stats.lastPlayedDay = day;
  if (status() === 'won') {
    stats.wins += 1;
    stats.distribution[guesses.length - 1] += 1;
    stats.currentStreak = stats.lastWonDay === day - 1 ? stats.currentStreak + 1 : 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.lastWonDay = day;
  } else {
    stats.currentStreak = 0;
  }
  storage.set(STATS_KEY, stats);
}

function renderStats() {
  const stats = loadStats();
  const streak = stats.lastWonDay !== null && stats.lastWonDay >= day - 1 ? stats.currentStreak : 0;
  const winRate = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
  const items = [
    [stats.played, 'Played'],
    [winRate, 'Win %'],
    [streak, 'Current streak'],
    [stats.maxStreak, 'Max streak'],
  ];
  $('#stats').innerHTML = items
    .map(([value, label]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`)
    .join('');

  const max = Math.max(1, ...stats.distribution);
  const todayRow = status() === 'won' ? guesses.length - 1 : -1;
  $('#distribution').innerHTML = stats.distribution
    .map(
      (count, i) => `
        <div class="bar-row">
          <span>${i + 1}</span>
          <div class="bar${i === todayRow ? ' today' : ''}" style="width: ${Math.max(8, (count / max) * 100)}%">${count}</div>
        </div>`,
    )
    .join('');
}

// UI

function buildIntervalGrid() {
  const grid = $('#interval-grid');
  for (const interval of INTERVALS) {
    const button = document.createElement('button');
    button.className = 'interval';
    button.dataset.semitones = interval.semitones;
    button.innerHTML = `<strong>${interval.name}</strong><small>${interval.semitones} ${interval.semitones === 1 ? 'semitone' : 'semitones'}</small>`;
    button.addEventListener('click', () => onIntervalClick(interval.semitones));
    grid.append(button);
  }
}

function onIntervalClick(semitones) {
  if (status() !== 'playing') {
    // After the game, the buttons play intervals from the same note for comparison.
    const second = puzzle.ascending ? puzzle.first + semitones : puzzle.first - semitones;
    comparing = semitones;
    playMelodic(puzzle.first, second);
    renderKeyboard(second);
    render();
    return;
  }
  if (guesses.includes(semitones)) return;
  selected = selected === semitones ? null : semitones;
  render();
}

function submitGuess() {
  if (selected === null || status() !== 'playing') return;
  guesses = [...guesses, selected];
  selected = null;
  storage.set(STATE_KEY, { day, guesses });

  const result = evaluateGuess(puzzle, guesses.at(-1));
  if (status() !== 'playing') {
    recordResult();
    render();
    playMelodic(puzzle.first, puzzle.second);
    $('#result').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  render();
  showToast(result === 'close' ? 'Close! Same family.' : 'Not that one.');
}

function render() {
  const current = status();
  const over = current !== 'playing';

  $('#day-label').textContent = `#${day}`;
  $('#play-harmonic').disabled = !over && misses() < 1;

  $('#attempts').innerHTML = Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
    const guess = guesses[i];
    if (guess === undefined) return '<li class="attempt empty"></li>';
    const result = evaluateGuess(puzzle, guess);
    return `<li class="attempt ${result}">${intervalBySemitones(guess).name}</li>`;
  }).join('');

  $('#hints').innerHTML = over ? '' : hintsFor(puzzle, misses()).map((h) => `<li>${h}</li>`).join('');

  for (const button of document.querySelectorAll('.interval')) {
    const semitones = Number(button.dataset.semitones);
    button.className = 'interval';
    if (guesses.includes(semitones)) button.classList.add(evaluateGuess(puzzle, semitones));
    if (over && semitones === puzzle.semitones) button.classList.add('answer');
    if (semitones === selected || (over && semitones === comparing)) button.classList.add('selected');
    button.disabled = !over && guesses.includes(semitones);
  }

  const confirm = $('#confirm-button');
  confirm.hidden = over;
  confirm.disabled = selected === null;
  confirm.textContent = selected === null ? 'Pick an interval' : `Submit: ${intervalBySemitones(selected).name}`;

  $('#result').hidden = !over;
  if (over) {
    const interval = intervalBySemitones(puzzle.semitones);
    $('#result-title').textContent =
      current === 'won' ? ['Genius! 🎉', 'Great ear! 👏', 'Nice! 🎵', 'Phew, close one! 😅'][guesses.length - 1] : 'Not this time 🎹';
    $('#result-answer').innerHTML = `The answer was an <strong>${puzzle.ascending ? 'ascending' : 'descending'} ${interval.name.toLowerCase()}</strong>: ${noteName(puzzle.first)} → ${noteName(puzzle.second)}.`;
    if (comparing === null) renderKeyboard(null);
  }
}

// Keyboard showing the puzzle notes (and the comparison note, if any).
function renderKeyboard(comparison) {
  const notes = [puzzle.first, puzzle.second, comparison].filter((n) => n !== null);
  const low = Math.min(...notes);
  const start = low - (low % 12);
  const end = Math.max(start + 24, ...notes);

  const whites = [];
  const blacks = [];
  for (let midi = start; midi <= end; midi++) {
    const classes = ['key'];
    if (midi === puzzle.first) classes.push('first');
    if (midi === puzzle.second) classes.push('second');
    if (midi === comparison && comparison !== puzzle.second) classes.push('compare');
    if (isBlackKey(midi)) {
      blacks.push({ midi, classes, after: whites.length });
    } else {
      whites.push({ midi, classes });
    }
  }

  const width = 100 / whites.length;
  const label = (midi) => (midi === puzzle.first ? '1' : midi === puzzle.second ? '2' : '');
  $('#keyboard').innerHTML =
    whites.map(({ midi, classes }) => `<div class="${classes.join(' ')} white"><span>${label(midi)}</span></div>`).join('') +
    blacks
      .map(
        ({ midi, classes, after }) =>
          `<div class="${classes.join(' ')} black" style="left: calc(${after * width}% - ${width * 0.3}%); width: ${width * 0.6}%"><span>${label(midi)}</span></div>`,
      )
      .join('');
}

// Audio buttons

function withPlayingState(button, duration) {
  button.classList.add('playing');
  clearTimeout(button.playingTimer);
  button.playingTimer = setTimeout(() => button.classList.remove('playing'), duration * 1000);
}

function setupAudioButtons() {
  $('#play-melodic').addEventListener('click', (event) => {
    comparing = null;
    if (status() !== 'playing') renderKeyboard(null);
    withPlayingState(event.currentTarget, playMelodic(puzzle.first, puzzle.second));
    render();
  });
  $('#play-harmonic').addEventListener('click', (event) => {
    withPlayingState(event.currentTarget, playHarmonic(puzzle.first, puzzle.second));
  });
}

// Sharing, countdown, modals and toast

async function share() {
  const text = `${shareText(puzzle, guesses)}\n${location.origin}${location.pathname}`;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch && navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied results to clipboard!');
  } catch {
    showToast("Couldn't copy the results.");
  }
}

function startCountdown() {
  const update = () => {
    if (dayNumber() !== day) {
      location.reload();
      return;
    }
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const seconds = Math.max(0, Math.floor((midnight - now) / 1000));
    const pad = (n) => String(n).padStart(2, '0');
    $('#countdown').textContent = `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
  };
  update();
  setInterval(update, 1000);
}

let toastTimer;
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 1800);
}

function setupModals() {
  for (const modal of document.querySelectorAll('dialog')) {
    modal.addEventListener('click', (event) => {
      // Close when clicking the backdrop or the × button.
      if (event.target === modal || event.target.closest('[data-close]')) modal.close();
    });
  }
  $('#help-button').addEventListener('click', () => $('#help-modal').showModal());
  $('#stats-button').addEventListener('click', () => {
    renderStats();
    $('#stats-modal').showModal();
  });
  if (!storage.get(HELP_SEEN_KEY, false)) {
    storage.set(HELP_SEEN_KEY, true);
    $('#help-modal').showModal();
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    if (document.querySelector('dialog[open]') || event.target.closest('button')) return;
    if (event.key === ' ') {
      event.preventDefault();
      $('#play-melodic').click();
    } else if (event.key === 'Enter') {
      submitGuess();
    }
  });
}

buildIntervalGrid();
setupAudioButtons();
setupModals();
setupKeyboardShortcuts();
$('#confirm-button').addEventListener('click', submitGuess);
$('#share-button').addEventListener('click', share);
startCountdown();
render();
