import { NextRequest, NextResponse } from 'next/server';
import { createTenant, listTenants, addUser } from '@/lib/growth/tenant-store';
import { seedGrowthDemo } from '@/lib/growth/seed';

export async function GET() {
  // Ensure the demo restaurant tenant exists with a real end-to-end story
  // (booking dip signal → research → opportunities) so a fresh environment
  // renders working, honest data rather than an empty screen.
  seedGrowthDemo();
  return NextResponse.json({ success: true, organizations: listTenants() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ success: false, error: 'VALIDATION_ERROR', message: 'Organization name is required' }, { status: 400 });
    }
    const org = createTenant({
      name: body.name,
      slug: body.slug,
      planTierId: body.planTierId || 'starter',
      country: body.country || 'ZA',
    });
    // Create the owner user as part of onboarding (§1: org + users + roles).
    if (body.ownerEmail) {
      addUser(org.id, { email: body.ownerEmail, name: body.ownerName || body.name, role: 'owner' });
    }
    return NextResponse.json({ success: true, organization: org }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith('TENANT_SLUG_EXISTS') ? 409 : 500;
    return NextResponse.json({ success: false, error: 'TENANT_ERROR', message }, { status });
  }
}
