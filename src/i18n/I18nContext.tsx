import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { format } from './format';
import { translations } from './translations';
import { IStrings, Language } from './types';

const LANGUAGE_KEY = 'appLanguage';

interface II18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  strings: IStrings;
  format: typeof format;
  ready: boolean;
}

const I18nContext = createContext<II18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ko');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((stored) => {
        if (stored === 'ko' || stored === 'en') {
          setLanguageState(stored);
        }
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    AsyncStorage.setItem(LANGUAGE_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      strings: translations[language],
      format,
      ready,
    }),
    [language, ready, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): II18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
