import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', workers: 1, reporter: 'list',
  use: { baseURL: 'http://localhost:3200', channel: 'msedge', headless: true, viewport: { width: 1536, height: 1024 } },
  webServer: { command: 'npm.cmd run start -- --port 3200', url: 'http://localhost:3200', reuseExistingServer: false, timeout: 60000 },
});
