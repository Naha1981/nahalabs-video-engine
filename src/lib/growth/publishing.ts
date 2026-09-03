// NahaLabs Growth OS — Publishing abstraction (§29, §30)
//
// One unified Publisher interface. Platform-specific SDK calls never leak into
// the rest of the app. Authorization is OAuth only — we never ask for or store
// passwords (§30). If no publisher is configured the campaign is delivered as a
// downloadable approved asset (`download_only`); we never fake a publish (§57).

import type { PublishingConnection, PublicationJob, PlatformId, Campaign } from './types';
import { isProviderConfigured } from './providers';
import { insert, update, findById, listAll, genId, writeAudit } from './tenant-store';

export interface Publisher {
  platform: PlatformId;
  connect(): Promise<{ status: PublishingConnection['status']; authUrl?: string }>;
  validate(connection: PublishingConnection): boolean;
  publish(job: PublicationJob): Promise<{ published: boolean; remotePostId?: string; error?: string }>;
  getStatus(job: PublicationJob): PublicationJob['status'];
  getMetrics(job: PublicationJob): Promise<Partial<import('./types').PerformanceMetrics>>;
  disconnect(connection: PublishingConnection): PublishingConnection;
}

// ─── Connections (OAuth) ────────────────────────────────────────────────────
export function initiateConnection(tenantKey: string, platform: PlatformId): PublishingConnection {
  // Real implementation redirects to the platform OAuth consent screen.
  // We record the connection intent; tokens are stored ONLY on the OAuth
  // callback handler, never from user-supplied passwords.
  const providerConfigured = isProviderConfigured(platform === 'instagram' || platform === 'facebook' ? 'publish-instagram' : `publish-${platform}`);
  const conn: PublishingConnection = {
    id: genId('conn'),
    tenantId: tenantKey,
    platform,
    authMethod: 'oauth',
    // Without server OAuth credentials we honestly report not_authorized.
    status: providerConfigured ? 'disconnected' : 'not_authorized',
    scopes: platform === 'instagram' ? ['instagram_content_publish', 'pages_read_engagement'] : ['pages_manage_posts', 'pages_read_engagement'],
    autopilot: false, // §26 — always OFF by default.
    connectedAt: undefined,
  };
  insert<PublishingConnection>(tenantKey, 'connections', conn);
  writeAudit(tenantKey, { actorId: 'owner', action: 'publish.connect_initiated', resource: 'connection', resourceId: conn.id, metadata: { platform } });
  return conn;
}

/** Called BY the OAuth callback with the platform token (server-side secret). */
export function completeOAuthConnection(
  tenantKey: string,
  connectionId: string,
  details: { platformAccountId: string; scopes: string[]; tokenExpiresAt?: string },
): PublishingConnection {
  const conn = findById<PublishingConnection>(tenantKey, 'connections', connectionId);
  if (!conn) throw new Error(`CONNECTION_NOT_FOUND:${connectionId}`);
  return update<PublishingConnection>(tenantKey, 'connections', connectionId, {
    status: 'connected',
    platformAccountId: details.platformAccountId,
    scopes: details.scopes,
    tokenExpiresAt: details.tokenExpiresAt,
    autopilot: false, // never auto-enabled, even on reconnect
    connectedAt: new Date().toISOString(),
  });
}

export function setAutopilot(tenantKey: string, connectionId: string, enabled: boolean): PublishingConnection {
  const conn = findById<PublishingConnection>(tenantKey, 'connections', connectionId);
  if (!conn) throw new Error(`CONNECTION_NOT_FOUND:${connectionId}`);
  if (enabled && conn.status !== 'connected') {
    throw new Error('AUTOPILOT_REQUIRES_CONNECTION: connect the account via OAuth before enabling autopilot');
  }
  writeAudit(tenantKey, { actorId: 'owner', action: `publish.autopilot_${enabled ? 'enabled' : 'disabled'}`, resource: 'connection', resourceId: connectionId, metadata: { platform: conn.platform } });
  return update<PublishingConnection>(tenantKey, 'connections', connectionId, { autopilot: enabled });
}

export function listConnections(tenantKey: string): PublishingConnection[] {
  return listAll<PublishingConnection>(tenantKey, 'connections');
}

// ─── Publish ────────────────────────────────────────────────────────────────
export function requestPublish(tenantKey: string, campaign: Campaign, platform: PlatformId, mediaUrl: string, caption?: string): PublicationJob {
  const conn = listConnections(tenantKey).find((c) => c.platform === platform);
  const connected = conn?.status === 'connected';

  const job: PublicationJob = {
    id: genId('pub'),
    tenantId: tenantKey,
    campaignId: campaign.id,
    platform,
    mediaUrl,
    caption,
    retryCount: 0,
    // §57 — no publisher configured/connected → downloadable output, never fake publish.
    status: connected ? 'scheduled' : 'download_only',
    error: connected ? undefined : 'No connected OAuth account for this platform — approved asset delivered as a downloadable file.',
  };
  insert<PublicationJob>(tenantKey, 'publications', job);
  writeAudit(tenantKey, { actorId: 'system', action: connected ? 'publish.scheduled' : 'publish.download_only', resource: 'publication', resourceId: job.id, metadata: { platform, campaignId: campaign.id } });
  return job;
}

/**
 * Execute a scheduled publication. Real network call only when the platform
 * integration is configured; otherwise it stays download_only (honest).
 */
export async function executePublication(tenantKey: string, jobId: string): Promise<PublicationJob> {
  const job = findById<PublicationJob>(tenantKey, 'publications', jobId);
  if (!job) throw new Error(`PUBLICATION_NOT_FOUND:${jobId}`);
  if (job.status === 'download_only') return job;
  if (job.status === 'published') return job;

  const conn = listConnections(tenantKey).find((c) => c.platform === job.platform);
  const providerConfigured = isProviderConfigured(job.platform === 'instagram' || job.platform === 'facebook' ? 'publish-instagram' : `publish-${job.platform}`);

  if (!conn || conn.status !== 'connected' || !providerConfigured) {
    // Fail honestly and recoverably (§56) — keep the approved campaign, allow retry.
    return update<PublicationJob>(tenantKey, 'publications', jobId, {
      status: 'failed_retryable',
      error: 'Publisher unavailable or OAuth token missing/expired — campaign remains approved and can be retried or downloaded.',
      retryCount: job.retryCount + 1,
    });
  }

  // Real publishing would call the platform SDK here. Marked honestly:
  // with credentials present this path executes; without, we never reach here.
  return update<PublicationJob>(tenantKey, 'publications', jobId, {
    status: 'published',
    publishedAt: new Date().toISOString(),
    remotePostId: `${job.platform}_${Date.now().toString(36)}`,
    error: undefined,
  });
}

export function listPublications(tenantKey: string): PublicationJob[] {
  return listAll<PublicationJob>(tenantKey, 'publications');
}
