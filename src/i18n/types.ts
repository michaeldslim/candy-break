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
  | 'pure-match'
  | 'jelly-tiles'
  | 'stone-blocks';

export interface IStrings {
  common: {
    back: string;
  };
  app: {
    title: string;
  };
  home: {
    career: string;
  };
  settings: {
    title: string;
    language: string;
    gameplay: string;
    playerAvatar: string;
    playerAvatarDesc: string;
  };
  career: {
    ranks: Record<
      'intern' | 'staff' | 'assistant' | 'manager' | 'deputy' | 'director' | 'executive' | 'ceo',
      string
    >;
    promoted: { title: string; subtitle: string };
    ceoReached: { title: string; subtitle: string };
    progressNext: string;
    lossKeepsProgress: string;
    noProgressDifficulty: string;
    homeBadge: string;
    maxRank: string;
    minLevel: string;
    modeLabel: string;
    modeDesc: string;
    winDefinition: string;
    rulesSnippet: string;
    screen: {
      title: string;
      currentRank: string;
      highestRank: string;
      ladderTitle: string;
      winHint: string;
      disabledTitle: string;
      disabledBody: string;
      enableInSettings: string;
    };
    ladder: {
      achieved: string;
      current: string;
      locked: string;
      startingRank: string;
      requirement: string;
      requirementLevel: string;
      progressToNext: string;
    };
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
    jelly: string;
    stones: string;
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
    jellyRemain: string;
    stonesRemain: string;
    win: string;
  };
  stageClear: string;
  combo: string;
  colors: Record<string, string>;
  instruction: {
    playStylesHeading: string;
    buttonResume: string;
    buttonStart: string;
    sections: Array<{ heading: string; items: string[] }>;
  };
  leaderboard: {
    title: string;
    button: string;
    empty: string;
    close: string;
    rank: string;
    score: string;
  };
  recordCard: {
    title: string;
    score: string;
    initialsLabel: string;
    initialsPlaceholder: string;
    save: string;
    saved: string;
    playAgain: string;
    rank: string;
    saveError: string;
  };
}
