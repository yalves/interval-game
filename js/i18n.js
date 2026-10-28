// UI text in every supported language. Values are strings with {placeholders},
// arrays, or functions that receive the params object.

export const DEFAULT_LANGUAGE = 'en';

// Label shown in the language picker.
export const LANGUAGES = {
  en: '🇺🇸',
  'pt-BR': '🇧🇷',
};

export const STRINGS = {
  en: {
    language: 'Language',
    howToPlay: 'How to play',
    statistics: 'Statistics',
    close: 'Close',
    gameMode: 'Game mode',
    daily: 'Daily',
    practice: 'Practice',
    question: "What's the interval between the two notes?",
    practiceStats: '{wins}/{played} correct · Streak {streak} · Best {best}',
    playNotes: 'Play notes',
    playTogether: 'Play together',
    guesses: 'Guesses',
    intervalsLabel: 'Intervals',
    pickInterval: 'Pick an interval',
    submit: 'Submit: {name}',
    semitone: 'semitone',
    semitones: 'semitones',
    resultTip: 'Tap the intervals below to compare them with the answer.',
    share: 'Share',
    nextInterval: 'Next interval →',
    nextPuzzleIn: 'Next puzzle in',
    toastClose: 'Close! Same family.',
    toastWrong: 'Not that one.',
    toastCopied: 'Copied results to clipboard!',
    toastCopyFailed: "Couldn't copy the results.",
    winTitles: ['Genius! 🎉', 'Great ear! 👏', 'Nice! 🎵', 'Phew, close one! 😅'],
    lossTitle: 'Not this time 🎹',
    answer: ({ ascending, name, first, second }) =>
      `The answer was ${ascending ? 'an ascending' : 'a descending'} <strong>${name.toLowerCase()}</strong>: ${first} → ${second}.`,
    hintTogether: 'You can now hear both notes played together.',
    hintSmall: "It's a small interval: 6 semitones (tritone) or less.",
    hintLarge: "It's a large interval: 7 semitones (perfect 5th) or more.",
    hintFamily: "It's a {family}.",
    families: {
      perfect: 'perfect consonance',
      imperfect: 'imperfect consonance',
      dissonant: 'dissonance',
    },
    intervals: [
      'Minor 2nd',
      'Major 2nd',
      'Minor 3rd',
      'Major 3rd',
      'Perfect 4th',
      'Tritone',
      'Perfect 5th',
      'Minor 6th',
      'Major 6th',
      'Minor 7th',
      'Major 7th',
      'Octave',
    ],
    notes: ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'],
    statPlayed: 'Played',
    statWinRate: 'Win %',
    statStreak: 'Current streak',
    statMaxStreak: 'Max streak',
    guessDistribution: 'Guess distribution',
    help: `
      <h2>How to play</h2>
      <p>There's a new puzzle every day. Listen to two piano notes and name the <strong>interval</strong> between them in <strong>4 guesses</strong> or fewer.</p>
      <p>An interval is the distance between two notes, measured in semitones (each neighboring key on the piano, white or black, is one semitone). The second note can be higher or lower than the first.</p>
      <h3>Colors</h3>
      <ul class="legend">
        <li><span class="swatch correct"></span> Correct interval.</li>
        <li><span class="swatch close"></span> Wrong, but in the same family (perfect consonance, imperfect consonance or dissonance).</li>
        <li><span class="swatch wrong"></span> Wrong, and in a different family.</li>
      </ul>
      <h3>Families</h3>
      <ul class="families">
        <li><strong>Perfect consonances:</strong> perfect 4th, perfect 5th, octave.</li>
        <li><strong>Imperfect consonances:</strong> 3rds and 6ths.</li>
        <li><strong>Dissonances:</strong> 2nds, 7ths and the tritone.</li>
      </ul>
      <h3>Hints</h3>
      <p>Each miss unlocks a new hint: first you can hear the notes together, then you learn whether the interval is small or large, and finally its family.</p>
      <h3>Practice</h3>
      <p>Want more? Switch to <strong>Practice</strong> for unlimited random intervals with the same rules. Practice games don't affect your daily stats.</p>
      <p class="muted">Shortcuts: <kbd>Space</kbd> plays the notes, <kbd>Enter</kbd> submits.</p>`,
  },

  'pt-BR': {
    language: 'Idioma',
    howToPlay: 'Como jogar',
    statistics: 'Estatísticas',
    close: 'Fechar',
    gameMode: 'Modo de jogo',
    daily: 'Diário',
    practice: 'Treino',
    question: 'Qual é o intervalo entre as duas notas?',
    practiceStats: '{wins}/{played} acertos · Sequência {streak} · Melhor {best}',
    playNotes: 'Ouvir notas',
    playTogether: 'Ouvir juntas',
    guesses: 'Tentativas',
    intervalsLabel: 'Intervalos',
    pickInterval: 'Escolha um intervalo',
    submit: 'Confirmar: {name}',
    semitone: 'semitom',
    semitones: 'semitons',
    resultTip: 'Toque nos intervalos abaixo para compará-los com a resposta.',
    share: 'Compartilhar',
    nextInterval: 'Próximo intervalo →',
    nextPuzzleIn: 'Próximo desafio em',
    toastClose: 'Quase! Mesma família.',
    toastWrong: 'Não é esse.',
    toastCopied: 'Resultado copiado!',
    toastCopyFailed: 'Não foi possível copiar o resultado.',
    winTitles: ['Genial! 🎉', 'Que ouvido! 👏', 'Boa! 🎵', 'Ufa, por pouco! 😅'],
    lossTitle: 'Não foi dessa vez 🎹',
    answer: ({ ascending, name, first, second }) =>
      `A resposta era <strong>${name.toLowerCase()} ${ascending ? 'ascendente' : 'descendente'}</strong>: ${first} → ${second}.`,
    hintTogether: 'Agora você pode ouvir as duas notas tocadas juntas.',
    hintSmall: 'É um intervalo pequeno: até 6 semitons (trítono).',
    hintLarge: 'É um intervalo grande: 7 semitons (5ª justa) ou mais.',
    hintFamily: 'É uma {family}.',
    families: {
      perfect: 'consonância perfeita',
      imperfect: 'consonância imperfeita',
      dissonant: 'dissonância',
    },
    intervals: [
      '2ª menor',
      '2ª maior',
      '3ª menor',
      '3ª maior',
      '4ª justa',
      'Trítono',
      '5ª justa',
      '6ª menor',
      '6ª maior',
      '7ª menor',
      '7ª maior',
      'Oitava',
    ],
    notes: ['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Lá♯', 'Si'],
    statPlayed: 'Jogos',
    statWinRate: '% de vitórias',
    statStreak: 'Sequência atual',
    statMaxStreak: 'Melhor sequência',
    guessDistribution: 'Distribuição de tentativas',
    help: `
      <h2>Como jogar</h2>
      <p>Todo dia há um novo desafio. Ouça duas notas de piano e descubra o <strong>intervalo</strong> entre elas em até <strong>4 tentativas</strong>.</p>
      <p>Um intervalo é a distância entre duas notas, medida em semitons (cada tecla vizinha no piano, branca ou preta, é um semitom). A segunda nota pode ser mais aguda ou mais grave que a primeira.</p>
      <h3>Cores</h3>
      <ul class="legend">
        <li><span class="swatch correct"></span> Intervalo certo.</li>
        <li><span class="swatch close"></span> Errado, mas da mesma família (consonância perfeita, consonância imperfeita ou dissonância).</li>
        <li><span class="swatch wrong"></span> Errado e de outra família.</li>
      </ul>
      <h3>Famílias</h3>
      <ul class="families">
        <li><strong>Consonâncias perfeitas:</strong> 4ª justa, 5ª justa, oitava.</li>
        <li><strong>Consonâncias imperfeitas:</strong> 3ªs e 6ªs.</li>
        <li><strong>Dissonâncias:</strong> 2ªs, 7ªs e trítono.</li>
      </ul>
      <h3>Dicas</h3>
      <p>Cada erro libera uma dica nova: primeiro você pode ouvir as notas juntas, depois descobre se o intervalo é pequeno ou grande e, por fim, a sua família.</p>
      <h3>Treino</h3>
      <p>Quer mais? Mude para <strong>Treino</strong> para jogar com intervalos aleatórios ilimitados e as mesmas regras. As partidas de treino não contam nas estatísticas diárias.</p>
      <p class="muted">Atalhos: <kbd>Espaço</kbd> toca as notas, <kbd>Enter</kbd> confirma.</p>`,
  },
};

let current = DEFAULT_LANGUAGE;

export function setLanguage(language) {
  current = language in STRINGS ? language : DEFAULT_LANGUAGE;
}

export function getLanguage() {
  return current;
}

export function t(key, params = {}) {
  const value = STRINGS[current][key] ?? STRINGS[DEFAULT_LANGUAGE][key];
  if (typeof value === 'function') return value(params);
  if (typeof value === 'string') return value.replace(/\{(\w+)\}/g, (_, name) => params[name]);
  return value;
}

export function intervalName(semitones) {
  return t('intervals')[semitones - 1];
}

export function noteName(midi) {
  return `${t('notes')[midi % 12]}${Math.floor(midi / 12) - 1}`;
}
