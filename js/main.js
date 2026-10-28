import {
  APP_NAME,
  GAME_TYPES,
  HARD_MODE_LISTENS,
  MAX_ATTEMPTS,
  dayNumber,
  evaluateGuess,
  gameStatus,
  hintsFor,
  isBlackKey,
  notesFor,
  puzzleForDay,
  randomPuzzle,
  shareText,
  spellNotes,
} from './games.js';
import { practiceStats, practiceWeights, recordPracticeGame, weakSpots } from './practice.js';
import { INSTRUMENTS, playNotes, prefetch, setInstrument, setVolume } from './audio.js';
import { DEFAULT_LANGUAGE, LANGUAGES, chordSymbol, getLanguage, noteName, optionName, setLanguage, songFor, t } from './i18n.js';
import { FLAGS } from './flags.js';
import { exportProgress, importProgress, storage } from './storage.js';

const $ = (selector) => document.querySelector(selector);

const today = dayNumber();

// Storage keys: the interval game keeps the original names, chords get a suffix.
const keyFor = (name, type) => (type === 'intervals' ? name : `${name}:${type}`);

const DEFAULT_SETTINGS = { hard: false, highContrast: false, volume: 0.8, instrument: 'piano' };
const DEFAULT_PRACTICE = {
  intervals: { pool: GAME_TYPES.intervals.dailyPool, direction: 'both', playback: 'melodic', adaptive: true },
  chords: { pool: GAME_TYPES.chords.dailyPool, direction: 'both', playback: 'harmonic', adaptive: true },
};

let settings = { ...DEFAULT_SETTINGS, ...storage.get('settings', {}) };

let type = 'intervals';
let mode = 'daily'; // 'daily' | 'practice' | 'archive'
let archiveDay = null;
let game; // { puzzle, guesses, hard, listens }
const practiceGames = {};
let selected = null;
let comparing = null;

// Saved games

// Before multiple games and the archive existed, only today's interval game was saved.
function migrateLegacyState() {
  const legacy = storage.get('state', null);
  if (!legacy) return;
  const history = storage.get('history', {});
  history[legacy.day] ??= { guesses: legacy.guesses, hard: false, listens: 0 };
  storage.set('history', history);
  storage.remove('state');
}

function loadHistory(gameType = type) {
  return storage.get(keyFor('history', gameType), {});
}

function loadGame() {
  if (mode === 'practice') {
    game = practiceGames[type] ??= newPracticeGame();
  } else {
    const day = mode === 'archive' ? archiveDay : today;
    const record = loadHistory()[day] ?? {};
    game = { puzzle: puzzleForDay(type, day), guesses: record.guesses ?? [], hard: record.hard ?? null, listens: record.listens ?? 0 };
  }
  selected = null;
  comparing = null;
}

function saveGame() {
  if (mode === 'practice') return;
  const history = loadHistory();
  history[game.puzzle.day] = { guesses: game.guesses, hard: game.hard, listens: game.listens };
  storage.set(keyFor('history', type), history);
}

function status() {
  return gameStatus(game.puzzle, game.guesses);
}

function misses() {
  return game.guesses.filter((g) => g !== game.puzzle.answer).length;
}

// Hard mode is fixed for a game at its first guess; before that it follows the setting.
function isHard() {
  return game.hard ?? settings.hard;
}

// Practice

function practiceSettings(gameType = type) {
  return { ...DEFAULT_PRACTICE[gameType], ...storage.get(keyFor('practice-settings', gameType), {}) };
}

function loadPracticeStats(gameType = type) {
  return practiceStats(storage.get(keyFor('practice-stats', gameType), {}));
}

function newPracticeGame() {
  const options = practiceSettings();
  const puzzle = randomPuzzle(type, {
    pool: options.pool,
    previous: practiceGames[type]?.puzzle.answer ?? null,
    weights: options.adaptive ? practiceWeights(loadPracticeStats(), options.pool) : null,
    direction: options.direction,
  });
  return { puzzle, guesses: [], hard: null, listens: 0 };
}

function nextPracticePuzzle() {
  practiceGames[type] = newPracticeGame();
  loadGame();
  hideToast();
  render();
  $('#play-primary').click();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Daily statistics

function loadStats(gameType = type) {
  return {
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: Array(MAX_ATTEMPTS).fill(0),
    lastPlayedDay: null,
    lastWonDay: null,
    ...storage.get(keyFor('stats', gameType), {}),
  };
}

function recordDailyResult() {
  const stats = loadStats();
  if (stats.lastPlayedDay === today) return;
  stats.played += 1;
  stats.lastPlayedDay = today;
  if (status() === 'won') {
    stats.wins += 1;
    stats.distribution[game.guesses.length - 1] += 1;
    stats.currentStreak = stats.lastWonDay === today - 1 ? stats.currentStreak + 1 : 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.lastWonDay = today;
  } else {
    stats.currentStreak = 0;
  }
  storage.set(keyFor('stats', type), stats);
}

function renderStats() {
  const stats = loadStats();
  const streak = stats.lastWonDay !== null && stats.lastWonDay >= today - 1 ? stats.currentStreak : 0;
  const winRate = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
  $('#stats-title').textContent = `${t('statistics')} · ${typeName()}`;
  $('#stats').innerHTML = [
    [stats.played, t('statPlayed')],
    [winRate, t('statWinRate')],
    [streak, t('statStreak')],
    [stats.maxStreak, t('statMaxStreak')],
  ]
    .map(([value, label]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`)
    .join('');

  const max = Math.max(1, ...stats.distribution);
  const todayRecord = loadHistory()[today];
  const todayRow = todayRecord && gameStatus(puzzleForDay(type, today), todayRecord.guesses) === 'won' ? todayRecord.guesses.length - 1 : -1;
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

// Archive

function renderArchive() {
  const history = loadHistory();
  const locale = getLanguage();
  $('#archive-title').textContent = `${t('archiveTitle')} · ${typeName()}`;
  const rows = [];
  for (let day = today; day >= 1; day--) {
    const date = new Date();
    date.setDate(date.getDate() - (today - day));
    const record = history[day];
    let state = t('notPlayed');
    let icon = '·';
    if (record?.guesses.length) {
      const result = gameStatus(puzzleForDay(type, day), record.guesses);
      icon = { won: '✅', lost: '❌', playing: '▶️' }[result];
      state = result === 'won' ? `${record.guesses.length}/${MAX_ATTEMPTS}` : result === 'lost' ? `X/${MAX_ATTEMPTS}` : t('inProgress');
    }
    rows.push(`
      <li><button data-day="${day}">
        <span class="archive-day">#${day}${day === today ? ` · ${t('today')}` : ''}</span>
        <span class="archive-date">${date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <span class="archive-state">${icon} ${state}</span>
      </button></li>`);
  }
  if (today === 1) rows.push(`<li class="archive-empty">${t('archiveEmpty')}</li>`);
  $('#archive-list').innerHTML = rows.join('');
}

function openArchive() {
  $('#stats-modal').close();
  renderArchive();
  $('#archive-modal').showModal();
}

// Navigation: the URL hash keeps the current game, e.g. #chords-practice or #archive-12.

function parseHash() {
  let rest = location.hash.slice(1);
  let gameType = 'intervals';
  if (rest.startsWith('chords')) {
    gameType = 'chords';
    rest = rest.slice('chords'.length).replace(/^-/, '');
  }
  if (rest === 'practice') return { type: gameType, mode: 'practice' };
  const archive = rest.match(/^archive-(\d+)$/);
  if (archive && Number(archive[1]) >= 1 && Number(archive[1]) < today) {
    return { type: gameType, mode: 'archive', day: Number(archive[1]) };
  }
  return { type: gameType, mode: 'daily' };
}

function hashFor(route) {
  const parts = [];
  if (route.type === 'chords') parts.push('chords');
  if (route.mode === 'practice') parts.push('practice');
  if (route.mode === 'archive') parts.push(`archive-${route.day}`);
  return parts.length ? `#${parts.join('-')}` : '';
}

function navigate(route) {
  if (route.mode !== 'practice' && dayNumber() !== today) {
    // A new day started while the page was open: reload to get the new puzzles.
    location.replace(`${location.pathname}${location.search}${hashFor({ ...route, mode: 'daily' })}`);
    return;
  }
  type = route.type;
  mode = route.mode === 'archive' && route.day === today ? 'daily' : route.mode;
  archiveDay = mode === 'archive' ? route.day : null;
  history.replaceState(null, '', `${location.pathname}${location.search}${hashFor({ type, mode, day: archiveDay })}`);
  loadGame();
  hideToast();
  renderPracticePanel();
  render();
}

// Rendering

function typeName(gameType = type) {
  return t(gameType === 'intervals' ? 'typeIntervals' : 'typeChords');
}

function primaryPlayback() {
  return mode === 'practice' ? practiceSettings().playback : GAME_TYPES[type].playback;
}

function playbackLabel(playback) {
  const key = { intervals: { melodic: 'playIntervalsMelodic', harmonic: 'playIntervalsHarmonic' }, chords: { melodic: 'playChordsMelodic', harmonic: 'playChordsHarmonic' } };
  return t(key[type][playback]);
}

// The answers shown as buttons: the daily pool, or the practice selection
// (plus anything already on the board).
function gridOptions() {
  const all = GAME_TYPES[type].options.map((o) => o.id);
  const base = mode === 'practice' ? practiceSettings().pool : GAME_TYPES[type].dailyPool;
  const shown = new Set([...base, game.puzzle.answer, ...game.guesses]);
  return all.filter((id) => shown.has(id));
}

function optionDetail(id) {
  if (type === 'chords') return chordSymbol(id);
  return `${id} ${t(id === 1 ? 'semitone' : 'semitones')}`;
}

function render() {
  const current = status();
  const over = current !== 'playing';
  const { puzzle, guesses } = game;

  for (const tab of document.querySelectorAll('[data-type]')) tab.setAttribute('aria-selected', String(tab.dataset.type === type));
  for (const tab of document.querySelectorAll('[data-mode]')) {
    tab.setAttribute('aria-selected', String(tab.dataset.mode === (mode === 'archive' ? 'daily' : mode)));
  }

  $('#day-label').textContent = mode === 'practice' ? t('practice') : mode === 'archive' ? `#${archiveDay} · ${t('archive')}` : `#${today}`;
  $('#question').textContent = t(type === 'intervals' ? 'questionIntervals' : 'questionChords');
  $('#archive-note').hidden = mode !== 'archive';
  $('#practice-panel').hidden = mode !== 'practice';
  $('#practice-stats').hidden = mode !== 'practice';
  if (mode === 'practice') {
    const stats = loadPracticeStats();
    $('#practice-stats').textContent = t('practiceStats', { wins: stats.wins, played: stats.played, streak: stats.streak, best: stats.bestStreak });
  }

  // Listening
  const primary = primaryPlayback();
  const secondary = primary === 'melodic' ? 'harmonic' : 'melodic';
  $('#play-primary-label').textContent = playbackLabel(primary);
  $('#play-secondary-label').textContent = playbackLabel(secondary);
  $('#play-secondary').disabled = !over && (isHard() || misses() < 1);
  const listensLeft = HARD_MODE_LISTENS - game.listens;
  $('#listens-left').hidden = over || !isHard();
  $('#listens-left').textContent = listensLeft > 0 ? t('listensLeft', { count: listensLeft }) : t('noListensLeft');

  $('#attempts').innerHTML = Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
    const guess = guesses[i];
    if (guess === undefined) return '<li class="attempt empty"></li>';
    return `<li class="attempt ${evaluateGuess(puzzle, guess)}">${optionName(type, guess)}</li>`;
  }).join('');

  const hints = over || isHard() ? [] : hintsFor(puzzle, misses());
  $('#hints').innerHTML = hints.map(({ key, family }) => `<li>${t(key, { family: family && t('families')[family] })}</li>`).join('');

  renderGrid(over);

  const confirm = $('#confirm-button');
  confirm.hidden = over;
  confirm.disabled = selected === null;
  confirm.textContent = selected === null ? t('pickAnswer') : t('submit', { name: optionName(type, selected) });

  $('#result').hidden = !over;
  if (over) renderResult(current);
}

function renderGrid(over) {
  const grid = $('#option-grid');
  const ids = gridOptions();
  const layoutKey = `${type}:${ids.join(',')}`;
  if (grid.dataset.layout !== layoutKey) {
    grid.dataset.layout = layoutKey;
    grid.className = `option-grid ${type}${ids.length > 12 ? ' many' : ''}`;
    grid.innerHTML = '';
    for (const id of ids) {
      const button = document.createElement('button');
      button.dataset.option = id;
      button.addEventListener('click', () => onOptionClick(id));
      grid.append(button);
    }
  }
  for (const button of grid.children) {
    const id = type === 'intervals' ? Number(button.dataset.option) : button.dataset.option;
    const guessed = game.guesses.includes(id);
    button.className = 'option';
    button.innerHTML = `<strong>${optionName(type, id)}</strong><small>${optionDetail(id)}</small>`;
    if (guessed) button.classList.add(evaluateGuess(game.puzzle, id));
    if (over && id === game.puzzle.answer) button.classList.add('answer');
    if (id === selected || (over && id === comparing)) button.classList.add('selected');
    button.disabled = !over && guessed;
  }
}

function renderResult(current) {
  const { puzzle, guesses } = game;
  const spelled = spellNotes(puzzle);
  $('#result-title').textContent = current === 'won' ? t('winTitles')[guesses.length - 1] : t('lossTitle');
  $('#result-answer').innerHTML =
    type === 'intervals'
      ? t('answer', { ascending: puzzle.ascending, name: optionName(type, puzzle.answer), first: noteName(spelled[0]), second: noteName(spelled[1]) })
      : t('answerChord', { name: optionName(type, puzzle.answer), symbol: chordSymbol(puzzle.answer, spelled[0]), notes: spelled.map(noteName).join(' · ') });

  const song = type === 'intervals' ? songFor(puzzle.answer, puzzle.ascending) : null;
  $('#result-song').hidden = !song;
  if (song) $('#result-song').innerHTML = `🎵 ${t('songLabel')} <em>${song}</em>`;

  $('#share-button').hidden = mode === 'practice';
  $('#countdown-box').hidden = mode !== 'daily';
  $('#next-button').hidden = mode !== 'practice';
  $('#result-archive-button').hidden = mode === 'practice';
  if (comparing === null) renderKeyboard(null);
}

// Keyboard showing the puzzle notes (and the notes being compared, if any).
function renderKeyboard(comparison) {
  const { notes } = game.puzzle;
  const extra = (comparison ?? []).filter((n) => !notes.includes(n));
  const all = [...notes, ...extra];
  const low = Math.min(...all);
  const start = low - (low % 12);
  const end = Math.max(start + 24, Math.max(...all) + (11 - (Math.max(...all) % 12)));

  const whites = [];
  const blacks = [];
  for (let midi = start; midi <= end; midi++) {
    const classes = ['key'];
    const index = notes.indexOf(midi);
    if (index === 0) classes.push('first');
    else if (index > 0) classes.push('second');
    else if (extra.includes(midi)) classes.push('compare');
    const key = { midi, classes, label: index >= 0 ? index + 1 : '' };
    if (isBlackKey(midi)) blacks.push({ ...key, after: whites.length });
    else whites.push(key);
  }

  const width = 100 / whites.length;
  $('#keyboard').innerHTML =
    whites.map(({ classes, label }) => `<div class="${classes.join(' ')} white"><span>${label}</span></div>`).join('') +
    blacks
      .map(
        ({ classes, label, after }) =>
          `<div class="${classes.join(' ')} black" style="left: calc(${after * width}% - ${width * 0.3}%); width: ${width * 0.6}%"><span>${label}</span></div>`,
      )
      .join('');
}

// Practice settings panel

function renderPracticePanel() {
  if (mode !== 'practice') return;
  const options = practiceSettings();
  const checkbox = (id) => `
    <label class="chip"><input type="checkbox" name="pool" value="${id}"${options.pool.includes(id) ? ' checked' : ''} />${optionName(type, id)}</label>`;
  const radio = (name, value, label) => `
    <label class="chip"><input type="radio" name="${name}" value="${value}"${options[name] === value ? ' checked' : ''} />${label}</label>`;

  let pool;
  if (type === 'intervals') {
    const simple = GAME_TYPES.intervals.options.filter((o) => !o.compound).map((o) => o.id);
    const compound = GAME_TYPES.intervals.options.filter((o) => o.compound).map((o) => o.id);
    pool = `
      <p class="group-label">${t('simpleIntervals')} <button class="link-button" data-select="simple">${t('selectAll')}</button></p>
      <div class="chips">${simple.map(checkbox).join('')}</div>
      <p class="group-label">${t('compoundIntervals')} <button class="link-button" data-select="compound">${t('selectAll')}</button></p>
      <div class="chips">${compound.map(checkbox).join('')}</div>`;
  } else {
    pool = `
      <p class="group-label"><button class="link-button" data-select="all">${t('selectAll')}</button></p>
      <div class="chips">${GAME_TYPES.chords.options.map((o) => checkbox(o.id)).join('')}</div>`;
  }

  const stats = loadPracticeStats();
  const spots = weakSpots(stats, GAME_TYPES[type].options.map((o) => o.id));
  const parseId = (id) => (type === 'intervals' ? Number(id) : id);
  const spotList = spots.length
    ? `<ul class="weak-spots">${spots
        .map(
          (spot) =>
            `<li>${t('weakSpot', {
              name: optionName(type, spot.id),
              accuracy: Math.round(spot.accuracy * 100),
              confusedWith: spot.confusedWith && optionName(type, parseId(spot.confusedWith)),
            })}</li>`,
        )
        .join('')}</ul>`
    : `<p class="muted">${t('noWeakSpots')}</p>`;

  $('#practice-panel-body').innerHTML = `
    <fieldset><legend>${t('include')}</legend>${pool}</fieldset>
    ${
      type === 'intervals'
        ? `<fieldset><legend>${t('direction')}</legend><div class="chips">
            ${radio('direction', 'up', t('directionUp'))}${radio('direction', 'down', t('directionDown'))}${radio('direction', 'both', t('directionBoth'))}
          </div></fieldset>`
        : ''
    }
    <fieldset><legend>${t('playback')}</legend><div class="chips">
      ${radio('playback', 'melodic', t(type === 'intervals' ? 'playbackMelodicIntervals' : 'playbackMelodicChords'))}${radio('playback', 'harmonic', t('playbackHarmonic'))}
    </div></fieldset>
    <label class="toggle-row"><input type="checkbox" name="adaptive"${options.adaptive ? ' checked' : ''} /> ${t('adaptive')}</label>
    <h4>${t('weakSpots')}</h4>
    ${spotList}
    <button class="link-button danger" data-reset>${t('resetPractice')}</button>`;
}

function savePracticeSettings(changes) {
  const options = { ...practiceSettings(), ...changes };
  const order = GAME_TYPES[type].options.map((o) => o.id);
  options.pool = order.filter((id) => options.pool.includes(id));
  storage.set(keyFor('practice-settings', type), options);
  // Apply right away unless a puzzle is already under way.
  if (game.guesses.length === 0) practiceGames[type] = newPracticeGame();
  loadGame();
  renderPracticePanel();
  render();
}

function setupPracticePanel() {
  const body = $('#practice-panel-body');
  body.addEventListener('change', (event) => {
    const input = event.target;
    const parseId = (id) => (type === 'intervals' ? Number(id) : id);
    if (input.name === 'pool') {
      const pool = [...body.querySelectorAll('input[name="pool"]:checked')].map((el) => parseId(el.value));
      if (pool.length < 2) {
        input.checked = true;
        showToast(t('needAtLeastTwo'));
        return;
      }
      savePracticeSettings({ pool });
    } else if (input.name === 'direction' || input.name === 'playback') {
      savePracticeSettings({ [input.name]: input.value });
    } else if (input.name === 'adaptive') {
      savePracticeSettings({ adaptive: input.checked });
    }
  });
  body.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.select) {
      const options = GAME_TYPES[type].options;
      const group = { simple: options.filter((o) => !o.compound), compound: options.filter((o) => o.compound), all: options }[button.dataset.select];
      savePracticeSettings({ pool: [...new Set([...practiceSettings().pool, ...group.map((o) => o.id)])] });
    } else if ('reset' in button.dataset && confirm(t('resetPracticeConfirm'))) {
      storage.remove(keyFor('practice-stats', type));
      renderPracticePanel();
      render();
    }
  });
}

// Playing

function onOptionClick(id) {
  if (status() !== 'playing') {
    // After the game, the buttons play each answer from the same starting point.
    comparing = id;
    const notes = notesFor(game.puzzle, id);
    playNotes(notes, primaryPlayback());
    renderKeyboard(notes);
    render();
    return;
  }
  if (game.guesses.includes(id)) return;
  selected = selected === id ? null : id;
  render();
}

function submitGuess() {
  if (selected === null || status() !== 'playing') return;
  if (game.guesses.length === 0) game.hard = settings.hard;
  game.guesses = [...game.guesses, selected];
  selected = null;
  saveGame();

  const result = evaluateGuess(game.puzzle, game.guesses.at(-1));
  if (status() !== 'playing') {
    if (mode === 'daily') recordDailyResult();
    if (mode === 'practice') {
      storage.set(keyFor('practice-stats', type), recordPracticeGame(loadPracticeStats(), game.puzzle.answer, game.guesses));
      renderPracticePanel();
    }
    render();
    playNotes(game.puzzle.notes, primaryPlayback());
    $('#result').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    return;
  }
  render();
  showToast(t(result === 'close' ? 'toastClose' : 'toastWrong'));
}

function listen(playback, button) {
  const over = status() !== 'playing';
  if (!over && isHard()) {
    if (game.listens >= HARD_MODE_LISTENS) {
      showToast(t('noListensLeft'));
      return;
    }
    game.listens += 1;
    saveGame();
  }
  comparing = null;
  if (over) renderKeyboard(null);
  button.classList.add('playing');
  clearTimeout(button.playingTimer);
  button.playingTimer = setTimeout(() => button.classList.remove('playing'), playNotes(game.puzzle.notes, playback) * 1000);
  render();
}

function setupAudioButtons() {
  $('#play-primary').addEventListener('click', (event) => listen(primaryPlayback(), event.currentTarget));
  $('#play-secondary').addEventListener('click', (event) => listen(primaryPlayback() === 'melodic' ? 'harmonic' : 'melodic', event.currentTarget));
}

// Sharing and countdown

async function share() {
  const title = type === 'intervals' ? APP_NAME : `${APP_NAME} ${t('typeChords')}`;
  const url = `${location.origin}${location.pathname}${type === 'chords' ? '#chords' : ''}`;
  const text = `${shareText(game.puzzle, game.guesses, { title, hard: game.hard, highContrast: settings.highContrast })}\n${url}`;
  if (matchMedia('(pointer: coarse)').matches && navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }
  copy(text, t('toastCopied'));
}

async function copy(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    showToast(t('toastCopyFailed'));
  }
}

function startCountdown() {
  const update = () => {
    if (dayNumber() !== today && mode === 'daily') {
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

// Toast

let toastTimer;
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 1800);
}

function hideToast() {
  $('#toast').hidden = true;
}

// Language

// Fills every element marked with data-i18n (text), data-i18n-html or data-i18n-aria.
function translatePage() {
  document.documentElement.lang = getLanguage();
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  const language = LANGUAGES[getLanguage()];
  $('#language-button').innerHTML = FLAGS[language.flag];
  $('#language-button').setAttribute('aria-label', `${t('language')}: ${language.name}`);
  $('#import-input').placeholder = t('importPlaceholder');
  $('#language-list').innerHTML = Object.entries(LANGUAGES)
    .map(
      ([code, { name, flag }]) =>
        `<li><button role="menuitemradio" aria-checked="${code === getLanguage()}" data-language="${code}">${FLAGS[flag]}<span>${name}</span></button></li>`,
    )
    .join('');
  renderInstrumentChoices();
}

function setupLanguage() {
  setLanguage(storage.get('language', DEFAULT_LANGUAGE));
  const button = $('#language-button');
  const list = $('#language-list');
  const toggle = (open) => {
    list.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) list.querySelector('[aria-checked="true"]')?.focus();
  };
  button.addEventListener('click', () => toggle(list.hidden));
  list.addEventListener('click', (event) => {
    const option = event.target.closest('[data-language]');
    if (!option) return;
    setLanguage(option.dataset.language);
    storage.set('language', getLanguage());
    toggle(false);
    translatePage();
    renderPracticePanel();
    render();
    button.focus();
  });
  document.addEventListener('click', (event) => {
    if (!list.hidden && !event.target.closest('.language-menu')) toggle(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !list.hidden) {
      toggle(false);
      button.focus();
    }
  });
}

// Settings

function saveSettings(changes) {
  settings = { ...settings, ...changes };
  storage.set('settings', settings);
}

function applySettings() {
  document.documentElement.classList.toggle('high-contrast', settings.highContrast);
  setVolume(settings.volume);
  setInstrument(settings.instrument);
}

function renderInstrumentChoices() {
  $('#setting-instrument').innerHTML = Object.keys(INSTRUMENTS)
    .map(
      (name) =>
        `<label class="chip"><input type="radio" name="instrument" value="${name}"${settings.instrument === name ? ' checked' : ''} />${t('instruments')[name]}</label>`,
    )
    .join('');
}

function setupSettings() {
  $('#settings-button').addEventListener('click', () => {
    $('#setting-hard').checked = settings.hard;
    $('#setting-contrast').checked = settings.highContrast;
    $('#setting-volume').value = Math.round(settings.volume * 100);
    renderInstrumentChoices();
    $('#settings-modal').showModal();
  });

  $('#setting-hard').addEventListener('change', (event) => {
    const turningOn = event.target.checked;
    // Like Wordle: hard mode can't be switched on halfway through a game.
    if (turningOn && game.guesses.length > 0 && status() === 'playing' && !game.hard) {
      event.target.checked = false;
      showToast(t('hardModeLocked'));
      return;
    }
    saveSettings({ hard: turningOn });
    render();
  });
  $('#setting-contrast').addEventListener('change', (event) => {
    saveSettings({ highContrast: event.target.checked });
    applySettings();
  });
  $('#setting-volume').addEventListener('input', (event) => {
    saveSettings({ volume: Number(event.target.value) / 100 });
    setVolume(settings.volume);
  });
  $('#setting-volume').addEventListener('change', () => playNotes([60], 'harmonic'));
  $('#setting-instrument').addEventListener('change', (event) => {
    saveSettings({ instrument: event.target.value });
    setInstrument(settings.instrument);
    playNotes([60, 64, 67], 'melodic');
  });

  $('#export-button').addEventListener('click', () => copy(exportProgress(), t('codeCopied')));
  $('#import-button').addEventListener('click', () => {
    const code = $('#import-input').value;
    if (!code.trim()) return;
    if (!confirm(t('importConfirm'))) return;
    try {
      importProgress(code);
      location.reload();
    } catch {
      showToast(t('importInvalid'));
    }
  });
}

// Modals

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
  $('#stats-archive-button').addEventListener('click', openArchive);
  $('#result-archive-button').addEventListener('click', openArchive);
  $('#archive-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-day]');
    if (!button) return;
    $('#archive-modal').close();
    navigate({ type, mode: 'archive', day: Number(button.dataset.day) });
  });
  if (!storage.get('help-seen', false)) {
    storage.set('help-seen', true);
    $('#help-modal').showModal();
  }
}

// Keyboard shortcuts: Space plays, digits or arrows pick an answer, Enter submits.

function moveSelection(key) {
  const buttons = [...$('#option-grid').children];
  const columns = getComputedStyle($('#option-grid')).gridTemplateColumns.split(' ').length;
  const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[key];
  let index = buttons.findIndex((b) => b.classList.contains('selected'));
  if (index === -1) index = step > 0 ? -step : buttons.length - step;
  for (let i = index + step; i >= 0 && i < buttons.length; i += step) {
    if (!buttons[i].disabled) {
      buttons[i].click();
      return;
    }
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    if (document.querySelector('dialog[open]') || event.target.closest('input, textarea, select, summary, .practice-panel')) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const onButton = event.target.closest('button');
    if (event.key === ' ' && !onButton) {
      event.preventDefault();
      $('#play-primary').click();
    } else if (event.key === 'Enter') {
      // Enter submits even when focus is still on a button (e.g. after clicking Play).
      if (status() === 'playing' && selected !== null) {
        event.preventDefault();
        submitGuess();
      } else if (mode === 'practice' && status() !== 'playing' && !onButton) {
        nextPracticePuzzle();
      }
    } else if (/^[0-9]$/.test(event.key)) {
      const button = $('#option-grid').children[event.key === '0' ? 9 : Number(event.key) - 1];
      if (button && !button.disabled) button.click();
    } else if (event.key.startsWith('Arrow') && status() === 'playing') {
      event.preventDefault();
      moveSelection(event.key);
    }
  });
}

// Offline support and installation

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  // Local development serves unversioned files; caching them would hide edits.
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (local && !new URLSearchParams(location.search).has('sw')) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // Hand the worker everything loaded so far (it only sees requests made after
  // it takes control), including the instrument samples once they've arrived.
  const sendLoadedFiles = () =>
    navigator.serviceWorker.ready.then((registration) => {
      const urls = performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((url) => new URL(url).origin === location.origin);
      registration.active?.postMessage({ type: 'cache', page: location.href.split('#')[0], urls });
    });
  addEventListener('load', () => setTimeout(sendLoadedFiles, 3000));
}

migrateLegacyState();
setupLanguage();
applySettings();
translatePage();
setupAudioButtons();
setupModals();
setupSettings();
setupPracticePanel();
setupKeyboardShortcuts();
$('#confirm-button').addEventListener('click', submitGuess);
$('#share-button').addEventListener('click', share);
$('#next-button').addEventListener('click', nextPracticePuzzle);
$('#back-to-today').addEventListener('click', () => navigate({ type, mode: 'daily' }));
for (const tab of document.querySelectorAll('[data-type]')) {
  tab.addEventListener('click', () => navigate({ type: tab.dataset.type, mode: mode === 'archive' ? 'daily' : mode }));
}
for (const tab of document.querySelectorAll('[data-mode]')) {
  tab.addEventListener('click', () => navigate({ type, mode: tab.dataset.mode }));
}
window.addEventListener('hashchange', () => navigate(parseHash()));
startCountdown();
navigate(parseHash());
prefetch();
registerServiceWorker();
