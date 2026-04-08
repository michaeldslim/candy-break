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

        const createsHorizontal = left1 && left2 && left1.candyBreak === nextCube.candyBreak && left2.candyBreak === nextCube.candyBreak;
        const createsVertical = up1 && up2 && up1.candyBreak === nextCube.candyBreak && up2.candyBreak === nextCube.candyBreak;

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

// Describes a detected run that may spawn a special tile
interface IRunResult {
  positions: IPosition[];
  spawnSpecial?: { pos: IPosition; tile: ICandyBreak };
}

const detectRuns = (board: IBoard, mask: boolean[][], minMatch: number): IRunResult[] => {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const results: IRunResult[] = [];
  const counted = new Set<string>(); // prevent double-counting cross intersections per run

  // Horizontal runs
  for (let row = 0; row < rows; row += 1) {
    let runStart = -1;
    let runColor = '';
    let runSpecial = false;
    for (let col = 0; col <= cols; col += 1) {
      const valid = col < cols && isPlayableCell(mask, row, col);
      const cell = valid ? board[row][col] : null;
      const color = cell ? (cell.special === 'rainbow' ? '__rainbow__' : cell.candyBreak) : '';
      const sameColor = valid && cell && color === runColor && !cell.special && !runSpecial;
      if (sameColor) continue;
      if (runStart !== -1) {
        const runLen = col - runStart;
        if (runLen >= minMatch) {
          const positions: IPosition[] = [];
          for (let c = runStart; c < col; c += 1) positions.push({ row, col: c });
          const centerCol = Math.floor((runStart + col - 1) / 2);
          let spawnSpecial: IRunResult['spawnSpecial'];
          if (runLen === 4) {
            spawnSpecial = { pos: { row, col: centerCol }, tile: { candyBreak: runColor, special: 'striped-v' } };
          } else if (runLen >= 5) {
            spawnSpecial = { pos: { row, col: centerCol }, tile: { candyBreak: runColor, special: 'rainbow' } };
          }
          positions.forEach(p => counted.add(keyOf(p.row, p.col)));
          results.push({ positions, spawnSpecial });
        }
      }
      if (valid && cell && !cell.special) { runStart = col; runColor = color; runSpecial = false; }
      else { runStart = -1; runColor = ''; runSpecial = false; }
    }
  }

  // Vertical runs
  for (let col = 0; col < cols; col += 1) {
    let runStart = -1;
    let runColor = '';
    for (let row = 0; row <= rows; row += 1) {
      const valid = row < rows && isPlayableCell(mask, row, col);
      const cell = valid ? board[row][col] : null;
      const color = cell ? (cell.special === 'rainbow' ? '__rainbow__' : cell.candyBreak) : '';
      const sameColor = valid && cell && color === runColor && !cell.special;
      if (sameColor) continue;
      if (runStart !== -1) {
        const runLen = row - runStart;
        if (runLen >= minMatch) {
          const positions: IPosition[] = [];
          for (let r = runStart; r < row; r += 1) positions.push({ row: r, col });
          const centerRow = Math.floor((runStart + row - 1) / 2);
          let spawnSpecial: IRunResult['spawnSpecial'];
          if (runLen === 4) {
            spawnSpecial = { pos: { row: centerRow, col }, tile: { candyBreak: runColor, special: 'striped-h' } };
          } else if (runLen >= 5) {
            spawnSpecial = { pos: { row: centerRow, col }, tile: { candyBreak: runColor, special: 'rainbow' } };
          }
          // don't double-count positions already part of a horizontal run that spawns a special
          positions.forEach(p => counted.add(keyOf(p.row, p.col)));
          results.push({ positions, spawnSpecial });
        }
      }
      if (valid && cell && !cell.special) { runStart = row; runColor = color; }
      else { runStart = -1; runColor = ''; }
    }
  }

  return results;
};

const findMatches = (board: IBoard, mask: boolean[][], minMatch: number): IPosition[] => {
  const runs = detectRuns(board, mask, minMatch);
  const seen = new Set<string>();
  const positions: IPosition[] = [];
  for (const run of runs) {
    for (const p of run.positions) {
      const k = keyOf(p.row, p.col);
      if (!seen.has(k)) { seen.add(k); positions.push(p); }
    }
  }
  return positions;
};

// Collect positions that a special tile at (row,col) would clear
const specialClearPositions = (
  board: IBoard,
  mask: boolean[][],
  row: number,
  col: number,
  special: 'striped-h' | 'striped-v' | 'rainbow',
  partnerCandyBreak?: string,
): IPosition[] => {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const result: IPosition[] = [];
  if (special === 'striped-h') {
    for (let c = 0; c < cols; c += 1) {
      if (isPlayableCell(mask, row, c)) result.push({ row, col: c });
    }
  } else if (special === 'striped-v') {
    for (let r = 0; r < rows; r += 1) {
      if (isPlayableCell(mask, r, col)) result.push({ row: r, col });
    }
  } else if (special === 'rainbow') {
    // clears all tiles of partner color (or own candyBreak if no partner)
    const target = partnerCandyBreak ?? board[row]?.[col]?.candyBreak ?? '';
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const cell = board[r]?.[c];
        if (cell && cell.candyBreak === target && !cell.special) result.push({ row: r, col: c });
      }
    }
    result.push({ row, col }); // the rainbow tile itself
  }
  return result;
};

// Apply normal run clears and place any spawned special tiles
const clearMatchedCells = (board: IBoard, mask: boolean[][], minMatch: number): IBoard => {
  const runs = detectRuns(board, mask, minMatch);
  const nextBoard = cloneBoard(board);
  const cleared = new Set<string>();

  for (const run of runs) {
    for (const p of run.positions) {
      cleared.add(keyOf(p.row, p.col));
      if (nextBoard[p.row]) nextBoard[p.row][p.col] = null;
    }
  }

  // Activate specials caught in normal runs
  for (let r = 0; r < board.length; r += 1) {
    for (let c = 0; c < (board[0]?.length ?? 0); c += 1) {
      if (!cleared.has(keyOf(r, c))) continue;
      const original = board[r]?.[c];
      if (!original?.special || original.special === 'rainbow') continue;
      // striped tile got cleared — fire it
      const extra = specialClearPositions(board, mask, r, c, original.special);
      for (const p of extra) {
        if (nextBoard[p.row]) nextBoard[p.row][p.col] = null;
      }
    }
  }

  // Place spawned specials (only if that cell wasn't also cleared by another run)
  for (const run of runs) {
    if (!run.spawnSpecial) continue;
    const { pos, tile } = run.spawnSpecial;
    if (nextBoard[pos.row]) nextBoard[pos.row][pos.col] = tile;
  }

  return nextBoard;
};

// Activate a special tile during a swap (before cascade resolution)
const activateSpecialOnSwap = (
  board: IBoard,
  mask: boolean[][],
  specialPos: IPosition,
  partnerPos: IPosition,
): IBoard => {
  const cell = board[specialPos.row]?.[specialPos.col];
  if (!cell?.special) return board;
  const partner = board[partnerPos.row]?.[partnerPos.col];
  const positions = specialClearPositions(board, mask, specialPos.row, specialPos.col, cell.special, partner?.candyBreak);
  const next = cloneBoard(board);
  for (const p of positions) {
    if (next[p.row]) next[p.row][p.col] = null;
  }
  return next;
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
    const cleared = clearMatchedCells(currentBoard, mask, minMatch);
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

// After swapping, activate any specials on the swapped cells before cascade
const applySwapSpecials = (
  board: IBoard,
  mask: boolean[][],
  from: IPosition,
  to: IPosition,
): { board: IBoard; activated: boolean } => {
  let current = board;
  let activated = false;
  const fromCell = board[from.row]?.[from.col];
  const toCell = board[to.row]?.[to.col];
  if (fromCell?.special) {
    current = activateSpecialOnSwap(current, mask, from, to);
    activated = true;
  }
  if (toCell?.special) {
    current = activateSpecialOnSwap(current, mask, to, from);
    activated = true;
  }
  return { board: current, activated };
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

  // Check if either swapped cell is a special — activate before normal match check
  const { board: afterSpecials, activated } = applySwapSpecials(swapped, mask, from, to);

  const immediateMatches = findMatches(afterSpecials, mask, minMatch);

  if (!activated && immediateMatches.length === 0) {
    return { moved: false, board, previewBoard: board, matchedPositions: [], totalCleared: 0, comboCount: 0 };
  }

  const resolved = resolveBoard(afterSpecials, mask, minMatch, maxKinds);
  return {
    moved: true,
    board: resolved.board,
    previewBoard: afterSpecials,
    matchedPositions: immediateMatches,
    totalCleared: resolved.totalCleared,
    comboCount: resolved.comboCount,
  };
};

export interface ICascadeStep {
  matchedPositions: IPosition[];
  nextBoard: IBoard;
}

export const resolveAllSteps = (
  board: IBoard,
  mask: boolean[][],
  minMatch: number,
  maxKinds: number,
): ICascadeStep[] => {
  const steps: ICascadeStep[] = [];
  let currentBoard = cloneBoard(board);

  // Collect null playable cells already cleared by special activation before this call
  const preCleared: IPosition[] = [];
  for (let r = 0; r < currentBoard.length; r += 1) {
    for (let c = 0; c < (currentBoard[0]?.length ?? 0); c += 1) {
      if (isPlayableCell(mask, r, c) && currentBoard[r]?.[c] === null) {
        preCleared.push({ row: r, col: c });
      }
    }
  }
  if (preCleared.length > 0) {
    const dropped = dropAndRefill(currentBoard, mask, maxKinds);
    steps.push({ matchedPositions: preCleared, nextBoard: dropped });
    currentBoard = dropped;
  }

  while (true) {
    const matches = findMatches(currentBoard, mask, minMatch);
    if (matches.length === 0) break;
    const cleared = clearMatchedCells(currentBoard, mask, minMatch);
    const next = dropAndRefill(cleared, mask, maxKinds);
    steps.push({ matchedPositions: matches, nextBoard: next });
    currentBoard = next;
  }

  return steps;
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
