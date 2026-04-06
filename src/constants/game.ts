import { ICandyBreak, IGameConfig, IGameShape } from '../types';

export const GAME_BASE_ROWS = 8;
export const GAME_BASE_COLS = 8;
export const GAME_BASE_MIN_MATCH = 3;
export const GAME_BASE_EASY_MOVES = 20;
export const GAME_BASE_EASY_GOAL = 35;
export const GAME_BASE_EASY_COLOR_KINDS = 4;

export const SCORE_BASE_POINTS = 15;
export const SCORE_EXTRA_TILE_POINTS = 5;
export const SCORE_COMBO_POINTS = 10;

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
    id: 'square',
    label: 'Square',
    mask: [
      [false, false, false, false, false, false, false, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false],
      [false, false, false, false, false, false, false, false],
    ],
  },
  {
    id: 'diamond',
    label: 'Diamond',
    mask: [
      [false, false, false, true, true, false, false, false],
      [false, false, true, true, true, true, false, false],
      [false, true, true, true, true, true, true, false],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [false, true, true, true, true, true, true, false],
      [false, false, true, true, true, true, false, false],
      [false, false, false, true, true, false, false, false],
    ],
  },
  {
    id: 'plus',
    label: 'Plus',
    mask: [
      [false, false, true, true, true, true, false, false],
      [false, false, true, true, true, true, false, false],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [false, false, true, true, true, true, false, false],
      [false, false, true, true, true, true, false, false],
    ],
  },
  {
    id: 'ring',
    label: 'Ring',
    mask: [
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, false, false, false, false, true, true],
      [true, true, false, false, false, false, true, true],
      [true, true, false, false, false, false, true, true],
      [true, true, false, false, false, false, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
    ],
  },
  {
    id: 'hourglass',
    label: 'Hourglass',
    mask: [
      [true, true, true, true, true, true, true, true],
      [false, true, true, true, true, true, true, false],
      [false, false, true, true, true, true, false, false],
      [false, false, false, true, true, false, false, false],
      [false, false, false, true, true, false, false, false],
      [false, false, true, true, true, true, false, false],
      [false, true, true, true, true, true, true, false],
      [true, true, true, true, true, true, true, true],
    ],
  },
];

export const COLOR_POOL: ICandyBreak[] = [
  { color: '#ef476f', candyBreak: 'Red' },
  { color: '#118ab2', candyBreak: 'Blue' },
  { color: '#ffd166', candyBreak: 'Gold' },
  { color: '#06d6a0', candyBreak: 'Mint' },
  { color: '#ef476f', candyBreak: 'Red' },
  { color: '#118ab2', candyBreak: 'Blue' },
  { color: '#ffd166', candyBreak: 'Gold' },
  { color: '#06d6a0', candyBreak: 'Mint' },
  { color: '#ef476f', candyBreak: 'Red' },
  { color: '#118ab2', candyBreak: 'Blue' },
  { color: '#ffd166', candyBreak: 'Gold' },
  { color: '#06d6a0', candyBreak: 'Mint' },
];
