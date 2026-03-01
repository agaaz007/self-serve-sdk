/**
 * Authentication middleware for Exit Button API
 *
 * Validates API key format (eb_live_ or eb_test_ prefix, min 20 chars).
 * Loads per-tenant configuration (PostHog, ElevenLabs) from DB when available.
 * Falls back to global env var defaults if no DB or tenant not found.
 */

import { config } from '../config';
import { logger } from '../lib/logger';
import { tenantCacheGet, tenantCacheSet } from '../lib/tenant-cache';
import { createHash } from 'crypto';

export interface TenantConfig {
  posthogApiKey?: string;
  posthogProjectId?: string;
  posthogHost: string;
  elevenLabsApiKey?: string;
  interventionAgentId?: string;
  chatAgentId?: string;
  tier: string;
  sessionLimit: number;
}

export interface Tenant {
  id: string;
  apiKeyPrefix: string;
  config: TenantConfig;
  tier: string;
  sessionLimit: number;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}

const VALID_PREFIXES = ['eb_live_', 'eb_test_'] as const;
const MIN_KEY_LENGTH = 20;

function isValidKeyFormat(key: string): boolean {
  if (key.length < MIN_KEY_LENGTH) return false;
  return VALID_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function getDefaultConfig(): TenantConfig {
  return {
    posthogApiKey: config.posthogApiKey,
    posthogProjectId: config.posthogProjectId,
    posthogHost: config.posthogHost,
    elevenLabsApiKey: config.elevenLabsApiKey,
    interventionAgentId: config.elevenLabsAgentId,
    chatAgentId: config.elevenLabsChatAgentId,
    tier: 'free',
    sessionLimit: 25,
  };
}

/**
 * Load tenant config from DB by API key prefix.
 * Checks tenant cache first, then DB. Verifies key hash on DB lookup.
 * Returns null if DB is unavailable or tenant not found.
 */
async function loadTenantFromDb(keyPrefix: string, fullKey: string): Promise<{ id: string; config: TenantConfig; tier: string; sessionLimit: number } | null> {
  // Check tenant cache first
  const cached = tenantCacheGet(keyPrefix);
  if (cached) {
    return {
      id: cached.id,
      config: cached.config,
      tier: cached.tier,
      sessionLimit: cached.sessionLimit,
    };
  }

  try {
    // Dynamic import to avoid circular dependency and handle missing DB gracefully
    const { db, apiKeys, tenants } = await import('../db');
    const { eq } = await import('drizzle-orm');

    if (!db) return null;

    const result = await db
      .select({
        tenantId: tenants.id,
        keyHash: apiKeys.keyHash,
        posthogApiKey: tenants.posthogApiKey,
        posthogProjectId: tenants.posthogProjectId,
        posthogHost: tenants.posthogHost,
        elevenLabsApiKey: tenants.elevenLabsApiKey,
        interventionAgentId: tenants.interventionAgentId,
        chatAgentId: tenants.chatAgentId,
        tier: tenants.tier,
        sessionLimit: tenants.sessionLimit,
      })
      .from(apiKeys)
      .innerJoin(tenants, eq(apiKeys.tenantId, tenants.id))
      .where(eq(apiKeys.keyPrefix, keyPrefix))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0]!;

    // Verify key hash
    const computedHash = createHash('sha256').update(fullKey).digest('hex');
    if (computedHash !== row.keyHash) {
      logger.warn({ keyPrefix }, 'API key hash mismatch');
      return null;
    }

    // Use optional chaining and defaults for backward compatibility
    const tier = (row as any).tier || 'free';
    const sessionLimit = (row as any).sessionLimit ?? 25;

    const tenantConfig: TenantConfig = {
      posthogApiKey: row.posthogApiKey || undefined,
      posthogProjectId: row.posthogProjectId || undefined,
      posthogHost: row.posthogHost || 'https://app.posthog.com',
      elevenLabsApiKey: row.elevenLabsApiKey || undefined,
      interventionAgentId: row.interventionAgentId || undefined,
      chatAgentId: row.chatAgentId || undefined,
      tier,
      sessionLimit,
    };

    // Populate cache
    tenantCacheSet(keyPrefix, {
      id: row.tenantId,
      config: tenantConfig,
      tier,
      sessionLimit,
    });

    return {
      id: row.tenantId,
      config: tenantConfig,
      tier,
      sessionLimit,
    };
  } catch (err) {
    logger.warn({ err }, 'Failed to load tenant from DB');
    return null;
  }
}

export function authenticate(req: any, res: any, next: any): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid API key' });
    return;
  }

  const key = authHeader.slice('Bearer '.length).trim();

  if (!isValidKeyFormat(key)) {
    res.status(401).json({ error: 'Missing or invalid API key' });
    return;
  }

  const keyPrefix = key.substring(0, 12);

  // Try to load tenant config from DB, fall back to global defaults
  loadTenantFromDb(keyPrefix, key)
    .then((tenant) => {
      if (tenant) {
        // Merge: tenant-specific values override, fall back to global for any missing
        const defaults = getDefaultConfig();
        req.tenant = {
          id: tenant.id,
          apiKeyPrefix: keyPrefix,
          tier: tenant.tier,
          sessionLimit: tenant.sessionLimit,
          config: {
            posthogApiKey: tenant.config.posthogApiKey || defaults.posthogApiKey,
            posthogProjectId: tenant.config.posthogProjectId || defaults.posthogProjectId,
            posthogHost: tenant.config.posthogHost || defaults.posthogHost,
            elevenLabsApiKey: tenant.config.elevenLabsApiKey || defaults.elevenLabsApiKey,
            interventionAgentId: tenant.config.interventionAgentId || defaults.interventionAgentId,
            chatAgentId: tenant.config.chatAgentId || defaults.chatAgentId,
            tier: tenant.tier,
            sessionLimit: tenant.sessionLimit,
          },
        };
      } else {
        req.tenant = {
          id: 'default',
          apiKeyPrefix: keyPrefix,
          tier: 'free',
          sessionLimit: 25,
          config: { ...getDefaultConfig(), tier: 'free', sessionLimit: 25 },
        };
      }
      next();
    })
    .catch((err: any) => {
      logger.warn({ err }, 'Tenant config lookup failed, using defaults');
      req.tenant = {
        id: 'default',
        apiKeyPrefix: keyPrefix,
        tier: 'free',
        sessionLimit: 25,
        config: { ...getDefaultConfig(), tier: 'free', sessionLimit: 25 },
      };
      next();
    });
}
