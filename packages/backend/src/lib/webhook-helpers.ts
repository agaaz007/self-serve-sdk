import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from './logger';

/**
 * Verify ElevenLabs webhook HMAC signature.
 * Returns null if valid, or an error message string if invalid.
 * If no secret is configured, skips verification (returns null).
 */
export function verifyWebhookSignature(
  signatureHeader: string | undefined,
  rawBody: string,
  secret: string | undefined
): string | null {
  if (!secret) return null; // no secret configured, skip

  if (!signatureHeader) return 'Missing signature';

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => p.split('=') as [string, string])
  );
  const timestamp = parts['t'];
  const receivedSig = parts['v0'] || parts['v1'];

  if (!timestamp || !receivedSig) return 'Malformed signature';

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSig = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  const sigBuffer = Buffer.from(receivedSig, 'hex');
  const expectedBuffer = Buffer.from(expectedSig, 'hex');
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    logger.warn({ receivedSig, expectedSig }, 'Webhook HMAC signature mismatch');
    return 'Invalid signature';
  }

  return null;
}

/**
 * Resolve the session ID from an ElevenLabs webhook payload.
 * Tries 3 strategies: dynamic_variables.session_id, conversation_id lookup, agent_id fallback.
 */
export async function resolveSessionId(
  db: any,
  sessions: any,
  payload: any
): Promise<string | null> {
  const data = payload.data || payload;
  const conversationId = data.conversation_id;

  // Strategy 1: session_id from dynamic variables
  const dynamicVars = data.conversation_initiation_client_data?.dynamic_variables || {};
  let sessionId = dynamicVars.session_id as string | undefined;
  if (sessionId) {
    logger.info({ sessionId, conversationId }, 'Session ID from dynamic variables');
    return sessionId;
  }

  if (!db) return null;

  // Strategy 2: Look up by elevenlabs_conversation_id
  if (conversationId) {
    try {
      const { eq } = await import('drizzle-orm');
      const result = await db.select({ id: sessions.id })
        .from(sessions)
        .where(eq(sessions.elevenLabsConversationId, conversationId))
        .limit(1);

      if (result.length > 0) {
        logger.info({ sessionId: result[0].id, conversationId }, 'Resolved session via conversation_id lookup');
        return result[0].id;
      }
    } catch (e) {
      logger.warn({ err: e, conversationId }, 'conversation_id lookup failed');
    }
  }

  // Strategy 3: Most recent initiated session matching agent_id
  try {
    const { eq, desc, and } = await import('drizzle-orm');
    const agentId = data.agent_id;
    const conditions = agentId
      ? and(eq(sessions.status, 'initiated'), eq(sessions.agentId, agentId))
      : eq(sessions.status, 'initiated');

    const result = await db.select({ id: sessions.id })
      .from(sessions)
      .where(conditions)
      .orderBy(desc(sessions.createdAt))
      .limit(1);

    if (result.length > 0) {
      logger.info({ sessionId: result[0].id, conversationId, agentId }, 'Resolved session via agent_id fallback');
      return result[0].id;
    }
  } catch (e) {
    logger.warn({ err: e, conversationId }, 'agent_id fallback lookup failed');
  }

  logger.warn({ conversationId }, 'No session found for webhook');
  return null;
}

/**
 * Analyze a conversation transcript using Groq LLM to determine retained/churned.
 */
export async function analyzeTranscript(
  transcriptText: string,
  groqApiKey: string
): Promise<{ outcome: 'retained' | 'churned'; confidence: number; reason: string }> {
  const defaultResult = { outcome: 'churned' as const, confidence: 0, reason: 'Analysis failed or unavailable' };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are analyzing a customer retention conversation transcript. The customer initiated a subscription cancellation and spoke with an AI retention agent.

Determine the outcome of the conversation:
- "retained" = customer agreed to stay, accepted an offer, changed their mind, or expressed willingness to continue
- "churned" = customer confirmed they want to cancel, declined all offers, or remained firm on leaving

Respond with ONLY valid JSON:
{
  "outcome": "retained" or "churned",
  "confidence": 0.0 to 1.0,
  "reason": "brief explanation of why you determined this outcome"
}`,
          },
          {
            role: 'user',
            content: `Analyze this exit interview transcript and determine the outcome:\n\n${transcriptText}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_completion_tokens: 256,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.warn({ status: response.status, body: errBody }, 'Groq API error');
      return defaultResult;
    }

    const data = (await response.json()) as any;
    const rawJson = data.choices?.[0]?.message?.content;
    if (!rawJson) return defaultResult;

    const analysis = JSON.parse(rawJson);
    return {
      outcome: analysis.outcome === 'retained' ? 'retained' : 'churned',
      confidence: analysis.confidence || 0,
      reason: analysis.reason || '',
    };
  } catch (e) {
    logger.warn({ err: e }, 'Groq analysis failed');
    return defaultResult;
  }
}
