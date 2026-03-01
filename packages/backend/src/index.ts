/**
 * Exit Button Backend Service
 *
 * Fetches PostHog session replays and analyzes user behavior for exit interviews
 */

import { config } from './config';
import { logger } from './lib/logger';
import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { analyzeUserSessions } from './lib/posthog-session-analysis';
import { verifyWebhookSignature, resolveSessionId, analyzeTranscript } from './lib/webhook-helpers';
import { InitiateRequestSchema, CompleteRequestSchema, PrefetchRequestSchema } from './lib/validation';
import { authenticate } from './middleware/auth';
import { validate } from './middleware/validate';
import { globalRateLimit, initiateRateLimit, completeRateLimit, prefetchRateLimit } from './middleware/rate-limit';
import { checkQuota } from './middleware/check-quota';
import { adminAuth } from './middleware/admin-auth';
import adminRouter from './routes/admin';
import { prefetchKey, prefetchGet, prefetchSetPending } from './lib/prefetch-cache';
import { getPosthogCreds } from './lib/posthog-helpers';
import { db, sessions, pool } from './db';
import { eq, desc, and, sql } from 'drizzle-orm';
import { randomUUID, createHmac } from 'crypto';

const app: express.Express = express();

// Request logging
app.use(pinoHttp({ logger, autoLogging: { ignore: (req: any) => req.url === '/api/health' } }));

// Global rate limit
app.use(globalRateLimit);

// CORS
app.set('trust proxy', true);
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options('*', cors());
app.use(express.json({
  verify: (req: any, _res, buf) => {
    // Capture raw body for webhook signature verification before JSON parsing
    req.rawBody = buf.toString('utf-8');
  },
}));

/**
 * Get conversation token from ElevenLabs for WebRTC agent access
 */
async function getElevenLabsConversationToken(agentId: string, elevenLabsApiKey: string): Promise<string> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
    {
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get conversation token from ElevenLabs');
  }

  const data = (await response.json()) as any;
  return data.token;
}

// ============ Embed SDK ============

let cachedEmbedJs: string | null = null;

app.get('/embed.js', (_req, res) => {
  if (!cachedEmbedJs) {
    const paths = [
      resolve(__dirname, '../../embed/dist/index.global.js'),
      resolve(process.cwd(), 'packages/embed/dist/index.global.js'),
    ];
    for (const p of paths) {
      if (existsSync(p)) {
        cachedEmbedJs = readFileSync(p, 'utf-8');
        break;
      }
    }
  }

  if (cachedEmbedJs) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=60, stale-while-revalidate=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(cachedEmbedJs);
  } else {
    res.status(404).send('// embed.js not found — run pnpm build first');
  }
});

// ============ API Endpoints ============

/**
 * POST /api/exit-session/prefetch
 *
 * Kicks off PostHog session analysis ahead of time so /initiate is fast.
 * No DB session is created, no signed URL is fetched.
 */
app.post('/api/exit-session/prefetch', authenticate, prefetchRateLimit, validate(PrefetchRequestSchema), async (req, res) => {
  try {
    const { userId, planName, mrr, accountAge, sessionAnalysis } = req.body;

    // Client explicitly opted out of session analysis
    if (sessionAnalysis === false) {
      return res.json({ status: 'cached' });
    }

    const tenantId = req.tenant?.id || 'default';
    const key = prefetchKey(tenantId, userId);

    // Check if we already have a result or in-flight request
    const existing = prefetchGet(key);
    if (existing.hit) {
      if (existing.data) {
        return res.json({ status: 'cached' });
      }
      if (existing.pending) {
        return res.json({ status: 'in_progress' });
      }
    }

    // Build PostHog credentials from tenant config
    const { creds: posthogCreds, hasPosthog } = getPosthogCreds(req.tenant!.config);

    if (!hasPosthog) {
      return res.json({ status: 'cached' }); // nothing to prefetch
    }

    // Start analysis and cache the promise
    const promise = analyzeUserSessions(posthogCreds, userId, { planName, mrr, accountAge });
    prefetchSetPending(key, promise);

    logger.info({ tenantId, userId }, 'Prefetch started');
    res.json({ status: 'started' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start prefetch');
    res.status(500).json({ error: 'Failed to start prefetch' });
  }
});

/**
 * POST /api/exit-session/initiate
 *
 * Runs PostHog analysis + AI + signed URL all in parallel where possible.
 */
app.post('/api/exit-session/initiate', authenticate, initiateRateLimit, validate(InitiateRequestSchema), checkQuota, async (req, res) => {
  try {
    const { userId: rawUserId, planName, mrr, accountAge, sessionAnalysis } = req.body;
    const userId = rawUserId || `anon_${Date.now()}`;

    const sessionId = `exit_${randomUUID()}`;
    const startTime = Date.now();
    logger.info({ userId, sessionId }, 'Initiating exit session');

    // Get tenant-specific credentials
    const tenantConfig = req.tenant!.config;
    const agentId = tenantConfig.interventionAgentId;
    const chatAgentId = tenantConfig.chatAgentId;
    const elevenLabsApiKey = tenantConfig.elevenLabsApiKey;

    // Build PostHog credentials from tenant config
    const { creds: posthogCreds, hasPosthog: hasPosthogCreds } = getPosthogCreds(tenantConfig);
    // Skip session analysis if client explicitly opted out
    const hasPosthog = sessionAnalysis !== false && hasPosthogCreds;

    // Check prefetch cache before running PostHog analysis
    const tenantId = req.tenant?.id || 'default';
    const cacheKey = prefetchKey(tenantId, userId);
    const cached = prefetchGet(cacheKey);
    let prefetchCacheHit = false;

    // Run conversation token fetch AND session analysis IN PARALLEL
    const tToken = Date.now();
    let token_ms = 0;

    const [tokenResult, chatTokenResult, analysisResult] = await Promise.all([
      // Task 1a: Get conversation token for voice agent (WebRTC)
      (agentId && elevenLabsApiKey)
        ? getElevenLabsConversationToken(agentId, elevenLabsApiKey)
            .then(token => { token_ms = Date.now() - tToken; return token; })
            .catch(e => {
              token_ms = Date.now() - tToken;
              logger.warn({ err: e.message, agentId }, 'Could not get conversation token — private agents will fail to connect');
              return null;
            })
        : Promise.resolve(null).then(() => { token_ms = 0; return null; }),

      // Task 1b: Get conversation token for chat agent (if different from voice)
      (chatAgentId && elevenLabsApiKey && chatAgentId !== agentId)
        ? getElevenLabsConversationToken(chatAgentId, elevenLabsApiKey)
            .catch(e => {
              logger.warn({ err: e.message, chatAgentId }, 'Could not get chat conversation token');
              return null;
            })
        : Promise.resolve(null),

      // Task 2: Full session analysis — try prefetch cache first
      ((): Promise<any> => {
        // Cache hit with completed data
        if (cached.hit && cached.data) {
          prefetchCacheHit = true;
          logger.info({ userId }, 'Prefetch cache hit');
          return Promise.resolve(cached.data);
        }
        // In-flight prefetch — await the same promise
        if (cached.hit && cached.pending) {
          prefetchCacheHit = true;
          logger.info({ userId }, 'Awaiting in-flight prefetch');
          return cached.pending;
        }
        // Cache miss — run analysis normally
        if (!hasPosthog) {
          return Promise.resolve({ recordings: [] as any[], aiAnalysis: null, contextForAgent: '', timing: { personUuid_ms: 0, recordingsList_ms: 0, analyticsEvents_ms: 0, posthogParallel_ms: 0, elementExtraction_ms: 0, blobFetch_ms: 0, rrwebParse_ms: 0, enrichment_ms: 0, aiAnalysis_ms: 0, contextGen_ms: 0, total_ms: 0 } });
        }
        return analyzeUserSessions(posthogCreds, userId, { planName, mrr, accountAge });
      })(),
    ]);

    const { recordings, aiAnalysis, contextForAgent, timing } = analysisResult;
    const elapsed = Date.now() - startTime;

    logger.info({ token_ms, elapsed, recordingsCount: recordings.length }, 'Exit session analysis complete');
    if (aiAnalysis) {
      logger.info({ churnRisk: aiAnalysis.churn_risk, uxRating: aiAnalysis.ux_rating }, 'AI analysis result');
    }

    const fullContext = contextForAgent;

    // Build dynamic variables
    const frustrationPointsText = aiAnalysis?.frustration_points
      ?.map((fp: any) => `- [${fp.timestamp}] ${fp.issue}`)
      .join('\n') || 'No specific frustration points detected';

    const dropOffPointsText = aiAnalysis?.frustration_points
      ?.filter((fp: any) => fp.issue.toLowerCase().includes('abandon') || fp.issue.toLowerCase().includes('left') || fp.issue.toLowerCase().includes('exit'))
      .map((fp: any) => `- [${fp.timestamp}] ${fp.issue}`)
      .join('\n') || 'No drop-off points detected';

    const dynamicVariables = {
      session_id: sessionId,
      user_name: userId,
      company_name: planName || 'Unknown',
      plan_name: planName || 'Unknown',
      mrr: String(mrr || 0),
      account_age: accountAge || 'Unknown',
      session_insights: fullContext,
      summary: aiAnalysis?.summary || 'No session analysis available',
      user_intent: aiAnalysis?.user_intent || 'Unknown',
      churn_risk: aiAnalysis?.churn_risk || 'unknown',
      ux_rating: String(aiAnalysis?.ux_rating || 'N/A'),
      recommended_offer: aiAnalysis?.recommended_offer || 'Standard retention offer',
      frustration_points: frustrationPointsText,
      drop_off_points: dropOffPointsText,
      user_journey: aiAnalysis?.description || 'No journey data available',
      went_well: aiAnalysis?.went_well?.join(', ') || 'Unable to determine',
      tags: aiAnalysis?.tags?.join(', ') || 'No tags',
      opening_line: aiAnalysis?.opening_line || '',
      probing_questions: aiAnalysis?.probing_questions?.join(' | ') || '',
      value_hooks: aiAnalysis?.value_hooks?.join(' | ') || '',
      unasked_needs: aiAnalysis?.unasked_needs?.join(' | ') || '',
    };

    // Persist session to database if available
    if (db) {
      try {
        await db.insert(sessions).values({
          id: sessionId,
          tenantId: req.tenant?.id !== 'default' ? req.tenant?.id : null,
          userId,
          status: 'initiated',
          agentId: agentId || null,
          context: fullContext,
          dynamicVariables,
          aiAnalysis,
          timing: { ...timing, token_ms, total_ms: elapsed },
        });
      } catch (e) {
        logger.warn({ err: e }, 'Failed to persist session to DB (non-fatal)');
      }
    }

    // Increment usage counter
    if (db && req.tenant?.id && req.tenant.id !== 'default') {
      try {
        const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        await db.execute(
          sql`INSERT INTO usage (id, tenant_id, period, session_count, voice_minutes)
              VALUES (gen_random_uuid(), ${req.tenant.id}, ${period}, 1, 0)
              ON CONFLICT (tenant_id, period) DO UPDATE SET
                session_count = usage.session_count + 1,
                updated_at = NOW()`
        );
      } catch (e) {
        logger.warn({ err: e }, 'Failed to increment usage counter (non-fatal)');
      }
    }

    res.json({
      sessionId,
      agentId: agentId || null,
      conversationToken: tokenResult,
      chatAgentId: chatAgentId || null,
      chatConversationToken: chatTokenResult,
      context: fullContext,
      dynamicVariables,
      elapsed_ms: elapsed,
      timing: {
        ...timing,
        token_ms,
        prefetchCacheHit,
        total_ms: elapsed,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to initiate exit session');
    res.status(500).json({ error: 'Failed to initiate session' });
  }
});

/**
 * POST /api/exit-session/complete
 *
 * Records the outcome of an exit interview
 */
app.post('/api/exit-session/complete', authenticate, completeRateLimit, validate(CompleteRequestSchema), async (req, res) => {
  try {
    const { sessionId, userId, outcome, acceptedOffer, transcript } = req.body;

    logger.info({ sessionId, outcome }, 'Completing exit session');

    // Update session in database if available
    if (db) {
      try {
        await db.update(sessions)
          .set({
            status: outcome || 'completed',
            outcome,
            offers: acceptedOffer ? [acceptedOffer] : null,
            transcript,
            completedAt: new Date(),
          })
          .where(eq(sessions.id, sessionId));
      } catch (e) {
        logger.warn({ err: e }, 'Failed to update session in DB (non-fatal)');
      }
    }

    // Send event to PostHog using tenant's credentials
    const tenantConfig = req.tenant?.config;
    const phApiKey = tenantConfig?.posthogApiKey;
    const phHost = tenantConfig?.posthogHost || 'https://app.posthog.com';

    if (phApiKey) {
      try {
        await fetch(`${phHost}/capture/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: phApiKey,
            event: outcome === 'retained' ? 'user_retained' : 'user_churned',
            distinct_id: userId,
            properties: {
              session_id: sessionId,
              accepted_offer: acceptedOffer,
              transcript_length: transcript?.length || 0,
            },
          }),
        });
      } catch (e) {
        logger.warn({ err: e }, 'Failed to send event to PostHog (non-fatal)');
      }
    }

    res.json({
      success: true,
      sessionId,
      outcome,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to complete exit session');
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

/**
 * PATCH /api/exit-session/:sessionId/conversation
 *
 * Links an ElevenLabs conversation_id to a session.
 * Called by the embed SDK when the WebSocket connection provides the conversation_id.
 */
app.patch('/api/exit-session/:sessionId/conversation', authenticate, async (req, res) => {
  const { sessionId } = req.params;
  const { elevenLabsConversationId } = req.body;

  if (!elevenLabsConversationId) {
    return res.status(400).json({ error: 'elevenLabsConversationId is required' });
  }

  if (!db) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    await db.update(sessions)
      .set({ elevenLabsConversationId })
      .where(eq(sessions.id, sessionId));

    logger.info({ sessionId, elevenLabsConversationId }, 'Linked conversation_id to session');
    res.json({ success: true, sessionId, elevenLabsConversationId });
  } catch (e) {
    logger.error({ err: e, sessionId }, 'Failed to link conversation_id');
    res.status(500).json({ error: 'Failed to update session' });
  }
});

/**
 * POST /api/exit-session/webhook/elevenlabs
 *
 * ElevenLabs post-call webhook — receives conversation data after each call ends.
 * Authenticated via HMAC signature (ElevenLabs-Signature header).
 * Returns immediately, then analyzes transcript and updates session asynchronously.
 */
app.post('/api/exit-session/webhook/elevenlabs', async (req, res) => {
  // 1. Verify signature
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  const sigError = verifyWebhookSignature(
    req.headers['elevenlabs-signature'] as string | undefined,
    rawBody,
    config.elevenLabsWebhookSecret
  );
  if (sigError) {
    return res.status(401).json({ error: sigError });
  }

  // 2. Parse payload and format transcript
  const payload = req.body;
  const data = payload.data || payload;
  const transcript = data.transcript || [];
  const conversationId = data.conversation_id;

  logger.info({ conversationId, eventType: payload.type }, 'ElevenLabs post-call webhook received');

  const transcriptText = transcript
    .map((t: any) => `${t.role === 'agent' ? 'Agent' : 'Customer'}: ${t.message}`)
    .join('\n');

  // 3. Respond immediately (async processing below)
  res.json({ success: true, conversationId });

  // 4. Fire-and-forget: resolve session, analyze, update DB
  (async () => {
    try {
      const sessionId = await resolveSessionId(db, sessions, payload);

      const { outcome, confidence, reason } = await analyzeTranscript(transcriptText, config.groqApiKey);
      logger.info({ conversationId, outcome, confidence, reason }, 'Groq transcript analysis complete');

      if (db && sessionId) {
        const formattedTranscript = transcript.map((t: any) => ({
          role: t.role === 'agent' ? 'assistant' : 'user',
          content: t.message,
          timestamp: new Date().toISOString(),
        }));

        await db.update(sessions)
          .set({ status: outcome, outcome, transcript: formattedTranscript, completedAt: new Date() })
          .where(eq(sessions.id, sessionId));

        logger.info({ sessionId, outcome }, 'Session updated from webhook');
      }
    } catch (e) {
      logger.error({ err: e, conversationId }, 'Async webhook processing failed');
    }
  })();
});

/**
 * GET /api/exit-session/:sessionId
 *
 * Get session details from database
 */
app.get('/api/exit-session/:sessionId', authenticate, async (req, res) => {
  const sessionId = req.params.sessionId as string;

  if (!db) {
    return res.status(503).json({ error: 'Database not configured', sessionId });
  }

  try {
    const result = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (result.length === 0) {
      return res.status(404).json({ error: 'Session not found', sessionId });
    }
    res.json(result[0]);
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch session');
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

/**
 * GET /api/health
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'not configured',
  });
});

// ============ Admin API ============
app.use('/api/admin', adminAuth, adminRouter);

// ============ Global Error Handler ============

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled route error');
  res.status(500).json({ error: 'Internal server error' });
});

// ============ Graceful Shutdown ============

let server: ReturnType<typeof app.listen>;

function shutdown(signal: string) {
  logger.info({ signal }, 'Received shutdown signal, closing server...');
  server?.close(async () => {
    if (pool) {
      await pool.end();
      logger.info('Database pool closed');
    }
    logger.info('Server closed');
    process.exit(0);
  });
  // Force exit after 10 seconds
  setTimeout(() => {
    logger.warn('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

// ============ Start Server ============

// Only listen when running directly (not on Vercel serverless)
if (!process.env.VERCEL) {
  server = app.listen(config.port, () => {
    logger.info({
      port: config.port,
      env: config.nodeEnv,
      database: db ? 'connected' : 'not configured',
    }, 'Exit Button Backend started');
  });
}

export default app;
