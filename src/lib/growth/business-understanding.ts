// NahaLabs Growth OS — Business Understanding (§4)
//
// Turns a free-text brief ("I'm a restaurant in Johannesburg, new summer menu,
// I want 6 Instagram Reels") into a structured BusinessProfile: industry /
// sub-industry / products / audience / location / objective / platform /
// compliance requirements — with a HIGH/MEDIUM/LOW confidence.
//
// Deterministic keyword classifier. It deliberately needs no LLM or API key so
// onboarding works offline; when an LLM research provider is configured later,
// this output is the seed the provider verifies rather than replaces.

import type { BusinessProfile, BusinessVertical, CampaignObjective, Confidence, PlatformId } from './types';
import type { IndustryId } from '../engine/types';
import { genId } from './tenant-store';

interface VerticalRule {
  vertical: BusinessVertical;
  industryId: IndustryId;
  label: string;
  keywords: string[];
  products: string[];
}

// Order matters: more specific rules first (e.g. "dental clinic" before generic).
const VERTICAL_RULES: VerticalRule[] = [
  {
    vertical: 'dental_medical',
    industryId: 'healthcare-wellness',
    label: 'Dental / Medical Practice',
    keywords: ['dentist', 'dental', 'implant', 'orthodont', 'clinic', 'doctor', 'medical', 'physio', 'chiropractor', 'optometrist', 'aesthetic clinic', 'gp practice'],
    products: ['consultations', 'treatments'],
  },
  {
    vertical: 'beauty_fitness',
    industryId: 'healthcare-wellness',
    label: 'Beauty / Fitness',
    keywords: ['gym', 'fitness', 'salon', 'spa', 'beauty', 'barber', 'hair', 'nails', 'makeup', 'lash', 'personal trainer', 'yoga', 'wellness studio', 'skincare clinic'],
    products: ['memberships', 'treatments', 'classes'],
  },
  {
    vertical: 'restaurant',
    industryId: 'hospitality-dining',
    label: 'Restaurant / Food Service',
    keywords: ['restaurant', 'cafe', 'café', 'bistro', 'eatery', 'menu', 'burger', 'pizza', 'kitchen', 'diner', 'coffee shop', 'bakery', 'food truck', 'sushi', 'steakhouse', 'brasserie', 'taverna'],
    products: ['dishes', 'menu items'],
  },
  {
    vertical: 'hospitality_tourism',
    industryId: 'hospitality-dining',
    label: 'Hotel / Hospitality / Tourism',
    keywords: ['hotel', 'guesthouse', 'guest house', 'bnb', 'b&b', 'lodge', 'resort', 'tourism', 'tour', 'travel', 'backpackers', 'safari', 'accommodation'],
    products: ['rooms', 'stays', 'experiences'],
  },
  {
    vertical: 'real_estate',
    industryId: 'real-estate',
    label: 'Real Estate',
    keywords: ['real estate', 'realtor', 'property', 'house for sale', 'listing', 'apartment', 'estate agent', 'rental', 'townhouse', 'home for sale', 'list a house'],
    products: ['listings', 'properties'],
  },
  {
    vertical: 'automotive',
    industryId: 'd2c-ecommerce',
    label: 'Automotive',
    keywords: ['bmw', 'car dealership', 'dealership', 'used car', 'vehicle', 'auto ', 'automotive', 'car sales', 'motorbike', 'motorcycle', 'suv', 'bakkie', 'test drive'],
    products: ['vehicles'],
  },
  {
    vertical: 'b2b_industrial',
    industryId: 'manufacturing-industrial',
    label: 'B2B / Industrial',
    keywords: ['factory', 'manufactur', 'components', 'industrial', 'warehouse', 'supply', 'wholesale', 'cnc', 'fabrication', 'plant', 'engineering works', 'foundry'],
    products: ['components', 'manufactured goods'],
  },
  {
    vertical: 'professional_services',
    industryId: 'legal-compliance',
    label: 'Professional Services',
    keywords: ['law firm', 'attorney', 'accountant', 'accounting', 'bookkeeper', 'consultant', 'consulting', 'financial advisor', 'insurance broker', 'audit firm', 'tax'],
    products: ['services', 'advisory'],
  },
  {
    vertical: 'retail_fashion_footwear',
    industryId: 'd2c-ecommerce',
    label: 'Retail / Fashion / Footwear',
    keywords: ['sneaker', 'shoe', 'footwear', 'fashion', 'clothing', 'apparel', 'boutique', 'retail', 'store', 'collection', 'winter range', 'streetwear', 'accessories', 'jewellery'],
    products: ['products', 'range'],
  },
  {
    vertical: 'education_creator_agency',
    industryId: 'education-edtech',
    label: 'Education / Creator / Agency',
    keywords: ['course', 'school', 'tutor', 'academy', 'training', 'online course', 'creator', 'agency', 'influencer', 'coach', 'mentor', 'workshop', 'edtech'],
    products: ['courses', 'programs', 'services'],
  },
];

const OBJECTIVE_RULES: { objective: CampaignObjective; keywords: string[] }[] = [
  { objective: 'bookings', keywords: ['book', 'booking', 'reservation', 'reserve', 'table', 'appointment', 'consultation', 'fill ', 'covers'] },
  { objective: 'sales', keywords: ['sell', 'sales', 'buy', 'purchase', 'order', 'shop now', 'deal', 'discount', 'launch', 'new product', 'winter menu', 'new burger', 'new menu'] },
  { objective: 'leads', keywords: ['lead', 'enquir', 'quote', 'contact us', 'get in touch', 'sign up', 'demo'] },
  { objective: 'traffic', keywords: ['visit', 'website', 'click', 'link', 'foot traffic', 'come in'] },
  { objective: 'engagement', keywords: ['engage', 'comments', 'followers', 'community', 'go viral', 'reels'] },
  { objective: 'awareness', keywords: ['awareness', 'introduce', 'grand opening', 'new location', 'announce', 'brand'] },
  { objective: 'retention', keywords: ['loyal', 'come back', 'return', 'members', 'existing customers'] },
];

const PLATFORM_RULES: { platform: PlatformId; keywords: string[] }[] = [
  { platform: 'instagram', keywords: ['instagram', 'reel', 'reels', 'ig ', 'insta', 'story', 'stories'] },
  { platform: 'facebook', keywords: ['facebook', 'fb ', 'meta'] },
  { platform: 'tiktok', keywords: ['tiktok', 'tik tok'] },
  { platform: 'youtube', keywords: ['youtube', 'yt ', 'long-form', 'long form'] },
  { platform: 'linkedin', keywords: ['linkedin'] },
  { platform: 'whatsapp', keywords: ['whatsapp', 'wa.me'] },
];

export interface UnderstandingResult {
  profile: BusinessProfile;
  platforms: PlatformId[];
  objective: CampaignObjective;
}

function countHits(text: string, keywords: string[]): { hits: number; matched: string[] } {
  const matched: string[] = [];
  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) matched.push(kw.trim());
  }
  return { hits: matched.length, matched };
}

/** Detect a South-African / general location phrase ("in Sandton", "Johannesburg"). */
function detectLocation(text: string): string | undefined {
  const m = text.match(/\b(?:in|based in|near)\s+([A-Z][a-zA-Z'’\-]+(?:\s+[A-Z][a-zA-Z'’\-]+)?)/);
  const known = ['Johannesburg', 'Sandton', 'Cape Town', 'Durban', 'Pretoria', 'Soweto', 'Centurion', 'Midrand', 'Bloemfontein', 'Port Elizabeth', 'Gqeberha', 'Stellenbosch'];
  for (const city of known) {
    if (text.includes(city)) return city;
  }
  return m ? m[1] : undefined;
}

export function understandBusiness(input: {
  tenantId: string;
  description: string;
  name?: string;
  website?: string;
}): UnderstandingResult {
  const text = ` ${input.description.toLowerCase()} `;

  // Vertical / industry
  let best: { rule: VerticalRule; matched: string[] } | null = null;
  for (const rule of VERTICAL_RULES) {
    const { hits, matched } = countHits(text, rule.keywords);
    if (hits > 0 && (!best || hits > best.matched.length)) {
      best = { rule, matched };
    }
  }

  const missingCriticalInfo: string[] = [];
  let confidence: Confidence;
  let vertical: BusinessVertical;
  let industryId: IndustryId;
  let label: string;

  if (best) {
    vertical = best.rule.vertical;
    industryId = best.rule.industryId;
    label = best.rule.label;
    confidence = best.matched.length >= 2 ? 'HIGH' : 'MEDIUM';
  } else {
    vertical = 'professional_services';
    industryId = 'b2b-saas';
    label = 'Unknown / General Business';
    confidence = 'LOW';
    missingCriticalInfo.push('industry: could not confidently determine industry — ask the owner what business they are in');
  }

  // Objective
  let objective: CampaignObjective = 'awareness';
  let objHits = 0;
  for (const r of OBJECTIVE_RULES) {
    const { hits } = countHits(text, r.keywords);
    if (hits > objHits) {
      objHits = hits;
      objective = r.objective;
    }
  }
  if (objHits === 0) {
    missingCriticalInfo.push('objective: what should this content achieve (bookings, sales, leads, awareness)?');
  }

  // Platforms
  const platforms: PlatformId[] = [];
  for (const r of PLATFORM_RULES) {
    if (countHits(text, r.keywords).hits > 0 && !platforms.includes(r.platform)) platforms.push(r.platform);
  }
  if (platforms.length === 0) {
    // Sensible default but flag it rather than silently assuming
    platforms.push('instagram');
    missingCriticalInfo.push('platform: no platform mentioned — defaulted to Instagram Reels; confirm with owner');
  }

  // Products / offer heuristics
  const products = best ? [...best.rule.products] : [];
  const offerMatch = text.match(/new\s+([a-z0-9'’\- ]{2,30}?)(?:\.|,| and| that| this| i | we |$)/);
  if (offerMatch) products.unshift(offerMatch[1].trim());

  const location = detectLocation(input.description);

  if (!input.description || input.description.trim().length < 12) {
    confidence = 'LOW';
    missingCriticalInfo.push('brief: description too short to understand the business');
  }

  const now = new Date().toISOString();
  const profile: BusinessProfile = {
    id: genId('biz'),
    tenantId: input.tenantId,
    name: input.name || label,
    description: input.description,
    website: input.website,
    location,
    products: Array.from(new Set(products)).slice(0, 8),
    services: [],
    audience: undefined,
    socialProfiles: [],
    industryId,
    vertical,
    detectionConfidence: confidence,
    missingCriticalInfo,
    createdAt: now,
    updatedAt: now,
  };

  return { profile, platforms, objective };
}

/** Human-readable clarifying questions when confidence is LOW (§4 — no long questionnaires). */
export function clarifyingQuestions(profile: BusinessProfile): string[] {
  return profile.missingCriticalInfo.map((m) => {
    const [field, rest] = m.split(':');
    return `${field}: ${rest || 'please provide more detail'}`;
  });
}
