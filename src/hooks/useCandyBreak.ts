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

const EASY_LEVEL = 1;
const MATCH_ANIMATION_MS = 220;

const createBoardForShape = (shapeIndex: number): IBoard => {
  const mask = GAME_SHAPES[shapeIndex]?.mask ?? GAME_SHAPES[0].mask;
  return createInitialBoard(mask, GAME_CONFIG.easyColorKinds);
};

export const useCandyBreak = (): IUseCandyBreakResult => {
  const [shapeIndex, setShapeIndex] = useState(0);
  const [board, setBoard] = useState<IBoard>(() => createBoardForShape(0));
  const [selectedCell, setSelectedCell] = useState<IPosition | null>(null);
  const [matchedCellKeys, setMatchedCellKeys] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [movesLeft, setMovesLeft] = useState(GAME_CONFIG.easyMoves);
  const [goalRemaining, setGoalRemaining] = useState(GAME_CONFIG.easyGoal);
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
          setWon(true);
          setGameOver(true);
          return;
        }

        if (nextMoves === 0) {
          setGameOver(true);
        }
      }, MATCH_ANIMATION_MS);
    },
    [board, gameOver, goalRemaining, isResolving, movesLeft, selectedCell, shapeMask, won],
  );

  const restart = useCallback(() => {
    setBoard(createBoardForShape(shapeIndex));
    setSelectedCell(null);
    setMatchedCellKeys([]);
    setIsResolving(false);
    setScore(0);
    setCombo(0);
    setMovesLeft(GAME_CONFIG.easyMoves);
    setGoalRemaining(GAME_CONFIG.easyGoal);
    setWon(false);
    setGameOver(false);
  }, [shapeIndex]);

  const cycleShape = useCallback(() => {
    const nextIndex = (shapeIndex + 1) % GAME_SHAPES.length;
    setShapeIndex(nextIndex);
    setBoard(createBoardForShape(nextIndex));
    setSelectedCell(null);
    setMatchedCellKeys([]);
    setIsResolving(false);
    setScore(0);
    setCombo(0);
    setMovesLeft(GAME_CONFIG.easyMoves);
    setGoalRemaining(GAME_CONFIG.easyGoal);
    setWon(false);
    setGameOver(false);
  }, [shapeIndex]);

  const level = EASY_LEVEL;
  const goal = useMemo(() => GAME_CONFIG.easyGoal, []);

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
