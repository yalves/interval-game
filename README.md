# Musicle 🎹

A daily ear-training game in the style of Wordle: every day you hear two piano notes and have **4 guesses** to name the interval between them.

## How it works

- **Daily puzzle**: the interval, starting note and direction (ascending/descending) are picked by a seeded random generator from the date, so everyone gets the same puzzle on the same day. The interval never repeats on consecutive days. Puzzle #1 is 2026-10-28; a new one starts at local midnight.
- **Feedback**: 🟩 correct · 🟨 wrong but same family (perfect consonance, imperfect consonance, dissonance) · ⬛ wrong.
- **Hints** after each miss: (1) hear the notes played together, (2) small vs. large interval, (3) the interval's family.
- **After the game**: the answer is shown on a piano keyboard, and the interval buttons play each interval from the same starting note for comparison.
- **Practice mode**: unlimited random intervals with the same rules, with its own score and streak (doesn't affect daily stats). Link straight to it with `#practice`.
- **Languages**: English (default) and Brazilian Portuguese, picked in the header and remembered per browser. All UI text lives in `js/i18n.js`; to add a language, add an entry to `STRINGS` and its flag to `LANGUAGES` (a test checks that every language has the same keys).
- **Stats and streaks** are stored in `localStorage`; results can be shared as an emoji grid.
- The piano is synthesized with the Web Audio API — no audio files.

## Running locally

It's a static site with no build step. ES modules require a web server (opening `index.html` via `file://` won't work):

```sh
npm start        # python3 -m http.server 8000 → http://localhost:8000
npm test         # tests for the puzzle logic (Node 18+)
```

## Structure

```
index.html
css/style.css
js/puzzle.js     # pure logic: daily puzzle, scoring, hints, share text
js/audio.js      # piano synthesis
js/i18n.js       # UI text for each language
js/main.js       # UI, persistence, stats
tests/           # node:test tests
```

## Deploying

The site is served by GitHub Pages from the `gh-pages` branch: https://yalves.github.io/musicle/

`.github/workflows/pages.yml` runs the tests on every push to the default branch and, if they pass, updates `gh-pages`, so the live site follows the default branch automatically.
