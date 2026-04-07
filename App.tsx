import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
import { useCandyBreak } from './src/hooks/useCandyBreak';
import { CANDY_SYMBOLS } from './src/constants/game';

const HORIZONTAL_PADDING = 24;
const BOARD_CONTAINER_PADDING = 12;
const MAX_CELL_SIZE = 46;
const MIN_CELL_SIZE = 22;
const BOARD_HEIGHT_RATIO = 0.6;
const ANDROID_TOP_PADDING = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;
const MATCH_ANIMATION_MS = 220;

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
    tapCell,
    restart,
    bombPosition,
  } = useCandyBreak();

  const matchAnim = useRef(new Animated.Value(0)).current;
  const comboAnim = useRef(new Animated.Value(0)).current;
  const bombPulseAnim = useRef(new Animated.Value(0)).current;
  const bombPulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const matchSoundRef = useRef<Audio.Sound | null>(null);
  const congratsSoundRef = useRef<Audio.Sound | null>(null);
  const fireworksTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevFinalWinRef = useRef(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [colorBlind, setColorBlind] = useState(false);

  // Start/stop bomb pulse loop
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


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.headerContainer}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Candy Break</Text>
          <View style={styles.bestContainer}>
            <Text style={styles.bestValue}>BEST: 🥇 {bestScore}</Text>
          </View>
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
                      <AnimatedPressable
                        key={`cell-${rowIndex}-${colIndex}`}
                        onPress={() => tapCell(rowIndex, colIndex)}
                        disabled={!isPlayable || gameOver || isResolving}
                        style={[
                          styles.cell,
                          {
                            width: cellSize,
                            height: cellSize,
                            backgroundColor: isPlayable
                              ? cell
                                ? cell.color
                                : 'transparent'
                              : 'transparent',
                            borderWidth:
                              selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 3 : 1,
                            borderColor:
                              selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                                ? '#fdf0d5'
                                : '#0f1a34',
                            opacity: isPlayable ? 1 : 0,
                          },
                          isMatched
                            ? {
                                transform: [{ scale: matchScale }, { rotate: matchRotate }],
                                opacity: matchOpacity,
                              }
                            : null,
                        ]}
                      >
                        {colorBlind && cell && isPlayable ? (
                          <Text style={{ fontSize: cellSize * 0.62, color: '#d8d8d8', fontWeight: '900', lineHeight: cellSize * 0.72 }}>
                            {CANDY_SYMBOLS[cell.candyBreak] ?? '?'}
                          </Text>
                        ) : null}
                      </AnimatedPressable>
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
            <Pressable style={styles.controlButton} onPress={restart}>
              <Text style={styles.controlText}>Restart</Text>
            </Pressable>
            <Pressable
              style={[styles.controlButton, colorBlind && styles.controlButtonActive]}
              onPress={() => setColorBlind((v) => !v)}
            >
              <Text style={styles.controlText}>{colorBlind ? '♿ ON' : '♿ OFF'}</Text>
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
    paddingTop: 34,
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
  gameOverOverlay: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
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
    minWidth: 130,
    height: 46,
    marginHorizontal: 3,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a506b',
  },
  controlButtonActive: {
    backgroundColor: '#118ab2',
  },
  controlText: {
    color: '#fdf0d5',
    fontSize: 16,
    fontWeight: '700',
  },
});
