// UI text in every supported language. Values are strings with {placeholders},
// arrays, objects, or functions that receive the params object.

export const DEFAULT_LANGUAGE = 'en';

// Flag drawn next to each language in the picker (see flags.js).
export const LANGUAGES = {
  en: { name: 'English', flag: 'us' },
  'pt-BR': { name: 'Português (Brasil)', flag: 'br' },
};

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ACCIDENTALS = { '-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪' };

export const STRINGS = {
  en: {
    language: 'Language',
    howToPlay: 'How to play',
    statistics: 'Statistics',
    settings: 'Settings',
    close: 'Close',
    gameType: 'Game',
    typeIntervals: 'Intervals',
    typeChords: 'Chords',
    gameMode: 'Game mode',
    daily: 'Daily',
    practice: 'Practice',
    questionIntervals: "What's the interval between the two notes?",
    questionChords: 'Which chord is this?',
    practiceStats: '{wins}/{played} correct · Streak {streak} · Best {best}',
    playIntervalsMelodic: 'Play notes',
    playIntervalsHarmonic: 'Play together',
    playChordsHarmonic: 'Play chord',
    playChordsMelodic: 'Play arpeggio',
    listensLeft: ({ count }) => (count === 1 ? '1 listen left' : `${count} listens left`),
    noListensLeft: 'No listens left in hard mode.',
    guesses: 'Guesses',
    options: 'Answers',
    pickAnswer: 'Pick an answer',
    submit: 'Submit: {name}',
    semitone: 'semitone',
    semitones: 'semitones',
    resultTip: 'Tap the answers below to compare them with the right one.',
    share: 'Share',
    nextPuzzle: 'Next →',
    nextPuzzleIn: 'Next puzzle in',
    archive: 'Archive',
    archiveTitle: 'Past puzzles',
    archiveEmpty: 'Past puzzles show up here from the second day on.',
    playArchive: 'Play past puzzles',
    backToToday: 'Back to today',
    today: 'Today',
    notPlayed: 'Not played',
    inProgress: 'In progress',
    toastClose: 'Close! Same family.',
    toastWrong: 'Not that one.',
    toastCopied: 'Copied results to clipboard!',
    toastCopyFailed: "Couldn't copy.",
    winTitles: ['Genius! 🎉', 'Great ear! 👏', 'Nice! 🎵', 'Phew, close one! 😅'],
    lossTitle: 'Not this time 🎹',
    answer: ({ ascending, name, first, second }) =>
      `The answer was ${ascending ? 'an ascending' : 'a descending'} <strong>${name.toLowerCase()}</strong>: ${first} → ${second}.`,
    answerChord: ({ name, symbol, notes }) => `The answer was <strong>${name}</strong> (${symbol}): ${notes}.`,
    songLabel: 'Remember it:',
    ascendingNote: '(ascending)',
    hintTogether: 'You can now hear both notes played together.',
    hintSmall: "It's a small interval: 6 semitones (tritone) or less.",
    hintLarge: "It's a large interval: 7 semitones (perfect 5th) or more.",
    hintCompound: "It's a compound interval: larger than an octave.",
    hintArpeggio: 'You can now hear the chord one note at a time.',
    hintTriad: 'It has 3 notes (a triad).',
    hintSeventh: 'It has 4 notes (a seventh chord).',
    hintFamily: "It's {family}.",
    families: {
      perfect: 'a perfect consonance',
      imperfect: 'an imperfect consonance',
      dissonant: 'a dissonance',
      majorThird: 'a chord with a major third',
      minorThird: 'a chord with a minor third',
      suspended: 'a suspended chord (no third)',
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
      'Minor 9th',
      'Major 9th',
      'Minor 10th',
      'Major 10th',
      'Perfect 11th',
      'Augmented 11th',
      'Perfect 12th',
      'Minor 13th',
      'Major 13th',
      'Minor 14th',
      'Major 14th',
      'Double octave',
    ],
    chords: {
      major: 'Major',
      minor: 'Minor',
      diminished: 'Diminished',
      augmented: 'Augmented',
      sus2: 'Sus2',
      sus4: 'Sus4',
      dominant7: 'Dominant 7th',
      major7: 'Major 7th',
      minor7: 'Minor 7th',
    },
    chordSymbols: { major: '', minor: 'm', diminished: '°', augmented: '+', sus2: 'sus2', sus4: 'sus4', dominant7: '7', major7: 'maj7', minor7: 'm7' },
    // Well-known songs that start with each interval (by semitones).
    songs: {
      1: { up: 'Jaws (theme)', down: 'Joy to the World' },
      2: { up: 'Happy Birthday', down: 'Mary Had a Little Lamb' },
      3: { up: 'Greensleeves', down: 'Hey Jude' },
      4: { up: 'When the Saints Go Marching In', down: 'Swing Low, Sweet Chariot' },
      5: { up: 'Here Comes the Bride', down: 'Eine kleine Nachtmusik' },
      6: { up: 'The Simpsons (theme)' },
      7: { up: 'Twinkle, Twinkle, Little Star', down: 'The Flintstones (theme)' },
      8: { up: 'The Entertainer', down: 'Love Story (theme)' },
      9: { up: 'My Bonnie Lies Over the Ocean', down: "Nobody Knows the Trouble I've Seen" },
      10: { up: 'Somewhere (West Side Story)' },
      11: { up: 'Take On Me (chorus)' },
      12: { up: 'Over the Rainbow' },
    },
    notes: LETTERS,
    statPlayed: 'Played',
    statWinRate: 'Win %',
    statStreak: 'Current streak',
    statMaxStreak: 'Max streak',
    guessDistribution: 'Guess distribution',
    practiceSettings: 'Practice settings',
    include: 'Include',
    simpleIntervals: 'Simple',
    compoundIntervals: 'Compound (beyond the octave)',
    selectAll: 'All',
    needAtLeastTwo: 'Pick at least 2 answers.',
    direction: 'Direction',
    directionUp: 'Ascending',
    directionDown: 'Descending',
    directionBoth: 'Both',
    playback: 'Playback',
    playbackMelodicIntervals: 'One after another',
    playbackMelodicChords: 'Arpeggio',
    playbackHarmonic: 'Together',
    adaptive: 'Focus on my weak spots',
    weakSpots: 'Weak spots',
    weakSpot: ({ name, accuracy, confusedWith }) =>
      `<strong>${name}</strong>: ${accuracy}% on the first try${confusedWith ? ` · often mistaken for ${confusedWith}` : ''}`,
    noWeakSpots: 'No weak spots yet. Keep practicing!',
    resetPractice: 'Reset practice stats',
    resetPracticeConfirm: 'Reset your practice stats for this game?',
    hardMode: 'Hard mode',
    hardModeInfo: 'Only 3 listens and no hints. Change it before your first guess.',
    hardModeLocked: 'Hard mode can only be turned on before the first guess.',
    highContrast: 'High contrast colors',
    highContrastInfo: 'For color vision deficiency.',
    instrument: 'Instrument',
    instruments: { piano: 'Piano', guitar: 'Guitar', synth: 'Synth' },
    volume: 'Volume',
    transfer: 'Move your progress',
    transferInfo: 'Copy a code with your stats, streaks and settings, then paste it on another device.',
    copyCode: 'Copy code',
    importCode: 'Import',
    importPlaceholder: 'Paste a code here',
    importConfirm: 'This replaces the progress saved on this device. Continue?',
    importInvalid: "That code isn't valid.",
    codeCopied: 'Code copied!',
    credits:
      'Sounds: <a href="https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html">Salamander Grand Piano</a> by Alexander Holm and a nylon guitar from <a href="https://github.com/nbrosowsky/tonejs-instruments">tonejs-instruments</a>, under <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>.',
    help: `
      <h2>How to play</h2>
      <p>Every day there are two new puzzles. In <strong>Intervals</strong>, listen to two piano notes and name the distance between them. In <strong>Chords</strong>, name the type of chord. You have <strong>4 guesses</strong>.</p>
      <p>An interval is measured in semitones: each neighboring key on the piano, white or black, is one semitone. The second note can be higher or lower than the first.</p>
      <h3>Colors</h3>
      <ul class="legend">
        <li><span class="swatch correct"></span> Correct.</li>
        <li><span class="swatch close"></span> Wrong, but in the same family.</li>
        <li><span class="swatch wrong"></span> Wrong, and in a different family.</li>
      </ul>
      <h3>Families</h3>
      <ul class="families">
        <li><strong>Perfect consonances:</strong> perfect 4th, perfect 5th, octave.</li>
        <li><strong>Imperfect consonances:</strong> 3rds and 6ths.</li>
        <li><strong>Dissonances:</strong> 2nds, 7ths and the tritone.</li>
        <li><strong>Chords</strong> are grouped by their third: major (major, augmented, dominant 7th, major 7th), minor (minor, diminished, minor 7th) or none (sus2, sus4).</li>
      </ul>
      <h3>Hints</h3>
      <p>Each miss unlocks a new hint: another way to listen, then the size of the interval (or the number of notes in the chord), and finally its family.</p>
      <h3>Hard mode</h3>
      <p>Only 3 listens and no hints. Your result gets a * when shared.</p>
      <h3>Practice and archive</h3>
      <p>Switch to <strong>Practice</strong> for unlimited puzzles, choosing what to include. It focuses on the answers you miss most. Missed a day? Play it from the <strong>archive</strong> in the statistics.</p>
      <p class="muted">Shortcuts: <kbd>Space</kbd> plays, <kbd>1</kbd>–<kbd>9</kbd> and <kbd>0</kbd> or the arrow keys pick an answer, <kbd>Enter</kbd> submits.</p>`,
  },

  'pt-BR': {
    language: 'Idioma',
    howToPlay: 'Como jogar',
    statistics: 'Estatísticas',
    settings: 'Configurações',
    close: 'Fechar',
    gameType: 'Jogo',
    typeIntervals: 'Intervalos',
    typeChords: 'Acordes',
    gameMode: 'Modo de jogo',
    daily: 'Diário',
    practice: 'Treino',
    questionIntervals: 'Qual é o intervalo entre as duas notas?',
    questionChords: 'Que acorde é este?',
    practiceStats: '{wins}/{played} acertos · Sequência {streak} · Melhor {best}',
    playIntervalsMelodic: 'Ouvir notas',
    playIntervalsHarmonic: 'Ouvir juntas',
    playChordsHarmonic: 'Ouvir acorde',
    playChordsMelodic: 'Ouvir arpejo',
    listensLeft: ({ count }) => (count === 1 ? 'Resta 1 audição' : `Restam ${count} audições`),
    noListensLeft: 'Sem audições restantes no modo difícil.',
    guesses: 'Tentativas',
    options: 'Respostas',
    pickAnswer: 'Escolha uma resposta',
    submit: 'Confirmar: {name}',
    semitone: 'semitom',
    semitones: 'semitons',
    resultTip: 'Toque nas respostas abaixo para compará-las com a certa.',
    share: 'Compartilhar',
    nextPuzzle: 'Próximo →',
    nextPuzzleIn: 'Próximo desafio em',
    archive: 'Arquivo',
    archiveTitle: 'Desafios anteriores',
    archiveEmpty: 'Os desafios anteriores aparecem aqui a partir do segundo dia.',
    playArchive: 'Jogar desafios anteriores',
    backToToday: 'Voltar para hoje',
    today: 'Hoje',
    notPlayed: 'Não jogado',
    inProgress: 'Em andamento',
    toastClose: 'Quase! Mesma família.',
    toastWrong: 'Não é esse.',
    toastCopied: 'Resultado copiado!',
    toastCopyFailed: 'Não foi possível copiar.',
    winTitles: ['Genial! 🎉', 'Que ouvido! 👏', 'Boa! 🎵', 'Ufa, por pouco! 😅'],
    lossTitle: 'Não foi dessa vez 🎹',
    answer: ({ ascending, name, first, second }) =>
      `A resposta era <strong>${name.toLowerCase()} ${ascending ? 'ascendente' : 'descendente'}</strong>: ${first} → ${second}.`,
    answerChord: ({ name, symbol, notes }) => `A resposta era <strong>${name}</strong> (${symbol}): ${notes}.`,
    songLabel: 'Para lembrar:',
    ascendingNote: '(ascendente)',
    hintTogether: 'Agora você pode ouvir as duas notas tocadas juntas.',
    hintSmall: 'É um intervalo pequeno: até 6 semitons (trítono).',
    hintLarge: 'É um intervalo grande: 7 semitons (5ª justa) ou mais.',
    hintCompound: 'É um intervalo composto: maior que uma oitava.',
    hintArpeggio: 'Agora você pode ouvir o acorde nota por nota.',
    hintTriad: 'Ele tem 3 notas (uma tríade).',
    hintSeventh: 'Ele tem 4 notas (um acorde com sétima).',
    hintFamily: 'É {family}.',
    families: {
      perfect: 'uma consonância perfeita',
      imperfect: 'uma consonância imperfeita',
      dissonant: 'uma dissonância',
      majorThird: 'um acorde com terça maior',
      minorThird: 'um acorde com terça menor',
      suspended: 'um acorde suspenso (sem terça)',
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
      '9ª menor',
      '9ª maior',
      '10ª menor',
      '10ª maior',
      '11ª justa',
      '11ª aumentada',
      '12ª justa',
      '13ª menor',
      '13ª maior',
      '14ª menor',
      '14ª maior',
      'Oitava dupla',
    ],
    chords: {
      major: 'Maior',
      minor: 'Menor',
      diminished: 'Diminuto',
      augmented: 'Aumentado',
      sus2: 'Sus2',
      sus4: 'Sus4',
      dominant7: 'Sétima (dominante)',
      major7: 'Sétima maior',
      minor7: 'Menor com sétima',
    },
    chordSymbols: { major: '', minor: 'm', diminished: '°', augmented: '+', sus2: 'sus2', sus4: 'sus4', dominant7: '7', major7: '7M', minor7: 'm7' },
    songs: {
      1: { up: 'Tubarão (tema)', down: 'Joy to the World' },
      2: { up: 'Parabéns pra Você', down: 'Mary Had a Little Lamb' },
      3: { up: 'Greensleeves', down: 'Hey Jude' },
      4: { up: 'When the Saints Go Marching In', down: 'Swing Low, Sweet Chariot' },
      5: { up: 'Marcha Nupcial (Lá vem a noiva)', down: 'Pequena Serenata Noturna (Mozart)' },
      6: { up: 'Os Simpsons (abertura)' },
      7: { up: 'Brilha, Brilha, Estrelinha', down: 'Os Flintstones (abertura)' },
      8: { up: 'The Entertainer', down: 'Love Story (tema)' },
      9: { up: 'My Bonnie Lies Over the Ocean', down: "Nobody Knows the Trouble I've Seen" },
      10: { up: 'Somewhere (Amor, Sublime Amor)' },
      11: { up: 'Take On Me (refrão)' },
      12: { up: 'Over the Rainbow (O Mágico de Oz)' },
    },
    notes: ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'],
    statPlayed: 'Jogos',
    statWinRate: '% de vitórias',
    statStreak: 'Sequência atual',
    statMaxStreak: 'Melhor sequência',
    guessDistribution: 'Distribuição de tentativas',
    practiceSettings: 'Ajustes do treino',
    include: 'Incluir',
    simpleIntervals: 'Simples',
    compoundIntervals: 'Compostos (além da oitava)',
    selectAll: 'Todos',
    needAtLeastTwo: 'Escolha pelo menos 2 respostas.',
    direction: 'Direção',
    directionUp: 'Ascendente',
    directionDown: 'Descendente',
    directionBoth: 'Ambas',
    playback: 'Reprodução',
    playbackMelodicIntervals: 'Uma depois da outra',
    playbackMelodicChords: 'Arpejo',
    playbackHarmonic: 'Juntas',
    adaptive: 'Focar nos meus pontos fracos',
    weakSpots: 'Pontos fracos',
    weakSpot: ({ name, accuracy, confusedWith }) =>
      `<strong>${name}</strong>: ${accuracy}% de acerto na primeira tentativa${confusedWith ? ` · costuma ser confundido com ${confusedWith}` : ''}`,
    noWeakSpots: 'Nenhum ponto fraco ainda. Continue treinando!',
    resetPractice: 'Zerar estatísticas do treino',
    resetPracticeConfirm: 'Zerar as estatísticas de treino deste jogo?',
    hardMode: 'Modo difícil',
    hardModeInfo: 'Só 3 audições e nenhuma dica. Mude antes do primeiro palpite.',
    hardModeLocked: 'O modo difícil só pode ser ligado antes do primeiro palpite.',
    highContrast: 'Cores de alto contraste',
    highContrastInfo: 'Para daltonismo.',
    instrument: 'Instrumento',
    instruments: { piano: 'Piano', guitar: 'Violão', synth: 'Sintetizador' },
    volume: 'Volume',
    transfer: 'Transferir progresso',
    transferInfo: 'Copie um código com suas estatísticas, sequências e configurações e cole em outro aparelho.',
    copyCode: 'Copiar código',
    importCode: 'Importar',
    importPlaceholder: 'Cole um código aqui',
    importConfirm: 'Isso substitui o progresso salvo neste aparelho. Continuar?',
    importInvalid: 'Esse código não é válido.',
    codeCopied: 'Código copiado!',
    credits:
      'Sons: <a href="https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html">Salamander Grand Piano</a>, de Alexander Holm, e um violão de nylon do <a href="https://github.com/nbrosowsky/tonejs-instruments">tonejs-instruments</a>, sob a licença <a href="https://creativecommons.org/licenses/by/3.0/deed.pt_BR">CC BY 3.0</a>.',
    help: `
      <h2>Como jogar</h2>
      <p>Todo dia há dois desafios novos. Em <strong>Intervalos</strong>, ouça duas notas de piano e descubra a distância entre elas. Em <strong>Acordes</strong>, descubra o tipo de acorde. Você tem <strong>4 tentativas</strong>.</p>
      <p>Um intervalo é medido em semitons: cada tecla vizinha no piano, branca ou preta, é um semitom. A segunda nota pode ser mais aguda ou mais grave que a primeira.</p>
      <h3>Cores</h3>
      <ul class="legend">
        <li><span class="swatch correct"></span> Certo.</li>
        <li><span class="swatch close"></span> Errado, mas da mesma família.</li>
        <li><span class="swatch wrong"></span> Errado e de outra família.</li>
      </ul>
      <h3>Famílias</h3>
      <ul class="families">
        <li><strong>Consonâncias perfeitas:</strong> 4ª justa, 5ª justa, oitava.</li>
        <li><strong>Consonâncias imperfeitas:</strong> 3ªs e 6ªs.</li>
        <li><strong>Dissonâncias:</strong> 2ªs, 7ªs e trítono.</li>
        <li><strong>Acordes</strong> são agrupados pela terça: maior (maior, aumentado, sétima, sétima maior), menor (menor, diminuto, menor com sétima) ou nenhuma (sus2, sus4).</li>
      </ul>
      <h3>Dicas</h3>
      <p>Cada erro libera uma dica nova: outro jeito de ouvir, depois o tamanho do intervalo (ou o número de notas do acorde) e, por fim, a família.</p>
      <h3>Modo difícil</h3>
      <p>Só 3 audições e nenhuma dica. Seu resultado ganha um * ao ser compartilhado.</p>
      <h3>Treino e arquivo</h3>
      <p>Mude para <strong>Treino</strong> para jogar sem limites, escolhendo o que incluir. Ele foca nas respostas que você mais erra. Perdeu um dia? Jogue pelo <strong>arquivo</strong> nas estatísticas.</p>
      <p class="muted">Atalhos: <kbd>Espaço</kbd> toca, <kbd>1</kbd>–<kbd>9</kbd> e <kbd>0</kbd> ou as setas escolhem uma resposta, <kbd>Enter</kbd> confirma.</p>`,
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

export function optionName(type, id) {
  return type === 'intervals' ? t('intervals')[id - 1] : t('chords')[id];
}

// A spelled note ({ letter, accidental, octave }, see spellNotes) as text, e.g. "A♭4".
export function noteName({ letter, accidental, octave }) {
  return `${t('notes')[letter]}${ACCIDENTALS[accidental]}${octave}`;
}

// Chord symbols always use letter names (C, Dm7...), as Brazilian musicians do too.
export function chordSymbol(id, root = { letter: 0, accidental: 0 }) {
  return `${LETTERS[root.letter]}${ACCIDENTALS[root.accidental]}${t('chordSymbols')[id]}`;
}

// A well-known song that starts with this interval, preferring the same direction.
export function songFor(semitones, ascending) {
  const song = t('songs')[semitones];
  if (!song) return null;
  if (!ascending && song.down) return song.down;
  return ascending ? song.up : `${song.up} ${t('ascendingNote')}`;
}
