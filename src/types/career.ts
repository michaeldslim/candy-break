export type CareerRank =
  | 'intern'
  | 'staff'
  | 'assistant'
  | 'manager'
  | 'deputy'
  | 'director'
  | 'executive'
  | 'ceo';

export interface CareerState {
  rank: CareerRank;
  promotionWins: number;
  highestRankAchieved: CareerRank;
}

export interface RunResultInput {
  won: boolean;
  /** Level just cleared — only when won is true. */
  completedLevel?: number;
}

export interface PromotionResult {
  nextState: CareerState;
  promoted: CareerRank | null;
  lost: boolean;
  noProgressDifficulty: boolean;
  unchanged: boolean;
}

export interface PromotionTarget {
  requiredWins: number;
  minGameLevel?: number;
  nextRank: CareerRank;
}
