import { ICandyBreak, IGameConfig, IGameShape } from '../types';

export const GAME_BASE_ROWS = 12;
export const GAME_BASE_COLS = 8;
export const GAME_BASE_MIN_MATCH = 3;
export const GAME_BASE_EASY_MOVES = 20;
export const GAME_BASE_EASY_GOAL = 35;
export const GAME_BASE_EASY_COLOR_KINDS = 4;

export const SCORE_BASE_POINTS = 15;
export const SCORE_EXTRA_TILE_POINTS = 5;
export const SCORE_COMBO_POINTS = 10;
export const BOMB_SCORE_BONUS = 50;

export const TIMER_ATTACK_SECONDS = 90;
export const LOCKED_TILES_FREEZE_RATIO = 0.2;  // 20% of cells
export const BOMB_STORM_SPAWN_RATIO = 0.3;     // spawn at 30% moves remaining
export const BOMB_STORM_RESPAWNS = 1;          // 1 respawn = 2 bombs total
export const ORDER_COLLECT_BASE_PER_COLOR = 12;
export const ORDER_COLLECT_COLORS = ['Red', 'Blue', 'Gold'];
export const MOVE_SAVER_REFUND_CAP = 3;

export const FULL_MASK: boolean[][] = Array.from({ length: GAME_BASE_ROWS }, () =>
  Array.from({ length: GAME_BASE_COLS }, () => true)
);

export const FIREWORK_COLORS = [
  '#FF6B6B',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
  '#C084FC',
  '#FF9F43',
  '#FF6BFF',
];
export const FIREWORK_NUM_BURSTS = 10;
export const FIREWORK_PARTICLES_PER_BURST = 10;

export const GAME_CONFIG: IGameConfig = {
  rows: GAME_BASE_ROWS,
  cols: GAME_BASE_COLS,
  minMatch: GAME_BASE_MIN_MATCH,
  easyMoves: GAME_BASE_EASY_MOVES,
  easyGoal: GAME_BASE_EASY_GOAL,
  easyColorKinds: GAME_BASE_EASY_COLOR_KINDS,
};

export const GAME_SHAPES: IGameShape[] = [
  {
    id: 'classic',
    label: 'Classic',
    mask: FULL_MASK,
    playStyle: 'classic',
  },
  {
    id: 'color-target',
    label: 'Color Target',
    mask: FULL_MASK,
    playStyle: 'color-target',
  },
  {
    id: 'locked-tiles',
    label: 'Locked Tiles',
    mask: FULL_MASK,
    playStyle: 'locked-tiles',
  },
  {
    id: 'multiplier-rush',
    label: 'Multiplier Rush',
    mask: FULL_MASK,
    playStyle: 'multiplier-rush',
    scoreThreshold: 1500,
  },
  {
    id: 'bomb-storm',
    label: 'Bomb Storm',
    mask: FULL_MASK,
    playStyle: 'bomb-storm',
    bombRespawns: BOMB_STORM_RESPAWNS,
  },
  {
    id: 'timer-attack',
    label: 'Timer Attack',
    mask: FULL_MASK,
    playStyle: 'timer-attack',
    timerSeconds: TIMER_ATTACK_SECONDS,
  },
  {
    id: 'order-collect',
    label: 'Order Collect',
    mask: FULL_MASK,
    playStyle: 'order-collect',
  },
  {
    id: 'combo-goal',
    label: 'Combo Goal',
    mask: FULL_MASK,
    playStyle: 'combo-goal',
  },
  {
    id: 'move-saver',
    label: 'Move Saver',
    mask: FULL_MASK,
    playStyle: 'move-saver',
  },
];

export const COLOR_POOL: ICandyBreak[] = [
  { candyBreak: 'Red' },
  { candyBreak: 'Blue' },
  { candyBreak: 'Gold' },
  { candyBreak: 'Mint' },
];
