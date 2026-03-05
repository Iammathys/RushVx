export interface PlatformValidator {
  maxDurationSec: number;
  width: number;
  height: number;
  fps: number[];
  vCodec: string;
  aCodec: string;
  fastStart?: boolean;
}

export type ValidatorsMap = Record<string, PlatformValidator>;

export function validateDuration(platform: PlatformValidator, durationSec: number): string | null {
  if (durationSec > platform.maxDurationSec) {
    return `Durée max ${platform.maxDurationSec}s pour cette plateforme (actuel: ${Math.round(durationSec)}s).`;
  }
  return null;
}

export function validateFps(platform: PlatformValidator, fps: number): string | null {
  if (!platform.fps.includes(fps)) {
    return `FPS supportés: ${platform.fps.join(', ')} (actuel: ${fps}).`;
  }
  return null;
}

export function getValidatorWarnings(
  validators: ValidatorsMap,
  durationSec: number,
  fps: number
): { platform: string; message: string }[] {
  const warnings: { platform: string; message: string }[] = [];
  for (const [name, platform] of Object.entries(validators)) {
    const d = validateDuration(platform, durationSec);
    if (d) warnings.push({ platform: name, message: d });
    const f = validateFps(platform, fps);
    if (f) warnings.push({ platform: name, message: f });
  }
  return warnings;
}
