import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sampleData, stats, average, correlation, historicalEstimate, isDataset } from '../frontend/src/lib/dashboard.ts';

test('sample records are relationally valid and aggregate consistently', () => {
  assert.equal(isDataset(sampleData), true);
  const summary = stats(sampleData.battles);
  assert.equal(summary.played, 100);
  assert.equal(summary.wins, 58);
  assert.equal(summary.losses, 42);
  assert.ok(Math.abs(summary.winRate - 58) < 1e-10);
  assert.equal(average(sampleData.players.map(p => p.hp / p.maxHp * 100)), 55.8);
  assert.equal(sampleData.players.filter(p => p.active).length, 4);
});
test('period and player slices do not mix unrelated battle records', () => {
  const slice = sampleData.battles.filter(b => b.playerId === 'vean' && b.sessionId === 'n3s1');
  assert.deepEqual({ played: stats(slice).played, wins: stats(slice).wins, losses: stats(slice).losses }, { played: 4, wins: 3, losses: 1 });
});
test('empty data and zero variance do not fabricate correlations or forecasts', () => {
  assert.equal(stats([]).winRate, 0);
  assert.equal(average([]), 0);
  assert.equal(correlation([1, 1, 1], [0, 1, 0]), null);
  assert.equal(correlation([], []), null);
  assert.match(historicalEstimate([]), /Insufficient/);
});
test('correlation recognizes positive and negative relationships', () => {
  assert.equal(correlation([1, 2, 3], [2, 4, 6]), 1);
  assert.equal(correlation([1, 2, 3], [6, 4, 2]), -1);
  assert.match(historicalEstimate(sampleData.battles), /not an evaluated next-battle forecast/);
});
test('API validation rejects malformed records, duplicate IDs, and dangling references', () => {
  assert.equal(isDataset(null), false);
  assert.equal(isDataset({ players: [], sessions: [], battles: [] }), true);
  assert.equal(isDataset({ ...sampleData, players: [...sampleData.players, sampleData.players[0]] }), false);
  assert.equal(isDataset({ ...sampleData, battles: [{ ...sampleData.battles[0], playerId: 'unknown' }] }), false);
  assert.equal(isDataset({ ...sampleData, players: [{ ...sampleData.players[0], hp: 101 }] }), false);
  assert.equal(isDataset({ ...sampleData, battles: [{ ...sampleData.battles[0], damageDealt: NaN }] }), false);
});
