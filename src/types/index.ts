export interface ICandyBreak {
  color: string;
  candyBreak: string;
}

export interface IPosition {
  row: number;
  col: number;
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
}

export interface IScoreResult {
  points: number;
  comboAwarded: number;
}

export interface IGameShape {
  id: string;
  label: string;
  mask: boolean[][];
}

export type IBoardCell = ICandyBreak | null;
export type IBoard = IBoardCell[][];
