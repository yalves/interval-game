// Everything the game saves lives in localStorage under this prefix.
const PREFIX = 'intervalgame:';
// The game used to be called Musicle; its saved data and transfer codes still work.
const OLD_PREFIX = 'musicle:';
const CODE_VERSION = 'M1.';

const renamedKey = (key) => (key.startsWith(OLD_PREFIX) ? PREFIX + key.slice(OLD_PREFIX.length) : key);

// Runs once on load, before anything reads saved data.
try {
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith(OLD_PREFIX)) continue;
    if (localStorage.getItem(renamedKey(key)) === null) localStorage.setItem(renamedKey(key), localStorage.getItem(key));
    localStorage.removeItem(key);
  }
} catch {
  // No storage available.
}

export const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(PREFIX + key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // No storage (e.g. private mode): the game still works, it just doesn't persist.
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // Nothing to remove.
    }
  },
};

function savedKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(PREFIX)) keys.push(key);
  }
  return keys;
}

// A copyable code with all saved progress, to move it to another device.
export function exportProgress() {
  const data = Object.fromEntries(savedKeys().map((key) => [key, localStorage.getItem(key)]));
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return CODE_VERSION + btoa(binary);
}

// Replaces all saved progress with the code's. Throws if the code is invalid.
export function importProgress(code) {
  const trimmed = code.trim();
  if (!trimmed.startsWith(CODE_VERSION)) throw new Error('Unknown code');
  const bytes = Uint8Array.from(atob(trimmed.slice(CODE_VERSION.length)), (c) => c.charCodeAt(0));
  const data = JSON.parse(new TextDecoder().decode(bytes));
  const entries = Object.entries(data).map(([key, value]) => [renamedKey(key), value]);
  if (!entries.length || !entries.every(([key, value]) => key.startsWith(PREFIX) && typeof value === 'string')) {
    throw new Error('Invalid code');
  }
  for (const [, value] of entries) JSON.parse(value);
  for (const key of savedKeys()) localStorage.removeItem(key);
  for (const [key, value] of entries) localStorage.setItem(key, value);
}
