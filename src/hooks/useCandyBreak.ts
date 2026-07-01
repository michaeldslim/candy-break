import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BOMB_SCORE_BONUS,
  BOMB_STORM_RESPAWNS,
  BOMB_STORM_SPAWN_RATIO,
  COLOR_POOL,
  GAME_CONFIG,
  GAME_SHAPES,
  LOCKED_TILES_FREEZE_RATIO,
  TIMER_ATTACK_SECONDS,
} from '../constants/game';
import { IBoard, IFrozenCell, IPosition, PlayStyle } from '../types';
import {
  areAdjacent,
  createInitialBoard,
  getAdjacentPositions,
  getRandomPlayablePosition,
  ICascadeStep,
  isPlayableCell,
  resolveAllSteps,
  scoreClear,
  trySwapAndResolve,
} from '../utils/gameEngine';

interface ISavedGame {
  level: number;
  shapeIndex: number;
  score: number;
  movesLeft: number;
  goalRemaining: number;
  board: IBoard;
  targetColor?: string | null;
  frozenCells?: IFrozenCell[];
  timerSecondsLeft?: number | null;
  comboMultiplier?: number;
  bombRespawnsLeft?: number;
}

interface IUseCandyBreakResult {
  board: IBoard;
  shapeMask: boolean[][];
  selectedCell: IPosition | null;
  matchedCellKeys: string[];
  isResolving: boolean;
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
  bombActivating: IPosition | null;
  stageStars: 1 | 2 | 3 | null;
  bestStars: 0 | 1 | 2 | 3;
  hasSavedGame: boolean;
  playStyle: PlayStyle;
  targetColor: string | null;
  frozenCells: IFrozenCell[];
  comboMultiplier: number;
  timerSecondsLeft: number | null;
  tapCell: (row: number, col: number) => void;
  cycleShape: () => void;
  restart: () => void;
  restartFromLevelOne: () => void;
  resumeSavedGame: () => void;
}

const START_LEVEL = 1;
const SAVE_GAME_KEY = 'savedGame';
const MAX_LEVEL = 5;
const MATCH_ANIMATION_MS = 220;
const DROP_PAUSE_MS = 140;
// entries matching GAME_SHAPES indices
const SHAPE_GOALS = [40, 55, 65, 45, 55, 50, 38];
const LEVEL_GOAL_MULTIPLIERS = [1, 1.15, 1.3, 1.5, 1.7];
const LEVEL_MOVES = [20, 19, 18, 17, 16];

const calcStars = (
  remaining: number,
  total: number,
  style: PlayStyle,
): 1 | 2 | 3 => {
  const ratio = total > 0 ? remaining / total : 0;
  if (style === 'timer-attack') {
    if (ratio >= 0.5) return 3;
    if (ratio >= 0.2) return 2;
    return 1;
  }
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
};

const getMovesForLevel = (level: number): number =>
  LEVEL_MOVES[level - 1] ?? LEVEL_MOVES[LEVEL_MOVES.length - 1] ?? GAME_CONFIG.easyMoves;

const getGoalForStage = (shapeIndex: number, level: number): number => {
  const shape = GAME_SHAPES[shapeIndex];
  if (shape?.playStyle === 'locked-tiles') {
    return Math.floor(GAME_CONFIG.rows * GAME_CONFIG.cols * LOCKED_TILES_FREEZE_RATIO);
  }
  const baseGoal = SHAPE_GOALS[shapeIndex] ?? GAME_CONFIG.easyGoal;
  const multiplier =
    LEVEL_GOAL_MULTIPLIERS[level - 1] ??
    LEVEL_GOAL_MULTIPLIERS[LEVEL_GOAL_MULTIPLIERS.length - 1] ??
    1;
  return Math.round(baseGoal * multiplier);
};

const computeGoalAfterSteps = (
  steps: ICascadeStep[],
  style: PlayStyle,
  currentGoalRemaining: number,
  currentTargetColor: string | null,
  currentFrozenCells: IFrozenCell[],
): { goalRemaining: number; frozenCells: IFrozenCell[] } => {
  const totalCleared = steps.reduce((sum, s) => sum + s.matchedPositions.length, 0);
  const clearedByColor: Record<string, number> = {};
  for (const step of steps) {
    for (const [color, count] of Object.entries(step.matchedByColor)) {
      clearedByColor[color] = (clearedByColor[color] ?? 0) + count;
    }
  }

  if (style === 'color-target' && currentTargetColor) {
    const colorCleared = clearedByColor[currentTargetColor] ?? 0;
    return {
      goalRemaining: Math.max(0, currentGoalRemaining - colorCleared),
      frozenCells: currentFrozenCells,
    };
  }

  if (style === 'locked-tiles' && currentFrozenCells.length > 0) {
    const clearedSet = new Set<string>();
    for (const step of steps) {
      for (const p of step.matchedPositions) {
        clearedSet.add(`${p.row}:${p.col}`);
      }
    }
    const nextFrozen = currentFrozenCells.map(fc => {
      if (fc.hitsRemaining <= 0) return fc;
      const adjacents = getAdjacentPositions(fc.row, fc.col, GAME_CONFIG.rows, GAME_CONFIG.cols);
      const wasHit = adjacents.some(a => clearedSet.has(`${a.row}:${a.col}`));
      return wasHit ? { ...fc, hitsRemaining: fc.hitsRemaining - 1 } : fc;
    });
    return {
      goalRemaining: nextFrozen.filter(fc => fc.hitsRemaining > 0).length,
      frozenCells: nextFrozen,
    };
  }

  return {
    goalRemaining: Math.max(0, currentGoalRemaining - totalCleared),
    frozenCells: currentFrozenCells,
  };
};

interface IStageInit {
  board: IBoard;
  playStyle: PlayStyle;
  targetColor: string | null;
  frozenCells: IFrozenCell[];
  timerSecondsLeft: number | null;
  bombRespawnsLeft: number;
  moves: number;
  goal: number;
}

const initializeStage = (shapeIndex: number, level: number): IStageInit => {
  const shape = GAME_SHAPES[shapeIndex] ?? GAME_SHAPES[0];
  const board = createInitialBoard(shape.mask, GAME_CONFIG.easyColorKinds);
  const playStyle: PlayStyle = shape.playStyle;
  const moves = getMovesForLevel(level);
  const goal = getGoalForStage(shapeIndex, level);

  let targetColor: string | null = null;
  let frozenCells: IFrozenCell[] = [];
  let timerSecondsLeft: number | null = null;
  let bombRespawnsLeft = 0;

  if (playStyle === 'color-target') {
    const idx = Math.floor(Math.random() * COLOR_POOL.length);
    targetColor = COLOR_POOL[idx]?.candyBreak ?? 'Red';
  } else if (playStyle === 'locked-tiles') {
    const rows = GAME_CONFIG.rows;
    const cols = GAME_CONFIG.cols;
    const frozenCount = goal; // goal = frozen cell count for this mode
    const allPositions: IPosition[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        allPositions.push({ row: r, col: c });
      }
    }
    // Fisher-Yates shuffle
    for (let i = allPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = allPositions[i]!;
      allPositions[i] = allPositions[j]!;
      allPositions[j] = tmp;
    }
    frozenCells = allPositions.slice(0, frozenCount).map(p => ({ ...p, hitsRemaining: 2 }));
  } else if (playStyle === 'timer-attack') {
    timerSecondsLeft = shape.timerSeconds ?? TIMER_ATTACK_SECONDS;
  } else if (playStyle === 'bomb-storm') {
    bombRespawnsLeft = shape.bombRespawns ?? BOMB_STORM_RESPAWNS;
  }

  return { board, playStyle, targetColor, frozenCells, timerSecondsLeft, bombRespawnsLeft, moves, goal };
};

export const useCandyBreak = (): IUseCandyBreakResult => {
  const [level, setLevel] = useState(START_LEVEL);
  const [shapeIndex, setShapeIndex] = useState(0);
  const [board, setBoard] = useState<IBoard>(() => initializeStage(0, START_LEVEL).board);
  const [selectedCell, setSelectedCell] = useState<IPosition | null>(null);
  const [matchedCellKeys, setMatchedCellKeys] = useState<string[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [movesLeft, setMovesLeft] = useState(() => getMovesForLevel(START_LEVEL));
  const [goalRemaining, setGoalRemaining] = useState(() => getGoalForStage(0, START_LEVEL));
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [bombPosition, setBombPosition] = useState<IPosition | null>(null);
  const [bombActivating, setBombActivating] = useState<IPosition | null>(null);
  const [stageStars, setStageStars] = useState<1 | 2 | 3 | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [bestStars, setBestStars] = useState<0 | 1 | 2 | 3>(0);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const savedGameRef = useRef<ISavedGame | null>(null);

  // Play-style specific state
  const [playStyle, setPlayStyle] = useState<PlayStyle>('classic');
  const [targetColor, setTargetColor] = useState<string | null>(null);
  const [frozenCells, setFrozenCells] = useState<IFrozenCell[]>([]);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);
  const [bombRespawnsLeft, setBombRespawnsLeft] = useState(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load persisted best score and saved game on mount
  useEffect(() => {
    AsyncStorage.getItem('bestScore').then((value) => {
      if (value !== null) setBestScore(parseInt(value, 10));
    }).catch(() => undefined);

    AsyncStorage.getItem(SAVE_GAME_KEY).then((raw) => {
      if (!raw) return;
      const saved: ISavedGame = JSON.parse(raw) as ISavedGame;
      savedGameRef.current = saved;
      setHasSavedGame(true);
    }).catch(() => undefined);
  }, []);

  // Clear saved game when game ends
  useEffect(() => {
    if (gameOver) {
      AsyncStorage.removeItem(SAVE_GAME_KEY).catch(() => undefined);
      setHasSavedGame(false);
    }
  }, [gameOver]);

  // Load best stars for current shape+level
  useEffect(() => {
    const key = `stars_L${level}_S${shapeIndex}`;
    AsyncStorage.getItem(key).then((value) => {
      setBestStars(value !== null ? (parseInt(value, 10) as 1 | 2 | 3) : 0);
    }).catch(() => undefined);
  }, [level, shapeIndex]);

  // Timer countdown for timer-attack mode — just ticks
  useEffect(() => {
    if (playStyle !== 'timer-attack' || gameOver || won) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }
    timerIntervalRef.current = setInterval(() => {
      setTimerSecondsLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [playStyle, gameOver, won]);

  // Trigger game over when timer reaches 0
  useEffect(() => {
    if (playStyle === 'timer-attack' && timerSecondsLeft === 0 && !gameOver && !won) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setGameOver(true);
    }
  }, [playStyle, timerSecondsLeft, gameOver, won]);

  const currentShape = GAME_SHAPES[shapeIndex] ?? GAME_SHAPES[0];
  const shapeMask = currentShape.mask;
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const applyStageInit = useCallback((init: IStageInit): void => {
    setPlayStyle(init.playStyle);
    setTargetColor(init.targetColor);
    setFrozenCells(init.frozenCells);
    setTimerSecondsLeft(init.timerSecondsLeft);
    setBombRespawnsLeft(init.bombRespawnsLeft);
    setComboMultiplier(1);
    setBoard(init.board);
    setMovesLeft(init.moves);
    setGoalRemaining(init.goal);
    setSelectedCell(null);
    setMatchedCellKeys([]);
    setIsResolving(false);
    setCombo(0);
    setBombPosition(null);
    setBombActivating(null);
    setStageStars(null);
  }, []);

  const tapCell = useCallback(
    (row: number, col: number) => {
      if (gameOver || won || isResolving || !isPlayableCell(shapeMask, row, col)) {
        return;
      }

      // Locked-tiles: block swapping a frozen cell
      if (playStyle === 'locked-tiles') {
        const fc = frozenCells.find(f => f.row === row && f.col === col && f.hitsRemaining > 0);
        if (fc) {
          setSelectedCell(null);
          return;
        }
        if (selectedCell) {
          const selFrozen = frozenCells.find(f => f.row === selectedCell.row && f.col === selectedCell.col && f.hitsRemaining > 0);
          if (selFrozen) {
            setSelectedCell(null);
            return;
          }
        }
      }

      // Bomb activation — single tap clears the stage (or respawns for bomb-storm)
      if (bombPosition && bombPosition.row === row && bombPosition.col === col) {
        setIsResolving(true);
        setMatchedCellKeys([`${row}:${col}`]);
        setBombActivating({ row, col });
        setBombPosition(null);
        setSelectedCell(null);

        if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);

        resolveTimerRef.current = setTimeout(() => {
          setMatchedCellKeys([]);
          setBombActivating(null);
          setScore((prev) => {
            const next = prev + BOMB_SCORE_BONUS;
            if (next > bestScore) {
              setBestScore(next);
              AsyncStorage.setItem('bestScore', String(next)).catch(() => undefined);
            }
            return next;
          });

          // Bomb-storm: respawn bomb if respawns remain
          if (playStyle === 'bomb-storm' && bombRespawnsLeft > 0) {
            setBombRespawnsLeft(prev => prev - 1);
            setBombPosition(getRandomPlayablePosition(shapeMask));
            setIsResolving(false);
            return;
          }

          // Advance to next stage
          const isLastShape = shapeIndex >= GAME_SHAPES.length - 1;
          if (isLastShape) {
            const isLastLevel = level >= MAX_LEVEL;
            if (!isLastLevel) {
              const nextLevel = level + 1;
              const init = initializeStage(0, nextLevel);
              setLevel(nextLevel);
              setShapeIndex(0);
              applyStageInit(init);
              return;
            }
            setWon(true);
            setGameOver(true);
            setIsResolving(false);
            return;
          }

          const nextShapeIndex = shapeIndex + 1;
          const init = initializeStage(nextShapeIndex, level);
          setShapeIndex(nextShapeIndex);
          applyStageInit(init);
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

      const steps = resolveAllSteps(result.previewBoard, shapeMask, GAME_CONFIG.minMatch, GAME_CONFIG.easyColorKinds);
      if (steps.length === 0) {
        setSelectedCell(tapped);
        return;
      }

      const totalCleared = steps.reduce((sum, s) => sum + s.matchedPositions.length, 0);

      const comboCount = steps.length;
      const finalBoard = steps[steps.length - 1]!.nextBoard;
      const clearScore = scoreClear(totalCleared, comboCount);

      // Multiplier-rush: amplify score by current combo multiplier
      const effectivePoints = playStyle === 'multiplier-rush'
        ? clearScore.points * comboMultiplier
        : clearScore.points;

      // Timer-attack: don't decrement moves
      const nextMoves = playStyle === 'timer-attack'
        ? movesLeft
        : Math.max(0, movesLeft - 1);

      let runningGoalRemaining = goalRemaining;
      let runningFrozenCells = frozenCells;

      const applyStepProgress = (step: ICascadeStep, stepIndex: number): void => {
        const result = computeGoalAfterSteps(
          [step],
          playStyle,
          runningGoalRemaining,
          targetColor,
          runningFrozenCells,
        );
        runningGoalRemaining = result.goalRemaining;
        runningFrozenCells = result.frozenCells;
        setGoalRemaining(runningGoalRemaining);
        if (playStyle === 'locked-tiles') {
          setFrozenCells(runningFrozenCells);
        }
        const cascadeCount = stepIndex + 1;
        if (cascadeCount >= 2) {
          setCombo(cascadeCount);
        }
      };

      // Multiplier-rush: update combo multiplier (cap at 8x)
      const nextComboMultiplier = (playStyle === 'multiplier-rush')
        ? (comboCount >= 2 ? Math.min(comboMultiplier * 2, 8) : 1)
        : 1;

      setCombo(0);
      setIsResolving(true);
      setSelectedCell(null);

      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);

      const saveNewStage = (newBoard: IBoard, newLevel: number, newShapeIndex: number, newScore: number): void => {
        const snap: ISavedGame = {
          level: newLevel,
          shapeIndex: newShapeIndex,
          score: newScore,
          movesLeft: getMovesForLevel(newLevel),
          goalRemaining: getGoalForStage(newShapeIndex, newLevel),
          board: newBoard,
        };
        savedGameRef.current = snap;
        AsyncStorage.setItem(SAVE_GAME_KEY, JSON.stringify(snap)).catch(() => undefined);
      };

      const advanceAfterStars = (): void => {
        setStageStars(null);
        const currentScore = score + effectivePoints;
        const isLastShape = shapeIndex >= GAME_SHAPES.length - 1;
        if (isLastShape) {
          const isLastLevel = level >= MAX_LEVEL;
          if (!isLastLevel) {
            const nextLevel = level + 1;
            const init = initializeStage(0, nextLevel);
            setLevel(nextLevel);
            setShapeIndex(0);
            applyStageInit(init);
            setScore(currentScore);
            saveNewStage(init.board, nextLevel, 0, currentScore);
            return;
          }
          setIsResolving(false);
          setWon(true);
          setGameOver(true);
          return;
        }
        const nextShapeIndex = shapeIndex + 1;
        const init = initializeStage(nextShapeIndex, level);
        setShapeIndex(nextShapeIndex);
        applyStageInit(init);
        setScore(currentScore);
        saveNewStage(init.board, level, nextShapeIndex, currentScore);
      };

      const finalizeMove = (): void => {
        setBoard(finalBoard);
        setScore((prev) => {
          const next = prev + effectivePoints;
          if (next > bestScore) {
            setBestScore(next);
            AsyncStorage.setItem('bestScore', String(next)).catch(() => undefined);
          }
          return next;
        });
        setMovesLeft(nextMoves);
        if (playStyle === 'multiplier-rush') setComboMultiplier(nextComboMultiplier);
        setMatchedCellKeys([]);

        // Bomb spawn threshold (bomb-storm spawns earlier)
        const spawnRatio = playStyle === 'bomb-storm' ? BOMB_STORM_SPAWN_RATIO : 0.6;
        const spawnThreshold = Math.floor(getMovesForLevel(level) * spawnRatio);
        if (playStyle !== 'timer-attack' && bombPosition === null && nextMoves === spawnThreshold && runningGoalRemaining > 0) {
          setBombPosition(getRandomPlayablePosition(shapeMask));
        }

        if (runningGoalRemaining === 0) {
          const totalMoves = getMovesForLevel(level);
          const starsRemaining = playStyle === 'timer-attack' ? (timerSecondsLeft ?? 0) : nextMoves;
          const starsTotal = playStyle === 'timer-attack' ? (currentShape.timerSeconds ?? TIMER_ATTACK_SECONDS) : totalMoves;
          const stars = calcStars(starsRemaining, starsTotal, playStyle);
          const starsKey = `stars_L${level}_S${shapeIndex}`;
          AsyncStorage.getItem(starsKey).then((existing) => {
            const prev = existing ? parseInt(existing, 10) : 0;
            if (stars > prev) {
              AsyncStorage.setItem(starsKey, String(stars)).catch(() => undefined);
              setBestStars(stars);
            } else {
              setBestStars(prev as 0 | 1 | 2 | 3);
            }
          }).catch(() => undefined);
          setStageStars(stars);
          resolveTimerRef.current = setTimeout(() => {
            advanceAfterStars();
          }, 1500);
          return;
        }

        if (runningGoalRemaining > 0 && (playStyle === 'timer-attack' || nextMoves > 0)) {
          const snap: ISavedGame = {
            level,
            shapeIndex,
            score: score + effectivePoints,
            movesLeft: nextMoves,
            goalRemaining: runningGoalRemaining,
            board: finalBoard,
            targetColor,
            frozenCells: playStyle === 'locked-tiles' ? runningFrozenCells : undefined,
            timerSecondsLeft: playStyle === 'timer-attack' ? timerSecondsLeft : undefined,
            comboMultiplier: playStyle === 'multiplier-rush' ? nextComboMultiplier : undefined,
            bombRespawnsLeft: playStyle === 'bomb-storm' ? bombRespawnsLeft : undefined,
          };
          AsyncStorage.setItem(SAVE_GAME_KEY, JSON.stringify(snap)).catch(() => undefined);
        }

        setIsResolving(false);
        if (playStyle !== 'timer-attack' && nextMoves === 0) {
          setGameOver(true);
        }
      };

      const playStep = (stepIndex: number): void => {
        const step = steps[stepIndex]!;
        const displayBoard = stepIndex === 0 ? result.previewBoard : steps[stepIndex - 1]!.nextBoard;

        applyStepProgress(step, stepIndex);
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
    [
      applyStageInit,
      bestScore,
      board,
      bombPosition,
      bombRespawnsLeft,
      comboMultiplier,
      currentShape,
      frozenCells,
      gameOver,
      goalRemaining,
      isResolving,
      level,
      movesLeft,
      playStyle,
      score,
      selectedCell,
      shapeIndex,
      shapeMask,
      targetColor,
      timerSecondsLeft,
      won,
    ],
  );

  const resumeSavedGame = useCallback(() => {
    const saved = savedGameRef.current;
    if (!saved) return;
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const shape = GAME_SHAPES[saved.shapeIndex] ?? GAME_SHAPES[0];
    setLevel(saved.level);
    setShapeIndex(saved.shapeIndex);
    setScore(saved.score);
    setMovesLeft(saved.movesLeft);
    setGoalRemaining(saved.goalRemaining);
    setBoard(saved.board);
    setSelectedCell(null);
    setMatchedCellKeys([]);
    setIsResolving(false);
    setCombo(0);
    setWon(false);
    setGameOver(false);
    setBombPosition(null);
    setBombActivating(null);
    setStageStars(null);
    setPlayStyle(shape.playStyle);
    setTargetColor(saved.targetColor ?? null);
    setFrozenCells(saved.frozenCells ?? []);
    setComboMultiplier(saved.comboMultiplier ?? 1);
    setBombRespawnsLeft(saved.bombRespawnsLeft ?? 0);
    // Always reset timer to full on resume (timer doesn't persist across sessions)
    setTimerSecondsLeft(shape.playStyle === 'timer-attack' ? (shape.timerSeconds ?? TIMER_ATTACK_SECONDS) : null);
  }, []);

  const restart = useCallback(() => {
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    AsyncStorage.removeItem(SAVE_GAME_KEY).catch(() => undefined);
    setHasSavedGame(false);
    setWon(false);
    setGameOver(false);
    setScore(0);
    const init = initializeStage(shapeIndex, level);
    setShapeIndex(shapeIndex);
    applyStageInit(init);
  }, [applyStageInit, level, shapeIndex]);

  const restartFromLevelOne = useCallback(() => {
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    AsyncStorage.removeItem(SAVE_GAME_KEY).catch(() => undefined);
    setHasSavedGame(false);
    setLevel(START_LEVEL);
    setShapeIndex(0);
    setScore(0);
    setWon(false);
    setGameOver(false);
    applyStageInit(initializeStage(0, START_LEVEL));
  }, [applyStageInit]);

  const cycleShape = useCallback(() => {
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    const nextIndex = (shapeIndex + 1) % GAME_SHAPES.length;
    setShapeIndex(nextIndex);
    setScore(0);
    setWon(false);
    setGameOver(false);
    applyStageInit(initializeStage(nextIndex, level));
  }, [applyStageInit, level, shapeIndex]);

  const goal = useMemo(() => getGoalForStage(shapeIndex, level), [level, shapeIndex]);

  return {
    board,
    shapeMask,
    selectedCell,
    matchedCellKeys,
    isResolving,
    goal,
    goalRemaining,
    movesLeft,
    gameOver,
    won,
    score,
    bestScore,
    level,
    bombPosition,
    bombActivating,
    stageStars,
    bestStars,
    hasSavedGame,
    combo,
    playStyle,
    targetColor,
    frozenCells,
    comboMultiplier,
    timerSecondsLeft,
    tapCell,
    cycleShape,
    restart,
    restartFromLevelOne,
    resumeSavedGame,
  };
};
