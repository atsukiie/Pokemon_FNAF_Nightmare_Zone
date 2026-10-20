import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { isDataset } from '../frontend/src/lib/dashboard.ts';

const api = process.env.DASHBOARD_CHECK_API || 'http://127.0.0.1:3002/api';
const frontend = process.env.DASHBOARD_CHECK_FRONTEND || 'http://localhost:3000';
const health = await fetch(`${api}/health`).then(r => r.json());
assert.equal(health.service, 'nightmare-zone-api');
assert.equal(health.databaseConfigured, true);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('nightmare-admin-preferences', JSON.stringify({ dataMode: 'live', autoRefresh: false })));
  const received = page.waitForResponse(r => r.url() === `${api}/dashboard`, { timeout: 30000 });
  await page.goto(frontend);
  const response = await received;
  assert.equal(response.status(), 200);
  const data = await response.json();
  assert.equal(isDataset(data), true);
  assert.equal(data.metadata?.dataSource, 'real');
  if (data.players.length) await page.locator('.player-card').first().waitFor({ state: 'visible' });
  assert.equal(await page.locator('.player-card').count(), data.players.length);
  assert.equal(await page.locator('.state-message.error').count(), 0);
  assert.match(await page.locator('.data-notice').first().innerText(), /Real gameplay records/);
  if (data.battles.length) {
    await page.getByRole('combobox', { name: 'Performance metric' }).selectOption('Average HP');
    const points = await page.locator('.performance polyline').getAttribute('points');
    for (const point of points.split(' ')) {
      const y = Number(point.split(',')[1]);
      assert.ok(y >= 29.9 && y <= 148.1, 'Actual game HP must fit the percentage chart scale.');
    }
    await page.getByRole('combobox', { name: 'Performance metric' }).selectOption('Win rate');
  }
  if (data.players.length) {
    await page.getByRole('button', { name: 'View details', exact: true }).first().click();
    assert.equal(await page.getByRole('dialog').isVisible(), true);
    assert.equal(await page.locator('.roster-member').count(), data.players[0].roster.length);
    await page.keyboard.press('Escape');
  }
  await page.screenshot({ path: 'frontend/test-results/connected-game.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log(`Verified browser → dashboard API → shared game database: ${data.players.length} players, ${data.battles.length} real battles.`);
} finally { await browser.close(); }
