import type { TenantConfig } from '../middleware/auth';
import type { PostHogCredentials } from './posthog-session-analysis';

export function getPosthogCreds(tenantConfig: TenantConfig): { creds: PostHogCredentials; hasPosthog: boolean } {
  const creds: PostHogCredentials = {
    apiKey: tenantConfig.posthogApiKey || '',
    projectId: tenantConfig.posthogProjectId || '',
    host: tenantConfig.posthogHost,
  };
  const hasPosthog = !!(creds.apiKey && creds.projectId);
  return { creds, hasPosthog };
}
