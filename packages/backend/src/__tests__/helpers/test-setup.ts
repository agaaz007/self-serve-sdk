import { vi } from 'vitest';

/**
 * Create a mock config object. Call vi.mock('../config', ...) with this.
 */
export function createMockConfig(overrides: Record<string, any> = {}) {
  return {
    posthogApiKey: 'test',
    posthogProjectId: '123',
    posthogHost: 'https://app.posthog.com',
    elevenLabsApiKey: 'test',
    elevenLabsAgentId: 'test_agent',
    elevenLabsChatAgentId: undefined,
    elevenLabsWebhookSecret: undefined,
    groqApiKey: 'test_groq_key',
    adminApiKey: undefined,
    databaseUrl: undefined,
    port: 0,
    nodeEnv: 'test',
    ...overrides,
  };
}

/**
 * Create a mock logger that captures all log calls.
 */
export function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

/**
 * Create a mock DB with chainable query builders.
 */
export function createMockDb() {
  const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockDbUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

  const mockSelectLimit = vi.fn().mockResolvedValue([]);
  const mockSelectOrderBy = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit, orderBy: mockSelectOrderBy });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockDbSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

  const mockInsertReturning = vi.fn().mockResolvedValue([]);
  const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
  const mockDbInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

  const mockExecute = vi.fn().mockResolvedValue(undefined);

  return {
    db: {
      update: (...args: any[]) => mockDbUpdate(...args),
      select: (...args: any[]) => mockDbSelect(...args),
      insert: (...args: any[]) => mockDbInsert(...args),
      execute: mockExecute,
    },
    mocks: {
      update: mockDbUpdate,
      updateSet: mockUpdateSet,
      updateWhere: mockUpdateWhere,
      select: mockDbSelect,
      selectFrom: mockSelectFrom,
      selectWhere: mockSelectWhere,
      selectLimit: mockSelectLimit,
      selectOrderBy: mockSelectOrderBy,
      insert: mockDbInsert,
      insertValues: mockInsertValues,
      insertReturning: mockInsertReturning,
      execute: mockExecute,
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
  };
}

/**
 * Create a default tenant config for use in authenticate mock.
 */
export function createMockTenant(overrides: Record<string, any> = {}) {
  return {
    id: 'test-tenant-id',
    apiKeyPrefix: 'eb_live_test',
    tier: 'free',
    sessionLimit: 25,
    config: {
      posthogApiKey: 'test',
      posthogProjectId: '123',
      posthogHost: 'https://app.posthog.com',
      elevenLabsApiKey: 'test',
      interventionAgentId: 'test_agent',
      chatAgentId: undefined,
    },
    ...overrides,
  };
}

/**
 * Create a mock authenticate middleware that attaches a tenant to the request.
 */
export function createMockAuthMiddleware(tenantOverrides: Record<string, any> = {}) {
  const tenant = createMockTenant(tenantOverrides);
  return (req: any, _res: any, next: any) => {
    req.tenant = tenant;
    next();
  };
}

/**
 * Save and restore process listeners (index.ts registers shutdown handlers).
 */
export function captureProcessListeners() {
  return {
    uncaughtException: process.listeners('uncaughtException').slice(),
    SIGTERM: process.listeners('SIGTERM').slice(),
    SIGINT: process.listeners('SIGINT').slice(),
    unhandledRejection: process.listeners('unhandledRejection').slice(),
  };
}

export function restoreProcessListeners(saved: ReturnType<typeof captureProcessListeners>) {
  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('SIGTERM');
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('unhandledRejection');

  for (const listener of saved.uncaughtException) {
    process.on('uncaughtException', listener as NodeJS.UncaughtExceptionListener);
  }
  for (const listener of saved.unhandledRejection) {
    process.on('unhandledRejection', listener as NodeJS.UnhandledRejectionListener);
  }
}
