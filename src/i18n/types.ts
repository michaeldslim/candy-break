export type Language = 'ko' | 'en';

export type PlayStyleBannerKey =
  | 'classic'
  | 'color-target'
  | 'locked-tiles'
  | 'multiplier-rush'
  | 'bomb-storm'
  | 'timer-attack'
  | 'order-collect'
  | 'combo-goal'
  | 'move-saver'
  | 'pure-match';

export interface IStrings {
  app: {
    title: string;
  };
  hud: {
    stars: string;
    best: string;
    score: string;
    level: string;
    goal: string;
    scoreGoal: string;
    combos: string;
    time: string;
    multi: string;
    frozen: string;
    saved: string;
    moves: string;
  };
  banners: Record<PlayStyleBannerKey, { label: string; hint: string }>;
  gameOver: {
    titleLose: string;
    titleWin: string;
    noMoves: string;
    timeOut: string;
    frozenRemain: string;
    win: string;
  };
  stageClear: string;
  combo: string;
  colors: Record<string, string>;
  instruction: {
    title: string;
    buttonResume: string;
    buttonStart: string;
    sections: Array<{ heading: string; items: string[] }>;
  };
}
