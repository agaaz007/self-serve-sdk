/**
 * In-memory TTL cache for tenant configuration lookups.
 *
 * Avoids hitting the database on every authenticated request by caching
 * tenant config keyed by API key prefix. Modelled after prefetch-cache.ts.
 */

import { logger } from './logger';

interface CachedTenant {
  id: string;
  config: any; // TenantConfig shape
  tier: string;
  sessionLimit: number;
  cachedAt: number;
}

const TTL_MS = 60 * 1000; // 60 seconds
const MAX_ENTRIES = 200;
const EVICTION_INTERVAL_MS = 30 * 1000;

const cache = new Map<string, CachedTenant>();

const evictionTimer = setInterval(() => {
  const now = Date.now();
  for (const [k, v] of cache) {
    if (now - v.cachedAt > TTL_MS) cache.delete(k);
  }
}, EVICTION_INTERVAL_MS);

if (typeof evictionTimer === 'object' && 'unref' in evictionTimer) {
  evictionTimer.unref();
}

export function tenantCacheGet(keyPrefix: string): CachedTenant | null {
  const entry = cache.get(keyPrefix);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > TTL_MS) {
    cache.delete(keyPrefix);
    return null;
  }
  return entry;
}

export function tenantCacheSet(keyPrefix: string, tenant: Omit<CachedTenant, 'cachedAt'>): void {
  if (cache.size >= MAX_ENTRIES && !cache.has(keyPrefix)) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [k, v] of cache) {
      if (v.cachedAt < oldestTime) {
        oldestTime = v.cachedAt;
        oldestKey = k;
      }
    }
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(keyPrefix, { ...tenant, cachedAt: Date.now() });
}

export function tenantCacheInvalidate(keyPrefix: string): void {
  cache.delete(keyPrefix);
}

export function tenantCacheClear(): void {
  cache.clear();
}
