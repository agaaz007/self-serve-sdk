import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Authentication middleware for admin API endpoints.
 * Requires the ADMIN_API_KEY environment variable to be set.
 */
export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  if (!config.adminApiKey) {
    res.status(503).json({ error: 'Admin API not configured' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid admin API key' });
    return;
  }

  const key = authHeader.slice('Bearer '.length).trim();
  if (key !== config.adminApiKey) {
    res.status(401).json({ error: 'Invalid admin API key' });
    return;
  }

  next();
}
