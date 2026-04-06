import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GAME_CONFIG, GAME_SHAPES } from '../constants/game';
import { IBoard, IPosition } from '../types';
import {
  areAdjacent,
  createInitialBoard,
  isPlayableCell,
  scoreClear,
  trySwapAndResolve,
} from '../utils/gameEngine';

interface IUseCandyBreakResult {
  board: IBoard;
  shapeMask: boolean[][];
  selectedCell: IPosition | null;
  matchedCellKeys: string[];
  isResolving: boolean;
  shapeLabel: string;
  goal: number;
  goalRemaining: number;
  movesLeft: number;
  gameOver: boolean;
  won: boolean;
  score: number;
  level: number;
  combo: number;
  tapCell: (row: number, col: number) => void;
  cycleShape: () => void;
  restart: () => void;
}

const START_LEVEL = 1;
const MAX_LEVEL = 5;
const MATCH_ANIMATION_MS = 220;
const SHAPE_GOALS = [35, 50, 75, 90, 120];
const LEVEL_GOAL_MULTIPLIERS = [1, 1.15, 1.3, 1.5, 1.7];
const LEVEL_MOVES = [20, 18, 16, 14, 12];

const getMovesForLevel = (level: number): number => {
  return LEVEL_MOVES[level - 1] ?? LEVEL_MOVES[LEVEL_MOVES.length - 1] ?? GAME_CONFIG.easyMoves;
};

const getGoalForShape = (shapeIndex: number, level: number): number => {
  const baseGoal = SHAPE_GOALS[shapeIndex] ?? GAME_CONFIG.easyGoal;
  const multiplier = LEVEL_GOAL_MULTIPLIERS[level - 1] ?? LEVEL_GOAL_MULTIPLIERS[LEVEL_GOAL_MULTIPLIERS.length - 1] ?? 1;
  return Math.round(baseGoal * multiplier);
};

const createBoardForShape = (shapeIndex: number): IBoard => {
  const mask = GAME_SHAPES[shapeIndex]?.mask ?? GAME_SHAPES[0].mask;
  return createInitialBoard(mask, GAME_CONFIG.easyColorKinds);
};

export const useCandyBreak = (): IUseCandyBreakResult => {
  const [level, setLevel] = useState(START_LEVEL);
  const [shapeIndex, setShapeIndex] = useState(0);
  const [board, setBoard] = useState<IBoard>(() => createBoardForShape(0));
  const [selectedCell, setSelectedCell] = useState<IPosition | null>(null);
  const [matchedCellKeys, setMatchedCellKeys] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [movesLeft, setMovesLeft] = useState(() => getMovesForLevel(START_LEVEL));
  const [goalRemaining, setGoalRemaining] = useState(() => getGoalForShape(0, START_LEVEL));
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const currentShape = GAME_SHAPES[shapeIndex] ?? GAME_SHAPES[0];
  const shapeMask = currentShape.mask;
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resolveTimerRef.current) {
        clearTimeout(resolveTimerRef.current);
      }
    };
  }, []);

  const tapCell = useCallback(
    (row: number, col: number) => {
      if (gameOver || won || isResolving || !isPlayableCell(shapeMask, row, col)) {
        return;
      }

      const tapped = { row, col };

      if (!selectedCell) {
        setSelectedCell(tapped);
        return;
      }

      if (selectedCell.row === row && selectedCell.col === col) {
        setSelectedCell(null);
        return;
      }

      if (!areAdjacent(selectedCell, tapped)) {
        setSelectedCell(tapped);
        return;
      }

      const result = trySwapAndResolve(
        board,
        shapeMask,
        selectedCell,
        tapped,
        GAME_CONFIG.minMatch,
        GAME_CONFIG.easyColorKinds,
      );

      if (!result.moved) {
        setSelectedCell(tapped);
        return;
      }

      const clearScore = scoreClear(result.totalCleared, result.comboCount);
      const nextMoves = Math.max(0, movesLeft - 1);
      const goalReduction = result.matchedPositions.length;
      const nextGoalRemaining = Math.max(0, goalRemaining - goalReduction);

      const matchedKeys = result.matchedPositions.map(({ row: matchedRow, col: matchedCol }) =>
        `${matchedRow}:${matchedCol}`,
      );

      setIsResolving(true);
      setMatchedCellKeys(matchedKeys);
      setBoard(result.previewBoard);
      setSelectedCell(null);

      if (resolveTimerRef.current) {
        clearTimeout(resolveTimerRef.current);
      }

      resolveTimerRef.current = setTimeout(() => {
        setBoard(result.board);
        setCombo(result.comboCount);
        setScore((prev) => prev + clearScore.points);
        setMovesLeft(nextMoves);
        setGoalRemaining(nextGoalRemaining);
        setMatchedCellKeys([]);
        setIsResolving(false);

        if (nextGoalRemaining === 0) {
          const isLastShape = shapeIndex >= GAME_SHAPES.length - 1;
          if (isLastShape) {
            const isLastLevel = level >= MAX_LEVEL;
            if (!isLastLevel) {
              const nextLevel = level + 1;
              setLevel(nextLevel);
              setShapeIndex(0);
              setBoard(createBoardForShape(0));
              setSelectedCell(null);
              setMatchedCellKeys([]);
              setIsResolving(false);
              setCombo(0);
              setMovesLeft(getMovesForLevel(nextLevel));
              setGoalRemaining(getGoalForShape(0, nextLevel));
              return;
            }

            setWon(true);
            setGameOver(true);
            return;
          }

          const nextShapeIndex = shapeIndex + 1;
          setShapeIndex(nextShapeIndex);
          setBoard(createBoardForShape(nextShapeIndex));
          setSelectedCell(null);
          setMatchedCellKeys([]);
          setIsResolving(false);
          setCombo(0);
          setMovesLeft(getMovesForLevel(level));
          setGoalRemaining(getGoalForShape(nextShapeIndex, level));
          return;
        }

        if (nextMoves === 0) {
          setGameOver(true);
        }
      }, MATCH_ANIMATION_MS);
    },
    [board, gameOver, goalRemaining, isResolving, level, movesLeft, selectedCell, shapeIndex, shapeMask, won],
  );

  const restart = useCallback(() => {
    setBoard(createBoardForShape(shapeIndex));
    setSelectedCell(null);
    setMatchedCellKeys([]);
    setIsResolving(false);
    setScore(0);
    setCombo(0);
    setMovesLeft(getMovesForLevel(level));
    setGoalRemaining(getGoalForShape(shapeIndex, level));
    setWon(false);
    setGameOver(false);
  }, [level, shapeIndex]);

  const cycleShape = useCallback(() => {
    const nextIndex = (shapeIndex + 1) % GAME_SHAPES.length;
    setShapeIndex(nextIndex);
    setBoard(createBoardForShape(nextIndex));
    setSelectedCell(null);
    setMatchedCellKeys([]);
    setIsResolving(false);
    setScore(0);
    setCombo(0);
    setMovesLeft(getMovesForLevel(level));
    setGoalRemaining(getGoalForShape(nextIndex, level));
    setWon(false);
    setGameOver(false);
  }, [level, shapeIndex]);

  const goal = useMemo(() => getGoalForShape(shapeIndex, level), [level, shapeIndex]);

  return {
    board,
    shapeMask,
    selectedCell,
    matchedCellKeys,
    isResolving,
    shapeLabel: currentShape.label,
    goal,
    goalRemaining,
    movesLeft,
    gameOver,
    won,
    score,
    level,
    combo,
    tapCell,
    cycleShape,
    restart,
  };
};
