import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  View,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
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
const MAX_CELL_SIZE = 80; // 사실상 캡 제거 (어떤 폰이든 byWidth/byHeight가 자연히 제한)
const MIN_CELL_SIZE = 22;
const ANDROID_TOP_PADDING = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;
const MATCH_ANIMATION_MS = 220;

type SpecialType = 'striped-h' | 'striped-v' | 'rainbow';

function SpecialOverlay({ type, cellSize }: { type: SpecialType; cellSize: number }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.05] });

  if (type === 'striped-h') {
    // Double arrow pointing left & right  ←→
    return (
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          opacity,
          transform: [{ scale }],
        }}
      >
        {/* Left arrowhead */}
        <View style={{
          position: 'absolute',
          left: cellSize * 0.06,
          width: 0, height: 0,
          borderTopWidth: cellSize * 0.18,
          borderBottomWidth: cellSize * 0.18,
          borderRightWidth: cellSize * 0.22,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: 'rgba(255,255,255,0.95)',
        }} />
        {/* Center bar */}
        <View style={{
          width: cellSize * 0.5,
          height: 5,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.95)',
        }} />
        {/* Right arrowhead */}
        <View style={{
          position: 'absolute',
          right: cellSize * 0.06,
          width: 0, height: 0,
          borderTopWidth: cellSize * 0.18,
          borderBottomWidth: cellSize * 0.18,
          borderLeftWidth: cellSize * 0.22,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: 'rgba(255,255,255,0.95)',
        }} />
      </Animated.View>
    );
  }

  if (type === 'striped-v') {
    // Double arrow pointing up & down  ↑↓
    return (
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          opacity,
          transform: [{ scale }],
        }}
      >
        {/* Up arrowhead */}
        <View style={{
          position: 'absolute',
          top: cellSize * 0.06,
          width: 0, height: 0,
          borderLeftWidth: cellSize * 0.18,
          borderRightWidth: cellSize * 0.18,
          borderBottomWidth: cellSize * 0.22,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: 'rgba(255,255,255,0.95)',
        }} />
        {/* Center bar */}
        <View style={{
          width: 5,
          height: cellSize * 0.5,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.95)',
        }} />
        {/* Down arrowhead */}
        <View style={{
          position: 'absolute',
          bottom: cellSize * 0.06,
          width: 0, height: 0,
          borderLeftWidth: cellSize * 0.18,
          borderRightWidth: cellSize * 0.18,
          borderTopWidth: cellSize * 0.22,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: 'rgba(255,255,255,0.95)',
        }} />
      </Animated.View>
    );
  }

  // Rainbow — rotating star burst
  const spin = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transform: [{ scale }, { rotate: spin }],
      }}
    >
      {/* 4-point star: two overlapping rectangles */}
      <View style={{
        position: 'absolute',
        width: cellSize * 0.62,
        height: cellSize * 0.18,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.9)',
      }} />
      <View style={{
        position: 'absolute',
        width: cellSize * 0.18,
        height: cellSize * 0.62,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.9)',
      }} />
      <View style={{
        position: 'absolute',
        width: cellSize * 0.5,
        height: cellSize * 0.14,
        borderRadius: 3,
        backgroundColor: 'rgba(255,215,0,0.85)',
        transform: [{ rotate: '45deg' }],
      }} />
      <View style={{
        position: 'absolute',
        width: cellSize * 0.14,
        height: cellSize * 0.5,
        borderRadius: 3,
        backgroundColor: 'rgba(255,215,0,0.85)',
        transform: [{ rotate: '45deg' }],
      }} />
    </Animated.View>
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
    restartFromLevelOne,
    bombPosition,
    stageStars,
    bestStars,
    hasSavedGame,
    resumeSavedGame,
    playStyle,
    targetColor,
    frozenCells,
    comboMultiplier,
    timerSecondsLeft,
  } = useCandyBreak();

  const [hudHeight, setHudHeight] = useState(0);

  const matchAnim = useRef(new Animated.Value(0)).current;
  const comboAnim = useRef(new Animated.Value(0)).current;
  const stageCompleteAnim = useRef(new Animated.Value(0)).current;
  const bombPulseAnim = useRef(new Animated.Value(0)).current;
  const bombPulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
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
    const availableWidth = windowWidth - HORIZONTAL_PADDING - BOARD_CONTAINER_PADDING * 2;
    const availableHeight = Math.max(
      220,
      windowHeight - hudHeight - BOARD_CONTAINER_PADDING * 2 - 16,
    );
    const columns = board[0]?.length ?? 1;
    const rows = board.length || 1;
    const byWidth = Math.floor(availableWidth / columns);
    const byHeight = Math.floor(availableHeight / rows);
    const computed = Math.min(byWidth, byHeight);
    return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, computed));
  }, [board, hudHeight, windowHeight, windowWidth]);

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


  // Dynamic 4th HUD card based on play style
  const fourthCard = (() => {
    switch (playStyle) {
      case 'timer-attack':
        return { label: 'Time', value: String(timerSecondsLeft ?? 0), warn: (timerSecondsLeft ?? 999) <= 15 };
      case 'multiplier-rush':
        return { label: 'Multi', value: `x${comboMultiplier}`, warn: false };
      case 'locked-tiles':
        return { label: 'Frozen', value: String(frozenCells.filter(fc => fc.hitsRemaining > 0).length), warn: false };
      default:
        return { label: 'Moves', value: String(movesLeft), warn: movesLeft <= 5 };
    }
  })();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View onLayout={(e) => setHudHeight(e.nativeEvent.layout.height)}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Candy Break</Text>
          <View style={styles.topRow}>
            <Text style={styles.starsValue}>
              STARS: {[1, 2, 3].map((i) => (i <= bestStars ? '★' : '☆')).join('')}
            </Text>
            <Text style={styles.bestValue}>BEST: 🥇 {bestScore}</Text>
          </View>
        </View>
        <View style={styles.hudContent}>
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
              <Text style={styles.statLabel}>{playStyle === 'multiplier-rush' ? 'Score Goal' : 'Goal'}</Text>
              <Text style={styles.statValue}>{goalProgress}/{goal}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{fourthCard.label}</Text>
              <Text style={[styles.statValue, fourthCard.warn ? styles.statValueWarn : null]}>{fourthCard.value}</Text>
            </View>
          </View>

          {(() => {
            const bannerConfig: Record<string, { icon: string; label: string; hint: string; accent: string }> = {
              'classic':         { icon: '🍬', label: 'Classic',          hint: `Clear ${goal} candies`,                    accent: '#3a506b' },
              'color-target':    { icon: '🎯', label: 'Color Target',     hint: `Only ${targetColor ?? '?'} candies count`, accent: '#7b2d8b' },
              'locked-tiles':    { icon: '❄️', label: 'Locked Tiles',     hint: 'Match next to ❄️ to thaw',                 accent: '#1a5276' },
              'multiplier-rush': { icon: '✨', label: 'Multiplier Rush',  hint: 'Combos double your score!',                accent: '#7d6608' },
              'bomb-storm':      { icon: '💣', label: 'Bomb Storm',       hint: 'Tap the bomb to advance',                  accent: '#6e2c00' },
              'timer-attack':    { icon: '⏱️', label: 'Timer Attack',     hint: `Clear ${goal} before time runs out`,       accent: '#1a5c3a' },
            };
            const cfg = bannerConfig[playStyle];
            if (!cfg) return null;
            return (
              <View style={[styles.stageBanner, { backgroundColor: cfg.accent }]}>
                <Text style={styles.stageBannerIcon}>{cfg.icon}</Text>
                <Text style={styles.stageBannerLine} numberOfLines={1}>
                  <Text style={styles.stageBannerLabel}>{cfg.label}</Text>
                  <Text style={styles.stageBannerHint}>  {cfg.hint}</Text>
                </Text>
                {playStyle === 'color-target' && targetColor ? (
                  <Image source={CANDY_IMAGES[targetColor]} style={{ width: 26, height: 26 }} resizeMode="contain" />
                ) : null}
              </View>
            );
          })()}
        </View>
      </View>

      <View style={styles.boardWrapper}>
        <View style={styles.boardContainer}>
          {board.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.boardRow}>
              {row.map((cell, colIndex) => {
                  const isBomb = !!bombPosition && bombPosition.row === rowIndex && bombPosition.col === colIndex;
                  const isMatched = matchedSet.has(`${rowIndex}:${colIndex}`);
                  const isPlayable = !!shapeMask[rowIndex]?.[colIndex];
                  const frozenCell = frozenCells.find(fc => fc.row === rowIndex && fc.col === colIndex);
                  const isFrozen = !!(frozenCell && frozenCell.hitsRemaining > 0);

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

                  if (isFrozen) {
                    return (
                      <View
                        key={`cell-${rowIndex}-${colIndex}`}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          borderRadius: 7,
                          backgroundColor: '#1a3a5c',
                          borderWidth: 2,
                          borderColor: '#4fc3f7',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {cell ? (
                          <Image
                            source={CANDY_IMAGES[cell.candyBreak]}
                            style={{ width: cellSize * 0.92, height: cellSize * 0.92, opacity: 0.45 }}
                            resizeMode="contain"
                          />
                        ) : null}
                        <Text
                          style={{
                            position: 'absolute',
                            fontSize: cellSize * (frozenCell!.hitsRemaining === 2 ? 0.28 : 0.38),
                          }}
                        >
                          {frozenCell!.hitsRemaining === 2 ? '❄️❄️' : '❄️'}
                        </Text>
                      </View>
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
                          backgroundColor: 'transparent',
                          borderWidth: selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 3 : 1,
                          borderColor:
                            selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                              ? '#fdf0d5'
                              : '#0f1a34',
                          opacity: 1,
                        },
                        isMatched
                          ? {
                              transform: [{ scale: matchScale }, { rotate: matchRotate }],
                              opacity: matchOpacity,
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
                {won
                  ? 'Great matching! All stages completed.'
                  : playStyle === 'timer-attack'
                    ? 'Time ran out! Tap Restart to try again.'
                    : playStyle === 'locked-tiles'
                      ? 'Too many frozen tiles remain. Tap Restart.'
                      : 'No moves left. Tap Restart to try again.'}
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
        <Fireworks visible={showFireworks} />
      </View>
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
  hudContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  boardWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 12,
  },
  topRow: {
    marginTop: 6,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stageBanner: {
    width: '98%',
    alignSelf: 'center',
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
    gap: 6,
  },
  stageBannerIcon: {
    fontSize: 18,
  },
  stageBannerLine: {
    flex: 1,
    fontSize: 12,
  },
  stageBannerLabel: {
    color: '#fdf0d5',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stageBannerHint: {
    color: 'rgba(253,240,213,0.75)',
    fontSize: 12,
    fontWeight: '400',
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
});
