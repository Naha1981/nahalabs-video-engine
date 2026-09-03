// NahaLabs Growth OS — Multi-tenant in-memory store with database-layer isolation.
//
// §45: every business is a separate tenant. Isolation is enforced HERE (the
// "data layer") rather than relying on callers to remember a WHERE clause.
// Every read/write helper takes a tenantId and refuses cross-tenant access.
//
// The repository currently runs with zero environment variables (see README /
// next.config), so persistence is module-level in-memory storage, mirroring the
// existing src/lib/store/video-store.ts convention. The accessor API is shaped
// to be drop-in replaceable by a Postgres/Prisma adapter behind the same
// signatures (see docs/GROWTH_OS_INTEGRATION_AUDIT.md §migration).

import type {
  Organization,
  User,
  AuditLogEntry,
  BusinessProfile,
  Signal,
  ResearchRun,
  Opportunity,
  Campaign,
  ContentStrategy,
  DecisionLogEntry,
  PublishingConnection,
  PublicationJob,
  PerformanceMetrics,
  BusinessSignal,
  Learning,
  UsageEvent,
} from './types';

interface TenantRecord {
  organization: Organization;
  users: User[];
  audit: AuditLogEntry[];
  business?: BusinessProfile;
  signals: Signal[];
  researchRuns: ResearchRun[];
  opportunities: Opportunity[];
  campaigns: Campaign[];
  strategies: ContentStrategy[];
  decisions: DecisionLogEntry[];
  connections: PublishingConnection[];
  publications: PublicationJob[];
  metrics: PerformanceMetrics[];
  businessSignals: BusinessSignal[];
  learnings: Learning[];
  usage: UsageEvent[];
}

const tenants = new Map<string, TenantRecord>();

// ─── Id helper (deterministic-ish, no external deps) ────────────────────────
let counter = 0;
export function genId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

// ─── Tenant lifecycle ───────────────────────────────────────────────────────
export function createTenant(input: { name: string; slug?: string; planTierId?: Organization['planTierId']; country?: string }): Organization {
  const id = genId('org');
  const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || id;
  if (tenants.has(slug)) {
    // Slug collision — return existing? No: fail closed rather than merge tenants.
    throw new Error(`TENANT_SLUG_EXISTS:${slug}`);
  }
  const org: Organization = {
    id,
    name: input.name,
    slug,
    planTierId: input.planTierId || 'starter',
    country: input.country,
    dataResidence: 'ZA',
    createdAt: new Date().toISOString(),
  };
  tenants.set(slug, {
    organization: org,
    users: [],
    audit: [],
    signals: [],
    researchRuns: [],
    opportunities: [],
    campaigns: [],
    strategies: [],
    decisions: [],
    connections: [],
    publications: [],
    metrics: [],
    businessSignals: [],
    learnings: [],
    usage: [],
  });
  writeAudit(id, { actorId: 'system', action: 'tenant.created', resource: 'organization', resourceId: id });
  return org;
}

/** Resolve a tenant by slug OR organization id. Throws if unknown (fail-closed). */
function requireTenant(tenantKey: string): TenantRecord {
  const bySlug = tenants.get(tenantKey);
  if (bySlug) return bySlug;
  for (const rec of tenants.values()) {
    if (rec.organization.id === tenantKey) return rec;
  }
  throw new Error(`TENANT_NOT_FOUND:${tenantKey}`);
}

export function getTenant(tenantKey: string): Organization {
  return requireTenant(tenantKey).organization;
}

export function listTenants(): Organization[] {
  return Array.from(tenants.values()).map((r) => r.organization);
}

export function tenantExists(tenantKey: string): boolean {
  try {
    requireTenant(tenantKey);
    return true;
  } catch {
    return false;
  }
}

// ─── Users & roles ──────────────────────────────────────────────────────────
export function addUser(tenantKey: string, user: Omit<User, 'id' | 'tenantId' | 'createdAt'> & { id?: string }): User {
  const rec = requireTenant(tenantKey);
  const u: User = {
    id: user.id || genId('usr'),
    tenantId: rec.organization.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: new Date().toISOString(),
  };
  rec.users.push(u);
  writeAudit(rec.organization.id, { actorId: u.id, action: 'user.invited', resource: 'user', resourceId: u.id, metadata: { role: u.role } });
  return u;
}

export function listUsers(tenantKey: string): User[] {
  return requireTenant(tenantKey).users;
}

// ─── Audit log (§46) ────────────────────────────────────────────────────────
export function writeAudit(tenantId: string, entry: Omit<AuditLogEntry, 'id' | 'tenantId' | 'timestamp'>): AuditLogEntry {
  // audit must never throw into the caller's flow; but tenant must exist
  const rec = requireTenant(tenantId);
  const log: AuditLogEntry = {
    id: genId('aud'),
    tenantId: rec.organization.id,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  rec.audit.push(log);
  return log;
}

export function listAudit(tenantKey: string): AuditLogEntry[] {
  return requireTenant(tenantKey).audit;
}

// ─── Generic scoped collection accessor (the isolation boundary) ────────────
type CollectionKey =
  | 'signals'
  | 'researchRuns'
  | 'opportunities'
  | 'campaigns'
  | 'strategies'
  | 'decisions'
  | 'connections'
  | 'publications'
  | 'metrics'
  | 'businessSignals'
  | 'learnings'
  | 'usage';

function collection<K extends CollectionKey>(tenantKey: string, key: K): TenantRecord[K] {
  return requireTenant(tenantKey)[key];
}

// ─── Business profile ───────────────────────────────────────────────────────
export function setBusinessProfile(tenantKey: string, profile: BusinessProfile): BusinessProfile {
  const rec = requireTenant(tenantKey);
  const stored: BusinessProfile = { ...profile, tenantId: rec.organization.id };
  rec.business = stored;
  writeAudit(rec.organization.id, { actorId: 'system', action: 'business.updated', resource: 'business', resourceId: stored.id });
  return stored;
}

export function getBusinessProfile(tenantKey: string): BusinessProfile | undefined {
  return requireTenant(tenantKey).business;
}

// ─── Scoped CRUD helpers ────────────────────────────────────────────────────
export function insert<T extends { id: string }>(tenantKey: string, key: CollectionKey, item: T): T {
  const col = collection(tenantKey, key) as unknown as T[];
  col.push(item);
  return item;
}

export function update<T extends { id: string }>(tenantKey: string, key: CollectionKey, id: string, patch: Partial<T>): T {
  const col = collection(tenantKey, key) as unknown as T[];
  const idx = col.findIndex((x) => x.id === id);
  if (idx < 0) throw new Error(`${key.toUpperCase()}_NOT_FOUND:${id}`);
  col[idx] = { ...col[idx], ...patch, id: col[idx].id };
  return col[idx];
}

export function findById<T extends { id: string }>(tenantKey: string, key: CollectionKey, id: string): T | undefined {
  return (collection(tenantKey, key) as unknown as { id: string }[]).find((x) => x.id === id) as T | undefined;
}

export function listAll<T>(tenantKey: string, key: CollectionKey): T[] {
  return collection(tenantKey, key) as unknown as T[];
}

// ─── Test / seed support ────────────────────────────────────────────────────
export function _resetAllTenants(): void {
  tenants.clear();
  counter = 0;
}

// ─── Seed a demo tenant so the dashboard renders real (non-fake) data ───────
export function ensureSeedTenant(): Organization {
  const slug = 'flavourly-demo';
  if (tenants.has(slug)) return tenants.get(slug)!.organization;
  const org = createTenant({ name: 'Flavourly Sandton Kitchen', slug, planTierId: 'growth', country: 'ZA' });
  addUser(org.id, { email: 'owner@flavourly.example', name: 'Restaurant Owner', role: 'owner' });
  return org;
}
