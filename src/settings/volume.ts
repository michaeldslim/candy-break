import { BGM_VOLUME_DEFAULT, SFX_VOLUME_DEFAULT } from '../constants/audio';

export const clampVolume = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  const stepped = Math.round(value * 20) / 20;
  return Math.min(1, Math.max(0, stepped));
};

export { BGM_VOLUME_DEFAULT as DEFAULT_BACKGROUND_MUSIC_VOLUME, SFX_VOLUME_DEFAULT as DEFAULT_SOUND_EFFECTS_VOLUME };
