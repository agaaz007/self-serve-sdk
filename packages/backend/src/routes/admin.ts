import { Router, Request, Response } from 'express';
import { randomBytes, createHash } from 'crypto';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { tenantCacheInvalidate } from '../lib/tenant-cache';

const router: Router = Router();

// ─── Validation schemas ────────────────────────────────────────────────────

const CreateTenantSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  tier: z.enum(['free', 'starter', 'growth', 'enterprise']).default('free'),
  posthogApiKey: z.string().optional(),
  posthogProjectId: z.string().optional(),
  posthogHost: z.string().url().optional(),
  elevenLabsApiKey: z.string().optional(),
  interventionAgentId: z.string().optional(),
  chatAgentId: z.string().optional(),
});

const UpdateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  tier: z.enum(['free', 'starter', 'growth', 'enterprise']).optional(),
  sessionLimit: z.number().int().min(0).optional(),
  posthogApiKey: z.string().optional(),
  posthogProjectId: z.string().optional(),
  posthogHost: z.string().url().optional(),
  elevenLabsApiKey: z.string().optional(),
  interventionAgentId: z.string().optional(),
  chatAgentId: z.string().optional(),
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateApiKey(): { fullKey: string; prefix: string; hash: string } {
  const random = randomBytes(24).toString('hex');
  const fullKey = `eb_live_${random}`;
  const prefix = fullKey.substring(0, 12);
  const hash = createHash('sha256').update(fullKey).digest('hex');
  return { fullKey, prefix, hash };
}

function getSessionLimit(tier: string): number {
  switch (tier) {
    case 'free': return 25;
    case 'starter': return 200;
    case 'growth': return 1000;
    case 'enterprise': return 0; // unlimited
    default: return 25;
  }
}

// ─── Routes ────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/tenants — Create a new tenant with their first API key
 */
router.post('/tenants', async (req: Request, res: Response) => {
  try {
    const parsed = CreateTenantSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      return res.status(400).json({ error: 'Validation failed', details });
    }

    const { db, tenants, apiKeys } = await import('../db');
    if (!db) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const data = parsed.data;
    const sessionLimit = getSessionLimit(data.tier);

    // Create tenant
    const [tenant] = await db.insert(tenants).values({
      name: data.name,
      apiKeyHash: '', // Legacy field, keeping for compat
      tier: data.tier,
      sessionLimit,
      posthogApiKey: data.posthogApiKey || null,
      posthogProjectId: data.posthogProjectId || null,
      posthogHost: data.posthogHost || null,
      elevenLabsApiKey: data.elevenLabsApiKey || null,
      interventionAgentId: data.interventionAgentId || null,
      chatAgentId: data.chatAgentId || null,
    }).returning();

    // Generate first API key
    const { fullKey, prefix, hash } = generateApiKey();
    await db.insert(apiKeys).values({
      tenantId: tenant.id,
      keyPrefix: prefix,
      keyHash: hash,
      name: 'Default',
    });

    logger.info({ tenantId: tenant.id, tier: data.tier }, 'Tenant created');

    res.status(201).json({
      tenantId: tenant.id,
      name: data.name,
      tier: data.tier,
      sessionLimit,
      apiKey: fullKey, // Only shown once!
      apiKeyPrefix: prefix,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create tenant');
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

/**
 * PATCH /api/admin/tenants/:tenantId — Update tenant config
 */
router.patch('/tenants/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const parsed = UpdateTenantSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      return res.status(400).json({ error: 'Validation failed', details });
    }

    const { db, tenants } = await import('../db');
    const { eq } = await import('drizzle-orm');
    if (!db) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const data = parsed.data;

    // Build update object with only provided fields
    const updates: Record<string, any> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.tier !== undefined) {
      updates.tier = data.tier;
      if (data.sessionLimit === undefined) {
        updates.sessionLimit = getSessionLimit(data.tier);
      }
    }
    if (data.sessionLimit !== undefined) updates.sessionLimit = data.sessionLimit;
    if (data.posthogApiKey !== undefined) updates.posthogApiKey = data.posthogApiKey;
    if (data.posthogProjectId !== undefined) updates.posthogProjectId = data.posthogProjectId;
    if (data.posthogHost !== undefined) updates.posthogHost = data.posthogHost;
    if (data.elevenLabsApiKey !== undefined) updates.elevenLabsApiKey = data.elevenLabsApiKey;
    if (data.interventionAgentId !== undefined) updates.interventionAgentId = data.interventionAgentId;
    if (data.chatAgentId !== undefined) updates.chatAgentId = data.chatAgentId;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const result = await db.update(tenants)
      .set(updates)
      .where(eq(tenants.id, tenantId))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Invalidate cache for all API keys belonging to this tenant
    // (We'd need to look up all key prefixes, but for simplicity, clear the specific prefix if known)
    // For now, the 60s TTL handles propagation
    logger.info({ tenantId }, 'Tenant updated');

    res.json({ success: true, tenant: result[0] });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update tenant');
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

/**
 * POST /api/admin/tenants/:tenantId/api-keys — Generate a new API key
 */
router.post('/tenants/:tenantId/api-keys', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { name } = req.body || {};

    const { db, tenants, apiKeys } = await import('../db');
    const { eq } = await import('drizzle-orm');
    if (!db) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    // Verify tenant exists
    const tenantResult = await db.select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenantResult.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const { fullKey, prefix, hash } = generateApiKey();
    await db.insert(apiKeys).values({
      tenantId,
      keyPrefix: prefix,
      keyHash: hash,
      name: name || null,
    });

    logger.info({ tenantId, keyPrefix: prefix }, 'API key generated');

    res.status(201).json({
      apiKey: fullKey, // Only shown once!
      apiKeyPrefix: prefix,
      name: name || null,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate API key');
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

/**
 * DELETE /api/admin/tenants/:tenantId/api-keys/:keyId — Revoke an API key
 */
router.delete('/tenants/:tenantId/api-keys/:keyId', async (req: Request, res: Response) => {
  try {
    const { tenantId, keyId } = req.params;

    const { db, apiKeys } = await import('../db');
    const { eq, and } = await import('drizzle-orm');
    if (!db) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const result = await db.update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.tenantId, tenantId)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Invalidate tenant cache for this key prefix
    tenantCacheInvalidate(result[0].keyPrefix);

    logger.info({ tenantId, keyId }, 'API key revoked');
    res.json({ success: true, keyId, revokedAt: result[0].revokedAt });
  } catch (error) {
    logger.error({ err: error }, 'Failed to revoke API key');
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

/**
 * GET /api/admin/tenants/:tenantId/usage — Get usage for current period
 */
router.get('/tenants/:tenantId/usage', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const period = req.query.period as string || getCurrentPeriod();

    const { db, usage, tenants } = await import('../db');
    const { eq, and } = await import('drizzle-orm');
    if (!db) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    // Get tenant info
    const tenantResult = await db.select({
      id: tenants.id,
      name: tenants.name,
      tier: tenants.tier,
      sessionLimit: tenants.sessionLimit,
    })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenantResult.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = tenantResult[0];

    // Get usage for the period
    const usageResult = await db.select()
      .from(usage)
      .where(and(eq(usage.tenantId, tenantId), eq(usage.period, period)))
      .limit(1);

    const usageData = usageResult[0] || { sessionCount: 0, voiceMinutes: 0 };

    res.json({
      tenantId,
      tenantName: tenant.name,
      tier: tenant.tier,
      period,
      sessionCount: usageData.sessionCount,
      voiceMinutes: usageData.voiceMinutes,
      sessionLimit: tenant.sessionLimit,
      remaining: tenant.sessionLimit > 0
        ? Math.max(0, tenant.sessionLimit - usageData.sessionCount)
        : null, // null = unlimited
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get usage');
    res.status(500).json({ error: 'Failed to get usage' });
  }
});

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default router;
