/**
 * Auth middleware tests
 *
 * Tests the authenticate middleware including:
 * - API key format validation
 * - Tenant lookup from DB
 * - Config merging (tenant-specific overrides + global fallbacks)
 * - Key hash verification (target behavior for strengthened auth)
 *
 * The auth middleware uses a dynamic import for ../db, so we mock
 * it at module level. The mock chain: db.select().from().innerJoin().where().limit()
 */

// ============ Mocks (MUST be before any imports) ============

vi.mock('../config', () => ({
  config: {
    posthogApiKey: 'test',
    posthogProjectId: '123',
    posthogHost: 'https://app.posthog.com',
    elevenLabsApiKey: 'test',
    elevenLabsAgentId: 'test_agent',
    elevenLabsChatAgentId: undefined,
    elevenLabsWebhookSecret: undefined,
    groqApiKey: 'test_groq_key',
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

// Mock tenant cache so it never returns cached values (each test controls DB results)
vi.mock('../lib/tenant-cache', () => ({
  tenantCacheGet: vi.fn().mockReturnValue(null),
  tenantCacheSet: vi.fn(),
  tenantCacheInvalidate: vi.fn(),
  tenantCacheClear: vi.fn(),
}));

// The mock select chain — exposed via mockSelectLimit for per-test control
const mockSelectLimit = vi.fn().mockResolvedValue([]);
const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
const mockSelectInnerJoin = vi.fn().mockReturnValue({ where: mockSelectWhere });
const mockSelectFrom = vi.fn().mockReturnValue({
  innerJoin: mockSelectInnerJoin,
  where: mockSelectWhere,
});
const mockDbSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

vi.mock('../db', () => ({
  db: {
    select: (...args: any[]) => mockDbSelect(...args),
  },
  apiKeys: {
    id: 'id',
    tenantId: 'tenant_id',
    keyPrefix: 'key_prefix',
    keyHash: 'key_hash',
    revokedAt: 'revoked_at',
  },
  tenants: {
    id: 'id',
    name: 'name',
    posthogApiKey: 'posthog_api_key',
    posthogProjectId: 'posthog_project_id',
    posthogHost: 'posthog_host',
    elevenLabsApiKey: 'elevenlabs_api_key',
    interventionAgentId: 'intervention_agent_id',
    chatAgentId: 'chat_agent_id',
  },
  sessions: { id: 'id', status: 'status' },
  pool: null,
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: any, b: any) => ({ _type: 'eq', left: a, right: b }),
}));

// ============ Imports ============

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'crypto';
import { authenticate } from '../middleware/auth';
import { config } from '../config';

// Pre-compute the SHA-256 hash for the test API key used throughout
const TEST_KEY = 'eb_live_1234567890abcdef';
const TEST_KEY_HASH = createHash('sha256').update(TEST_KEY).digest('hex');

// ============ Helpers ============

function createMockReq(headers: Record<string, string> = {}) {
  return {
    headers,
    tenant: undefined as any,
  };
}

function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

/**
 * Call the authenticate middleware and wait for the async DB lookup to resolve.
 */
async function callAuthenticate(
  headers: Record<string, string> = {},
): Promise<{ req: any; res: any; next: any }> {
  const req = createMockReq(headers);
  const res = createMockRes();
  const next = vi.fn();

  authenticate(req, res, next);

  // The middleware calls loadTenantFromDb (async), need to flush
  await new Promise((r) => setTimeout(r, 20));

  return { req, res, next };
}

// ============ Setup ============

beforeEach(() => {
  vi.clearAllMocks();
  // Re-set up mock chains after clearAllMocks
  mockSelectLimit.mockResolvedValue([]);
  mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
  mockSelectInnerJoin.mockReturnValue({ where: mockSelectWhere });
  mockSelectFrom.mockReturnValue({
    innerJoin: mockSelectInnerJoin,
    where: mockSelectWhere,
  });
  mockDbSelect.mockReturnValue({ from: mockSelectFrom });
});

// ============ Tests ============

describe('authenticate middleware', () => {
  describe('request validation', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const { res, next } = await callAuthenticate({});

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid API key' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when Authorization header has no Bearer prefix', async () => {
      const { res, next } = await callAuthenticate({
        authorization: 'Basic eb_live_1234567890abcdef',
      });

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid API key' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when API key is shorter than 20 characters', async () => {
      const { res, next } = await callAuthenticate({
        authorization: 'Bearer eb_live_short',
      });

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid API key' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when API key has wrong prefix (not eb_live_ or eb_test_)', async () => {
      const { res, next } = await callAuthenticate({
        authorization: 'Bearer xx_prod_1234567890abcdef',
      });

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid API key' });
      expect(next).not.toHaveBeenCalled();
    });

    it('accepts valid eb_live_ key format', async () => {
      const { next } = await callAuthenticate({
        authorization: 'Bearer eb_live_1234567890abcdef',
      });

      expect(next).toHaveBeenCalled();
    });

    it('accepts valid eb_test_ key format', async () => {
      const { next } = await callAuthenticate({
        authorization: 'Bearer eb_test_1234567890abcdef',
      });

      expect(next).toHaveBeenCalled();
    });
  });

  describe('tenant lookup from DB', () => {
    it('looks up tenant by key prefix from DB', async () => {
      await callAuthenticate({
        authorization: 'Bearer eb_live_1234567890abcdef',
      });

      // The auth middleware calls db.select(...).from(apiKeys).innerJoin(tenants, ...).where(...).limit(1)
      expect(mockDbSelect).toHaveBeenCalled();
    });

    it('attaches tenant config to req.tenant when found', async () => {
      mockSelectLimit.mockResolvedValue([{
        tenantId: 'tenant-abc',
        keyHash: TEST_KEY_HASH,
        posthogApiKey: 'ph_tenant_key',
        posthogProjectId: 'proj_tenant',
        posthogHost: 'https://eu.posthog.com',
        elevenLabsApiKey: 'el_tenant_key',
        interventionAgentId: 'agent_tenant',
        chatAgentId: 'chat_tenant',
      }]);

      const { req, next } = await callAuthenticate({
        authorization: 'Bearer eb_live_1234567890abcdef',
      });

      expect(next).toHaveBeenCalled();
      expect(req.tenant).toBeDefined();
      expect(req.tenant.id).toBe('tenant-abc');
      expect(req.tenant.config.posthogApiKey).toBe('ph_tenant_key');
      expect(req.tenant.config.elevenLabsApiKey).toBe('el_tenant_key');
    });

    it('falls back to default config when DB returns no results', async () => {
      mockSelectLimit.mockResolvedValue([]);

      const { req, next } = await callAuthenticate({
        authorization: 'Bearer eb_live_1234567890abcdef',
      });

      expect(next).toHaveBeenCalled();
      expect(req.tenant).toBeDefined();
      expect(req.tenant.id).toBe('default');
      expect(req.tenant.config.posthogApiKey).toBe(config.posthogApiKey);
    });

    it('falls back to default config when DB query throws', async () => {
      mockSelectLimit.mockRejectedValue(new Error('DB connection failed'));

      const { req, next } = await callAuthenticate({
        authorization: 'Bearer eb_live_1234567890abcdef',
      });

      expect(next).toHaveBeenCalled();
      expect(req.tenant).toBeDefined();
      expect(req.tenant.id).toBe('default');
    });

    it('merges tenant-specific values with global defaults', async () => {
      mockSelectLimit.mockResolvedValue([{
        tenantId: 'tenant-merge',
        keyHash: TEST_KEY_HASH,
        posthogApiKey: 'ph_custom',
        posthogProjectId: null,
        posthogHost: null,
        elevenLabsApiKey: 'el_custom',
        interventionAgentId: null,
        chatAgentId: null,
      }]);

      const { req } = await callAuthenticate({
        authorization: 'Bearer eb_live_1234567890abcdef',
      });

      expect(req.tenant.config.posthogApiKey).toBe('ph_custom');
      // null/empty tenant values should fall through to global config defaults
      expect(req.tenant.config.posthogProjectId).toBe(config.posthogProjectId);
      expect(req.tenant.config.elevenLabsApiKey).toBe('el_custom');
    });

    it('uses global default for missing tenant-specific fields', async () => {
      mockSelectLimit.mockResolvedValue([{
        tenantId: 'tenant-empty',
        keyHash: TEST_KEY_HASH,
        posthogApiKey: null,
        posthogProjectId: null,
        posthogHost: null,
        elevenLabsApiKey: null,
        interventionAgentId: null,
        chatAgentId: null,
      }]);

      const { req } = await callAuthenticate({
        authorization: 'Bearer eb_live_1234567890abcdef',
      });

      expect(req.tenant.config.posthogApiKey).toBe(config.posthogApiKey);
      expect(req.tenant.config.elevenLabsApiKey).toBe(config.elevenLabsApiKey);
      expect(req.tenant.config.interventionAgentId).toBe(config.elevenLabsAgentId);
    });
  });

  describe('key hash verification', () => {
    // These test the target behavior for strengthened auth (task #12).
    // Current auth middleware does not verify key hashes.

    it('verifies API key hash matches stored hash', async () => {
      mockSelectLimit.mockResolvedValue([{
        tenantId: 'tenant-hash',
        keyHash: TEST_KEY_HASH,
        posthogApiKey: 'test',
        posthogProjectId: '123',
        posthogHost: null,
        elevenLabsApiKey: 'test',
        interventionAgentId: 'test_agent',
        chatAgentId: null,
      }]);

      const { req, next } = await callAuthenticate({
        authorization: `Bearer ${TEST_KEY}`,
      });

      expect(next).toHaveBeenCalled();
      expect(req.tenant.id).toBe('tenant-hash');
    });

    it('falls back to defaults when API key hash does not match', async () => {
      mockSelectLimit.mockResolvedValue([{
        tenantId: 'tenant-hash-mismatch',
        keyHash: 'wrong_hash_value_that_does_not_match',
        posthogApiKey: 'test',
        posthogProjectId: '123',
        posthogHost: null,
        elevenLabsApiKey: 'test',
        interventionAgentId: 'test_agent',
        chatAgentId: null,
      }]);

      const { req, next } = await callAuthenticate({
        authorization: `Bearer ${TEST_KEY}`,
      });

      // Hash mismatch → loadTenantFromDb returns null → falls back to defaults
      expect(next).toHaveBeenCalled();
      expect(req.tenant.id).toBe('default');
    });

    it('falls back to defaults when keyHash is missing from DB row', async () => {
      mockSelectLimit.mockResolvedValue([{
        tenantId: 'tenant-no-hash',
        posthogApiKey: 'test',
        posthogProjectId: '123',
        posthogHost: null,
        elevenLabsApiKey: 'test',
        interventionAgentId: 'test_agent',
        chatAgentId: null,
      }]);

      const { req, next } = await callAuthenticate({
        authorization: `Bearer ${TEST_KEY}`,
      });

      // No keyHash → hash mismatch → falls back to defaults
      expect(next).toHaveBeenCalled();
      expect(req.tenant.id).toBe('default');
    });
  });

  describe('tenant config merging', () => {
    it('uses tenant posthogApiKey over global default', async () => {
      mockSelectLimit.mockResolvedValue([{
        tenantId: 'tenant-ph',
        keyHash: TEST_KEY_HASH,
        posthogApiKey: 'ph_tenant_override',
        posthogProjectId: null,
        posthogHost: null,
        elevenLabsApiKey: null,
        interventionAgentId: null,
        chatAgentId: null,
      }]);

      const { req } = await callAuthenticate({
        authorization: 'Bearer eb_live_1234567890abcdef',
      });

      expect(req.tenant.config.posthogApiKey).toBe('ph_tenant_override');
    });

    it('uses tenant elevenLabsApiKey over global default', async () => {
      mockSelectLimit.mockResolvedValue([{
        tenantId: 'tenant-el',
        keyHash: TEST_KEY_HASH,
        posthogApiKey: null,
        posthogProjectId: null,
        posthogHost: null,
        elevenLabsApiKey: 'el_tenant_override',
        interventionAgentId: null,
        chatAgentId: null,
      }]);

      const { req } = await callAuthenticate({
        authorization: 'Bearer eb_live_1234567890abcdef',
      });

      expect(req.tenant.config.elevenLabsApiKey).toBe('el_tenant_override');
    });

    it('falls through to global posthogHost when tenant has none', async () => {
      mockSelectLimit.mockResolvedValue([{
        tenantId: 'tenant-host',
        keyHash: TEST_KEY_HASH,
        posthogApiKey: null,
        posthogProjectId: null,
        posthogHost: null,
        elevenLabsApiKey: null,
        interventionAgentId: null,
        chatAgentId: null,
      }]);

      const { req } = await callAuthenticate({
        authorization: 'Bearer eb_live_1234567890abcdef',
      });

      expect(req.tenant.config.posthogHost).toBe(config.posthogHost);
    });

    it('includes tier and sessionLimit from DB', async () => {
      mockSelectLimit.mockResolvedValue([{
        tenantId: 'tenant-tier',
        keyHash: TEST_KEY_HASH,
        posthogApiKey: null,
        posthogProjectId: null,
        posthogHost: null,
        elevenLabsApiKey: null,
        interventionAgentId: null,
        chatAgentId: null,
        tier: 'growth',
        sessionLimit: 500,
      }]);

      const { req } = await callAuthenticate({
        authorization: 'Bearer eb_live_1234567890abcdef',
      });

      expect(req.tenant).toBeDefined();
      expect(req.tenant.id).toBe('tenant-tier');
    });

    it('defaults tier to free and sessionLimit to 25 when not in DB', async () => {
      mockSelectLimit.mockResolvedValue([]);

      const { req } = await callAuthenticate({
        authorization: 'Bearer eb_live_1234567890abcdef',
      });

      expect(req.tenant).toBeDefined();
      expect(req.tenant.id).toBe('default');
    });
  });
});
