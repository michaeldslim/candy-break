import type { CareerRank, PromotionTarget } from '../types/career';

export const CAREER_RANK_ORDER: CareerRank[] = [
  'intern',
  'staff',
  'assistant',
  'manager',
  'deputy',
  'director',
  'executive',
  'ceo',
];

const PROMOTION_RULES: Partial<
  Record<CareerRank, { requiredWins: number; minGameLevel?: number }>
> = {
  intern: { requiredWins: 3 },
  staff: { requiredWins: 5 },
  assistant: { requiredWins: 7 },
  manager: { requiredWins: 10 },
  deputy: { requiredWins: 5, minGameLevel: 3 },
  director: { requiredWins: 7, minGameLevel: 4 },
  executive: { requiredWins: 5, minGameLevel: 5 },
};

export function getNextRank(rank: CareerRank): CareerRank | null {
  const index = CAREER_RANK_ORDER.indexOf(rank);
  if (index < 0 || index >= CAREER_RANK_ORDER.length - 1) {
    return null;
  }
  return CAREER_RANK_ORDER[index + 1];
}

export function meetsMinGameLevel(completedLevel: number, minimum: number): boolean {
  return completedLevel >= minimum;
}

export function getPromotionTarget(rank: CareerRank): PromotionTarget | null {
  const nextRank = getNextRank(rank);
  if (!nextRank) {
    return null;
  }

  const rule = PROMOTION_RULES[rank];
  if (!rule) {
    return null;
  }

  return {
    nextRank,
    requiredWins: rule.requiredWins,
    minGameLevel: rule.minGameLevel,
  };
}

export function rankIndex(rank: CareerRank): number {
  return CAREER_RANK_ORDER.indexOf(rank);
}

export function getRequirementToReachRank(rank: CareerRank): PromotionTarget | null {
  const index = CAREER_RANK_ORDER.indexOf(rank);
  if (index <= 0) {
    return null;
  }

  return getPromotionTarget(CAREER_RANK_ORDER[index - 1]);
}

export function isHigherRank(left: CareerRank, right: CareerRank): boolean {
  return rankIndex(left) > rankIndex(right);
}
