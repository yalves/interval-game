// Practice statistics: per-answer accuracy and confusions, used to focus
// practice on the answers a player gets wrong most often. Pure, no DOM.

export function practiceStats(saved = {}) {
  return { played: 0, wins: 0, streak: 0, bestStreak: 0, ...saved, byAnswer: { ...saved.byAnswer } };
}

export function recordPracticeGame(saved, answer, guesses) {
  const stats = practiceStats(saved);
  const won = guesses.includes(answer);
  stats.played += 1;
  stats.wins += won ? 1 : 0;
  stats.streak = won ? stats.streak + 1 : 0;
  stats.bestStreak = Math.max(stats.bestStreak, stats.streak);

  const entry = stats.byAnswer[answer] ?? { seen: 0, firstTry: 0, confusions: {} };
  const confusions = { ...entry.confusions };
  for (const guess of guesses) {
    if (guess !== answer) confusions[guess] = (confusions[guess] ?? 0) + 1;
  }
  stats.byAnswer[answer] = {
    seen: entry.seen + 1,
    firstTry: entry.firstTry + (guesses[0] === answer ? 1 : 0),
    confusions,
  };
  return stats;
}

// First-try accuracy with Laplace smoothing, so unseen answers count as 50%.
function smoothedAccuracy(entry) {
  return ((entry?.firstTry ?? 0) + 1) / ((entry?.seen ?? 0) + 2);
}

// Weight for each answer in the pool: from 1 (always right) up to 5 (always wrong).
export function practiceWeights(stats, pool) {
  return Object.fromEntries(pool.map((id) => [id, 1 + 4 * (1 - smoothedAccuracy(stats.byAnswer[id]))]));
}

// The answers with the lowest first-try accuracy, with what they get mistaken for.
export function weakSpots(stats, pool, limit = 3) {
  return pool
    .map((id) => ({ id, entry: stats.byAnswer[id] }))
    .filter(({ entry }) => entry && entry.seen > 0 && entry.firstTry < entry.seen)
    .map(({ id, entry }) => {
      const [confusedWith] = Object.entries(entry.confusions).sort((a, b) => b[1] - a[1])[0] ?? [];
      return { id, seen: entry.seen, accuracy: entry.firstTry / entry.seen, confusedWith };
    })
    .sort((a, b) => a.accuracy - b.accuracy || b.seen - a.seen)
    .slice(0, limit);
}
