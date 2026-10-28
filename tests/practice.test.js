import { test } from 'node:test';
import assert from 'node:assert/strict';
import { practiceStats, practiceWeights, recordPracticeGame, weakSpots } from '../js/practice.js';

test('records results, streaks and confusions', () => {
  let stats = practiceStats();
  stats = recordPracticeGame(stats, 7, [12, 5, 7]);
  stats = recordPracticeGame(stats, 7, [12, 1, 2, 3]);
  stats = recordPracticeGame(stats, 3, [3]);
  assert.deepEqual([stats.played, stats.wins, stats.streak, stats.bestStreak], [3, 2, 1, 1]);
  assert.deepEqual(stats.byAnswer[7], { seen: 2, firstTry: 0, confusions: { 12: 2, 5: 1, 1: 1, 2: 1, 3: 1 } });
  assert.deepEqual(stats.byAnswer[3], { seen: 1, firstTry: 1, confusions: {} });
});

test('survives a JSON round trip and old saved stats without byAnswer', () => {
  const old = { played: 4, wins: 3, streak: 2, bestStreak: 3 };
  const stats = recordPracticeGame(JSON.parse(JSON.stringify(practiceStats(old))), 'minor', ['major', 'minor']);
  assert.equal(stats.played, 5);
  assert.deepEqual(stats.byAnswer.minor, { seen: 1, firstTry: 0, confusions: { major: 1 } });
});

test('weights favor answers that are often missed', () => {
  let stats = practiceStats();
  for (let i = 0; i < 5; i++) stats = recordPracticeGame(stats, 1, [1]);
  for (let i = 0; i < 5; i++) stats = recordPracticeGame(stats, 2, [5, 2]);
  const weights = practiceWeights(stats, [1, 2, 3]);
  assert.ok(weights[2] > weights[3] && weights[3] > weights[1], JSON.stringify(weights));
  assert.equal(weights[3], 3);
});

test('weakSpots lists the least accurate answers with their usual confusion', () => {
  let stats = practiceStats();
  stats = recordPracticeGame(stats, 8, [7, 8]);
  stats = recordPracticeGame(stats, 8, [7, 9, 8]);
  stats = recordPracticeGame(stats, 4, [3, 4]);
  stats = recordPracticeGame(stats, 4, [4]);
  stats = recordPracticeGame(stats, 5, [5]);
  assert.deepEqual(weakSpots(stats, [4, 5, 8]), [
    { id: 8, seen: 2, accuracy: 0, confusedWith: '7' },
    { id: 4, seen: 2, accuracy: 0.5, confusedWith: '3' },
  ]);
});
