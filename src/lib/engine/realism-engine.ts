import { Shot } from './types';

export interface RealismParameters {
  sensorType: string;
  lensType: string;
  lightingStyle: string;
  colorGradeLUT: string;
  motionPhysics: string;
}

export const CINEMATIC_PRESETS: Record<string, RealismParameters> = {
  enterprise_tech: {
    sensorType: 'Arri Alexa 35 LF Large Format Sensor, RAW 4K',
    lensType: 'Cooke Anamorphic /i Prime 40mm, f/2.0, subtle horizontal blue streak flare',
    lightingStyle: 'Architectural soft ambient window light, 5600K balanced with warm 3200K interior accents',
    colorGradeLUT: 'Kodak 2383 Film Print Emulation, deep obsidian blacks, crisp cyan highlights',
    motionPhysics: 'Subtle Steadicam glide forward, fluid organic camera operator breathing',
  },
  luxury_lifestyle: {
    sensorType: 'RED V-Raptor 8K VV, Ultra High Dynamic Range',
    lensType: 'Leica Noctilux-M 50mm f/0.95, creamy soft bokeh, natural depth of field falloff',
    lightingStyle: 'Low-angle golden hour sunset backlighting, atmospheric volumetric dust motes',
    colorGradeLUT: 'Warm Tuscan Gold & Velvet Shadows, saturated skin tones, high micro-contrast',
    motionPhysics: 'Heavy camera crane descending gracefully into interior space',
  },
  gritty_industrial: {
    sensorType: 'Sony FX9 Full Frame, Dual Native ISO 4000',
    lensType: 'Zeiss Supreme Prime 28mm T1.5, zero chromatic aberration, tack-sharp edge-to-edge',
    lightingStyle: 'High-contrast industrial neon and amber spark reflections, moody directional rim light',
    colorGradeLUT: 'Cool Industrial Teal & Orange tungsten contrast, punchy midtone texture',
    motionPhysics: 'Snappy dynamic tracking alongside automated machinery, rapid parallax movement',
  }
};

export const STANDARD_NEGATIVE_PROMPT = 
  'cartoon, 3d render, cgi, plastic skin, uncanny valley, anime, over-saturated, airbrushed, oversmoothed surfaces, extra fingers, deformed limbs, floating artifacts, generic watermark, blurry background artifacts, low resolution, amateur video, flat lighting';

export function enrichRealismPrompt(
  rawIdea: string,
  shotType: Shot['shotType'],
  cameraMotion: Shot['cameraMotion'],
  lighting: Shot['lightingStyle'],
  presetKey: keyof typeof CINEMATIC_PRESETS = 'enterprise_tech'
): string {
  const preset = CINEMATIC_PRESETS[presetKey] || CINEMATIC_PRESETS.enterprise_tech;

  const shotTypeMap: Record<Shot['shotType'], string> = {
    macro_detail: 'Extremely detailed macro close-up with tactile surface textures and micro-reflections',
    wide_establishing: 'Sweeping 4K wide architectural establishing shot with deep atmospheric perspective',
    medium_over_shoulder: 'Cinematic medium over-the-shoulder shot capturing authentic human presence and focus',
    dynamic_tracking: 'High-velocity tracking shot maintaining razor-sharp subject focus while background blurs',
    cinematic_drone: 'High-altitude cinematic aerial sweeping gracefully across the environment',
    screen_ui_demo: 'Clean crisp screen interface interacting seamlessly with human hands, zero glare reflection'
  };

  const motionMap: Record<Shot['cameraMotion'], string> = {
    subtle_zoom_in: 'Slow imperceptible optical dolly push-in elevating emotional tension',
    lateral_truck_right: 'Smooth horizontal truck right creating three-dimensional spatial parallax',
    cinematic_pan: 'Elegant sweeping rotational pan revealing scale and prestige',
    dolly_forward: 'Steadicam dolly forward gliding smoothly through the space',
    static_hero: 'Locked-off majestic hero shot with subtle ambient wind and natural light movement'
  };

  return [
    `Ultra-realistic 4K commercial cinema: ${rawIdea}.`,
    `Framing: ${shotTypeMap[shotType]}.`,
    `Camera Motion: ${motionMap[cameraMotion]}.`,
    `Optics: Shot on ${preset.sensorType} with ${preset.lensType}.`,
    `Lighting: ${preset.lightingStyle}.`,
    `Color Science: ${preset.colorGradeLUT}. Natural skin pores, authentic cloth weaves, physical materials, photorealistic physics, 24fps film motion blur.`
  ].join(' ');
}
