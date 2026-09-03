import { IndustryId, IndustryIntelligence } from './types';

export const INDUSTRY_CATALOG: Record<IndustryId, IndustryIntelligence> = {
  'b2b-saas': {
    id: 'b2b-saas',
    title: 'B2B Enterprise SaaS & Cloud Platforms',
    category: 'Technology & Software',
    summary: 'High-leverage video scripts designed to compress 6-month enterprise sales cycles into 60-second clarity. Targets VP/C-Suite pain points of manual drift, broken workflows, and fragmented tooling.',
    recommendedDurationSec: 60,
    avgConversionRate: '4.8% Demo Booking',
    keyPsychologicalTriggers: ['Operational Debt Fear', 'Executive Visibility', 'Consolidation ROI', 'Speed to Value'],
    hookBlueprints: [
      {
        pattern: 'The Uncomfortable Truth Hook',
        example: 'Your engineering team is spending 32 hours a week fixing synchronization issues that shouldn’t even exist.',
        targetEmotion: 'Urgent Recognition'
      },
      {
        pattern: 'Contrast & Relief Hook',
        example: 'Most enterprise platforms require 9 months of integration. Here is how Tier-1 teams go live in 18 minutes.',
        targetEmotion: 'Relief & Fascination'
      },
      {
        pattern: 'Metrics Anchor Hook',
        example: '92% of SaaS churn happens before the end-user ever sees value. Here is the single workflow that stops it.',
        targetEmotion: 'Urgency & Revenue Focus'
      }
    ],
    visualMetaphors: [
      'Chaotic split-screens transforming into a single crystal-clear unified dashboard',
      'Data packets racing through clean geometric neon pipelines without bottlenecks',
      'Executive terminal with instant zero-latency status confirmation and green telemetry'
    ],
    pacingGuidelines: {
      hookDurationSec: 5,
      problemAgitationSec: 15,
      solutionRevealSec: 20,
      proofSocialProofSec: 12,
      ctaDurationSec: 8
    },
    defaultStockTags: ['modern glass office', 'software engineer coding high-tech', 'minimalist dashboard UI', 'data center server room cinematic', 'executive meeting room'],
    recommendedMotion: 'smooth dolly-in with snappy micro-zooms on UI metrics and metrics count-up',
    complianceNotes: 'Avoid unverifiable uptime claims without disclaimers. Ensure all metric displays cite authoritative benchmarks.'
  },

  'd2c-ecommerce': {
    id: 'd2c-ecommerce',
    title: 'D2C E-commerce & Premium Consumer Goods',
    category: 'Retail & Consumer',
    summary: 'High-velocity short-form reels and commercial ads engineered for rapid pattern-interruption, sensory texture demonstration, and instant checkout conversions.',
    recommendedDurationSec: 30,
    avgConversionRate: '6.2% Direct Purchase',
    keyPsychologicalTriggers: ['Sensory Desire', 'Identity Alignment', 'FOMO & Scarcity', 'Frictionless Upgrade'],
    hookBlueprints: [
      {
        pattern: 'Sensory Disruption Hook',
        example: 'Stop buying leather that flakes after four months. Look at what real vegetable-tanned grain looks like after five years.',
        targetEmotion: 'Curiosity & Quality Contrast'
      },
      {
        pattern: 'Before/After Extreme Test Hook',
        example: 'We put our untearable travel bag against a 50kg industrial pull test. Watch what happens.',
        targetEmotion: 'Shock & Proof'
      }
    ],
    visualMetaphors: [
      'Close-up macro slow-motion water droplets beading off hydrophobic textile',
      'Unboxing sequence with golden-hour backlighting and satisfying tactile snap',
      'Side-by-side comparison with cheap generic product degrading vs pristine product'
    ],
    pacingGuidelines: {
      hookDurationSec: 3,
      problemAgitationSec: 7,
      solutionRevealSec: 10,
      proofSocialProofSec: 6,
      ctaDurationSec: 4
    },
    defaultStockTags: ['macro product photography', 'golden hour lifestyle model', 'satisfying unboxing', 'cinematic product rotation studio lighting'],
    recommendedMotion: 'dynamic orbital spin, whip pans into product textures, speed ramping',
    complianceNotes: 'Adhere to consumer protection standards. Clearly display shipping guarantees and return windows.'
  },

  'real-estate': {
    id: 'real-estate',
    title: 'Luxury Real Estate & High-Yield Developments',
    category: 'Property & Architecture',
    summary: 'Architectural cinema that sells lifestyle prestige, panoramic vistas, and sovereign wealth appreciation for discerning high-net-worth buyers.',
    recommendedDurationSec: 45,
    avgConversionRate: '3.4% VIP Tour Request',
    keyPsychologicalTriggers: ['Status & Legacy', 'Serenity & Privacy', 'Architectural Harmony', 'Capital Preservation'],
    hookBlueprints: [
      {
        pattern: 'Atmospheric Immersion Hook',
        example: 'Imagine waking up to unobstructed 360-degree ocean views where the only sound is the morning tide.',
        targetEmotion: 'Aspirational Longing'
      },
      {
        pattern: 'Exclusivity Reveal Hook',
        example: 'Only 6 private villas will ever be built on this protected coastal cliffside.',
        targetEmotion: 'Scarcity & Privilege'
      }
    ],
    visualMetaphors: [
      'Sunset drone sweep ascending over infinity pool into floor-to-ceiling glass living space',
      'Natural Italian marble surfaces reflecting warm candlelight and custom architecture',
      'Aerial 4K landscape gliding over coastal canopy into private helicopter pad'
    ],
    pacingGuidelines: {
      hookDurationSec: 4,
      problemAgitationSec: 8,
      solutionRevealSec: 18,
      proofSocialProofSec: 9,
      ctaDurationSec: 6
    },
    defaultStockTags: ['luxury modern architectural villa', 'infinity pool sunset drone', 'marble interior design', 'penthouse skyline view evening'],
    recommendedMotion: 'slow cinematic drone fly-through, steady gimbal sweeps, ambient lighting shifts',
    complianceNotes: 'Disclose property jurisdiction, developer license numbers, and architectural rendering disclaimers.'
  },

  'healthcare-wellness': {
    id: 'healthcare-wellness',
    title: 'Clinical Healthcare, Biotech & Longevity Wellness',
    category: 'Health & Life Sciences',
    summary: 'Calm, authoritative, scientifically-grounded video narratives that build deep patient and physician trust while communicating clinical efficacy.',
    recommendedDurationSec: 60,
    avgConversionRate: '5.1% Consultation Booking',
    keyPsychologicalTriggers: ['Peace of Mind', 'Scientific Certainty', 'Compassionate Care', 'Vitality Restoration'],
    hookBlueprints: [
      {
        pattern: 'Biomarker Insight Hook',
        example: 'Your standard blood panel only checks 14 basic markers. Here is what 150 advanced longevity biomarkers reveal.',
        targetEmotion: 'Scientific Curiosity'
      },
      {
        pattern: 'Patient Empathy Hook',
        example: 'Living with chronic inflammation shouldn’t be your normal. Here is the regenerative protocol changing patient recovery.',
        targetEmotion: 'Empathy & Hope'
      }
    ],
    visualMetaphors: [
      'Microscopic 3D cellular regeneration with clean soft-blue bio-luminescence',
      'Modern serene clinical environment with natural daylight and compassionate doctor interaction',
      'High-precision molecular analysis screen showing inflammation markers resolving'
    ],
    pacingGuidelines: {
      hookDurationSec: 5,
      problemAgitationSec: 14,
      solutionRevealSec: 22,
      proofSocialProofSec: 11,
      ctaDurationSec: 8
    },
    defaultStockTags: ['modern medical laboratory research', 'compassionate doctor patient consultation', 'dna molecular structure 3d', 'serene wellness sanctuary'],
    recommendedMotion: 'gentle tracking shots, smooth focus pulls from clinical instruments to smiling patients',
    complianceNotes: 'Include mandatory medical disclaimers ("Not medical advice; consult certified practitioners"). Strictly avoid misleading curative claims.'
  },

  'logistics-cargoiq': {
    id: 'logistics-cargoiq',
    title: 'Global Logistics, Freight & CargoIQ Operations',
    category: 'Supply Chain & Transportation',
    summary: 'Mission-critical supply chain visual storytelling demonstrating real-time container tracking, customs compliance automation, and zero-loss freight velocity.',
    recommendedDurationSec: 50,
    avgConversionRate: '4.2% Enterprise RFP',
    keyPsychologicalTriggers: ['Zero Disruption Certainty', 'Customs Clearance Speed', 'Full Chain Visibility', 'Cost Margin Recovery'],
    hookBlueprints: [
      {
        pattern: 'Demurrage Nightmare Hook',
        example: 'A single missing customs document at Port of Durban just cost your shipment 5 days and R140,000 in demurrage penalties.',
        targetEmotion: 'Financial Risk Awareness'
      },
      {
        pattern: 'Sovereign Visibility Hook',
        example: 'Track 1,000 multimodal containers from origin vessel to final warehouse gate with zero manual check-ins.',
        targetEmotion: 'Operational Power'
      }
    ],
    visualMetaphors: [
      'Mega container vessel navigating harbor with digital telemetry overlay tracking containers',
      'Automated weighbridge and customs gate opening instantly with green barcode verification',
      'Global satellite orbital map showing logistics routes illuminated in synchronized emerald light'
    ],
    pacingGuidelines: {
      hookDurationSec: 5,
      problemAgitationSec: 12,
      solutionRevealSec: 18,
      proofSocialProofSec: 9,
      ctaDurationSec: 6
    },
    defaultStockTags: ['container ship ocean aerial', 'freight logistics warehouse robotic', 'truck highway sunrise drone', 'port crane container loading'],
    recommendedMotion: 'fast aerial tracking of freight routes, animated data HUD overlays on moving vehicles',
    complianceNotes: 'Ensure cross-border trade and customs compliance standards (SARS, WCO, FIATA) are accurately reflected.'
  },

  'hospitality-dining': {
    id: 'hospitality-dining',
    title: 'Hospitality, Luxury Dining & Gourmet Venues',
    category: 'Hospitality & Food',
    summary: 'Sensory-rich cinematic dining previews that trigger salivation, ambiance desire, and frictionless VIP table reservations via WhatsApp and Web.',
    recommendedDurationSec: 35,
    avgConversionRate: '7.8% Table Booking',
    keyPsychologicalTriggers: ['Culinary Artistry', 'Intimate Ambiance', 'VIP Hospitality', 'Celebration Urgency'],
    hookBlueprints: [
      {
        pattern: 'Culinary Flame & Flavor Hook',
        example: 'Wood-fired dry-aged Wagyu seared over indigenous hardwood charcoal at 400 degrees.',
        targetEmotion: 'Visceral Appetite'
      },
      {
        pattern: 'Weekend Escape Hook',
        example: 'This secret rooftop sanctuary in Sandton offers Cape Town sunset views with master mixology.',
        targetEmotion: 'Exclusivity & Excitement'
      }
    ],
    visualMetaphors: [
      'Chef plating artisan course with tweezers under warm directional kitchen spotlight',
      'Cocktail shaker pouring crystal clear liquid over hand-cut ice sphere in slow motion',
      'Lively atmospheric candlelit dining room filled with happy guests raising glasses'
    ],
    pacingGuidelines: {
      hookDurationSec: 3,
      problemAgitationSec: 6,
      solutionRevealSec: 14,
      proofSocialProofSec: 7,
      ctaDurationSec: 5
    },
    defaultStockTags: ['chef cooking fire slow motion', 'cocktail bar mixology luxury', 'gourmet restaurant ambiance evening', 'wine pouring crystal glass'],
    recommendedMotion: 'ultra slow-motion 120fps macro pulls, rotational pan around signature dishes',
    complianceNotes: 'Display liquor licensing and reservation policy disclaimers where appropriate.'
  },

  'fintech': {
    id: 'fintech',
    title: 'FinTech, Payments & Sovereign Wealth Systems',
    category: 'Finance & Banking',
    summary: 'Institutional-grade visual authority demonstrating instantaneous transaction settlement, biometric fraud protection, and automated wealth generation.',
    recommendedDurationSec: 60,
    avgConversionRate: '4.5% Account Creation / KYC',
    keyPsychologicalTriggers: ['Capital Security', 'Instant Liquidity', 'Algorithmic Precision', 'Zero Hidden Fees'],
    hookBlueprints: [
      {
        pattern: 'Hidden Fee Exposure Hook',
        example: 'Traditional merchant accounts secretly skim 3.8% off your gross margin through interchange hidden markups.',
        targetEmotion: 'Outrage & Curiosity'
      },
      {
        pattern: 'Instant Settlement Hook',
        example: 'What if every customer transaction settled directly into your interest-bearing treasury account in 400 milliseconds?',
        targetEmotion: 'Financial Empowerment'
      }
    ],
    visualMetaphors: [
      'Biometric fingerprint flash unlocking a sleek black titanium smart card interface',
      'Real-time transaction flow animating like golden light through encrypted banking ledger',
      'Clean analytics graph curving smoothly upward with verified audited returns'
    ],
    pacingGuidelines: {
      hookDurationSec: 5,
      problemAgitationSec: 15,
      solutionRevealSec: 20,
      proofSocialProofSec: 12,
      ctaDurationSec: 8
    },
    defaultStockTags: ['financial district skyscrapers sunset', 'cryptographic security data stream', 'mobile payment contactless nfc', 'stock trading multi monitor desk'],
    recommendedMotion: 'sleek geometric linear wipes, high-tech HUD numbers ticking upward smoothly',
    complianceNotes: 'Mandatory FSCA/SEC regulatory disclosures, risk warnings regarding capital loss.'
  },

  'legal-compliance': {
    id: 'legal-compliance',
    title: 'Legal Counsel, Corporate Advisory & Governance',
    category: 'Professional Services',
    summary: 'Sober, prestigious, ironclad visual communication designed to reassure general counsel and corporate boards during high-stakes mergers, disputes, and compliance audits.',
    recommendedDurationSec: 60,
    avgConversionRate: '3.1% Retainer Consultation',
    keyPsychologicalTriggers: ['Downside Protection', 'Uncompromising Integrity', 'Regulatory Mastery', 'Discretion'],
    hookBlueprints: [
      {
        pattern: 'Regulatory Audit Risk Hook',
        example: 'One unverified cross-border data transfer can trigger a R10 Million regulatory penalty before your next board meeting.',
        targetEmotion: 'Governance Accountability'
      }
    ],
    visualMetaphors: [
      'Architectural modern law library with floor-to-ceiling glass and heavy timber meeting table',
      'Fountain pen making decisive signature on official bound corporate agreement',
      'Scales of justice rendered in clean polished bronze beside high-tech legal analytics monitor'
    ],
    pacingGuidelines: {
      hookDurationSec: 5,
      problemAgitationSec: 15,
      solutionRevealSec: 20,
      proofSocialProofSec: 12,
      ctaDurationSec: 8
    },
    defaultStockTags: ['corporate attorney modern office', 'signing legal contract fountain pen', 'supreme court architecture majestic', 'boardroom executive meeting'],
    recommendedMotion: 'slow deliberate camera tracks, formal symmetrical framing',
    complianceNotes: 'State legal practice registration details and jurisdiction limitations.'
  },

  'high-ticket-coaching': {
    id: 'high-ticket-coaching',
    title: 'High-Ticket Executive Coaching & Advisory',
    category: 'Consulting & Education',
    summary: 'Charismatic, paradigm-shifting video assets that position founder-mentors as definitive category authorities to command R50k-R250k program retainers.',
    recommendedDurationSec: 60,
    avgConversionRate: '5.8% Strategy Call Booked',
    keyPsychologicalTriggers: ['Identity Shift', 'Time Leverage', 'Peer Group Elevation', 'Definitive Roadmap'],
    hookBlueprints: [
      {
        pattern: 'Paradox Hook',
        example: 'You don’t need more leads. You need a pricing architecture that stops you working 70 hours a week for commodity margins.',
        targetEmotion: 'Breakthrough Clarity'
      }
    ],
    visualMetaphors: [
      'Keynote speaker addressing an engaged auditorium of founders with spotlight backlighting',
      'Whiteboard strategy session turning chaotic notes into an elegant 3-step profit flywheel',
      'High-altitude alpine summit view representing apex mastery and clarity'
    ],
    pacingGuidelines: {
      hookDurationSec: 4,
      problemAgitationSec: 14,
      solutionRevealSec: 22,
      proofSocialProofSec: 12,
      ctaDurationSec: 8
    },
    defaultStockTags: ['keynote speaker stage auditorium', 'executive coach one on one mastermind', 'mountain summit sunrise aerial', 'luxury private jet terminal meeting'],
    recommendedMotion: 'confident direct eye-contact dolly, energetic cut transitions on pivotal statements',
    complianceNotes: 'Clearly state past performance does not guarantee individual earnings; provide typical client ranges.'
  },

  'education-edtech': {
    id: 'education-edtech',
    title: 'EdTech, Professional Academies & Certification',
    category: 'Education & Training',
    summary: 'Engaging, fast-paced educational videos that demystify complex skills, ignite learner curiosity, and drive enrolled student completions.',
    recommendedDurationSec: 45,
    avgConversionRate: '6.4% Course Enrollment',
    keyPsychologicalTriggers: ['Career Leap', 'Mastery Dopamine', 'Credential Authority', 'Gamified Progress'],
    hookBlueprints: [
      {
        pattern: 'Skill Acceleration Hook',
        example: 'Master modern AI engineering in 30 days without spending 4 years on outdated university theory.',
        targetEmotion: 'Empowerment & Speed'
      }
    ],
    visualMetaphors: [
      'Interactive glowing skill tree lighting up as levels are unlocked in real time',
      'Student working on laptop in modern creative hub receiving instant verified certificate',
      'Complex diagram assembling itself dynamically into simple intuitive building blocks'
    ],
    pacingGuidelines: {
      hookDurationSec: 4,
      problemAgitationSec: 10,
      solutionRevealSec: 16,
      proofSocialProofSec: 9,
      ctaDurationSec: 6
    },
    defaultStockTags: ['young student laptop coding', 'modern university campus creative space', 'interactive holographic ui display', 'digital certification badge glowing'],
    recommendedMotion: 'snappy kinetic motion graphics, zoom-in on milestone badges and student achievements',
    complianceNotes: 'Accreditation status and certification issuer must be clearly stated.'
  },

  'manufacturing-industrial': {
    id: 'manufacturing-industrial',
    title: 'Industrial Manufacturing, Robotics & Heavy Machinery',
    category: 'Industry & Engineering',
    summary: 'High-torque industrial precision video showcases highlighting robotic automation, ISO-certified tolerances, and resilient supply security for tier-1 procurement.',
    recommendedDurationSec: 60,
    avgConversionRate: '3.8% Factory Tour / Tender',
    keyPsychologicalTriggers: ['Tolerance Precision', 'Zero Failure Tolerances', 'Scale Throughput', 'Safety Supremacy'],
    hookBlueprints: [
      {
        pattern: 'Tolerance Benchmark Hook',
        example: 'Machined to 3 microns of tolerance across 50,000 continuous cycles with zero structural defect.',
        targetEmotion: 'Technical Awe'
      }
    ],
    visualMetaphors: [
      'Multi-axis CNC machine spraying coolant mist while sculpting aerospace titanium',
      'Robotic arm welding automotive chassis with synchronized amber sparks in slow motion',
      'Automated quality inspection laser verifying geometric precision in real time'
    ],
    pacingGuidelines: {
      hookDurationSec: 5,
      problemAgitationSec: 14,
      solutionRevealSec: 22,
      proofSocialProofSec: 11,
      ctaDurationSec: 8
    },
    defaultStockTags: ['robotic arm welding sparks industrial', 'cnc milling machine titanium precision', 'automated factory conveyor belt aerial', 'engineer inspecting blueprint in cleanroom'],
    recommendedMotion: 'slow tracking alongside automated assembly lines, dramatic close-ups of mechanical precision',
    complianceNotes: 'Display safety standard certifications (ISO 9001, CE, OSHA).'
  },

  'home-services-trades': {
    id: 'home-services-trades',
    title: 'Home Services, Solar Energy & Field Operations',
    category: 'Trades & Local Services',
    summary: 'Hyper-local, trustworthy video storytelling highlighting verified licensing, same-day response times, upfront transparent pricing, and 5-star community reputation.',
    recommendedDurationSec: 35,
    avgConversionRate: '8.2% Instant Quote Request',
    keyPsychologicalTriggers: ['Same-Day Relief', 'Licensed Trust', 'Fixed-Price Peace of Mind', 'Energy Independence'],
    hookBlueprints: [
      {
        pattern: 'Emergency Relief Hook',
        example: 'Burst geyser or power outage? Our certified technicians arrive at your door within 45 minutes guaranteed.',
        targetEmotion: 'Urgent Relief'
      },
      {
        pattern: 'Solar Independence Hook',
        example: 'Slash your monthly municipal electricity bill by 85% and never experience another minute of load shedding.',
        targetEmotion: 'Self-Reliance & Savings'
      }
    ],
    visualMetaphors: [
      'Friendly uniformed technician greeting homeowner with digital tablet and transparent estimate',
      'Drone aerial of sleek solar array installed on modern residential roof in bright sunshine',
      'Before-and-after split-screen of chaotic faulty wiring transformed into clean labeled electrical box'
    ],
    pacingGuidelines: {
      hookDurationSec: 3,
      problemAgitationSec: 8,
      solutionRevealSec: 13,
      proofSocialProofSec: 6,
      ctaDurationSec: 5
    },
    defaultStockTags: ['solar panel installation roof drone', 'friendly electrician technician uniform', 'modern residential home sunny day', 'happy family living room safe home'],
    recommendedMotion: 'bright natural daylight tracking, split-screen reveals, badge callouts',
    complianceNotes: 'Display professional electrical/plumbing trade board license numbers and insurance coverage.'
  }
};

export function getIndustryIntelligence(id: IndustryId): IndustryIntelligence {
  return INDUSTRY_CATALOG[id] || INDUSTRY_CATALOG['b2b-saas'];
}
