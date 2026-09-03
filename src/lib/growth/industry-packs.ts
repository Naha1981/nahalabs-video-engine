// NahaLabs Growth OS — Industry Pack Registry (§5)
//
// Growth packs layer ON TOP of the Video Engine's INDUSTRY_CATALOG
// (src/lib/engine/industry-intelligence.ts). They carry the GROWTH intelligence:
// what to research, which signals matter, compliance constraints, and which
// content formats/opportunities are typical for the vertical.
//
// Launch deep packs: Restaurant, Dental, Retail/Fashion. The registry is open
// for the full 50-business vertical matrix (§13) — the engine is NOT hardcoded
// to restaurants; unknown verticals get a generic but functional default pack.

import type { BusinessVertical, RecommendedFormat, SignalType, PlatformId } from './types';

export interface IndustryPack {
  vertical: BusinessVertical;
  label: string;
  /** Research angles that must be covered before generation (§7). */
  researchAngles: string[];
  /** Signal types this vertical actually cares about. */
  prioritySignals: SignalType[];
  /** Compliant, public/authorized signal sources (§10 — no bulk scraping). */
  signalSources: string[];
  /** Hard compliance rules for the vertical (§39 Industry QC). */
  complianceRules: string[];
  /** Typical opportunity templates (feeds the Opportunity Engine). */
  opportunityTemplates: {
    trigger: string;
    objective: string;
    format: RecommendedFormat;
    platform: PlatformId;
    angle: string;
  }[];
  /** Content formats this vertical most often wins with, in priority order. */
  preferredFormats: RecommendedFormat[];
  /** Seasonal / calendar moments worth surfacing (SA-leaning for launch). */
  seasonalMoments: { name: string; months: number[] }[];
  depth: 'deep' | 'standard' | 'generic';
}

const RESTAURANT_PACK: IndustryPack = {
  vertical: 'restaurant',
  label: 'Restaurant & Food Service',
  depth: 'deep',
  researchAngles: [
    'Local dining demand and search interest for the cuisine/dish',
    'Seasonality and day-of-week booking patterns (e.g. slow Tuesday/Wednesday)',
    'Public competitor positioning from compliant sources only',
    'Restaurant’s own menu, proven dishes, and past campaign performance',
    'Local events and holidays that drive dining traffic',
  ],
  prioritySignals: ['BOOKING_PATTERN', 'SEASONALITY', 'LOCAL_EVENT', 'SEARCH_DEMAND', 'PRODUCT_LAUNCH', 'CONTENT_GAP', 'CAMPAIGN_PERFORMANCE'],
  signalSources: ['owner booking/POS data (authorized)', 'public search trend feeds', 'local event calendars', 'manual competitor verification'],
  complianceRules: [
    'No unverifiable health or allergen claims; allergens must be stated where legally required',
    'No under-18 alcohol promotion; mandatory responsible-service disclaimer',
    'Prices and specials must match the real menu (no invented prices §42)',
    'No fake testimonials or fabricated review statistics',
  ],
  opportunityTemplates: [
    {
      trigger: 'Weeknight bookings below baseline + high local food search interest',
      objective: 'Fill slow weeknight seating',
      format: 'reel',
      platform: 'instagram',
      angle: 'Signature dish + limited weeknight incentive driving WhatsApp bookings',
    },
    {
      trigger: 'New menu item / seasonal launch',
      objective: 'Launch awareness + trial',
      format: 'reel',
      platform: 'instagram',
      angle: 'Sensory close-up of the new dish with clear CTA to book',
    },
    {
      trigger: 'Library of usable customer/food clips available',
      objective: 'Engagement + social proof',
      format: 'reel',
      platform: 'instagram',
      angle: 'UGC-style montage of real diners and real plates',
    },
  ],
  preferredFormats: ['reel', 'story', 'social_post', 'static_ad'],
  seasonalMoments: [
    { name: 'Summer menu season', months: [11, 12, 1, 2] },
    { name: 'Valentine’s dining', months: [2] },
    { name: 'Mother’s Day dining', months: [5] },
    { name: 'Winter menu / comfort season', months: [5, 6, 7, 8] },
    { name: 'Festive season bookings', months: [11, 12] },
  ],
};

const DENTAL_PACK: IndustryPack = {
  vertical: 'dental_medical',
  label: 'Dental / Medical Practice',
  depth: 'deep',
  researchAngles: [
    'Local demand for the specific treatment (implants, whitening, orthodontics)',
    'Approved educational/health topics for the profession',
    'Competitor positioning via public, compliant channels',
    'Practice’s own existing educational content and case material',
    'Regulatory constraints on medical advertising and claims',
  ],
  prioritySignals: ['SEARCH_DEMAND', 'CONTENT_GAP', 'SEASONALITY', 'CAMPAIGN_PERFORMANCE', 'CUSTOMER_SIGNAL'],
  signalSources: ['public search trend feeds', 'practice-provided booking data', 'professional body guidance', 'manual competitor verification'],
  complianceRules: [
    'No guarantees of clinical outcomes; no "painless"/"100% safe" claims',
    'Patient imagery only with explicit written consent; never stock "patients" as real cases',
    'Before/after content must represent real, documented cases',
    'Qualifications and credentials stated must be accurate and verifiable',
    'Health claims require citations and professional review before publish',
  ],
  opportunityTemplates: [
    {
      trigger: 'High local search demand for a treatment the practice offers',
      objective: 'Generate consultation bookings',
      format: 'reel',
      platform: 'facebook',
      angle: 'Educational explainer answering the top patient question, CTA to book consult',
    },
    {
      trigger: 'Common patient fear/misconception identified',
      objective: 'Trust + consideration',
      format: 'carousel',
      platform: 'instagram',
      angle: 'Myth-busting educational carousel (carousel often beats video here — §13)',
    },
  ],
  preferredFormats: ['reel', 'carousel', 'social_post', 'static_ad'],
  seasonalMoments: [
    { name: 'New-year / new-smile season', months: [1, 2] },
    { name: 'Back-to-school check-ups', months: [1, 8] },
    { name: 'Year-end benefits window', months: [11, 12] },
  ],
};

const RETAIL_PACK: IndustryPack = {
  vertical: 'retail_fashion_footwear',
  label: 'Retail / Fashion / Footwear',
  depth: 'deep',
  researchAngles: [
    'Seasonal demand and cultural/style moments',
    'Audience and trend signals for the product category',
    'Competitor positioning from public channels',
    'Existing product photography and campaign assets',
    'Brand identity and visual guidelines',
  ],
  prioritySignals: ['SEASONALITY', 'TREND', 'PRODUCT_LAUNCH', 'SALES_PATTERN', 'CONTENT_GAP', 'CAMPAIGN_PERFORMANCE'],
  signalSources: ['public trend feeds', 'seasonal calendar', 'store sales data (authorized)', 'manual competitor verification'],
  complianceRules: [
    'No counterfeit or misleading brand comparisons',
    'Sale/discount claims must be truthful with real reference pricing',
    'Product imagery must show the actual product (real assets first §16)',
    'Sizing/availability claims must match real inventory',
  ],
  opportunityTemplates: [
    {
      trigger: 'New seasonal collection / drop',
      objective: 'Product launch sales',
      format: 'reel',
      platform: 'instagram',
      angle: 'Dynamic product styling reel with real product footage and shop CTA',
    },
    {
      trigger: 'Slow-moving stock / end-of-season',
      objective: 'Clearance sales',
      format: 'static_ad',
      platform: 'facebook',
      angle: 'Clean product carousel/ad highlighting the real discount',
    },
  ],
  preferredFormats: ['reel', 'story', 'static_ad', 'carousel'],
  seasonalMoments: [
    { name: 'Winter collection', months: [4, 5, 6] },
    { name: 'Summer collection', months: [10, 11, 12] },
    { name: 'Black Friday / festive retail', months: [11, 12] },
    { name: 'Back-to-school / spring', months: [8, 9] },
  ],
};

// Standard packs cover the rest of the 50-business matrix with sensible logic.
function standardPack(vertical: BusinessVertical, label: string, partial: Partial<IndustryPack>): IndustryPack {
  return {
    vertical,
    label,
    depth: 'standard',
    researchAngles: [
      'Local/category demand and search interest',
      'Seasonal and event-driven opportunities',
      'Public competitor positioning (compliant only)',
      'Business’s own assets and past performance',
    ],
    prioritySignals: ['SEARCH_DEMAND', 'SEASONALITY', 'CONTENT_GAP', 'CAMPAIGN_PERFORMANCE', 'PRODUCT_LAUNCH'],
    signalSources: ['public trend feeds', 'owner-provided data', 'manual competitor verification'],
    complianceRules: ['No fabricated claims, prices, testimonials or statistics (§42)', 'Only use licensed/owned assets with provenance (§43)'],
    opportunityTemplates: [
      {
        trigger: 'Rising category demand + content gap',
        objective: 'Awareness + leads',
        format: 'reel',
        platform: 'instagram',
        angle: 'Clear value-prop reel grounded in real business assets',
      },
    ],
    preferredFormats: ['reel', 'static_ad', 'carousel', 'social_post'],
    seasonalMoments: [{ name: 'Festive / year-end', months: [11, 12] }],
    ...partial,
  };
}

const REGISTRY: Partial<Record<BusinessVertical, IndustryPack>> = {
  restaurant: RESTAURANT_PACK,
  dental_medical: DENTAL_PACK,
  retail_fashion_footwear: RETAIL_PACK,
  real_estate: standardPack('real_estate', 'Real Estate', {
    researchAngles: ['Local property demand and buyer/tenant search interest', 'Comparable listings from public portals', 'Neighbourhood amenities and seasonal buying patterns'],
    opportunityTemplates: [
      { trigger: 'New listing with strong visual assets', objective: 'Generate viewings/enquiries', format: 'reel', platform: 'facebook', angle: 'Cinematic property walkthrough with real footage, CTA to arrange viewing' },
      { trigger: 'Buyer/seller education gap', objective: 'Lead generation', format: 'carousel', platform: 'instagram', angle: 'Market-insight carousel positioning the agent as local expert' },
    ],
    preferredFormats: ['video_16x9', 'reel', 'carousel', 'static_ad'],
  }),
  automotive: standardPack('automotive', 'Automotive', {
    opportunityTemplates: [
      { trigger: 'Specific vehicle in inventory with good footage', objective: 'Enquiries / test drives', format: 'reel', platform: 'instagram', angle: 'Real vehicle walkaround highlighting genuine specs, no fake performance claims' },
    ],
    complianceRules: ['Specs and pricing must match the actual advertised vehicle', 'No misleading performance or fuel-economy claims'],
  }),
  beauty_fitness: standardPack('beauty_fitness', 'Beauty / Fitness', {
    opportunityTemplates: [
      { trigger: 'Membership/treatment demand + real client results (consented)', objective: 'Bookings / memberships', format: 'reel', platform: 'instagram', angle: 'Authentic transformation/results content with consent, CTA to book' },
    ],
    complianceRules: ['Results shown must be real and consented; no guaranteed-result claims'],
  }),
  hospitality_tourism: standardPack('hospitality_tourism', 'Hotels / Tourism', {
    preferredFormats: ['reel', 'video_16x9', 'story'],
    opportunityTemplates: [
      { trigger: 'Seasonal travel demand + real venue footage', objective: 'Bookings', format: 'reel', platform: 'instagram', angle: 'Immersive destination/venue reel driving direct booking' },
    ],
  }),
  b2b_industrial: standardPack('b2b_industrial', 'B2B / Industrial', {
    preferredFormats: ['video_16x9', 'pdf', 'landing_page', 'reel'],
    opportunityTemplates: [
      { trigger: 'Capability/capacity proof point available', objective: 'Leads / RFQs', format: 'video_16x9', platform: 'linkedin', angle: 'Factory/capability proof video for technical buyers; video optional vs spec PDF (§13)' },
    ],
  }),
  professional_services: standardPack('professional_services', 'Professional Services', {
    preferredFormats: ['carousel', 'social_post', 'reel', 'pdf'],
    opportunityTemplates: [
      { trigger: 'High-value question prospects search for', objective: 'Leads / authority', format: 'carousel', platform: 'linkedin', angle: 'Educational authority content; often a carousel/article outperforms video' },
    ],
  }),
  education_creator_agency: standardPack('education_creator_agency', 'Education / Creators / Agency', {
    preferredFormats: ['reel', 'carousel', 'video_16x9'],
  }),
};

const GENERIC_PACK: IndustryPack = standardPack('professional_services', 'General Business', { vertical: 'professional_services' });

export function getIndustryPack(vertical: BusinessVertical): IndustryPack {
  return REGISTRY[vertical] || GENERIC_PACK;
}

export function listIndustryPacks(): IndustryPack[] {
  return Object.values(REGISTRY);
}
