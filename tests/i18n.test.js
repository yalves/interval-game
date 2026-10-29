import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LANGUAGE, LANGUAGES, STRINGS, chordSymbol, noteName, optionFeel, optionName, setLanguage, songFor, t } from '../js/i18n.js';
import { CHORDS, DEGREES, INTERVALS } from '../js/games.js';
import { FLAGS } from '../js/flags.js';

function assertSameShape(actual, reference, path) {
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(reference).sort(), path);
  for (const key of Object.keys(reference)) {
    const [a, r] = [actual[key], reference[key]];
    assert.equal(typeof a, typeof r, `${path}.${key}`);
    if (Array.isArray(r)) assert.equal(a.length, r.length, `${path}.${key}`);
    else if (r && typeof r === 'object') assertSameShape(a, r, `${path}.${key}`);
  }
}

test('every language has the same keys and value types as the default', () => {
  assert.deepEqual(Object.keys(LANGUAGES).sort(), Object.keys(STRINGS).sort());
  for (const [language, strings] of Object.entries(STRINGS)) {
    assertSameShape(strings, STRINGS[DEFAULT_LANGUAGE], language);
    assert.ok(FLAGS[LANGUAGES[language].flag], `flag for ${language}`);
    assert.deepEqual(Object.keys(strings.chords).sort(), CHORDS.map((c) => c.id).sort());
    assert.equal(strings.intervals.length, 24);
  }
});

test('translates text, placeholders, options and notes', () => {
  setLanguage('pt-BR');
  assert.equal(t('submit', { name: optionName('intervals', 7) }), 'Confirmar: 5ª justa');
  assert.equal(optionName('chords', 'diminished'), 'Diminuto');
  assert.equal(noteName({ letter: 0, accidental: 0, octave: 4 }), 'Dó4');
  assert.equal(chordSymbol('major7', { letter: 1, accidental: 0 }), 'D7M');
  assert.equal(t('hintFamily', { family: t('families').majorThird }), 'É um acorde com terça maior: soa claro.');
  assert.match(t('answer', { ascending: false, name: 'Trítono', first: 'Fá♯4', second: 'Dó4' }), /trítono descendente/);

  setLanguage('en');
  assert.equal(t('submit', { name: optionName('intervals', 19) }), 'Submit: Perfect 12th');
  assert.equal(noteName({ letter: 6, accidental: -1, octave: 4 }), 'B♭4');
  assert.equal(chordSymbol('major7', { letter: 1, accidental: 0 }), 'Dmaj7');
  assert.equal(t('listensLeft', { count: 1 }), '1 listen left');
  assert.match(t('answer', { ascending: false, name: 'Tritone', first: 'F♯4', second: 'C4' }), /a descending <strong>tritone/);

  setLanguage('xx');
  assert.equal(t('daily'), 'Daily');
});

test('songFor prefers the matching direction and labels fallbacks', () => {
  setLanguage('en');
  assert.equal(songFor(5, true), 'Here Comes the Bride');
  assert.equal(songFor(5, false), 'Eine kleine Nachtmusik');
  assert.equal(songFor(6, false), 'The Simpsons (theme) (ascending)');
  assert.equal(songFor(14, true), null);
});

test('every answer has a friendly label and emoji in every language', () => {
  for (const language of Object.keys(STRINGS)) {
    setLanguage(language);
    for (const ascending of [true, false]) {
      for (const { id } of INTERVALS) {
        const feel = optionFeel('intervals', id, ascending);
        assert.ok(feel.emoji && feel.text, `${language} interval ${id}`);
      }
    }
    for (const { id } of CHORDS) assert.ok(optionFeel('chords', id).emoji && optionFeel('chords', id).text, `${language} ${id}`);
    for (const { id } of DEGREES) assert.ok(optionFeel('harmony', id).emoji && optionFeel('harmony', id).text, `${language} degree ${id}`);
  }
  setLanguage('en');
  assert.deepEqual(optionFeel('intervals', 5), { emoji: '👰', text: 'Here Comes the Bride' });
  assert.deepEqual(optionFeel('intervals', 5, false), { emoji: '🎻', text: 'Mozart Serenade' });
  assert.deepEqual(optionFeel('intervals', 6, false), { emoji: '🍩', text: 'The Simpsons' });
  assert.deepEqual(optionFeel('intervals', 19), { emoji: '⭐', text: 'Twinkle, Twinkle + an octave' });
  setLanguage('pt-BR');
  assert.deepEqual(optionFeel('chords', 'minor'), { emoji: '🌧️', text: 'Triste' });
});
