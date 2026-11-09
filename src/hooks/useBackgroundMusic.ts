import { Audio } from 'expo-av';
import { useEffect, useRef } from 'react';
import { BGM_SOURCE, BGM_VOLUME_DEFAULT } from '../constants/audio';

export type UseBackgroundMusicOptions = {
  /** When false, playback is paused (e.g. home, settings, in-game pause). */
  shouldPlay: boolean;
  /** User setting — master switch for background music. */
  enabled: boolean;
  volume?: number;
};

async function configureAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}

/**
 * Loads and loops background music. Safe to call when `enabled` is false — track stays paused.
 */
export function useBackgroundMusic({
  shouldPlay,
  enabled,
  volume = BGM_VOLUME_DEFAULT,
}: UseBackgroundMusicOptions): void {
  const soundRef = useRef<Audio.Sound | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const load = async (): Promise<void> => {
      try {
        await configureAudioMode();
        const { sound } = await Audio.Sound.createAsync(BGM_SOURCE, {
          isLooping: true,
          volume,
          shouldPlay: false,
        });
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        readyRef.current = true;
      } catch {
        readyRef.current = false;
        soundRef.current = null;
      }
    };

    void load();

    return () => {
      mounted = false;
      readyRef.current = false;
      const sound = soundRef.current;
      soundRef.current = null;
      if (sound) {
        void sound.unloadAsync();
      }
    };
  }, [volume]);

  useEffect(() => {
    const sound = soundRef.current;
    if (!sound || !readyRef.current) {
      return;
    }

    const syncPlayback = async (): Promise<void> => {
      try {
        await sound.setVolumeAsync(volume);
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
          return;
        }
        const wantPlay = enabled && shouldPlay;
        if (wantPlay && !status.isPlaying) {
          await sound.playAsync();
        } else if (!wantPlay && status.isPlaying) {
          await sound.pauseAsync();
        }
      } catch {
        // ignore unload races
      }
    };

    void syncPlayback();
  }, [enabled, shouldPlay, volume]);
}
