import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

/**
 * Middleware that checks if the tenant has exceeded their session quota.
 * Must run after authenticate middleware (needs req.tenant).
 */
export function checkQuota(req: Request, res: Response, next: NextFunction): void {
  const tenant = (req as any).tenant;
  if (!tenant || tenant.id === 'default') {
    // No tenant or default tenant — skip quota check
    next();
    return;
  }

  const { sessionLimit, tier } = tenant;

  // No limit for paid tiers (or if limit is 0 meaning unlimited)
  if (tier !== 'free' || !sessionLimit) {
    next();
    return;
  }

  // Check usage from DB
  checkUsageFromDb(tenant.id, sessionLimit)
    .then((allowed) => {
      if (allowed) {
        next();
      } else {
        res.status(429).json({
          error: 'Quota exceeded',
          code: 'QUOTA_EXCEEDED',
          limit: sessionLimit,
          tier,
          upgradeUrl: 'https://tranzmitai.com/pricing',
        });
      }
    })
    .catch((err) => {
      logger.warn({ err, tenantId: tenant.id }, 'Quota check failed, allowing request');
      next(); // fail-open
    });
}

async function checkUsageFromDb(tenantId: string, limit: number): Promise<boolean> {
  try {
    const { db, usage } = await import('../db');
    const { eq, and } = await import('drizzle-orm');

    if (!db) return true; // no DB, allow

    const period = getCurrentPeriod();
    const result = await db.select({ sessionCount: usage.sessionCount })
      .from(usage)
      .where(and(eq(usage.tenantId, tenantId), eq(usage.period, period)))
      .limit(1);

    const currentCount = result[0]?.sessionCount || 0;
    return currentCount < limit;
  } catch (err) {
    logger.warn({ err }, 'Failed to check usage');
    return true; // fail-open
  }
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
