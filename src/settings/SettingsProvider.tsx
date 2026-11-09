import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BGM_VOLUME_DEFAULT, SFX_VOLUME_DEFAULT } from '../constants/audio';
import { DEFAULT_PLAYER_AVATAR_ID, resolveAvatarId, type AvatarId } from '../constants/avatars';
import { clampVolume } from './volume';

const STORAGE_KEY = 'appSettings';

export interface AppSettings {
  playerAvatarId: AvatarId;
  careerModeEnabled: boolean;
  backgroundMusicEnabled: boolean;
  soundEffectsEnabled: boolean;
  backgroundMusicVolume: number;
  soundEffectsVolume: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  playerAvatarId: DEFAULT_PLAYER_AVATAR_ID,
  careerModeEnabled: true,
  backgroundMusicEnabled: true,
  soundEffectsEnabled: true,
  backgroundMusicVolume: BGM_VOLUME_DEFAULT,
  soundEffectsVolume: SFX_VOLUME_DEFAULT,
};

function loadSettings(raw: string | null): AppSettings {
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      playerAvatarId: resolveAvatarId(parsed.playerAvatarId, DEFAULT_PLAYER_AVATAR_ID),
      careerModeEnabled: parsed.careerModeEnabled ?? DEFAULT_SETTINGS.careerModeEnabled,
      backgroundMusicEnabled: parsed.backgroundMusicEnabled ?? DEFAULT_SETTINGS.backgroundMusicEnabled,
      soundEffectsEnabled: parsed.soundEffectsEnabled ?? DEFAULT_SETTINGS.soundEffectsEnabled,
      backgroundMusicVolume: clampVolume(
        parsed.backgroundMusicVolume,
        DEFAULT_SETTINGS.backgroundMusicVolume,
      ),
      soundEffectsVolume: clampVolume(parsed.soundEffectsVolume, DEFAULT_SETTINGS.soundEffectsVolume),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface SettingsContextValue {
  settings: AppSettings;
  loaded: boolean;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) {
          return;
        }
        setSettings(loadSettings(raw));
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loaded,
      updateSettings,
    }),
    [settings, loaded, updateSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
