export type PlayStyle =
  | 'classic'
  | 'color-target'
  | 'locked-tiles'
  | 'multiplier-rush'
  | 'bomb-storm'
  | 'timer-attack'
  | 'order-collect'
  | 'combo-goal'
  | 'move-saver';

export interface IOrderStep {
  color: string;
  count: number;
}

export interface ICandyBreak {
  candyBreak: string;
  special?: 'striped-h' | 'striped-v' | 'rainbow';
}

export interface IPosition {
  row: number;
  col: number;
}

export interface IFrozenCell extends IPosition {
  hitsRemaining: number; // 2 = needs 2 adjacent matches to thaw; 0 = thawed
}

export interface IPieceCell extends IPosition {
  colorItem: ICandyBreak;
}

export interface IFallingPiece {
  pivot: IPosition;
  colors: ICandyBreak[];
  rotation: number;
}

export interface IGameConfig {
  rows: number;
  cols: number;
  minMatch: number;
  easyMoves: number;
  easyGoal: number;
  easyColorKinds: number;
}

export interface IResolveResult {
  board: IBoard;
  totalCleared: number;
  comboCount: number;
  clearedByColor: Record<string, number>;
}

export interface IScoreResult {
  points: number;
  comboAwarded: number;
}

export interface IGameShape {
  id: string;
  label: string;
  mask: boolean[][];
  playStyle: PlayStyle;
  targetColor?: string;
  frozenCount?: number;
  scoreThreshold?: number;
  timerSeconds?: number;
  bombRespawns?: number;
}

export type IBoardCell = ICandyBreak | null;
export type IBoard = IBoardCell[][];
