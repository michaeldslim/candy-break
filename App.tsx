import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
import { MOVE_SAVER_REFUND_CAP } from './src/constants/game';
import { useCandyBreak } from './src/hooks/useCandyBreak';
import { I18nProvider, useI18n } from './src/i18n/I18nContext';
import { PlayStyleBannerKey } from './src/i18n/types';

const CANDY_IMAGES: Record<string, ReturnType<typeof require>> = {
  Red:  require('./assets/images/candy_red.png'),
  Blue: require('./assets/images/candy_blue.png'),
  Gold: require('./assets/images/candy_gold.png'),
  Mint: require('./assets/images/candy_mint.png'),
};

const CANDY_BAR_HEX: Record<string, string> = {
  Red: '#FF5A5F',
  Blue: '#4D96FF',
  Gold: '#FFD93D',
  Mint: '#6BCB77',
};

type CandyColorName = keyof typeof CANDY_BAR_HEX;

/** Pairs that stay vivid — Red+Blue is excluded (muddy reddish-purple). */
const CANDY_BAR_BLEND_PAIRS: [CandyColorName, CandyColorName][] = [
  ['Red', 'Gold'],
  ['Gold', 'Red'],
  ['Gold', 'Mint'],
  ['Mint', 'Gold'],
  ['Blue', 'Mint'],
  ['Mint', 'Blue'],
  ['Red', 'Mint'],
  ['Mint', 'Red'],
  ['Blue', 'Gold'],
  ['Gold', 'Blue'],
];

function mixHexWeighted(hex1: string, hex2: string, weight2: number): string {
  const n1 = parseInt(hex1.replace('#', ''), 16);
  const n2 = parseInt(hex2.replace('#', ''), 16);
  const t = Math.min(1, Math.max(0, weight2));
  const w1 = 1 - t;
  const channel = (shift: number) =>
    Math.round((((n1 >> shift) & 255) * w1 + ((n2 >> shift) & 255) * t));
  return `#${[16, 8, 0].map((s) => channel(s).toString(16).padStart(2, '0')).join('')}`;
}

/** One vivid mixed candy hue per stage (deterministic from level + shape + slot). */
function getStageBarFillColor(level: number, shapeIndex: number, stageSlot: number): string {
  const seed = level * 7919 + shapeIndex * 104729 + stageSlot * 15485863;
  const pair = CANDY_BAR_BLEND_PAIRS[Math.abs(seed) % CANDY_BAR_BLEND_PAIRS.length]!;
  const blend = 0.28 + (Math.abs(seed >> 4) % 45) / 100; // 0.28–0.72 toward second color
  return mixHexWeighted(CANDY_BAR_HEX[pair[0]], CANDY_BAR_HEX[pair[1]], blend);
}

const HORIZONTAL_PADDING = 24;
const BOARD_CONTAINER_PADDING = 12;
const MAX_CELL_SIZE = 80; // 사실상 캡 제거 (어떤 폰이든 byWidth/byHeight가 자연히 제한)
const MIN_CELL_SIZE = 22;
const ANDROID_TOP_PADDING = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;
const MATCH_ANIMATION_MS = 500;
const BASKET_BAR_HEIGHT = 20;
const BASKET_BAR_FRAME = 4;
const BASKET_TOTAL_HEIGHT = BASKET_BAR_HEIGHT + BASKET_BAR_FRAME * 2;
const BASKET_WIDTH_GRID_RATIO = 1;
const BASKET_GAP_BELOW_GRID = 8;
// Android gesture nav (e.g. Galaxy S25) — RN SafeAreaView does not inset the bottom.
const ANDROID_BOTTOM_SAFE_INSET = 64;
const IOS_BOTTOM_EXTRA_INSET = 8;

type SpecialType = 'striped-h' | 'striped-v' | 'rainbow';

type FlyingCandySpec = {
  key: string;
  row: number;
  col: number;
  color: string;
  tumbleSign: 1 | -1;
};

function CollectionBasket({
  width,
  height,
  bounceScale,
  squishY,
  fillRatio,
  fillColor,
}: {
  width: number;
  height: number;
  bounceScale: Animated.AnimatedInterpolation<number>;
  squishY: Animated.AnimatedInterpolation<number>;
  fillRatio: number;
  fillColor: string;
}) {
  const clampedFill = Math.min(1, Math.max(0, fillRatio));
  const fillAnim = useRef(new Animated.Value(clampedFill)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: clampedFill,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clampedFill, fillAnim]);

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.collectionBasket,
        {
          width,
          height,
          transform: [{ scaleX: bounceScale }, { scaleY: squishY }],
        },
      ]}
    >
      <View style={styles.collectionBasketFrame}>
        <View style={styles.collectionBasketProgressTrack}>
          <Animated.View
            style={[styles.collectionBasketProgressFill, { width: fillWidth, backgroundColor: fillColor }]}
          />
          <View style={styles.collectionBasketProgressShine} />
        </View>
      </View>
    </Animated.View>
  );
}

function FlyingCandy({
  row,
  col,
  cellSize,
  color,
  progress,
  mouthX,
  mouthY,
  tumbleSign,
}: {
  row: number;
  col: number;
  cellSize: number;
  color: string;
  progress: Animated.Value;
  mouthX: number;
  mouthY: number;
  tumbleSign: 1 | -1;
}) {
  const cellCenterX = col * cellSize + cellSize / 2;
  const cellCenterY = row * cellSize + cellSize / 2;
  const deltaX = mouthX - cellCenterX;
  const deltaY = mouthY - cellCenterY;

  const translateX = progress.interpolate({
    inputRange: [0, 0.15, 0.4, 1],
    outputRange: [0, deltaX * 0.03, deltaX * 0.28, deltaX],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 0.06, 0.28, 0.62, 1],
    outputRange: [0, deltaY * 0.08, deltaY * 0.42, deltaY * 0.78, deltaY],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.08, 0.2, 0.55, 1],
    outputRange: [1, 1.32, 1.12, 0.88, 0.58],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.84, 1],
    outputRange: [1, 1, 0],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: ['0deg', `${tumbleSign * 18}deg`, `${tumbleSign * 72}deg`],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: col * cellSize,
        top: row * cellSize,
        width: cellSize,
        height: cellSize,
        zIndex: 220 + row,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ translateX }, { translateY }, { scale }, { rotate }],
        opacity,
      }}
    >
      <Image
        source={CANDY_IMAGES[color]}
        style={{ width: cellSize * 0.94, height: cellSize * 0.94 }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

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

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

function AppContent() {
  const { strings, format } = useI18n();
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
    shapeIndex,
    stageSlot,
    combo,
    tapCell,
    restart,
    restartFromLevelOne,
    bombPosition,
    bombActivating,
    stageStars,
    bestStars,
    hasSavedGame,
    resumeSavedGame,
    playStyle,
    targetColor,
    orderSteps,
    orderStepIndex,
    frozenCells,
    jellyCells,
    stoneCells,
    comboMultiplier,
    timerSecondsLeft,
    moveSaverRefundsUsed,
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

  const bottomSafeInset =
    Platform.OS === 'android' ? ANDROID_BOTTOM_SAFE_INSET : IOS_BOTTOM_EXTRA_INSET;

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
  const goalFillRatio = goal > 0 ? Math.min(1, goalProgress / goal) : 0;
  const stageBarFillColor = useMemo(
    () => getStageBarFillColor(level, shapeIndex, stageSlot),
    [level, shapeIndex, stageSlot],
  );
  const matchedSet = useMemo(() => new Set(matchedCellKeys), [matchedCellKeys]);

  const boardColumns = board[0]?.length ?? 1;
  const boardRows = board.length || 1;
  const gridWidth = boardColumns * cellSize;
  const gridHeight = boardRows * cellSize;
  const basketWidth = Math.round(gridWidth * BASKET_WIDTH_GRID_RATIO);
  const basketHeight = BASKET_TOTAL_HEIGHT;
  const basketCollectX = gridWidth / 2;
  const basketCollectY = gridHeight + BASKET_GAP_BELOW_GRID + basketHeight / 2;

  const flyingCandies = useMemo((): FlyingCandySpec[] => {
    return matchedCellKeys
      .map((key) => {
        const [rowStr, colStr] = key.split(':');
        const row = Number(rowStr);
        const col = Number(colStr);
        const cell = board[row]?.[col];
        if (!cell?.candyBreak) {
          return null;
        }
        return {
          key,
          row,
          col,
          color: cell.candyBreak,
          tumbleSign: (row + col) % 2 === 0 ? 1 : -1,
        };
      })
      .filter((item): item is FlyingCandySpec => item !== null);
  }, [board, matchedCellKeys]);

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

  const basketBounce = matchAnim.interpolate({
    inputRange: [0, 0.76, 0.88, 1],
    outputRange: [1, 1, 1.16, 1],
  });

  const basketSquishY = matchAnim.interpolate({
    inputRange: [0, 0.76, 0.88, 1],
    outputRange: [1, 1, 0.9, 1],
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
      easing: Easing.bezier(0.2, 0.85, 0.35, 1),
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
        return { label: strings.hud.time, value: String(timerSecondsLeft ?? 0), warn: (timerSecondsLeft ?? 999) <= 15 };
      case 'multiplier-rush':
        return { label: strings.hud.multi, value: `x${comboMultiplier}`, warn: false };
      case 'locked-tiles':
        return { label: strings.hud.frozen, value: String(frozenCells.filter(fc => fc.hitsRemaining > 0).length), warn: false };
      case 'jelly-tiles':
        return { label: strings.hud.jelly, value: String(jellyCells.length), warn: false };
      case 'stone-blocks':
        return { label: strings.hud.stones, value: String(stoneCells.filter(sc => sc.hitsRemaining > 0).length), warn: false };
      case 'move-saver':
        return { label: strings.hud.saved, value: `${moveSaverRefundsUsed}/${MOVE_SAVER_REFUND_CAP}`, warn: false };
      default:
        return { label: strings.hud.moves, value: String(movesLeft), warn: movesLeft <= 5 };
    }
  })();

  const colorLabel = (color: string | null | undefined): string =>
    color ? (strings.colors[color] ?? color) : '?';

  const bannerIcons: Record<PlayStyleBannerKey, string> = {
    classic: '🍬',
    'color-target': '🎯',
    'locked-tiles': '❄️',
    'multiplier-rush': '✨',
    'bomb-storm': '💣',
    'timer-attack': '⏱️',
    'order-collect': '📋',
    'combo-goal': '🔗',
    'move-saver': '💾',
    'pure-match': '🧩',
    'jelly-tiles': '🟢',
    'stone-blocks': '🪨',
  };

  const bannerAccents: Record<PlayStyleBannerKey, string> = {
    classic: '#3a506b',
    'color-target': '#7b2d8b',
    'locked-tiles': '#1a5276',
    'multiplier-rush': '#7d6608',
    'bomb-storm': '#6e2c00',
    'timer-attack': '#1a5c3a',
    'order-collect': '#5b2c6f',
    'combo-goal': '#1a4a6e',
    'move-saver': '#2d6a4f',
    'pure-match': '#4a3728',
    'jelly-tiles': '#2e5c1e',
    'stone-blocks': '#4a4a4a',
  };

  const getBannerHint = (style: PlayStyleBannerKey): string => {
    const banner = strings.banners[style];
    switch (style) {
      case 'classic':
      case 'timer-attack':
        return format(banner.hint, { goal });
      case 'color-target':
      case 'order-collect':
        return format(banner.hint, { color: colorLabel(targetColor) });
      case 'move-saver':
        return format(banner.hint, { cap: MOVE_SAVER_REFUND_CAP });
      default:
        return banner.hint;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View onLayout={(e) => setHudHeight(e.nativeEvent.layout.height)}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{strings.app.title}</Text>
          <View style={styles.topRow}>
            <Text style={styles.starsValue}>
              {strings.hud.stars.toUpperCase()}: {[1, 2, 3].map((i) => (i <= bestStars ? '★' : '☆')).join('')}
            </Text>
            <Text style={styles.bestValue}>{strings.hud.best.toUpperCase()}: 🥇 {bestScore}</Text>
          </View>
        </View>
        <View style={styles.hudContent}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{strings.hud.score}</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{strings.hud.level}</Text>
              <Text style={styles.statValue}>{level}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                {playStyle === 'multiplier-rush' ? strings.hud.scoreGoal : playStyle === 'combo-goal' ? strings.hud.combos : strings.hud.goal}
              </Text>
              <Text style={styles.statValue}>{goalProgress}/{goal}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{fourthCard.label}</Text>
              <Text style={[styles.statValue, fourthCard.warn ? styles.statValueWarn : null]}>{fourthCard.value}</Text>
            </View>
          </View>

          {(() => {
            const style = playStyle as PlayStyleBannerKey;
            const banner = strings.banners[style];
            if (!banner) return null;
            return (
              <View style={[styles.stageBanner, { backgroundColor: bannerAccents[style] }]}>
                <Text style={styles.stageBannerIcon}>{bannerIcons[style]}</Text>
                <Text style={styles.stageBannerLine} numberOfLines={1}>
                  <Text style={styles.stageBannerLabel}>{banner.label}</Text>
                  <Text style={styles.stageBannerHint}>  {getBannerHint(style)}</Text>
                </Text>
                {playStyle === 'color-target' && targetColor ? (
                  <Image source={CANDY_IMAGES[targetColor]} style={{ width: 26, height: 26 }} resizeMode="contain" />
                ) : null}
                {playStyle === 'order-collect' && targetColor ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Image source={CANDY_IMAGES[targetColor]} style={{ width: 26, height: 26 }} resizeMode="contain" />
                    {orderSteps.slice(orderStepIndex + 1).map((step) => (
                      <View key={step.color} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.stageBannerHint}>→</Text>
                        <Image source={CANDY_IMAGES[step.color]} style={{ width: 20, height: 20, opacity: 0.7 }} resizeMode="contain" />
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })()}
        </View>
      </View>

      <View
        style={[
          styles.boardWrapper,
          {
            paddingBottom: Math.max(
              bottomSafeInset,
              BASKET_GAP_BELOW_GRID + BASKET_TOTAL_HEIGHT + 4,
            ),
          },
        ]}
      >
        <View style={styles.boardContainer}>
          <View style={[styles.boardPlayArea, { width: gridWidth }]}>
            <View style={{ width: gridWidth, height: gridHeight }}>
              {board.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.boardRow}>
                  {row.map((cell, colIndex) => {
                  const isBomb =
                    (!!bombPosition && bombPosition.row === rowIndex && bombPosition.col === colIndex) ||
                    (!!bombActivating && bombActivating.row === rowIndex && bombActivating.col === colIndex);
                  const isMatched = matchedSet.has(`${rowIndex}:${colIndex}`);
                  const isPlayable = !!shapeMask[rowIndex]?.[colIndex];
                  const frozenCell = frozenCells.find(fc => fc.row === rowIndex && fc.col === colIndex);
                  const isFrozen = !!(frozenCell && frozenCell.hitsRemaining > 0);
                  const stoneCell = stoneCells.find(sc => sc.row === rowIndex && sc.col === colIndex);
                  const isStone = !!(stoneCell && stoneCell.hitsRemaining > 0);
                  const hasJelly = jellyCells.some(jc => jc.row === rowIndex && jc.col === colIndex);

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

                  if (isStone) {
                    return (
                      <Pressable
                        key={`cell-${rowIndex}-${colIndex}`}
                        onPress={() => tapCell(rowIndex, colIndex)}
                        disabled={gameOver || isResolving}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          borderRadius: 7,
                          backgroundColor: '#3d3d3d',
                          borderWidth: 2,
                          borderColor: '#8a8a8a',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {cell ? (
                          <Image
                            source={CANDY_IMAGES[cell.candyBreak]}
                            style={{ width: cellSize * 0.92, height: cellSize * 0.92, opacity: 0.35 }}
                            resizeMode="contain"
                          />
                        ) : null}
                        <Text
                          style={{
                            position: 'absolute',
                            fontSize: cellSize * 0.38,
                          }}
                        >
                          🪨
                        </Text>
                      </Pressable>
                    );
                  }

                  if (isFrozen) {
                    return (
                      <Pressable
                        key={`cell-${rowIndex}-${colIndex}`}
                        onPress={() => tapCell(rowIndex, colIndex)}
                        disabled={gameOver || isResolving}
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
                      </Pressable>
                    );
                  }

                  return (
                    <View key={`cell-${rowIndex}-${colIndex}`} style={{ width: cellSize, height: cellSize }}>
                    <Pressable
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
                        },
                      ]}
                    >
                      {cell && isPlayable && !isMatched ? (
                        <Image
                          source={CANDY_IMAGES[cell.candyBreak]}
                          style={{ width: cellSize * 0.92, height: cellSize * 0.92 }}
                          resizeMode="contain"
                        />
                      ) : null}
                    </Pressable>
                      {cell?.special && isPlayable && !isMatched ? (
                        <SpecialOverlay type={cell.special} cellSize={cellSize} />
                      ) : null}
                      {hasJelly ? (
                        <View
                          pointerEvents="none"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: cellSize,
                            height: cellSize,
                            borderRadius: 7,
                            borderWidth: 3,
                            borderColor: '#7bed9f',
                            backgroundColor: 'rgba(123, 237, 159, 0.25)',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingBottom: 1,
                          }}
                        >
                          <Text style={{ fontSize: cellSize * 0.22 }}>🟢</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
                </View>
              ))}
            </View>

            {flyingCandies.length > 0 ? (
              <View
                pointerEvents="none"
                style={[styles.flyingCandyLayer, { width: gridWidth, height: gridHeight + basketHeight + BASKET_GAP_BELOW_GRID }]}
              >
                {flyingCandies.map((candy) => (
                  <FlyingCandy
                    key={candy.key}
                    row={candy.row}
                    col={candy.col}
                    cellSize={cellSize}
                    color={candy.color}
                    progress={matchAnim}
                    mouthX={basketCollectX}
                    mouthY={basketCollectY}
                    tumbleSign={candy.tumbleSign}
                  />
                ))}
              </View>
            ) : null}

            <View style={{ marginTop: BASKET_GAP_BELOW_GRID, alignItems: 'center' }}>
              <CollectionBasket
                width={basketWidth}
                height={basketHeight}
                bounceScale={basketBounce}
                squishY={basketSquishY}
                fillRatio={goalFillRatio}
                fillColor={stageBarFillColor}
              />
            </View>
          </View>

          {gameOver ? (
            <Pressable
              style={styles.gameOverOverlay}
              onPress={() => (won ? restartFromLevelOne() : restart())}
            >
              <View style={styles.gameOverCard}>
                <Text style={styles.gameOverTitle}>{won ? strings.gameOver.titleWin : strings.gameOver.titleLose}</Text>
                <Text style={styles.gameOverBody}>
                  {won
                    ? strings.gameOver.win
                    : playStyle === 'timer-attack'
                      ? strings.gameOver.timeOut
                      : playStyle === 'locked-tiles'
                        ? strings.gameOver.frozenRemain
                        : playStyle === 'jelly-tiles'
                          ? strings.gameOver.jellyRemain
                          : playStyle === 'stone-blocks'
                            ? strings.gameOver.stonesRemain
                            : strings.gameOver.noMoves}
                </Text>
              </View>
            </Pressable>
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
              <Text style={styles.stageCompleteTitle}>{strings.stageClear}</Text>
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
              <Text style={styles.comboText}>{format(strings.combo, { combo })}</Text>
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
    justifyContent: 'flex-start',
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
  boardPlayArea: {
    position: 'relative',
    alignSelf: 'center',
  },
  boardRow: {
    flexDirection: 'row',
  },
  flyingCandyLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 180,
  },
  collectionBasket: {
    position: 'relative',
    zIndex: 160,
  },
  collectionBasketFrame: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#e8c547',
    backgroundColor: '#5c3210',
    padding: BASKET_BAR_FRAME,
    justifyContent: 'center',
  },
  collectionBasketProgressTrack: {
    width: '100%',
    height: BASKET_BAR_HEIGHT,
    borderRadius: 999,
    backgroundColor: '#1a0f2e',
    overflow: 'hidden',
    position: 'relative',
  },
  collectionBasketProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  collectionBasketProgressShine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  cell: {
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1a34',
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 19, 43, 0.82)',
    borderRadius: 12,
  },
  gameOverCard: {
    marginHorizontal: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: 'rgba(28, 37, 65, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(255, 209, 102, 0.35)',
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
    color: '#ffd166',
    fontSize: 32,
    fontWeight: '900',
    textShadowColor: '#0b132b',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  gameOverBody: {
    marginTop: 10,
    color: '#fdf0d5',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
    textShadowColor: '#0b132b',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
