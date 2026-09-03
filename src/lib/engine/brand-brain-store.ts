import { BrandBrain } from './types';

export const DEFAULT_BRAND_BRAINS: BrandBrain[] = [
  {
    id: 'brain-nahalabs-core',
    tenantId: 'tenant-default',
    name: 'NahaLabs Video Engine (Global Enterprise)',
    industryId: 'b2b-saas',
    voice: {
      tone: 'authoritative',
      readingLevel: 'business_executive',
      prohibitedPhrases: ['cheap tool', 'magic button', 'vibe coding', 'push-button riches', 'growth hack'],
      requiredTaglines: ['The Commercial Intelligence Video Engine', 'Engineered by NahaLabs'],
      pacingWpm: 148,
    },
    visualIdentity: {
      primaryColor: '#4f46e5', // Indigo-600
      secondaryColor: '#06b6d4', // Cyan-500
      accentColor: '#10b981', // Emerald-500
      backgroundColor: '#090d16', // Deep cyber obsidian
      textColor: '#f8fafc',
      fontFamily: 'Inter, sans-serif',
      watermarkEnabled: true,
      aspectRatioDefault: '16:9',
    },
    compliance: {
      claimVerificationRequired: true,
      prohibitedWords: ['guaranteed profit', '100% risk free', 'get rich quick', 'instant miracle'],
      mandatoryDisclaimers: ['Audited enterprise results may vary based on market implementation.'],
      maxSceneSeconds: 15,
      requireCitations: true,
    },
    personas: [
      {
        id: 'p-cmo',
        name: 'Enterprise CMO / Head of Growth',
        painPoint: 'Agency video production is slow, costs R150,000 per asset, and lacks commercial funnel strategy.',
        dreamOutcome: 'Produce 20 high-converting cinematic commercial videos a month aligned to verified revenue attribution.',
        objections: ['Will it look cheap or obviously AI-generated?', 'Can we enforce our exact brand guidelines?'],
      },
      {
        id: 'p-founder',
        name: 'Venture-Backed Founder / CEO',
        painPoint: 'Prospects do not understand the technical value proposition in the first 10 seconds on the website.',
        dreamOutcome: 'Deliver a crystal-clear 60-second video that converts high-ticket pipeline with zero fluff.',
        objections: ['I do not have time to direct or edit video timelines.'],
      }
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'brain-cargoiq-freight',
    tenantId: 'tenant-default',
    name: 'CargoIQ Logistics & Freight OS',
    industryId: 'logistics-cargoiq',
    voice: {
      tone: 'authoritative',
      readingLevel: 'technical_specialist',
      prohibitedPhrases: ['easy shipping', 'cheap cargo', 'super fast box delivery'],
      requiredTaglines: ['Sovereign Supply Chain Velocity', 'Zero-Demurrage Logistics'],
      pacingWpm: 152,
    },
    visualIdentity: {
      primaryColor: '#0284c7', // Sky-600
      secondaryColor: '#0f172a', // Slate-900
      accentColor: '#10b981', // Emerald-500
      backgroundColor: '#030712',
      textColor: '#f9fafb',
      fontFamily: 'Geist, sans-serif',
      watermarkEnabled: true,
      aspectRatioDefault: '16:9',
    },
    compliance: {
      claimVerificationRequired: true,
      prohibitedWords: ['guaranteed zero customs delay', '100% tax avoidance'],
      mandatoryDisclaimers: ['Subject to international port authority clearance protocols.'],
      maxSceneSeconds: 12,
      requireCitations: true,
    },
    personas: [
      {
        id: 'p-logistics-director',
        name: 'Director of Global Supply Chain',
        painPoint: 'Port congestion and missing manifests cause millions in demurrage penalties.',
        dreamOutcome: 'Automate customs documentation and live container tracking down to the minute.',
        objections: ['Can it integrate with legacy EDI and port APIs?'],
      }
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'brain-flavourly-dining',
    tenantId: 'tenant-default',
    name: 'Flavourly Gourmet Dining & VIP Concierge',
    industryId: 'hospitality-dining',
    voice: {
      tone: 'conversational',
      readingLevel: 'accessible_grade6',
      prohibitedPhrases: ['fast food', 'cheap eats', 'budget grub'],
      requiredTaglines: ['Sensory Gastronomy in Sandton', 'Reserve VIP via WhatsApp'],
      pacingWpm: 140,
    },
    visualIdentity: {
      primaryColor: '#e11d48', // Rose-600
      secondaryColor: '#d97706', // Amber-600
      accentColor: '#f59e0b', // Amber-500
      backgroundColor: '#18080c', // Dark wine velvet
      textColor: '#fff1f2',
      fontFamily: 'Playfair Display, serif',
      watermarkEnabled: false,
      aspectRatioDefault: '9:16',
    },
    compliance: {
      claimVerificationRequired: false,
      prohibitedWords: ['unlimited free alcohol'],
      mandatoryDisclaimers: ['Strictly no under 18s. Table reservations held for 15 minutes.'],
      maxSceneSeconds: 8,
      requireCitations: false,
    },
    personas: [
      {
        id: 'p-foodie-couple',
        name: 'Urban High-Earner / Romantic Couple',
        painPoint: 'Tired of generic dining experiences and clumsy phone reservation booking.',
        dreamOutcome: 'Discover an unforgettable culinary evening and book a prime table in 3 taps on WhatsApp.',
        objections: ['Is the food actually as good as the video looks?'],
      }
    ],
    updatedAt: new Date().toISOString(),
  }
];

export function getBrandBrain(id: string): BrandBrain {
  return DEFAULT_BRAND_BRAINS.find(b => b.id === id) || DEFAULT_BRAND_BRAINS[0];
}
