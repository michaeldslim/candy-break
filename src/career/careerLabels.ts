import { format } from '../i18n/format';
import type { IStrings, Language } from '../i18n/types';
import type { CareerRank, CareerState, PromotionResult } from '../types/career';
import { CAREER_RANK_ORDER, getPromotionTarget, getRequirementToReachRank, rankIndex } from './careerRules';

export type CareerRankKey = keyof IStrings['career']['ranks'];

export const CAREER_RANK_KEYS: Record<CareerRank, CareerRankKey> = {
  intern: 'intern',
  staff: 'staff',
  assistant: 'assistant',
  manager: 'manager',
  deputy: 'deputy',
  director: 'director',
  executive: 'executive',
  ceo: 'ceo',
};

export function careerRankLabel(strings: IStrings, rank: CareerRank): string {
  return strings.career.ranks[CAREER_RANK_KEYS[rank]];
}

export function isMaxCareerRank(state: CareerState): boolean {
  return getPromotionTarget(state.rank) === null;
}

export function getCareerProgressCopy(
  strings: IStrings,
  state: CareerState,
): { primary: string; secondary?: string } {
  const rankLabel = careerRankLabel(strings, state.rank);
  const target = getPromotionTarget(state.rank);

  if (!target) {
    return { primary: format(strings.career.maxRank, { rank: rankLabel }) };
  }

  return {
    primary: format(strings.career.homeBadge, {
      rank: rankLabel,
      current: state.promotionWins,
      required: target.requiredWins,
    }),
    secondary: format(strings.career.progressNext, {
      nextRank: careerRankLabel(strings, target.nextRank),
      required: target.requiredWins,
    }),
  };
}

function minLevelLabel(strings: IStrings, minGameLevel: number | undefined): string {
  if (!minGameLevel) {
    return '';
  }
  return format(strings.career.minLevel, { level: minGameLevel });
}

export function getCareerResultMessage(
  strings: IStrings,
  result: PromotionResult,
): string {
  const rankLabel = careerRankLabel(strings, result.nextState.rank);
  const target = getPromotionTarget(result.nextState.rank);

  if (result.lost && target) {
    return format(strings.career.lossKeepsProgress, {
      rank: rankLabel,
      current: result.nextState.promotionWins,
      required: target.requiredWins,
    });
  }

  if (result.noProgressDifficulty) {
    return format(strings.career.noProgressDifficulty, {
      minLevel: minLevelLabel(strings, target?.minGameLevel),
    });
  }

  return getCareerProgressCopy(strings, result.nextState).primary;
}

export function getPromotionRequirementCopy(
  strings: IStrings,
  rank: CareerRank,
): string | null {
  const requirement = getRequirementToReachRank(rank);
  if (!requirement) {
    return null;
  }

  if (requirement.minGameLevel) {
    return format(strings.career.ladder.requirementLevel, {
      wins: requirement.requiredWins,
      level: requirement.minGameLevel,
    });
  }

  return format(strings.career.ladder.requirement, { wins: requirement.requiredWins });
}

export type CareerLadderStatus = 'achieved' | 'current' | 'locked';

export function getCareerLadderStatus(state: CareerState, rank: CareerRank): CareerLadderStatus {
  const currentIndex = rankIndex(state.rank);
  const rowIndex = rankIndex(rank);

  if (rowIndex < currentIndex) {
    return 'achieved';
  }

  if (rowIndex === currentIndex) {
    return 'current';
  }

  return 'locked';
}

export function getCareerLadderRows(): CareerRank[] {
  return [...CAREER_RANK_ORDER].reverse();
}
