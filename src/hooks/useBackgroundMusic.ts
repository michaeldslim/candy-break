import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';

interface IUseBackgroundMusicResult {
  isMusicOn: boolean;
  canPlayMusic: boolean;
  toggleMusic: () => void;
}

const BACKGROUND_TRACK = require('../../assets/audio/bg-loop.wav');

export const useBackgroundMusic = (): IUseBackgroundMusicResult => {
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [canPlayMusic, setCanPlayMusic] = useState(true);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async (): Promise<void> => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          BACKGROUND_TRACK,
          {
            shouldPlay: isMusicOn,
            isLooping: true,
            volume: 0.35,
          },
        );

        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
        setCanPlayMusic(true);
      } catch {
        if (isMounted) {
          setCanPlayMusic(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      const currentSound = soundRef.current;
      soundRef.current = null;
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    const syncPlayback = async (): Promise<void> => {
      const currentSound = soundRef.current;
      if (!currentSound) {
        return;
      }

      try {
        if (isMusicOn) {
          await currentSound.playAsync();
        } else {
          await currentSound.pauseAsync();
        }
      } catch {
        setCanPlayMusic(false);
      }
    };

    syncPlayback();
  }, [isMusicOn]);

  const toggleMusic = useCallback(() => {
    if (!canPlayMusic) {
      return;
    }
    setIsMusicOn((prev) => !prev);
  }, [canPlayMusic]);

  return {
    isMusicOn,
    canPlayMusic,
    toggleMusic,
  };
};
