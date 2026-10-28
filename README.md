# Musicle 🎹

A daily ear-training game in the style of Wordle: every day you hear two piano notes and have **4 guesses** to name the interval between them.

## How it works

- **Daily puzzle**: the interval, starting note and direction (ascending/descending) are picked by a seeded random generator from the date, so everyone gets the same puzzle on the same day. The interval never repeats on consecutive days. Puzzle #1 is 2026-10-28; a new one starts at local midnight.
- **Feedback**: 🟩 correct · 🟨 wrong but same family (perfect consonance, imperfect consonance, dissonance) · ⬛ wrong.
- **Hints** after each miss: (1) hear the notes played together, (2) small vs. large interval, (3) the interval's family.
- **After the game**: the answer is shown on a piano keyboard, and the interval buttons play each interval from the same starting note for comparison.
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
js/main.js       # UI, persistence, stats
tests/           # node:test tests
```

## Deploying

Any static host works. On GitHub Pages: *Settings → Pages → Deploy from a branch*, pick the branch and `/ (root)`.
