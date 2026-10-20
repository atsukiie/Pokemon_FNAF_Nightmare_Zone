import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { SupabaseService } = require('../backend/dist/supabase/supabase.service.js');
const { AppController } = require('../backend/dist/app.controller.js');
const { ConfigService } = require('@nestjs/config');
test('admin endpoint rejects missing tokens before database access', async () => {
  const service = new SupabaseService(new ConfigService({}));
  await assert.rejects(service.getAdminClient(), error => error.getStatus() === 401);
  await assert.rejects(service.getAdminClient('Basic token'), error => error.getStatus() === 401);
});
test('authorization uses verified app metadata rather than user metadata', async () => {
  const service = new SupabaseService(new ConfigService({}));
  service.getClient = () => ({ auth: { getUser: async () => ({ data: { user: { app_metadata: {}, user_metadata: { role: 'admin' } } }, error: null }) } });
  await assert.rejects(service.getAdminClient('Bearer valid'), error => error.getStatus() === 403);
  service.getClient = () => ({ auth: { getUser: async () => ({ data: { user: null }, error: {} }) } });
  await assert.rejects(service.getAdminClient('Bearer expired'), error => error.getStatus() === 401);
});
test('authorized requests get isolated clients and RPC errors are sanitized', async () => {
  const service = new SupabaseService(new ConfigService({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'public-key' }));
  service.getClient = () => ({ auth: { getUser: async () => ({ data: { user: { app_metadata: { role: 'admin' } } }, error: null }) } });
  assert.notEqual(await service.getAdminClient('Bearer one'), await service.getAdminClient('Bearer two'));
  const payload = { players: [], sessions: [], battles: [] };
  const controller = new AppController({ getAdminClient: async token => { assert.equal(token, 'Bearer admin'); return { rpc: async name => { assert.equal(name, 'get_admin_dashboard'); return { data: payload, error: null }; } }; } });
  assert.deepEqual(await controller.dashboard('Bearer admin'), payload);
  const failing = new AppController({ getAdminClient: async () => ({ rpc: async () => ({ data: null, error: { message: 'private information' } }) }) });
  await assert.rejects(failing.dashboard('Bearer admin'), error => error.getStatus() === 503 && !error.message.includes('private information'));
});
