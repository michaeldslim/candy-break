import {
  COLOR_POOL,
  SCORE_BASE_POINTS,
  SCORE_COMBO_POINTS,
  SCORE_EXTRA_TILE_POINTS,
} from '../constants/game';
import { IBoard, ICandyBreak, IPosition, IResolveResult, IScoreResult } from '../types';

const keyOf = (row: number, col: number): string => `${row}:${col}`;

const cloneBoard = (board: IBoard): IBoard => board.map((row) => [...row]);

const randomCandyBreak = (maxKinds: number): ICandyBreak => {
  const pool = COLOR_POOL.slice(0, Math.max(1, maxKinds));
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] ?? pool[0] ?? COLOR_POOL[0];
};

export const isPlayableCell = (mask: boolean[][], row: number, col: number): boolean => {
  if (row < 0 || col < 0) {
    return false;
  }
  const rowMask = mask[row];
  return rowMask?.[col] === true;
};

export const countPlayableCells = (mask: boolean[][]): number =>
  mask.reduce((sum, row) => sum + row.filter(Boolean).length, 0);

export const getRandomPlayablePosition = (mask: boolean[][]): IPosition | null => {
  const playable: IPosition[] = [];
  for (let row = 0; row < mask.length; row += 1) {
    for (let col = 0; col < (mask[0]?.length ?? 0); col += 1) {
      if (isPlayableCell(mask, row, col)) {
        playable.push({ row, col });
      }
    }
  }
  if (playable.length === 0) return null;
  return playable[Math.floor(Math.random() * playable.length)] ?? null;
};

export const createInitialBoard = (mask: boolean[][], maxKinds: number): IBoard => {
  const rows = mask.length;
  const cols = mask[0]?.length ?? 0;
  const board: IBoard = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!isPlayableCell(mask, row, col)) {
        continue;
      }

      let attempts = 0;
      let nextCube = randomCandyBreak(maxKinds);

      while (attempts < 16) {
        const left1 = board[row][col - 1];
        const left2 = board[row][col - 2];
        const up1 = board[row - 1]?.[col];
        const up2 = board[row - 2]?.[col];

        const createsHorizontal = left1 && left2 && left1.color === nextCube.color && left2.color === nextCube.color;
        const createsVertical = up1 && up2 && up1.color === nextCube.color && up2.color === nextCube.color;

        if (!createsHorizontal && !createsVertical) {
          break;
        }

        nextCube = randomCandyBreak(maxKinds);
        attempts += 1;
      }

      board[row][col] = nextCube;
    }
  }

  return board;
};

export const areAdjacent = (from: IPosition, to: IPosition): boolean =>
  Math.abs(from.row - to.row) + Math.abs(from.col - to.col) === 1;

const markRun = (positions: Set<string>, row: number, fromCol: number, toColExclusive: number): void => {
  for (let col = fromCol; col < toColExclusive; col += 1) {
    positions.add(keyOf(row, col));
  }
};

const markColumnRun = (positions: Set<string>, col: number, fromRow: number, toRowExclusive: number): void => {
  for (let row = fromRow; row < toRowExclusive; row += 1) {
    positions.add(keyOf(row, col));
  }
};

const findMatches = (board: IBoard, mask: boolean[][], minMatch: number): IPosition[] => {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const positions = new Set<string>();

  for (let row = 0; row < rows; row += 1) {
    let runStart = -1;
    let runColor = '';

    for (let col = 0; col <= cols; col += 1) {
      const valid = col < cols && isPlayableCell(mask, row, col);
      const cell = valid ? board[row][col] : null;
      const color = cell?.color ?? '';

      if (valid && cell && color === runColor) {
        continue;
      }

      if (runStart !== -1) {
        const runLength = col - runStart;
        if (runLength >= minMatch) {
          markRun(positions, row, runStart, col);
        }
      }

      if (valid && cell) {
        runStart = col;
        runColor = color;
      } else {
        runStart = -1;
        runColor = '';
      }
    }
  }

  for (let col = 0; col < cols; col += 1) {
    let runStart = -1;
    let runColor = '';

    for (let row = 0; row <= rows; row += 1) {
      const valid = row < rows && isPlayableCell(mask, row, col);
      const cell = valid ? board[row][col] : null;
      const color = cell?.color ?? '';

      if (valid && cell && color === runColor) {
        continue;
      }

      if (runStart !== -1) {
        const runLength = row - runStart;
        if (runLength >= minMatch) {
          markColumnRun(positions, col, runStart, row);
        }
      }

      if (valid && cell) {
        runStart = row;
        runColor = color;
      } else {
        runStart = -1;
        runColor = '';
      }
    }
  }

  return Array.from(positions).map((key) => {
    const [row, col] = key.split(':').map(Number);
    return { row, col };
  });
};

const clearMatchedCells = (board: IBoard, matches: IPosition[]): IBoard => {
  const nextBoard = cloneBoard(board);
  matches.forEach(({ row, col }) => {
    if (nextBoard[row]) {
      nextBoard[row][col] = null;
    }
  });
  return nextBoard;
};

const dropAndRefill = (board: IBoard, mask: boolean[][], maxKinds: number): IBoard => {
  const nextBoard = cloneBoard(board);
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let col = 0; col < cols; col += 1) {
    const validRows: number[] = [];
    for (let row = 0; row < rows; row += 1) {
      if (isPlayableCell(mask, row, col)) {
        validRows.push(row);
      }
    }

    const existing: ICandyBreak[] = [];
    for (let i = validRows.length - 1; i >= 0; i -= 1) {
      const row = validRows[i];
      const cell = nextBoard[row]?.[col] ?? null;
      if (cell) {
        existing.push(cell);
      }
    }

    for (let i = validRows.length - 1; i >= 0; i -= 1) {
      const row = validRows[i];
      nextBoard[row][col] = existing.shift() ?? randomCandyBreak(maxKinds);
    }
  }

  return nextBoard;
};

export const resolveBoard = (
  board: IBoard,
  mask: boolean[][],
  minMatch: number,
  maxKinds: number,
): IResolveResult => {
  let comboCount = 0;
  let totalCleared = 0;
  let currentBoard = cloneBoard(board);

  while (true) {
    const matches = findMatches(currentBoard, mask, minMatch);
    if (matches.length === 0) {
      break;
    }

    comboCount += 1;
    totalCleared += matches.length;
    const cleared = clearMatchedCells(currentBoard, matches);
    currentBoard = dropAndRefill(cleared, mask, maxKinds);
  }

  return {
    board: currentBoard,
    totalCleared,
    comboCount,
  };
};

const swapCells = (board: IBoard, from: IPosition, to: IPosition): IBoard => {
  const nextBoard = cloneBoard(board);
  const fromCell = nextBoard[from.row]?.[from.col] ?? null;
  const toCell = nextBoard[to.row]?.[to.col] ?? null;
  if (!nextBoard[from.row] || !nextBoard[to.row]) {
    return board;
  }
  nextBoard[from.row][from.col] = toCell;
  nextBoard[to.row][to.col] = fromCell;
  return nextBoard;
};

export const trySwapAndResolve = (
  board: IBoard,
  mask: boolean[][],
  from: IPosition,
  to: IPosition,
  minMatch: number,
  maxKinds: number,
): {
  moved: boolean;
  board: IBoard;
  previewBoard: IBoard;
  matchedPositions: IPosition[];
  totalCleared: number;
  comboCount: number;
} => {
  if (!isPlayableCell(mask, from.row, from.col) || !isPlayableCell(mask, to.row, to.col)) {
    return { moved: false, board, previewBoard: board, matchedPositions: [], totalCleared: 0, comboCount: 0 };
  }
  if (!areAdjacent(from, to)) {
    return { moved: false, board, previewBoard: board, matchedPositions: [], totalCleared: 0, comboCount: 0 };
  }

  const swapped = swapCells(board, from, to);
  const immediateMatches = findMatches(swapped, mask, minMatch);

  if (immediateMatches.length === 0) {
    return { moved: false, board, previewBoard: board, matchedPositions: [], totalCleared: 0, comboCount: 0 };
  }

  const resolved = resolveBoard(swapped, mask, minMatch, maxKinds);
  return {
    moved: true,
    board: resolved.board,
    previewBoard: swapped,
    matchedPositions: immediateMatches,
    totalCleared: resolved.totalCleared,
    comboCount: resolved.comboCount,
  };
};

export const findHint = (
  board: IBoard,
  mask: boolean[][],
  minMatch: number,
  maxKinds: number,
): { from: IPosition; to: IPosition } | null => {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const directions: IPosition[] = [
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: -1, col: 0 },
  ];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!isPlayableCell(mask, row, col)) continue;
      for (const dir of directions) {
        const neighbor = { row: row + dir.row, col: col + dir.col };
        if (!isPlayableCell(mask, neighbor.row, neighbor.col)) continue;
        const result = trySwapAndResolve(board, mask, { row, col }, neighbor, minMatch, maxKinds);
        if (result.moved) {
          return { from: { row, col }, to: neighbor };
        }
      }
    }
  }
  return null;
};

export const scoreClear = (clearedTiles: number, comboCount: number): IScoreResult => {
  if (clearedTiles <= 0) {
    return { points: 0, comboAwarded: 0 };
  }

  const extraTiles = Math.max(0, clearedTiles - 3);
  const tileBonus = extraTiles * SCORE_EXTRA_TILE_POINTS;
  const comboAwarded = comboCount > 1 ? (comboCount - 1) * SCORE_COMBO_POINTS : 0;

  return {
    points: SCORE_BASE_POINTS + tileBonus + comboAwarded,
    comboAwarded,
  };
};
