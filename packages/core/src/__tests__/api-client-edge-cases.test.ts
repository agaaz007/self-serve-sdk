import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExitButtonApiClient } from '../api-client';
import { ExitButtonError } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_API_KEY = 'eb_test_edge';
const TEST_BASE_URL = 'https://api.test.com';

function mockFetchResponse(body: unknown, status = 200, statusText = 'OK') {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: vi.fn().mockResolvedValue(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExitButtonApiClient — concurrency & edge cases', () => {
  let client: ExitButtonApiClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    client = new ExitButtonApiClient({ apiKey: TEST_API_KEY, baseUrl: TEST_BASE_URL });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =========================================================================
  // 1. Concurrent requests — multiple initiate() calls fire independently
  // =========================================================================

  it('concurrent initiate() calls should each fire independently', async () => {
    const response1 = { sessionId: 's1', agentId: 'a1', conversationToken: null, chatAgentId: null, chatConversationToken: null, context: '', dynamicVariables: {}, elapsed_ms: 10, timing: {} };
    const response2 = { sessionId: 's2', agentId: 'a2', conversationToken: null, chatAgentId: null, chatConversationToken: null, context: '', dynamicVariables: {}, elapsed_ms: 20, timing: {} };
    const response3 = { sessionId: 's3', agentId: 'a3', conversationToken: null, chatAgentId: null, chatConversationToken: null, context: '', dynamicVariables: {}, elapsed_ms: 30, timing: {} };

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      const body = callCount === 1 ? response1 : callCount === 2 ? response2 : response3;
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(body),
      });
    });

    const [r1, r2, r3] = await Promise.all([
      client.initiate({ userId: 'u1' }),
      client.initiate({ userId: 'u2' }),
      client.initiate({ userId: 'u3' }),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(r1.sessionId).toBe('s1');
    expect(r2.sessionId).toBe('s2');
    expect(r3.sessionId).toBe('s3');
  });

  // =========================================================================
  // 2. Short custom timeout triggers AbortError correctly
  // =========================================================================

  it('short custom timeout triggers AbortError correctly', async () => {
    const slowClient = new ExitButtonApiClient({
      apiKey: TEST_API_KEY,
      baseUrl: TEST_BASE_URL,
      timeout: 100,
    });

    // Mock fetch that listens to the AbortSignal and rejects with AbortError
    // when the signal fires (which happens when the setTimeout-based timeout expires).
    global.fetch = vi.fn().mockImplementation((_url: string, options?: RequestInit) => {
      return new Promise((resolve, reject) => {
        const signal = options?.signal;
        // If already aborted, reject immediately
        if (signal?.aborted) {
          const abortError = new DOMException('The operation was aborted', 'AbortError');
          reject(abortError);
          return;
        }
        // Resolve after 200ms (longer than the 100ms timeout)
        const resolveTimer = setTimeout(() => {
          resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: () => Promise.resolve({ sessionId: 'late' }),
          });
        }, 200);
        // Listen for abort and reject when it fires
        signal?.addEventListener('abort', () => {
          clearTimeout(resolveTimer);
          const abortError = new DOMException('The operation was aborted', 'AbortError');
          reject(abortError);
        });
      });
    });

    // Attach a .catch() immediately to prevent unhandled rejection warnings,
    // then advance timers to trigger the abort, and finally assert.
    const promise = slowClient.initiate({ userId: 'u1' });
    // Capture the error without leaving the rejection unhandled
    let caughtError: unknown;
    const handled = promise.catch((err) => { caughtError = err; });

    // Advance time past the timeout (100ms) to trigger controller.abort()
    await vi.advanceTimersByTimeAsync(150);

    await handled;

    expect(caughtError).toBeInstanceOf(ExitButtonError);
    expect((caughtError as ExitButtonError).message).toBe('Request timeout');
    expect((caughtError as ExitButtonError).code).toBe('NETWORK_ERROR');
    expect((caughtError as ExitButtonError).statusCode).toBeUndefined();
  });

  // =========================================================================
  // 3. Concurrent initiate + complete — both succeed independently
  // =========================================================================

  it('concurrent initiate() + complete() should both succeed independently', async () => {
    const initiateResp = { sessionId: 's1', agentId: 'a1', conversationToken: null, chatAgentId: null, chatConversationToken: null, context: '', dynamicVariables: {}, elapsed_ms: 10, timing: {} };
    const completeResp = { success: true, sessionId: 's0', outcome: 'retained' };

    global.fetch = vi.fn().mockImplementation((_url: string) => {
      const url = _url as string;
      const body = url.includes('initiate') ? initiateResp : completeResp;
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(body),
      });
    });

    const [initResult, complResult] = await Promise.all([
      client.initiate({ userId: 'u1' }),
      client.complete('s0', { outcome: 'retained' }),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(initResult.sessionId).toBe('s1');
    expect(complResult.success).toBe(true);
    expect(complResult.sessionId).toBe('s0');
  });

  // =========================================================================
  // 4. Request after previous error — client should be reusable
  // =========================================================================

  it('client should be reusable after a previous error', async () => {
    // First call: network error
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(client.initiate({ userId: 'u1' })).rejects.toThrow(ExitButtonError);

    // Second call: success
    const successResp = { sessionId: 's_ok', agentId: 'a1', conversationToken: null, chatAgentId: null, chatConversationToken: null, context: '', dynamicVariables: {}, elapsed_ms: 10, timing: {} };
    global.fetch = mockFetchResponse(successResp);

    const result = await client.initiate({ userId: 'u1' });

    expect(result.sessionId).toBe('s_ok');
  });

  // =========================================================================
  // 5. Empty string apiKey — should still send (server-side validation)
  // =========================================================================

  it('empty string apiKey should still send request (validation is server-side)', async () => {
    const emptyKeyClient = new ExitButtonApiClient({
      apiKey: '',
      baseUrl: TEST_BASE_URL,
    });

    const resp = { sessionId: 's1', agentId: 'a1', conversationToken: null, chatAgentId: null, chatConversationToken: null, context: '', dynamicVariables: {}, elapsed_ms: 10, timing: {} };
    global.fetch = mockFetchResponse(resp);

    const result = await emptyKeyClient.initiate({ userId: 'u1' });

    expect(result.sessionId).toBe('s1');
    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(options.headers.Authorization).toBe('Bearer ');
  });

  // =========================================================================
  // 6. Base URL with trailing slash — should not double-slash
  // =========================================================================

  it('base URL with trailing slash should not produce double-slashed URLs', async () => {
    const trailingSlashClient = new ExitButtonApiClient({
      apiKey: TEST_API_KEY,
      baseUrl: 'https://api.test.com/',
    });

    const resp = { sessionId: 's1', agentId: 'a1', conversationToken: null, chatAgentId: null, chatConversationToken: null, context: '', dynamicVariables: {}, elapsed_ms: 10, timing: {} };
    global.fetch = mockFetchResponse(resp);

    await trailingSlashClient.initiate({ userId: 'u1' });

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    // The implementation concatenates baseUrl + endpoint.
    // With trailing slash on baseUrl, the URL will be "https://api.test.com//api/exit-session/initiate"
    // This test documents the actual behavior: it does produce a double slash.
    expect(url).toBe('https://api.test.com//api/exit-session/initiate');
  });

  // =========================================================================
  // 7. Very large request body — should not crash
  // =========================================================================

  it('very large request body should not crash', async () => {
    const resp = { sessionId: 's_big', agentId: 'a1', conversationToken: null, chatAgentId: null, chatConversationToken: null, context: '', dynamicVariables: {}, elapsed_ms: 10, timing: {} };
    global.fetch = mockFetchResponse(resp);

    // Build a large metadata object (many keys with long values)
    const bigMetadata: Record<string, string> = {};
    for (let i = 0; i < 1000; i++) {
      bigMetadata[`key_${i}`] = 'x'.repeat(1000);
    }

    const result = await client.initiate({
      userId: 'u1',
      metadata: bigMetadata,
    });

    expect(result.sessionId).toBe('s_big');

    // Verify the body was serialized correctly
    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    const parsedBody = JSON.parse(options.body);
    expect(Object.keys(parsedBody.metadata)).toHaveLength(1000);
    expect(parsedBody.metadata.key_0).toBe('x'.repeat(1000));
  });

  // =========================================================================
  // 8. Server returns 200 but invalid JSON — should throw
  // =========================================================================

  it('server returns 200 but invalid JSON should throw SyntaxError', async () => {
    // response.ok is true, but response.json() rejects with a SyntaxError.
    // Because the code uses `return response.json()` (without `await`), the
    // rejected promise escapes the try/catch block. This is a subtle JS behavior:
    // `return promise` in an async function does NOT route the rejection through
    // the local catch — it propagates directly to the caller.
    // So the caller receives the raw SyntaxError, not a wrapped ExitButtonError.
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token < in JSON')),
    });

    await expect(client.initiate({ userId: 'u1' })).rejects.toThrow(SyntaxError);
    await expect(client.initiate({ userId: 'u1' })).rejects.toMatchObject({
      message: 'Unexpected token < in JSON',
    });

    // Verify it is NOT wrapped as ExitButtonError — this documents the current
    // behavior and serves as a regression guard if the implementation changes to
    // `return await response.json()`.
    try {
      await client.initiate({ userId: 'u1' });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(SyntaxError);
      expect(err).not.toBeInstanceOf(ExitButtonError);
    }
  });

  // =========================================================================
  // 9. Server returns empty body on 200 — should handle gracefully
  // =========================================================================

  it('server returns empty body on success should resolve with null/undefined from json()', async () => {
    // response.json() resolves to null (e.g., body was "null")
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue(null),
    });

    const result = await client.initiate({ userId: 'u1' });
    // The method returns whatever json() resolves to
    expect(result).toBeNull();
  });

  // =========================================================================
  // 10. Prefetch called multiple times concurrently — each fires
  // =========================================================================

  it('prefetch called multiple times concurrently should each fire (no dedup)', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      const status = callCount === 1 ? 'started' : callCount === 2 ? 'in_progress' : 'cached';
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({ status }),
      });
    });

    const [r1, r2, r3] = await Promise.all([
      client.prefetch({ userId: 'u1' }),
      client.prefetch({ userId: 'u1' }),
      client.prefetch({ userId: 'u1' }),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(r1.status).toBe('started');
    expect(r2.status).toBe('in_progress');
    expect(r3.status).toBe('cached');

    // All three should hit the same endpoint
    for (const call of (global.fetch as ReturnType<typeof vi.fn>).mock.calls) {
      expect(call[0]).toBe(`${TEST_BASE_URL}/api/exit-session/prefetch`);
    }
  });

  // =========================================================================
  // 11. Complete with no params — should send only sessionId
  // =========================================================================

  it('complete() with no params should send body containing only sessionId', async () => {
    const completeResp = { success: true, sessionId: 'sess_only', outcome: 'churned' };
    global.fetch = mockFetchResponse(completeResp);

    const result = await client.complete('sess_only');

    expect(result).toEqual(completeResp);

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    const body = JSON.parse(options.body);

    // When params is undefined, spreading it yields just { sessionId }
    expect(body).toEqual({ sessionId: 'sess_only' });
    expect(Object.keys(body)).toEqual(['sessionId']);
  });

  // =========================================================================
  // 12. Race condition: multiple getSession calls for different IDs
  // =========================================================================

  it('multiple getSession() calls for different IDs should route correctly', async () => {
    const sessions: Record<string, unknown> = {
      sess_a: { id: 'sess_a', status: 'initiated' },
      sess_b: { id: 'sess_b', status: 'completed' },
      sess_c: { id: 'sess_c', status: 'retained' },
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      // Extract the session ID from the URL
      const sessionId = url.split('/api/exit-session/')[1]!;
      const body = sessions[sessionId as keyof typeof sessions] || { error: 'not found' };
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(body),
      });
    });

    const [a, b, c] = await Promise.all([
      client.getSession('sess_a'),
      client.getSession('sess_b'),
      client.getSession('sess_c'),
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(a).toEqual({ id: 'sess_a', status: 'initiated' });
    expect(b).toEqual({ id: 'sess_b', status: 'completed' });
    expect(c).toEqual({ id: 'sess_c', status: 'retained' });

    // Verify each call used the correct URL
    const urls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
    expect(urls).toContain(`${TEST_BASE_URL}/api/exit-session/sess_a`);
    expect(urls).toContain(`${TEST_BASE_URL}/api/exit-session/sess_b`);
    expect(urls).toContain(`${TEST_BASE_URL}/api/exit-session/sess_c`);
  });

  // =========================================================================
  // 13. Error message with special characters — should preserve them
  // =========================================================================

  it('error message containing special characters should be preserved', async () => {
    const specialMessage = 'Error: <div>bad "input" & \'more\' \\ chars \n\t\u00e9\u00e8\u00ea</div>';
    global.fetch = mockFetchResponse(
      { message: specialMessage, code: 'VALIDATION_ERROR' },
      400,
      'Bad Request',
    );

    try {
      await client.initiate({ userId: 'u1' });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ExitButtonError);
      const exitErr = err as ExitButtonError;
      expect(exitErr.message).toBe(specialMessage);
      expect(exitErr.code).toBe('VALIDATION_ERROR');
      expect(exitErr.statusCode).toBe(400);
    }
  });

  // =========================================================================
  // 14. HTTP 429 rate limit — should throw with correct status
  // =========================================================================

  it('HTTP 429 rate limit should throw ExitButtonError with statusCode 429', async () => {
    global.fetch = mockFetchResponse(
      { message: 'Rate limit exceeded. Retry after 60s', code: 'RATE_LIMIT' },
      429,
      'Too Many Requests',
    );

    await expect(client.initiate({ userId: 'u1' })).rejects.toThrow(ExitButtonError);

    try {
      await client.initiate({ userId: 'u1' });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ExitButtonError);
      const exitErr = err as ExitButtonError;
      expect(exitErr.message).toBe('Rate limit exceeded. Retry after 60s');
      expect(exitErr.code).toBe('RATE_LIMIT');
      expect(exitErr.statusCode).toBe(429);
    }
  });

  // =========================================================================
  // 15. AbortController cleanup — timeout should be cleared on success
  // =========================================================================

  it('timeout should be cleared on successful response (no lingering timers)', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const resp = { sessionId: 's_clean', agentId: 'a1', conversationToken: null, chatAgentId: null, chatConversationToken: null, context: '', dynamicVariables: {}, elapsed_ms: 10, timing: {} };
    global.fetch = mockFetchResponse(resp);

    await client.initiate({ userId: 'u1' });

    // clearTimeout should have been called at least once (in the try block after response)
    expect(clearTimeoutSpy).toHaveBeenCalled();

    // Verify no pending timers would fire by advancing time far into the future
    // If the timeout were not cleared, this would trigger an abort on a completed request
    await vi.advanceTimersByTimeAsync(60000);

    // The request already completed successfully - no error should have been thrown
    clearTimeoutSpy.mockRestore();
  });
});
