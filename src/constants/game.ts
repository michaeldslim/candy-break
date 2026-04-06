import { ICandyBreak, IGameConfig, IGameShape } from '../types';

export const GAME_CONFIG: IGameConfig = {
  rows: 8,
  cols: 8,
  minMatch: 3,
  easyMoves: 20,
  easyGoal: 35,
  easyColorKinds: 4,
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
