import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LANGUAGE, STRINGS, intervalName, noteName, setLanguage, t } from '../js/i18n.js';

test('every language has the same keys and value types as the default', () => {
  const reference = STRINGS[DEFAULT_LANGUAGE];
  for (const [language, strings] of Object.entries(STRINGS)) {
    assert.deepEqual(Object.keys(strings).sort(), Object.keys(reference).sort(), language);
    for (const key of Object.keys(reference)) {
      assert.equal(typeof strings[key], typeof reference[key], `${language}.${key}`);
      if (Array.isArray(reference[key])) assert.equal(strings[key].length, reference[key].length, `${language}.${key}`);
    }
    assert.deepEqual(Object.keys(strings.families).sort(), Object.keys(reference.families).sort(), language);
  }
});

test('translates text, placeholders, intervals and notes', () => {
  setLanguage('pt-BR');
  assert.equal(t('submit', { name: intervalName(7) }), 'Confirmar: 5ª justa');
  assert.equal(noteName(60), 'Dó4');
  assert.match(t('answer', { ascending: false, name: 'Trítono', first: 'Fá♯4', second: 'Dó4' }), /trítono descendente/);

  setLanguage('en');
  assert.equal(t('submit', { name: intervalName(7) }), 'Submit: Perfect 5th');
  assert.equal(noteName(70), 'A♯4');
  assert.match(t('answer', { ascending: false, name: 'Tritone', first: 'F♯4', second: 'C4' }), /a descending <strong>tritone/);

  setLanguage('xx');
  assert.equal(t('daily'), 'Daily');
});
