import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BOMB_SCORE_BONUS, GAME_CONFIG, GAME_SHAPES } from '../constants/game';
import { IBoard, IPosition } from '../types';
import {
  areAdjacent,
  createInitialBoard,
  findHint,
  getRandomPlayablePosition,
  isPlayableCell,
  resolveAllSteps,
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
  bestScore: number;
  level: number;
  combo: number;
  bombPosition: IPosition | null;
  hintCells: IPosition[];
  stageStars: 1 | 2 | 3 | null;
  bestStars: 0 | 1 | 2 | 3;
  tapCell: (row: number, col: number) => void;
  cycleShape: () => void;
  restart: () => void;
  requestHint: () => void;
}

const START_LEVEL = 1;
const MAX_LEVEL = 5;
const MATCH_ANIMATION_MS = 220;
const DROP_PAUSE_MS = 140;
const SHAPE_GOALS = [40, 55, 65, 45, 55];
const LEVEL_GOAL_MULTIPLIERS = [1, 1.15, 1.3, 1.5, 1.7];
const LEVEL_MOVES = [20, 19, 18, 17, 16];

const calcStars = (movesLeft: number, totalMoves: number): 1 | 2 | 3 => {
  const ratio = movesLeft / totalMoves;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
};

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
  const [bombPosition, setBombPosition] = useState<IPosition | null>(null);
  const [hintCells, setHintCells] = useState<IPosition[]>([]);
  const [stageStars, setStageStars] = useState<1 | 2 | 3 | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [bestStars, setBestStars] = useState<0 | 1 | 2 | 3>(0);

  // Load persisted best score on mount
  useEffect(() => {
    AsyncStorage.getItem('bestScore').then((value) => {
      if (value !== null) {
        setBestScore(parseInt(value, 10));
      }
    }).catch(() => undefined);
  }, []);

  // Load best stars for current shape+level
  useEffect(() => {
    const key = `stars_L${level}_S${shapeIndex}`;
    AsyncStorage.getItem(key).then((value) => {
      setBestStars(value !== null ? (parseInt(value, 10) as 1 | 2 | 3) : 0);
    }).catch(() => undefined);
  }, [level, shapeIndex]);

  const currentShape = GAME_SHAPES[shapeIndex] ?? GAME_SHAPES[0];
  const shapeMask = currentShape.mask;
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resolveTimerRef.current) {
        clearTimeout(resolveTimerRef.current);
      }
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }
    };
  }, []);

  const tapCell = useCallback(
    (row: number, col: number) => {
      if (gameOver || won || isResolving || !isPlayableCell(shapeMask, row, col)) {
        return;
      }

      // Bomb activation — single tap clears the stage
      if (bombPosition && bombPosition.row === row && bombPosition.col === col) {
        setIsResolving(true);
        setMatchedCellKeys([`${row}:${col}`]);
        setBombPosition(null);
        setSelectedCell(null);

        if (resolveTimerRef.current) {
          clearTimeout(resolveTimerRef.current);
        }

        resolveTimerRef.current = setTimeout(() => {
          setMatchedCellKeys([]);
          setIsResolving(false);
        setScore((prev) => {
          const next = prev + BOMB_SCORE_BONUS;
          if (next > bestScore) {
            setBestScore(next);
            AsyncStorage.setItem('bestScore', String(next)).catch(() => undefined);
          }
          return next;
        });

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
              setBombPosition(null);
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
          setBombPosition(null);
        }, MATCH_ANIMATION_MS);
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

      // Compute all cascade steps synchronously upfront
      const steps = resolveAllSteps(result.previewBoard, shapeMask, GAME_CONFIG.minMatch, GAME_CONFIG.easyColorKinds);
      if (steps.length === 0) {
        setSelectedCell(tapped);
        return;
      }

      const totalCleared = steps.reduce((sum, s) => sum + s.matchedPositions.length, 0);
      const comboCount = steps.length;
      const finalBoard = steps[steps.length - 1]!.nextBoard;
      const clearScore = scoreClear(totalCleared, comboCount);
      const nextMoves = Math.max(0, movesLeft - 1);
      const nextGoalRemaining = Math.max(0, goalRemaining - totalCleared);

      setCombo(0);
      setIsResolving(true);
      setSelectedCell(null);

      if (resolveTimerRef.current) {
        clearTimeout(resolveTimerRef.current);
      }

      const advanceAfterStars = (): void => {
        setStageStars(null);
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
            setBombPosition(null);
            return;
          }
          setIsResolving(false);
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
        setBombPosition(null);
      };

      const finalizeMove = (): void => {
        setBoard(finalBoard);
        setCombo(comboCount);
        setScore((prev) => {
          const next = prev + clearScore.points;
          if (next > bestScore) {
            setBestScore(next);
            AsyncStorage.setItem('bestScore', String(next)).catch(() => undefined);
          }
          return next;
        });
        setMovesLeft(nextMoves);
        setGoalRemaining(nextGoalRemaining);
        setMatchedCellKeys([]);

        const spawnThreshold = Math.floor(getMovesForLevel(level) * 0.6);
        if (bombPosition === null && nextMoves === spawnThreshold && nextGoalRemaining > 0) {
          setBombPosition(getRandomPlayablePosition(shapeMask));
        }

        if (nextGoalRemaining === 0) {
          // Compute and persist best stars
          const stars = calcStars(nextMoves, getMovesForLevel(level));
          const starsKey = `stars_L${level}_S${shapeIndex}`;
          AsyncStorage.getItem(starsKey).then((existing) => {
            const prev = existing ? parseInt(existing, 10) : 0;
            if (stars > prev) {
              AsyncStorage.setItem(starsKey, String(stars)).catch(() => undefined);
              setBestStars(stars);
            } else {
              setBestStars((prev as 0 | 1 | 2 | 3));
            }
          }).catch(() => undefined);
          // Show overlay (isResolving stays true during the delay)
          setStageStars(stars);
          resolveTimerRef.current = setTimeout(() => {
            advanceAfterStars();
          }, 1500);
          return;
        }

        setIsResolving(false);
        if (nextMoves === 0) {
          setGameOver(true);
        }
      };

      const playStep = (stepIndex: number): void => {
        const step = steps[stepIndex]!;
        const displayBoard = stepIndex === 0 ? result.previewBoard : steps[stepIndex - 1]!.nextBoard;

        setBoard(displayBoard);
        setMatchedCellKeys(step.matchedPositions.map(({ row: r, col: c }) => `${r}:${c}`));

        resolveTimerRef.current = setTimeout(() => {
          setBoard(step.nextBoard);
          setMatchedCellKeys([]);

          if (stepIndex === steps.length - 1) {
            resolveTimerRef.current = setTimeout(() => {
              finalizeMove();
            }, DROP_PAUSE_MS);
          } else {
            resolveTimerRef.current = setTimeout(() => {
              playStep(stepIndex + 1);
            }, DROP_PAUSE_MS);
          }
        }, MATCH_ANIMATION_MS);
      };

      playStep(0);
    },
    [board, bombPosition, bestScore, gameOver, goalRemaining, isResolving, level, movesLeft, selectedCell, shapeIndex, shapeMask, won],
  );

  const restart = useCallback(() => {
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
    setStageStars(null);
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
    setBombPosition(null);
  }, [level, shapeIndex]);

  const cycleShape = useCallback(() => {
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
    setStageStars(null);
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
    setBombPosition(null);
  }, [level, shapeIndex]);

  const requestHint = useCallback(() => {
    if (gameOver || won || isResolving) return;
    const hint = findHint(board, shapeMask, GAME_CONFIG.minMatch, GAME_CONFIG.easyColorKinds);
    if (!hint) return;
    setHintCells([hint.from, hint.to]);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintCells([]), 1500);
  }, [board, gameOver, isResolving, shapeMask, won]);

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
    bestScore,
    level,
    bombPosition,
    hintCells,
    stageStars,
    bestStars,
    combo,
    tapCell,
    cycleShape,
    restart,
    requestHint,
  };
};
