import { NextResponse } from 'next/server';
import { PLAN_TIERS } from '@/lib/engine/cost-governor';
import { INITIAL_USAGE_LEDGER } from '@/lib/store/video-store';

export async function GET() {
  const totalSpendUsd = INITIAL_USAGE_LEDGER.reduce((acc, entry) => acc + entry.costUsd, 0);
  const totalRenderSeconds = INITIAL_USAGE_LEDGER.reduce((acc, entry) => acc + entry.renderSeconds, 0);
  const totalTokens = INITIAL_USAGE_LEDGER.reduce((acc, entry) => acc + entry.tokensUsed, 0);

  return NextResponse.json({
    success: true,
    currentPlan: PLAN_TIERS[1], // Growth tier default
    plans: PLAN_TIERS,
    usage: {
      totalSpendUsd: Number(totalSpendUsd.toFixed(2)),
      totalSpendZar: Number((totalSpendUsd * 18.2).toFixed(2)),
      totalRenderSeconds,
      totalMinutes: Number((totalRenderSeconds / 60).toFixed(1)),
      monthlyQuotaMinutes: 150,
      quotaUsedPercent: Number(((totalRenderSeconds / 60 / 150) * 100).toFixed(1)),
      totalTokens,
      currency: 'ZAR / USD',
    },
    ledger: INITIAL_USAGE_LEDGER,
  });
}
