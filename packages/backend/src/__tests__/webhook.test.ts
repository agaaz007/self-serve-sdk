/**
 * Webhook endpoint tests
 *
 * Tests the ElevenLabs post-call webhook handler including:
 * - 200 response with conversationId
 * - Synchronous processing (Groq analysis, session lookup, DB update)
 * - Signature verification
 */

// ============ Mocks (MUST be before any imports) ============

const originalListeners = {
  uncaughtException: process.listeners('uncaughtException').slice(),
  SIGTERM: process.listeners('SIGTERM').slice(),
  SIGINT: process.listeners('SIGINT').slice(),
  unhandledRejection: process.listeners('unhandledRejection').slice(),
};

vi.mock('../config', () => ({
  config: {
    posthogApiKey: 'test',
    posthogProjectId: '123',
    posthogHost: 'https://app.posthog.com',
    elevenLabsApiKey: 'test',
    elevenLabsAgentId: 'test_agent',
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

// Mock DB module
const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
const mockDbUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

const mockSelectLimit = vi.fn().mockResolvedValue([]);
const mockSelectOrderBy = vi.fn().mockReturnValue({ limit: mockSelectLimit });
const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit, orderBy: mockSelectOrderBy });
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
const mockDbSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

const mockDbInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockResolvedValue(undefined),
});

vi.mock('../db', () => ({
  db: {
    update: (...args: any[]) => mockDbUpdate(...args),
    select: (...args: any[]) => mockDbSelect(...args),
    insert: (...args: any[]) => mockDbInsert(...args),
  },
  sessions: {
    id: 'id',
    status: 'status',
    agentId: 'agent_id',
    createdAt: 'created_at',
    elevenLabsConversationId: 'elevenlabs_conversation_id',
  },
  pool: null,
}));

// Mock authenticate middleware to pass through with tenant config
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

// Mock global fetch for Groq API
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ============ Imports ============

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';

// Remove process handlers from index.ts
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

// ============ Helpers ============

/** Small delay helper for consistency across tests */
function tick(ms = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function groqResponse(outcome: 'retained' | 'churned', confidence = 0.9) {
  return {
    ok: true,
    json: async () => ({
      choices: [{
        message: {
          content: JSON.stringify({ outcome, confidence, reason: `Test ${outcome}` }),
        },
      }],
    }),
    text: async () => '',
  };
}

function webhookPayload(dataOverrides: Record<string, any> = {}, topOverrides: Record<string, any> = {}) {
  return {
    type: 'post_call_transcription',
    event_timestamp: Date.now(),
    data: {
      conversation_id: 'conv_test_123',
      agent_id: 'test_agent',
      transcript: [
        { role: 'agent', message: 'Hi, how can I help?' },
        { role: 'user', message: 'I want to cancel my subscription.' },
        { role: 'agent', message: 'I understand. Can I offer you a discount?' },
        { role: 'user', message: 'No thanks, please cancel.' },
      ],
      ...dataOverrides,
    },
    ...topOverrides,
  };
}

// ============ Tests ============

describe('POST /api/exit-session/webhook/elevenlabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: Groq returns "churned"
    mockFetch.mockResolvedValue(groqResponse('churned'));
    // Default: select returns no results (no matching session)
    mockSelectLimit.mockResolvedValue([]);
    // Reset update chain
    mockUpdateWhere.mockResolvedValue(undefined);
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
    mockDbUpdate.mockReturnValue({ set: mockUpdateSet });
  });

  it('returns 200 with conversationId and runs Groq analysis', async () => {
    const res = await request(app)
      .post('/api/exit-session/webhook/elevenlabs')
      .send(webhookPayload());

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('conversationId', 'conv_test_123');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test_groq_key',
        }),
      }),
    );
  });

  it('returns outcome from transcript analysis', async () => {
    mockFetch.mockResolvedValue(groqResponse('retained'));

    const res = await request(app)
      .post('/api/exit-session/webhook/elevenlabs')
      .send(webhookPayload());

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('outcome', 'retained');
    expect(mockFetch).toHaveBeenCalled();
  });

  it('handles Groq API failure gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const res = await request(app)
      .post('/api/exit-session/webhook/elevenlabs')
      .send(webhookPayload());

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);

    await tick();
  });

  it('uses session_id from dynamic variables when present', async () => {
    const payload = webhookPayload({
      conversation_initiation_client_data: {
        dynamic_variables: { session_id: 'exit_123_user_abc' },
      },
    }, {});

    const res = await request(app)
      .post('/api/exit-session/webhook/elevenlabs')
      .send(payload);

    expect(res.status).toBe(200);

    // Should update the session with the ID from dynamic vars
    expect(mockDbUpdate).toHaveBeenCalled();
    // Should NOT fall back to conversation_id lookup
    expect(mockDbSelect).not.toHaveBeenCalled();
  });

  it('resolves session via conversation_id when dynamic vars missing', async () => {
    // Setup: conversation_id lookup returns a matching session
    mockSelectLimit.mockResolvedValue([{ id: 'exit_456_user_xyz' }]);

    const payload = webhookPayload(); // No conversation_initiation_client_data

    const res = await request(app)
      .post('/api/exit-session/webhook/elevenlabs')
      .send(payload);

    expect(res.status).toBe(200);

    // Should have done the conversation_id lookup
    expect(mockDbSelect).toHaveBeenCalled();
    // Should have updated the found session
    expect(mockDbUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: expect.stringMatching(/^(retained|churned)$/),
        status: expect.stringMatching(/^(retained|churned)$/),
      }),
    );
  });

  it('falls back to agent_id lookup when conversation_id lookup fails', async () => {
    // First call (conversation_id lookup) returns empty, second call (agent_id fallback) returns match
    mockSelectLimit
      .mockResolvedValueOnce([])           // conversation_id lookup: no match
      .mockResolvedValueOnce([{ id: 'exit_789_user_fallback' }]); // agent_id fallback: found

    const payload = webhookPayload(); // No dynamic vars

    const res = await request(app)
      .post('/api/exit-session/webhook/elevenlabs')
      .send(payload);

    expect(res.status).toBe(200);

    // Should have called select twice (conversation_id + agent_id fallback)
    expect(mockDbSelect).toHaveBeenCalledTimes(2);
    // Should have updated the session found via agent_id fallback
    expect(mockDbUpdate).toHaveBeenCalled();
  });

  it('handles no matching session gracefully', async () => {
    // Both fallbacks return no results
    mockSelectLimit.mockResolvedValue([]);

    const payload = webhookPayload(); // No dynamic vars

    const res = await request(app)
      .post('/api/exit-session/webhook/elevenlabs')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);

    // Should have tried both lookups
    expect(mockDbSelect).toHaveBeenCalledTimes(2);
    // Should NOT have called update (no session found)
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it('handles empty transcript gracefully', async () => {
    const res = await request(app)
      .post('/api/exit-session/webhook/elevenlabs')
      .send(webhookPayload({ transcript: [] }, {}));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('ignores non-transcription webhook events', async () => {
    const res = await request(app)
      .post('/api/exit-session/webhook/elevenlabs')
      .send(webhookPayload({ transcript: undefined, full_audio: { format: 'wav' } }, { type: 'post_call_audio' }));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/exit-session/:sessionId/conversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateWhere.mockResolvedValue(undefined);
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
    mockDbUpdate.mockReturnValue({ set: mockUpdateSet });
  });

  it('links conversation_id to session', async () => {
    const res = await request(app)
      .patch('/api/exit-session/exit_123_user_abc/conversation')
      .send({ elevenLabsConversationId: 'conv_abc_123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('sessionId', 'exit_123_user_abc');
    expect(res.body).toHaveProperty('elevenLabsConversationId', 'conv_abc_123');

    // Verify DB update was called
    expect(mockDbUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith({
      elevenLabsConversationId: 'conv_abc_123',
    });
  });

  it('returns 400 when elevenLabsConversationId is missing', async () => {
    const res = await request(app)
      .patch('/api/exit-session/exit_123_user_abc/conversation')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'elevenLabsConversationId is required');
  });
});
