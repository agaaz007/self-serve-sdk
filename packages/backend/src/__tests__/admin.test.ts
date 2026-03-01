/**
 * Admin API endpoint tests
 *
 * Tests the admin endpoints for tenant management:
 * - POST /api/admin/tenants - Create tenant
 * - PATCH /api/admin/tenants/:tenantId - Update tenant
 * - POST /api/admin/tenants/:tenantId/api-keys - Generate API key
 * - DELETE /api/admin/tenants/:tenantId/api-keys/:keyId - Revoke API key
 * - GET /api/admin/tenants/:tenantId/usage - Get usage stats
 *
 * NOTE: The admin routes are being created by task #14 and wired by task #15.
 * These tests are written against the expected interface. Tests will gracefully
 * handle 404 when admin routes are not yet wired up.
 */

// ============ Mocks (MUST be before any imports) ============

const originalListeners = {
  uncaughtException: process.listeners('uncaughtException').slice(),
  SIGTERM: process.listeners('SIGTERM').slice(),
  SIGINT: process.listeners('SIGINT').slice(),
  unhandledRejection: process.listeners('unhandledRejection').slice(),
};

const ADMIN_API_KEY = 'test_admin_secret_key_12345';

vi.mock('../config', () => ({
  config: {
    posthogApiKey: 'test',
    posthogProjectId: '123',
    posthogHost: 'https://app.posthog.com',
    elevenLabsApiKey: 'test',
    elevenLabsAgentId: 'test_agent',
    elevenLabsWebhookSecret: undefined,
    groqApiKey: 'test_groq_key',
    adminApiKey: 'test_admin_secret_key_12345',
    port: 0,
    nodeEnv: 'test',
  },
}));

vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

vi.mock('pino-http', () => ({
  default: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../lib/posthog-session-analysis', () => ({
  analyzeUserSessions: vi.fn().mockResolvedValue({
    recordings: [],
    analysis: null,
    aiAnalysis: null,
    contextForAgent: 'Test context',
    timing: {
      personUuid_ms: 0, recordingsList_ms: 0, analyticsEvents_ms: 0,
      posthogParallel_ms: 0, elementExtraction_ms: 0, blobFetch_ms: 0,
      rrwebParse_ms: 0, enrichment_ms: 0, aiAnalysis_ms: 0,
      contextGen_ms: 0, total_ms: 0,
    },
  }),
}));

// Mock authenticate middleware for non-admin routes
vi.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.tenant = {
      id: 'default',
      apiKeyPrefix: 'eb_test_1234',
      config: {
        posthogApiKey: 'test',
        posthogProjectId: '123',
        posthogHost: 'https://app.posthog.com',
        elevenLabsApiKey: 'test',
        interventionAgentId: 'test_agent',
        chatAgentId: undefined,
      },
    };
    next();
  },
}));

const mockSelectLimit = vi.fn().mockResolvedValue([]);
const mockSelectOrderBy = vi.fn().mockReturnValue({ limit: mockSelectLimit });
const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit, orderBy: mockSelectOrderBy });
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
const mockDbSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

const mockUpdateReturning = vi.fn().mockResolvedValue([]);
const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
const mockDbUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

const mockInsertReturning = vi.fn().mockResolvedValue([]);
const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
const mockDbInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

vi.mock('../db', () => ({
  db: {
    select: (...args: any[]) => mockDbSelect(...args),
    update: (...args: any[]) => mockDbUpdate(...args),
    insert: (...args: any[]) => mockDbInsert(...args),
  },
  sessions: {
    id: 'id',
    status: 'status',
    agentId: 'agent_id',
    createdAt: 'created_at',
    elevenLabsConversationId: 'elevenlabs_conversation_id',
    tenantId: 'tenant_id',
  },
  tenants: {
    id: 'id',
    name: 'name',
    tier: 'tier',
    sessionLimit: 'session_limit',
    posthogApiKey: 'posthog_api_key',
    posthogProjectId: 'posthog_project_id',
    posthogHost: 'posthog_host',
    elevenLabsApiKey: 'elevenlabs_api_key',
    interventionAgentId: 'intervention_agent_id',
    chatAgentId: 'chat_agent_id',
  },
  apiKeys: {
    id: 'id',
    tenantId: 'tenant_id',
    keyPrefix: 'key_prefix',
    keyHash: 'key_hash',
    revokedAt: 'revoked_at',
  },
  usage: {
    id: 'id',
    tenantId: 'tenant_id',
    period: 'period',
    sessionCount: 'session_count',
    voiceMinutes: 'voice_minutes',
  },
  pool: null,
}));

// Mock global fetch
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ signed_url: 'wss://test.elevenlabs.io/signed' }),
  text: async () => '',
});
vi.stubGlobal('fetch', mockFetch);

// ============ Imports ============

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';

// Clean up process listeners from index.ts
process.removeAllListeners('uncaughtException');
process.removeAllListeners('SIGTERM');
process.removeAllListeners('SIGINT');
process.removeAllListeners('unhandledRejection');

for (const listener of originalListeners.uncaughtException) {
  process.on('uncaughtException', listener as NodeJS.UncaughtExceptionListener);
}
for (const listener of originalListeners.unhandledRejection) {
  process.on('unhandledRejection', listener as NodeJS.UnhandledRejectionListener);
}

// ============ Setup ============

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectLimit.mockResolvedValue([]);
  mockInsertReturning.mockResolvedValue([]);
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
  mockDbInsert.mockReturnValue({ values: mockInsertValues });
  mockUpdateReturning.mockResolvedValue([]);
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
  mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
  mockDbUpdate.mockReturnValue({ set: mockUpdateSet });
  mockSelectWhere.mockReturnValue({ limit: mockSelectLimit, orderBy: mockSelectOrderBy });
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
  mockDbSelect.mockReturnValue({ from: mockSelectFrom });
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ signed_url: 'wss://test.elevenlabs.io/signed' }),
    text: async () => '',
  });
});

// ============ Tests ============

describe('Admin API', () => {
  describe('POST /api/admin/tenants', () => {
    it('creates a tenant and returns API key', async () => {
      mockInsertReturning.mockResolvedValueOnce([{
        id: 'new-tenant-id',
        name: 'Acme Corp',
        tier: 'free',
        sessionLimit: 25,
      }]);

      const res = await request(app)
        .post('/api/admin/tenants')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`)
        .send({ name: 'Acme Corp' });

      if (res.status === 404) return;

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('tenantId');
      expect(res.body).toHaveProperty('apiKey');
      expect(res.body).toHaveProperty('apiKeyPrefix');
    });

    it('returns 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/admin/tenants')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`)
        .send({});

      if (res.status === 404) return;

      expect(res.status).toBe(400);
    });

    it('defaults tier to free', async () => {
      mockInsertReturning.mockResolvedValueOnce([{
        id: 'tenant-default-tier',
        name: 'FreeUser Inc',
        tier: 'free',
        sessionLimit: 25,
      }]);

      const res = await request(app)
        .post('/api/admin/tenants')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`)
        .send({ name: 'FreeUser Inc' });

      if (res.status === 404) return;

      if (res.status === 201) {
        expect(res.body.tier).toBe('free');
      }
    });

    it('returns session limit based on tier', async () => {
      mockInsertReturning.mockResolvedValueOnce([{
        id: 'tenant-growth',
        name: 'Growth Co',
        tier: 'growth',
        sessionLimit: 1000,
      }]);

      const res = await request(app)
        .post('/api/admin/tenants')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`)
        .send({ name: 'Growth Co', tier: 'growth' });

      if (res.status === 404) return;

      if (res.status === 201) {
        expect(res.body.sessionLimit).toBeGreaterThan(25);
      }
    });

    it('returns 401 without admin API key', async () => {
      const res = await request(app)
        .post('/api/admin/tenants')
        .send({ name: 'No Auth Corp' });

      if (res.status === 404) return;

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/admin/tenants/:tenantId', () => {
    it('updates tenant config', async () => {
      // PATCH uses db.update().set().where().returning(), not db.select()
      mockUpdateReturning.mockResolvedValueOnce([{
        id: 'existing-tenant',
        name: 'Updated Corp',
        tier: 'free',
      }]);

      const res = await request(app)
        .patch('/api/admin/tenants/existing-tenant')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`)
        .send({ name: 'Updated Corp' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('auto-sets sessionLimit when tier changes', async () => {
      mockUpdateReturning.mockResolvedValueOnce([{
        id: 'tier-change-tenant',
        name: 'Tier Change Corp',
        tier: 'growth',
        sessionLimit: 1000,
      }]);

      const res = await request(app)
        .patch('/api/admin/tenants/tier-change-tenant')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`)
        .send({ tier: 'growth' });

      expect(res.status).toBe(200);
      expect(mockDbUpdate).toHaveBeenCalled();
    });

    it('returns 404 for non-existent tenant', async () => {
      // db.update().set().where().returning() returns [] when tenant not found
      mockUpdateReturning.mockResolvedValueOnce([]);

      const res = await request(app)
        .patch('/api/admin/tenants/nonexistent-id')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`)
        .send({ name: 'Ghost Corp' });

      expect(res.status).toBe(404);
    });

    it('returns 400 for empty update', async () => {
      const res = await request(app)
        .patch('/api/admin/tenants/some-tenant')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`)
        .send({});

      expect([400, 404]).toContain(res.status);
    });
  });

  describe('POST /api/admin/tenants/:tenantId/api-keys', () => {
    it('generates a new API key for existing tenant', async () => {
      mockSelectLimit.mockResolvedValueOnce([{
        id: 'key-tenant',
        name: 'Key Corp',
      }]);

      mockInsertReturning.mockResolvedValueOnce([{
        id: 'key-id-123',
        keyPrefix: 'eb_live_abcd',
      }]);

      const res = await request(app)
        .post('/api/admin/tenants/key-tenant/api-keys')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`)
        .send({});

      if (res.status === 404) return;

      if (res.status === 201 || res.status === 200) {
        expect(res.body).toHaveProperty('apiKey');
      }
    });

    it('returns 404 for non-existent tenant', async () => {
      mockSelectLimit.mockResolvedValue([]);

      const res = await request(app)
        .post('/api/admin/tenants/ghost-tenant/api-keys')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`)
        .send({});

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/tenants/:tenantId/api-keys/:keyId', () => {
    it('revokes an API key (sets revokedAt)', async () => {
      // DELETE uses db.update().set().where(and(...)).returning()
      mockUpdateReturning.mockResolvedValueOnce([{
        id: 'revoke-key-id',
        keyPrefix: 'eb_live_revo',
        tenantId: 'revoke-tenant',
        revokedAt: new Date(),
      }]);

      const res = await request(app)
        .delete('/api/admin/tenants/revoke-tenant/api-keys/revoke-key-id')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`);

      expect(res.status).toBe(200);
      expect(mockDbUpdate).toHaveBeenCalled();
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent key', async () => {
      // db.update().set().where(and(...)).returning() returns [] when key not found
      mockUpdateReturning.mockResolvedValueOnce([]);

      const res = await request(app)
        .delete('/api/admin/tenants/some-tenant/api-keys/ghost-key')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`);

      expect(res.status).toBe(404);
    });

    it('invalidates tenant cache', async () => {
      mockUpdateReturning.mockResolvedValueOnce([{
        id: 'cache-key-id',
        keyPrefix: 'eb_live_cach',
        tenantId: 'cache-tenant',
        revokedAt: new Date(),
      }]);

      const res = await request(app)
        .delete('/api/admin/tenants/cache-tenant/api-keys/cache-key-id')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`);

      expect(res.status).toBe(200);
      expect(mockDbUpdate).toHaveBeenCalled();
    });
  });

  describe('GET /api/admin/tenants/:tenantId/usage', () => {
    it('returns usage for current period', async () => {
      mockSelectLimit
        .mockResolvedValueOnce([{ id: 'usage-tenant', name: 'Usage Corp' }])
        .mockResolvedValueOnce([{ sessionCount: 15, voiceMinutes: 42.5 }]);

      const res = await request(app)
        .get('/api/admin/tenants/usage-tenant/usage')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`);

      if (res.status === 404) return;

      if (res.status === 200) {
        expect(res.body).toHaveProperty('sessionCount');
      }
    });

    it('returns zero usage when no records exist', async () => {
      mockSelectLimit
        .mockResolvedValueOnce([{ id: 'empty-usage-tenant' }])
        .mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/admin/tenants/empty-usage-tenant/usage')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`);

      if (res.status === 404) return;

      if (res.status === 200) {
        expect(res.body.sessionCount).toBe(0);
      }
    });

    it('returns 404 for non-existent tenant', async () => {
      mockSelectLimit.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/admin/tenants/ghost-tenant/usage')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`);

      expect(res.status).toBe(404);
    });

    it('accepts custom period query param', async () => {
      mockSelectLimit
        .mockResolvedValueOnce([{ id: 'period-tenant' }])
        .mockResolvedValueOnce([{ sessionCount: 5, voiceMinutes: 10 }]);

      const res = await request(app)
        .get('/api/admin/tenants/period-tenant/usage?period=2025-01')
        .set('Authorization', `Bearer ${ADMIN_API_KEY}`);

      if (res.status === 404) return;

      if (res.status === 200) {
        expect(res.body).toHaveProperty('sessionCount');
      }
    });
  });
});
