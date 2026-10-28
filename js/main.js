import {
  INTERVALS,
  MAX_ATTEMPTS,
  dayNumber,
  evaluateGuess,
  gameStatus,
  hintsFor,
  isBlackKey,
  puzzleForDay,
  randomPuzzle,
  shareText,
} from './puzzle.js';
import { playHarmonic, playMelodic } from './audio.js';
import { DEFAULT_LANGUAGE, getLanguage, intervalName, noteName, setLanguage, t } from './i18n.js';

const STATE_KEY = 'musicle:state';
const STATS_KEY = 'musicle:stats';
const HELP_SEEN_KEY = 'musicle:help-seen';
const LANGUAGE_KEY = 'musicle:language';
const PRACTICE_STATS_KEY = 'musicle:practice-stats';

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
// The daily game and the practice game are kept side by side; `puzzle` and
// `guesses` always point at the one in the active mode.
const games = {
  daily: { puzzle: puzzleForDay(day), guesses: loadGuesses() },
  practice: { puzzle: randomPuzzle(), guesses: [] },
};
let mode = location.hash === '#practice' ? 'practice' : 'daily';
let { puzzle, guesses } = games[mode];
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

function loadPracticeStats() {
  return { played: 0, wins: 0, streak: 0, bestStreak: 0, ...storage.get(PRACTICE_STATS_KEY, {}) };
}

function recordPracticeResult() {
  const stats = loadPracticeStats();
  stats.played += 1;
  if (status() === 'won') {
    stats.wins += 1;
    stats.streak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
  } else {
    stats.streak = 0;
  }
  storage.set(PRACTICE_STATS_KEY, stats);
}

function renderStats() {
  const stats = loadStats();
  const streak = stats.lastWonDay !== null && stats.lastWonDay >= day - 1 ? stats.currentStreak : 0;
  const winRate = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
  const items = [
    [stats.played, t('statPlayed')],
    [winRate, t('statWinRate')],
    [streak, t('statStreak')],
    [stats.maxStreak, t('statMaxStreak')],
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
  games[mode].guesses = guesses;
  selected = null;
  if (mode === 'daily') storage.set(STATE_KEY, { day, guesses });

  const result = evaluateGuess(puzzle, guesses.at(-1));
  if (status() !== 'playing') {
    if (mode === 'daily') recordResult();
    else recordPracticeResult();
    render();
    playMelodic(puzzle.first, puzzle.second);
    $('#result').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  render();
  showToast(t(result === 'close' ? 'toastClose' : 'toastWrong'));
}

function render() {
  const current = status();
  const over = current !== 'playing';

  for (const tab of document.querySelectorAll('[data-mode]')) {
    tab.setAttribute('aria-selected', String(tab.dataset.mode === mode));
  }
  $('#day-label').textContent = mode === 'daily' ? `#${day}` : t('practice');
  $('#practice-stats').hidden = mode !== 'practice';
  if (mode === 'practice') {
    const stats = loadPracticeStats();
    $('#practice-stats').textContent = t('practiceStats', { wins: stats.wins, played: stats.played, streak: stats.streak, best: stats.bestStreak });
  }
  $('#play-harmonic').disabled = !over && misses() < 1;

  $('#attempts').innerHTML = Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
    const guess = guesses[i];
    if (guess === undefined) return '<li class="attempt empty"></li>';
    const result = evaluateGuess(puzzle, guess);
    return `<li class="attempt ${result}">${intervalName(guess)}</li>`;
  }).join('');

  $('#hints').innerHTML = over ? '' : hintsFor(puzzle, misses()).map(({ key, family }) => `<li>${t(key, { family: family && t('families')[family] })}</li>`).join('');

  for (const button of document.querySelectorAll('.interval')) {
    const semitones = Number(button.dataset.semitones);
    button.className = 'interval';
    button.innerHTML = `<strong>${intervalName(semitones)}</strong><small>${semitones} ${t(semitones === 1 ? 'semitone' : 'semitones')}</small>`;
    if (guesses.includes(semitones)) button.classList.add(evaluateGuess(puzzle, semitones));
    if (over && semitones === puzzle.semitones) button.classList.add('answer');
    if (semitones === selected || (over && semitones === comparing)) button.classList.add('selected');
    button.disabled = !over && guesses.includes(semitones);
  }

  const confirm = $('#confirm-button');
  confirm.hidden = over;
  confirm.disabled = selected === null;
  confirm.textContent = selected === null ? t('pickInterval') : t('submit', { name: intervalName(selected) });

  $('#result').hidden = !over;
  $('#share-button').hidden = mode !== 'daily';
  $('#countdown-box').hidden = mode !== 'daily';
  $('#next-button').hidden = mode !== 'practice';
  if (over) {
    $('#result-title').textContent = current === 'won' ? t('winTitles')[guesses.length - 1] : t('lossTitle');
    $('#result-answer').innerHTML = t('answer', {
      ascending: puzzle.ascending,
      name: intervalName(puzzle.semitones),
      first: noteName(puzzle.first),
      second: noteName(puzzle.second),
    });
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

// Language

// Fills every element marked with data-i18n (text), data-i18n-html or data-i18n-aria.
function translatePage() {
  document.documentElement.lang = getLanguage();
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  $('#language-select').value = getLanguage();
}

function setupLanguage() {
  setLanguage(storage.get(LANGUAGE_KEY, DEFAULT_LANGUAGE));
  translatePage();
  $('#language-select').addEventListener('change', (event) => {
    setLanguage(event.target.value);
    storage.set(LANGUAGE_KEY, getLanguage());
    translatePage();
    render();
    if ($('#stats-modal').open) renderStats();
  });
}

// Modes

function setMode(next) {
  if (next === mode) return;
  if (next === 'daily' && dayNumber() !== day) {
    // A new day started while practicing: reload to get the new puzzle.
    location.replace(`${location.pathname}${location.search}`);
    return;
  }
  mode = next;
  ({ puzzle, guesses } = games[mode]);
  selected = null;
  comparing = null;
  $('#toast').hidden = true;
  history.replaceState(null, '', mode === 'practice' ? '#practice' : `${location.pathname}${location.search}`);
  render();
}

function nextPracticePuzzle() {
  games.practice = { puzzle: randomPuzzle(puzzle.semitones), guesses: [] };
  ({ puzzle, guesses } = games.practice);
  selected = null;
  comparing = null;
  $('#toast').hidden = true;
  render();
  $('#play-melodic').click();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
    showToast(t('toastCopied'));
  } catch {
    showToast(t('toastCopyFailed'));
  }
}

function startCountdown() {
  const update = () => {
    if (dayNumber() !== day && mode === 'daily') {
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
      if (mode === 'practice' && status() !== 'playing') nextPracticePuzzle();
      else submitGuess();
    }
  });
}

setupLanguage();
buildIntervalGrid();
setupAudioButtons();
setupModals();
setupKeyboardShortcuts();
$('#confirm-button').addEventListener('click', submitGuess);
$('#share-button').addEventListener('click', share);
$('#next-button').addEventListener('click', nextPracticePuzzle);
for (const tab of document.querySelectorAll('[data-mode]')) {
  tab.addEventListener('click', () => setMode(tab.dataset.mode));
}
window.addEventListener('hashchange', () => setMode(location.hash === '#practice' ? 'practice' : 'daily'));
startCountdown();
render();
