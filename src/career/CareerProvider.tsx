import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSettings } from '../settings/SettingsProvider';
import { applyRunResult, DEFAULT_CAREER_STATE } from './careerProgress';
import { loadCareerState, saveCareerState } from './careerStorage';
import type { CareerState, PromotionResult, RunResultInput } from '../types/career';

interface CareerContextValue {
  careerState: CareerState;
  loaded: boolean;
  recordRunResult: (input: RunResultInput) => PromotionResult | null;
}

const CareerContext = createContext<CareerContextValue | null>(null);

export function CareerProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [careerState, setCareerState] = useState<CareerState>(DEFAULT_CAREER_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadCareerState()
      .then((state) => {
        if (!cancelled) {
          setCareerState(state);
        }
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

  const recordRunResult = useCallback(
    (input: RunResultInput): PromotionResult | null => {
      if (!settings.careerModeEnabled) {
        return null;
      }

      const result = applyRunResult(careerState, input);
      setCareerState(result.nextState);
      void saveCareerState(result.nextState);
      return result;
    },
    [careerState, settings.careerModeEnabled],
  );

  const value = useMemo(
    () => ({
      careerState,
      loaded,
      recordRunResult,
    }),
    [careerState, loaded, recordRunResult],
  );

  return <CareerContext.Provider value={value}>{children}</CareerContext.Provider>;
}

export function useCareer(): CareerContextValue {
  const context = useContext(CareerContext);
  if (!context) {
    throw new Error('useCareer must be used within CareerProvider');
  }
  return context;
}
