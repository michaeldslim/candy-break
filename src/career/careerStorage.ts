import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CAREER_STATE } from './careerProgress';
import { CAREER_RANK_ORDER } from './careerRules';
import type { CareerRank, CareerState } from '../types/career';

const STORAGE_KEY = 'careerState';

function isCareerRank(value: unknown): value is CareerRank {
  return typeof value === 'string' && CAREER_RANK_ORDER.includes(value as CareerRank);
}

function resolvePromotionWins(parsed: Partial<CareerState> & { promotionStreak?: number }): number {
  const raw =
    typeof parsed.promotionWins === 'number'
      ? parsed.promotionWins
      : typeof parsed.promotionStreak === 'number'
        ? parsed.promotionStreak
        : 0;

  if (Number.isNaN(raw) || raw < 0) {
    return 0;
  }

  return Math.floor(raw);
}

export function parseCareerState(raw: string | null): CareerState {
  if (!raw) {
    return DEFAULT_CAREER_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CareerState> & { promotionStreak?: number };
    const rank = isCareerRank(parsed.rank) ? parsed.rank : DEFAULT_CAREER_STATE.rank;
    const highestRankAchieved = isCareerRank(parsed.highestRankAchieved)
      ? parsed.highestRankAchieved
      : rank;

    return {
      rank,
      promotionWins: resolvePromotionWins(parsed),
      highestRankAchieved,
    };
  } catch {
    return DEFAULT_CAREER_STATE;
  }
}

export async function loadCareerState(): Promise<CareerState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return parseCareerState(raw);
}

export async function saveCareerState(state: CareerState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
