import { getPromotionTarget, isHigherRank, meetsMinGameLevel } from './careerRules';
import type {
  CareerRank,
  CareerState,
  PromotionResult,
  RunResultInput,
} from '../types/career';

export const DEFAULT_CAREER_STATE: CareerState = {
  rank: 'intern',
  promotionWins: 0,
  highestRankAchieved: 'intern',
};

function withHighestRank(state: CareerState, rank: CareerRank): CareerState {
  return {
    ...state,
    rank,
    highestRankAchieved: isHigherRank(rank, state.highestRankAchieved)
      ? rank
      : state.highestRankAchieved,
  };
}

export function applyRunResult(state: CareerState, input: RunResultInput): PromotionResult {
  if (!input.won) {
    return {
      nextState: state,
      promoted: null,
      lost: true,
      noProgressDifficulty: false,
      unchanged: false,
    };
  }

  const completedLevel = input.completedLevel ?? 0;
  const target = getPromotionTarget(state.rank);

  if (!target) {
    return {
      nextState: state,
      promoted: null,
      lost: false,
      noProgressDifficulty: false,
      unchanged: false,
    };
  }

  if (target.minGameLevel && !meetsMinGameLevel(completedLevel, target.minGameLevel)) {
    return {
      nextState: state,
      promoted: null,
      lost: false,
      noProgressDifficulty: true,
      unchanged: false,
    };
  }

  const nextWins = state.promotionWins + 1;

  if (nextWins < target.requiredWins) {
    return {
      nextState: {
        ...state,
        promotionWins: nextWins,
      },
      promoted: null,
      lost: false,
      noProgressDifficulty: false,
      unchanged: false,
    };
  }

  const promotedRank = target.nextRank;
  return {
    nextState: withHighestRank(
      {
        ...state,
        promotionWins: 0,
      },
      promotedRank,
    ),
    promoted: promotedRank,
    lost: false,
    noProgressDifficulty: false,
    unchanged: false,
  };
}
