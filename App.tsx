import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef } from 'react';
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
import { useBackgroundMusic } from './src/hooks/useBackgroundMusic';
import { useCandyBreak } from './src/hooks/useCandyBreak';

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
  const { isMusicOn, canPlayMusic, toggleMusic } = useBackgroundMusic();
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
    level,
    combo,
    tapCell,
    cycleShape,
    restart,
  } = useCandyBreak();

  const matchAnim = useRef(new Animated.Value(0)).current;

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

  const matchScale = matchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.72],
  });

  const matchOpacity = matchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.45],
  });

  useEffect(() => {
    if (matchedCellKeys.length === 0) {
      return;
    }

    matchAnim.setValue(0);
    Animated.sequence([
      Animated.timing(matchAnim, {
        toValue: 1,
        duration: MATCH_ANIMATION_MS / 2,
        useNativeDriver: true,
      }),
      Animated.timing(matchAnim, {
        toValue: 0,
        duration: MATCH_ANIMATION_MS / 2,
        useNativeDriver: true,
      }),
    ]).start();
  }, [matchAnim, matchedCellKeys]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Candy Break</Text>
          <Pressable
            style={styles.musicButton}
            onPress={toggleMusic}
            disabled={!canPlayMusic}
          >
            <Text style={styles.musicButtonText}>
              {canPlayMusic
                ? isMusicOn
                  ? 'Music: On'
                  : 'Music: Off'
                : 'Music unavailable'}
            </Text>
          </Pressable>
        </View>

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
            <Text style={styles.statLabel}>Combo</Text>
            <Text style={styles.statValue}>{combo}</Text>
          </View>
        </View>

        <View style={styles.modeRow}>
          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>Mode: Easy</Text>
            <Text style={styles.shapeLabel}>{shapeLabel}</Text>
          </View>
          <Pressable style={styles.nextRestartButton} onPress={cycleShape}>
            <Text style={styles.nextRestartText}>Change Shape</Text>
          </Pressable>
        </View>

        <View style={styles.goalCard}>
          <Text style={styles.goalText}>Goal: {goalProgress} / {goal}</Text>
          <Text style={styles.goalText}>Moves: {movesLeft}</Text>
        </View>

        <View style={styles.boardContainer}>
          {board.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.boardRow}>
              {row.map((cell, colIndex) => (
                <AnimatedPressable
                  key={`cell-${rowIndex}-${colIndex}`}
                  onPress={() => tapCell(rowIndex, colIndex)}
                  disabled={!shapeMask[rowIndex]?.[colIndex] || gameOver || isResolving}
                  style={[
                    styles.cell,
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: shapeMask[rowIndex]?.[colIndex]
                        ? cell
                          ? cell.color
                          : '#f5f3ea'
                        : 'transparent',
                      borderWidth:
                        selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 3 : 1,
                      borderColor:
                        selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                          ? '#fdf0d5'
                          : '#0f1a34',
                      opacity: shapeMask[rowIndex]?.[colIndex] ? 1 : 0,
                    },
                    matchedSet.has(`${rowIndex}:${colIndex}`)
                      ? {
                          transform: [{ scale: matchScale }],
                          opacity: matchOpacity,
                        }
                      : null,
                  ]}
                />
              ))}
            </View>
          ))}

          {gameOver ? (
            <View style={styles.gameOverOverlay}>
              <Text style={styles.gameOverTitle}>{won ? 'You Win!' : 'Game Over'}</Text>
              <Text style={styles.gameOverBody}>
                {won ? 'Great matching! Easy goal completed.' : 'No moves left. Try another shape.'}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.helpCard}>
          <Text style={styles.helpText}>Tap one cube, then tap an adjacent cube to swap.</Text>
          <Text style={styles.helpText}>Only swaps that create a match are accepted.</Text>
        </View>

        <View style={styles.controlsRow}>
          <Pressable style={styles.controlButton} onPress={restart}>
            <Text style={styles.controlText}>Restart</Text>
          </Pressable>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b132b',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 34,
  },
  container: {
    paddingTop: ANDROID_TOP_PADDING,
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
  modeRow: {
    marginTop: 8,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nextCard: {
    flex: 1,
    backgroundColor: '#1c2541',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  nextLabel: {
    color: '#a9bcd0',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  shapeLabel: {
    color: '#fdf0d5',
    fontSize: 14,
    fontWeight: '700',
  },
  nextRestartButton: {
    minWidth: 120,
    borderRadius: 10,
    backgroundColor: '#5bc0be',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextRestartText: {
    color: '#0b132b',
    fontSize: 12,
    fontWeight: '800',
  },
  goalCard: {
    marginTop: 8,
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#1c2541',
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalText: {
    color: '#fdf0d5',
    fontSize: 13,
    fontWeight: '700',
  },
  musicButton: {
    minWidth: 110,
    borderRadius: 999,
    backgroundColor: '#3a506b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  musicButtonText: {
    color: '#fdf0d5',
    fontSize: 12,
    fontWeight: '700',
  },
  boardContainer: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#f5f3ea',
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
    marginTop: 10,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#1c2541',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  helpText: {
    color: '#a9bcd0',
    fontSize: 12,
    fontWeight: '600',
  },
  controlsRow: {
    marginTop: 8,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    minWidth: 150,
    height: 46,
    marginHorizontal: 3,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a506b',
  },
  controlText: {
    color: '#fdf0d5',
    fontSize: 16,
    fontWeight: '700',
  },
});
