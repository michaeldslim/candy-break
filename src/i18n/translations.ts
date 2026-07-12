import { IStrings, Language } from './types';

const ko: IStrings = {
  app: {
    title: 'Candy Break',
  },
  hud: {
    stars: '별',
    best: '최고',
    score: '점수',
    level: '레벨',
    goal: '목표',
    scoreGoal: '점수 목표',
    combos: '콤보',
    time: '시간',
    multi: '배율',
    frozen: '얼음',
    saved: '환급',
    moves: '이동',
  },
  banners: {
    classic: { label: '클래식', hint: '{goal}개 캔디 제거' },
    'color-target': { label: '컬러 타겟', hint: '{color} 캔디만 Goal에 반영' },
    'locked-tiles': { label: '잠긴 타일', hint: '❄️ 옆에서 매치해 해동' },
    'multiplier-rush': { label: '멀티플라이어', hint: '콤보로 점수 배율 상승!' },
    'bomb-storm': { label: '폭탄 스톰', hint: '폭탄을 탭해 다음 스테이지로' },
    'timer-attack': { label: '타이머 어택', hint: '{goal}개 제거 (제한 시간)' },
    'order-collect': { label: '오더 콜렉트', hint: '{color} 캔디를 순서대로' },
    'combo-goal': { label: '콤보 골', hint: '연쇄 매치만 Goal에 반영' },
    'move-saver': { label: '무브 세이버', hint: '2연쇄 이상 시 이동 1회 환급 (최대 {cap}/스테이지)' },
    'pure-match': { label: '퓨어 매치', hint: '스트라이프·무지개 캔디 없음' },
  },
  gameOver: {
    titleLose: '게임 오버',
    titleWin: '승리!',
    noMoves: '이동 횟수가 없습니다. 아무 곳이나 탭해 이 스테이지를 다시 시도하세요.',
    timeOut: '시간이 초과되었습니다. 아무 곳이나 탭해 이 스테이지를 다시 시도하세요.',
    frozenRemain: '얼어붙은 타일이 남았습니다. 아무 곳이나 탭해 이 스테이지를 다시 시도하세요.',
    win: '모든 스테이지를 완료했습니다! 아무 곳이나 탭해 새 게임을 시작하세요.',
  },
  stageClear: '스테이지 클리어!',
  combo: '+콤보 x{combo}!',
  colors: {
    Red: '빨강',
    Blue: '파랑',
    Gold: '금색',
    Mint: '민트',
  },
  instruction: {
    title: '게임 방법',
    buttonResume: '지난 게임 계속하기',
    buttonStart: '새 게임',
    sections: [
      {
        heading: '기본',
        items: [
          '인접한 캔디 두 개를 탭해 위치를 바꾸세요.',
          '같은 모양 3개 이상이 가로/세로로 맞춰지면 제거됩니다.',
          '4개 매치 → 줄무늬(열/행 제거), 5개 이상 → 무지개(같은 종류 전부 제거)',
        ],
      },
      {
        heading: '플레이 스타일',
        items: [
          '🍬 클래식 — 제한 이동 안에 목표 수 제거',
          '🎯 컬러 타겟 — 지정 색상 캔디만 Goal에 반영',
          '❄️ 잠긴 타일 — 인접 매치로 얼어붙은 칸 해제',
          '✖️ 멀티플라이어 — 연속 콤보로 배율 최대 8배',
          '💣 폭탄 스톰 — 탭으로 폭탄을 터뜨려 주변 제거',
          '⏱️ 타이머 어택 — 90초 안에 최대한 많이 제거',
          '📋 오더 콜렉트 — 색상을 순서대로 수집 (다른 색은 Goal에 반영 안 됨)',
          '🔗 콤보 골 — 연쇄 매치(캐스케이드)만 Goal에 반영',
          '💾 무브 세이버 — 2연쇄 이상 시 이동 1회 환급 (스테이지당 최대 3회)',
          '🧩 퓨어 매치 — 스트라이프·무지개 캔디 없이 순수 매칭만',
        ],
      },
    ],
  },
};

const en: IStrings = {
  app: {
    title: 'Candy Break',
  },
  hud: {
    stars: 'Stars',
    best: 'Best',
    score: 'Score',
    level: 'Level',
    goal: 'Goal',
    scoreGoal: 'Score Goal',
    combos: 'Combos',
    time: 'Time',
    multi: 'Multi',
    frozen: 'Frozen',
    saved: 'Saved',
    moves: 'Moves',
  },
  banners: {
    classic: { label: 'Classic', hint: 'Clear {goal} candies' },
    'color-target': { label: 'Color Target', hint: 'Only {color} candies count' },
    'locked-tiles': { label: 'Locked Tiles', hint: 'Match next to ❄️ to thaw' },
    'multiplier-rush': { label: 'Multiplier Rush', hint: 'Combos double your score!' },
    'bomb-storm': { label: 'Bomb Storm', hint: 'Tap the bomb to advance' },
    'timer-attack': { label: 'Timer Attack', hint: 'Clear {goal} before time runs out' },
    'order-collect': { label: 'Order Collect', hint: 'Clear {color} candies in order' },
    'combo-goal': { label: 'Combo Goal', hint: 'Only cascade matches count toward Goal' },
    'move-saver': { label: 'Move Saver', hint: '2+ cascades refund 1 move (max {cap}/stage)' },
    'pure-match': { label: 'Pure Match', hint: 'No striped or rainbow candies' },
  },
  gameOver: {
    titleLose: 'Game Over',
    titleWin: 'You Win!',
    noMoves: 'No moves left. Tap anywhere to retry this stage.',
    timeOut: 'Time ran out! Tap anywhere to retry this stage.',
    frozenRemain: 'Too many frozen tiles remain. Tap anywhere to retry this stage.',
    win: 'All stages completed! Tap anywhere to start a new game.',
  },
  stageClear: 'Stage Clear!',
  combo: '+combo x{combo}!',
  colors: {
    Red: 'Red',
    Blue: 'Blue',
    Gold: 'Gold',
    Mint: 'Mint',
  },
  instruction: {
    title: 'How to Play',
    buttonResume: 'Resume Last Game',
    buttonStart: 'New Game',
    sections: [
      {
        heading: 'Basics',
        items: [
          'Tap two adjacent candies to swap them.',
          'Match 3+ of the same shape in a row or column to clear and score.',
          '4-match → stripe (clears a row/column), 5+ → rainbow (clears all of that kind)',
        ],
      },
      {
        heading: 'Play Styles',
        items: [
          '🍬 Classic — clear the target count within limited moves',
          '🎯 Color Target — only the chosen color counts toward your Goal',
          '❄️ Locked Tiles — thaw frozen cells with adjacent matches',
          '✖️ Multiplier Rush — chain combos to boost score up to 8×',
          '💣 Bomb Storm — tap bombs to blast nearby candies',
          '⏱️ Timer Attack — no move limit, clear as many as you can in 90s',
          '📋 Order Collect — clear colors in sequence; only the active color counts',
          '🔗 Combo Goal — only cascade matches (not your first match) count toward Goal',
          '💾 Move Saver — 2+ cascades refund 1 move (max 3 per stage)',
          '🧩 Pure Match — no striped or rainbow candies; basic matches only',
        ],
      },
    ],
  },
};

export const translations: Record<Language, IStrings> = { ko, en };
