import { Router, Request, Response } from 'express';
import { randomBytes, createHash } from 'crypto';
import { z } from 'zod';
import { logger } from '../lib/logger';

const router: Router = Router();

const SignupSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(7, 'Phone number is required').max(20),
  posthogApiKey: z.string().min(1, 'PostHog API key is required'),
});

function generateApiKey(): { fullKey: string; prefix: string; hash: string } {
  const random = randomBytes(24).toString('hex');
  const fullKey = `eb_live_${random}`;
  const prefix = fullKey.substring(0, 12);
  const hash = createHash('sha256').update(fullKey).digest('hex');
  return { fullKey, prefix, hash };
}

/**
 * POST /api/signup — Public self-serve tenant creation
 * No admin auth required. Rate limited to 5/hour per IP.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = SignupSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      res.status(400).json({ error: 'Validation failed', details });
      return;
    }

    const { db, tenants, apiKeys } = await import('../db');
    if (!db) {
      res.status(503).json({ error: 'Service temporarily unavailable' });
      return;
    }

    const { companyName, email, phone, posthogApiKey } = parsed.data;

    // Create tenant (always free tier)
    const [tenant] = await db.insert(tenants).values({
      name: companyName,
      email,
      phone,
      apiKeyHash: '', // Legacy field
      tier: 'free',
      sessionLimit: 25,
      posthogApiKey,
    }).returning();

    // Generate first API key
    const { fullKey, prefix, hash } = generateApiKey();
    await db.insert(apiKeys).values({
      tenantId: tenant.id,
      keyPrefix: prefix,
      keyHash: hash,
      name: 'Default',
    });

    logger.info({ tenantId: tenant.id, email }, 'Self-serve signup completed');

    res.status(201).json({
      tenantId: tenant.id,
      name: companyName,
      tier: 'free',
      sessionLimit: 25,
      apiKey: fullKey,
      apiKeyPrefix: prefix,
    });
  } catch (error) {
    logger.error({ err: error }, 'Signup failed');
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

export default router;
