// NahaLabs Growth OS — Demo seed (§51 restaurant pilot, §52 daily flow, §53 performance trigger)
//
// Seeds ONE real demo tenant (a Sandton restaurant) with a genuine end-to-end
// story the dashboard can render: business understanding → a Tuesday booking
// dip signal → research → scored opportunities. Nothing here is fake success:
// providers still report their real availability.

import { ensureSeedTenant, setBusinessProfile, getTenant } from './tenant-store';
import { understandBusiness } from './business-understanding';
import { ingestBusinessMetric } from './signal-engine';
import { runResearch } from './research-engine';
import { evaluateOpportunities } from './opportunity-engine';
import { listConnections, initiateConnection } from './publishing';
import { getBusinessProfile } from './tenant-store';

let seeded = false;

export function seedGrowthDemo(): { tenantId: string } {
  if (seeded) return { tenantId: ensureSeedTenant().id };
  const org = ensureSeedTenant();
  const tenantId = org.id;

  const brief =
    "I'm a restaurant in Sandton, Johannesburg. We have a new gourmet burger and summer menu and I want Instagram Reels that drive table bookings.";
  const { profile } = understandBusiness({ tenantId, description: brief, name: 'Flavourly Sandton Kitchen' });
  setBusinessProfile(tenantId, profile);

  // §53 — Tuesday covers 35% below baseline → booking-pattern signal.
  ingestBusinessMetric(tenantId, { kind: 'covers', value: 65, baseline: 100, period: 'Tuesday dinner' });

  // Daily research + opportunities (§52).
  const research = runResearch({ tenantKey: tenantId, profile, trigger: 'scheduled_daily' });
  evaluateOpportunities({ tenantKey: tenantId, profile, research, usableFootageCount: 14 });

  // Connected channel intent (starts NOT authorized unless OAuth configured — honest).
  if (listConnections(tenantId).length === 0) {
    initiateConnection(tenantId, 'instagram');
  }

  seeded = true;
  return { tenantId };
}

export function getDemoTenantId(): string {
  return seedGrowthDemo().tenantId;
}

export function demoBusinessName(): string {
  const id = seedGrowthDemo().tenantId;
  return getBusinessProfile(id)?.name || getTenant(id).name;
}
