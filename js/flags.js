// Small inline SVG flags for the language picker (Windows can't draw flag emojis).

const usStars = Array.from({ length: 20 }, (_, i) => {
  const row = Math.floor(i / 5);
  const col = i % 5;
  return `<circle cx="${1.6 + col * 3 + (row % 2) * 1.5}" cy="${1.4 + row * 2.6}" r="0.55"/>`;
}).join('');

export const FLAGS = {
  us: `<svg viewBox="0 0 38 20" aria-hidden="true"><rect width="38" height="20" fill="#b22234"/><path stroke="#fff" stroke-width="1.54" d="M0 2.31h38M0 5.39h38M0 8.47h38M0 11.55h38M0 14.63h38M0 17.71h38"/><rect width="15.2" height="10.77" fill="#3c3b6e"/><g fill="#fff">${usStars}</g></svg>`,
  br: `<svg viewBox="0 0 20 14" aria-hidden="true"><rect width="20" height="14" fill="#009c3b"/><path fill="#ffdf00" d="M1.7 7 10 1.2 18.3 7 10 12.8z"/><circle cx="10" cy="7" r="3.5" fill="#002776"/><path d="M6.6 6.3q3.6-1.2 6.8 1.1" fill="none" stroke="#fff" stroke-width="0.55"/></svg>`,
};
