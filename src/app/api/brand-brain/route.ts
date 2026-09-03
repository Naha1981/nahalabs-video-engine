import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_BRAND_BRAINS } from '@/lib/engine/brand-brain-store';
import { BrandBrain } from '@/lib/engine/types';

let brandBrainsStore = [...DEFAULT_BRAND_BRAINS];

export async function GET() {
  return NextResponse.json({
    success: true,
    count: brandBrainsStore.length,
    brandBrains: brandBrainsStore
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: BrandBrain = await req.json();
    if (!body.name || !body.industryId) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Name and Industry are required'
      }, { status: 400 });
    }

    const existingIndex = brandBrainsStore.findIndex(b => b.id === body.id);
    if (existingIndex >= 0) {
      brandBrainsStore[existingIndex] = { ...body, updatedAt: new Date().toISOString() };
    } else {
      const newBrain = {
        ...body,
        id: body.id || `brain-${Date.now().toString(36)}`,
        updatedAt: new Date().toISOString()
      };
      brandBrainsStore.push(newBrain);
    }

    return NextResponse.json({
      success: true,
      brandBrains: brandBrainsStore
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}
