import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Fireworks from './src/components/Fireworks';
import InstructionPage from './src/components/InstructionPage';
import { useCandyBreak } from './src/hooks/useCandyBreak';

const CANDY_IMAGES: Record<string, ReturnType<typeof require>> = {
  Red:  require('./assets/images/candy_red.png'),
  Blue: require('./assets/images/candy_blue.png'),
  Gold: require('./assets/images/candy_gold.png'),
  Mint: require('./assets/images/candy_mint.png'),
};

const HORIZONTAL_PADDING = 24;
const BOARD_CONTAINER_PADDING = 12;
const MAX_CELL_SIZE = 46;
const MIN_CELL_SIZE = 22;
const BOARD_HEIGHT_RATIO = 0.6;
const ANDROID_TOP_PADDING = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;
const MATCH_ANIMATION_MS = 220;

type SpecialType = 'striped-h' | 'striped-v' | 'rainbow';

function SpecialOverlay({ type, cellSize }: { type: SpecialType; cellSize: number }) {
  const [opacity, setOpacity] = useState(1);
  useEffect(() => {
    const STEPS = 20;
    let step = 0;
    const id = setInterval(() => {
      step = (step + 1) % STEPS;
      // 0–9: fade out 1→0.15, 10–19: fade in 0.15→1
      const half = STEPS / 2;
      const newOpacity = step < half
        ? 1 - (step / half) * 0.85
        : 0.15 + ((step - half) / half) * 0.85;
      setOpacity(newOpacity);
    }, 50); // 20 steps × 50ms = 1s cycle
    return () => clearInterval(id);
  }, []);

  if (type === 'striped-h') {
    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: (cellSize - 6) / 2,
          left: cellSize * 0.06,
          width: cellSize * 0.88,
          height: 6,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.9)',
          opacity,
        }}
      />
    );
  }
  if (type === 'striped-v') {
    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: (cellSize - 6) / 2,
          top: cellSize * 0.06,
          width: 6,
          height: cellSize * 0.88,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.9)',
          opacity,
        }}
      />
    );
  }
  // rainbow
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: (cellSize - cellSize * 0.7) / 2,
        left: (cellSize - cellSize * 0.7) / 2,
        width: cellSize * 0.7,
        height: cellSize * 0.7,
        borderRadius: cellSize * 0.35,
        borderWidth: 3,
        borderColor: '#fff',
        backgroundColor: 'rgba(255,255,255,0.2)',
        opacity,
      }}
    />
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function App() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const {
    board,
    shapeMask,
    selectedCell,
    matchedCellKeys,
    isResolving,
    shapeLabel,
    goal,
    goalRemaining,
    movesLeft,
    gameOver,
    won,
    score,
    bestScore,
    level,
    combo,
    hintCells,
    tapCell,
    restart,
    restartFromLevelOne,
    bombPosition,
    requestHint,
    stageStars,
    bestStars,
    hasSavedGame,
    resumeSavedGame,
  } = useCandyBreak();

  const hintSet = useMemo(() => new Set(hintCells?.map(p => `${p.row}:${p.col}`) ?? []), [hintCells]);

  const matchAnim = useRef(new Animated.Value(0)).current;
  const comboAnim = useRef(new Animated.Value(0)).current;
  const stageCompleteAnim = useRef(new Animated.Value(0)).current;
  const bombPulseAnim = useRef(new Animated.Value(0)).current;
  const bombPulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const hintPulseAnim = useRef(new Animated.Value(0)).current;
  const hintPulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const matchSoundRef = useRef<Audio.Sound | null>(null);
  const congratsSoundRef = useRef<Audio.Sound | null>(null);
  const fireworksTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevFinalWinRef = useRef(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showInstructionPage, setShowInstructionPage] = useState(true);

  // Start/stop bomb pulse loop
  // Blink loop for special tiles handled by SpecialOverlay component

  useEffect(() => {
    if (bombPosition) {
      bombPulseAnim.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bombPulseAnim, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(bombPulseAnim, {
            toValue: 0,
            duration: 550,
            useNativeDriver: true,
          }),
        ]),
      );
      bombPulseLoopRef.current = loop;
      loop.start();
    } else {
      bombPulseLoopRef.current?.stop();
      bombPulseLoopRef.current = null;
      bombPulseAnim.setValue(0);
    }
    return () => {
      bombPulseLoopRef.current?.stop();
    };
  }, [bombPulseAnim, bombPosition]);

  // Start/stop hint pulse loop
  useEffect(() => {
    if (hintCells && hintCells.length > 0) {
      hintPulseAnim.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(hintPulseAnim, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(hintPulseAnim, {
            toValue: 0,
            duration: 380,
            useNativeDriver: true,
          }),
        ]),
      );
      hintPulseLoopRef.current = loop;
      loop.start();
    } else {
      hintPulseLoopRef.current?.stop();
      hintPulseLoopRef.current = null;
      hintPulseAnim.setValue(0);
    }
    return () => {
      hintPulseLoopRef.current?.stop();
    };
  }, [hintCells, hintPulseAnim]);

  useEffect(() => {
    let mounted = true;

    const loadSounds = async (): Promise<void> => {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/sounds/swoosh.mp3'),
      );
      const { sound: congratsSound } = await Audio.Sound.createAsync(
        require('./assets/sounds/congrats.mp3'),
      );

      if (!mounted) {
        await sound.unloadAsync();
        await congratsSound.unloadAsync();
        return;
      }

      matchSoundRef.current = sound;
      congratsSoundRef.current = congratsSound;
    };

    loadSounds().catch(() => {
      matchSoundRef.current = null;
      congratsSoundRef.current = null;
    });

    return () => {
      mounted = false;
      if (fireworksTimerRef.current) {
        clearTimeout(fireworksTimerRef.current);
      }
      const matchSound = matchSoundRef.current;
      const congratsSound = congratsSoundRef.current;
      matchSoundRef.current = null;
      congratsSoundRef.current = null;
      if (matchSound) {
        matchSound.unloadAsync();
      }
      if (congratsSound) {
        congratsSound.unloadAsync();
      }
    };
  }, []);

  const cellSize = useMemo(() => {
    const availableWidth =
      windowWidth - HORIZONTAL_PADDING - BOARD_CONTAINER_PADDING * 2;
    const availableHeight = Math.max(
      220,
      windowHeight * BOARD_HEIGHT_RATIO - BOARD_CONTAINER_PADDING * 2,
    );
    const columns = board[0]?.length ?? 1;
    const rows = board.length || 1;
    const byWidth = Math.floor(availableWidth / columns);
    const byHeight = Math.floor(availableHeight / rows);
    const computed = Math.min(byWidth, byHeight);
    return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, computed));
  }, [board, windowHeight, windowWidth]);

  const goalProgress = Math.max(0, goal - goalRemaining);
  const matchedSet = useMemo(() => new Set(matchedCellKeys), [matchedCellKeys]);

  const bombScale = bombPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.12],
  });
  const bombOpacity = bombPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });

  const hintScale = hintPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const hintOpacity = hintPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const comboScale = comboAnim.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0.4, 1.2, 1.0, 0],
  });
  const comboOpacity = comboAnim.interpolate({
    inputRange: [0, 0.08, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });
  const comboTranslateY = comboAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -28],
  });

  const matchScale = matchAnim.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [1, 1.35, 0],
  });

  const matchOpacity = matchAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, 1, 0],
  });

  const matchRotate = matchAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: ['0deg', '14deg', '-10deg'],
  });

  useEffect(() => {
    if (matchedCellKeys.length === 0) {
      return;
    }

    const playMatchSound = async (): Promise<void> => {
      const sound = matchSoundRef.current;
      if (!sound) {
        return;
      }
      await sound.replayAsync();
    };

    playMatchSound().catch(() => undefined);

    matchAnim.setValue(0);
    Animated.timing(matchAnim, {
      toValue: 1,
      duration: MATCH_ANIMATION_MS,
      useNativeDriver: true,
    }).start();
  }, [matchAnim, matchedCellKeys]);

  useEffect(() => {
    if (stageStars === null) return;
    stageCompleteAnim.setValue(0);
    Animated.spring(stageCompleteAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [stageStars, stageCompleteAnim]);

  useEffect(() => {
    if (combo < 2) return;
    comboAnim.setValue(0);
    Animated.timing(comboAnim, {
      toValue: 1,
      duration: 1600,
      useNativeDriver: true,
    }).start();
  }, [combo, comboAnim]);

  useEffect(() => {
    const isFinalWin = won && gameOver;
    if (isFinalWin && !prevFinalWinRef.current) {
      const playCongratsSound = async (): Promise<void> => {
        const sound = congratsSoundRef.current;
        if (!sound) {
          return;
        }
        await sound.replayAsync();
      };

      playCongratsSound().catch(() => undefined);
      setShowFireworks(true);

      if (fireworksTimerRef.current) {
        clearTimeout(fireworksTimerRef.current);
      }
      fireworksTimerRef.current = setTimeout(() => {
        setShowFireworks(false);
      }, 4500);
    }

    prevFinalWinRef.current = isFinalWin;
  }, [gameOver, won]);

  const startGame = (): void => {
    restartFromLevelOne();
    setShowInstructionPage(false);
  };

  const continueGame = (): void => {
    resumeSavedGame();
    setShowInstructionPage(false);
  };

  if (showInstructionPage) {
    return (
      <InstructionPage
        onStartGame={startGame}
        onContinueGame={continueGame}
        hasSavedGame={hasSavedGame}
      />
    );
  }


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Candy Break</Text>
        <View style={styles.topRow}>
          <Text style={styles.starsValue}>
            STARS: {[1, 2, 3].map((i) => (i <= bestStars ? '★' : '☆')).join('')}
          </Text>
          <Text style={styles.bestValue}>BEST: 🥇 {bestScore}</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Level</Text>
              <Text style={styles.statValue}>{level}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Goal</Text>
              <Text style={styles.statValue}>{goalProgress}/{goal}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Moves</Text>
              <Text style={[styles.statValue, movesLeft <= 5 ? styles.statValueWarn : null]}>{movesLeft}</Text>
            </View>
          </View>

          <View style={styles.shapeStageCard}>
            <Text style={styles.shapeStageLabel}>Current Shape</Text>
            <Text style={styles.shapeStageValue}>{shapeLabel}</Text>
          </View>

          <View style={styles.boardContainer}>
            {board.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.boardRow}>
                {row.map((cell, colIndex) => {
                    const isBomb = !!bombPosition && bombPosition.row === rowIndex && bombPosition.col === colIndex;
                    const isMatched = matchedSet.has(`${rowIndex}:${colIndex}`);
                    const isPlayable = !!shapeMask[rowIndex]?.[colIndex];

                    if (isBomb) {
                      return (
                        <Animated.View
                          key={`cell-${rowIndex}-${colIndex}`}
                          style={[
                            styles.cell,
                            {
                              width: cellSize,
                              height: cellSize,
                              backgroundColor: '#ffd166',
                              borderWidth: 2,
                              borderColor: '#fff7c0',
                              transform: [{ scale: bombScale }],
                              opacity: bombOpacity,
                              alignItems: 'center',
                              justifyContent: 'center',
                            },
                          ]}
                        >
                          <Pressable
                            onPress={() => tapCell(rowIndex, colIndex)}
                            style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Text style={{ fontSize: cellSize * 0.42, lineHeight: cellSize * 0.52 }}>⚡</Text>
                          </Pressable>
                        </Animated.View>
                      );
                    }

                    return (
                      <View key={`cell-${rowIndex}-${colIndex}`} style={{ width: cellSize, height: cellSize }}>
                      <AnimatedPressable
                        onPress={() => tapCell(rowIndex, colIndex)}
                        disabled={!isPlayable || gameOver || isResolving}
                        style={[
                          styles.cell,
                          {
                            width: cellSize,
                            height: cellSize,
                            backgroundColor: isPlayable
                              ? 'transparent'
                              : 'transparent',
                            borderWidth:
                              selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 3 : hintSet.has(`${rowIndex}:${colIndex}`) ? 3 : 1,
                            borderColor:
                              selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                                ? '#fdf0d5'
                                : hintSet.has(`${rowIndex}:${colIndex}`)
                                  ? '#ffd166'
                                  : '#0f1a34',
                            opacity: isPlayable ? 1 : 0,
                          },
                          isMatched
                            ? {
                                transform: [{ scale: matchScale }, { rotate: matchRotate }],
                                opacity: matchOpacity,
                              }
                            : hintSet.has(`${rowIndex}:${colIndex}`)
                              ? {
                                  transform: [{ scale: hintScale }],
                                  opacity: hintOpacity,
                                }
                              : null,
                        ]}
                      >
                        {cell && isPlayable ? (
                          <Image
                            source={CANDY_IMAGES[cell.candyBreak]}
                            style={{ width: cellSize * 0.92, height: cellSize * 0.92 }}
                            resizeMode="contain"
                          />
                        ) : null}
                      </AnimatedPressable>
                        {cell?.special && isPlayable ? (
                          <SpecialOverlay type={cell.special} cellSize={cellSize} />
                        ) : null}
                      </View>
                    );
                  })}
              </View>
            ))}

            {gameOver ? (
              <View style={styles.gameOverOverlay}>
                <Text style={styles.gameOverTitle}>{won ? 'You Win!' : 'Game Over'}</Text>
                <Text style={styles.gameOverBody}>
                  {won ? 'Great matching! All shapes completed.' : `No moves left on ${shapeLabel}. Tap Restart to try again.`}
                </Text>
              </View>
            ) : null}

            {stageStars !== null ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.stageCompleteOverlay,
                  {
                    opacity: stageCompleteAnim,
                    transform: [
                      {
                        scale: stageCompleteAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.stageCompleteTitle}>Stage Clear!</Text>
                <Text style={styles.stageCompleteStars}>
                  {[1, 2, 3].map((i) => (i <= stageStars ? '★' : '☆')).join('  ')}
                </Text>
              </Animated.View>
            ) : null}

            {combo >= 2 ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.comboOverlay,
                  {
                    transform: [{ scale: comboScale }, { translateY: comboTranslateY }],
                    opacity: comboOpacity,
                  },
                ]}
              >
                <Text style={styles.comboText}>+combo x{combo}!</Text>
              </Animated.View>
            ) : null}
          </View>

          <View style={styles.helpCard}>
            <Text style={styles.helpText}>Tap one cube, then tap an adjacent cube to swap.</Text>
          </View>

          <View style={styles.controlsRow}>
            <Pressable style={styles.controlButton} onPress={restart} onLongPress={restartFromLevelOne} delayLongPress={450}>
              <Text style={styles.controlText}>Restart</Text>
            </Pressable>
            <Pressable style={styles.controlButton} onPress={requestHint} disabled={gameOver || isResolving}>
              <Text style={styles.controlText}>Hint</Text>
            </Pressable>
          </View>
        </View>
        <Fireworks visible={showFireworks} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b132b',
  },
  headerContainer: {
    paddingTop: ANDROID_TOP_PADDING + 20,
    paddingHorizontal: 12,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 34,
  },
  container: {
    paddingTop: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  topRow: {
    marginTop: 6,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bestContainer: {
    alignItems: 'flex-end',
  },
  bestValue: {
    color: '#ffd166',
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fdf0d5',
    textAlign: 'center',
    marginBottom: 4,
  },
  starsValue: {
    color: '#ffd166',
    fontSize: 15,
    fontWeight: '700',
  },
  statsRow: {
    marginTop: 8,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#1c2541',
    paddingVertical: 6,
    alignItems: 'center',
  },
  statLabel: {
    color: '#a9bcd0',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    marginTop: 2,
    color: '#fdf0d5',
    fontSize: 17,
    fontWeight: '700',
  },
  statValueWarn: {
    color: '#ff6b6b',
  },
  boardContainer: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
    padding: BOARD_CONTAINER_PADDING,
    position: 'relative',
  },
  shapeStageCard: {
    marginTop: 8,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#1c2541',
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shapeStageLabel: {
    color: '#a9bcd0',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  shapeStageValue: {
    color: '#fdf0d5',
    fontSize: 15,
    fontWeight: '800',
  },
  boardRow: {
    flexDirection: 'row',
  },
  cell: {
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1a34',
  },
  specialOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  rainbowOverlay: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  gameOverOverlay: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  stageCompleteOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 88,
    backgroundColor: 'rgba(11, 19, 43, 0.82)',
    borderRadius: 12,
  },
  stageCompleteTitle: {
    color: '#ffd166',
    fontSize: 30,
    fontWeight: '900',
    textShadowColor: '#0b132b',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  stageCompleteStars: {
    color: '#ffd166',
    fontSize: 42,
    marginTop: 10,
    textShadowColor: '#0b132b',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  comboOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  comboText: {
    color: '#ffd166',
    fontSize: 28,
    fontWeight: '900',
    textShadowColor: '#0b132b',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  gameOverTitle: {
    color: '#ffb703',
    fontSize: 32,
    fontWeight: '800',
  },
  gameOverBody: {
    marginTop: 6,
    color: '#fdf0d5',
    fontSize: 14,
    textAlign: 'center',
  },
  helpCard: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#1c2541',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  helpText: {
    color: '#a9bcd0',
    fontSize: 10,
    fontWeight: '600',
  },
  controlsRow: {
    marginTop: 8,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    minWidth: 90,
    height: 38,
    marginHorizontal: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a506b',
  },
  controlButtonActive: {
    backgroundColor: '#118ab2',
  },
  controlText: {
    color: '#fdf0d5',
    fontSize: 13,
    fontWeight: '700',
  },
});
