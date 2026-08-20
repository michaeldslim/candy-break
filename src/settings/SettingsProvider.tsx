import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_PLAYER_AVATAR_ID, resolveAvatarId, type AvatarId } from '../constants/avatars';

const STORAGE_KEY = 'appSettings';

export interface AppSettings {
  playerAvatarId: AvatarId;
  careerModeEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  playerAvatarId: DEFAULT_PLAYER_AVATAR_ID,
  careerModeEnabled: true,
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
