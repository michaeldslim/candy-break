import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getCareerProgressCopy } from '../career/careerLabels';
import { useCareer } from '../career/CareerProvider';
import { useI18n } from '../i18n/I18nContext';
import { useSettings } from '../settings/SettingsProvider';
import { ILeaderboardEntry } from '../types';
import { loadLeaderboard } from '../utils/leaderboard';
import LeaderboardView from './LeaderboardView';
import PlayerAvatar from './PlayerAvatar';

const ANDROID_TOP_PADDING = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;
const COLLAPSE_DURATION_MS = 300;

function PlayStylesCollapsible({
  title,
  heading,
  items,
  expanded,
  onToggle,
}: {
  title: string;
  heading: string;
  items: string[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const chevronProgress = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const [bodyHeight, setBodyHeight] = useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progress, {
        toValue: expanded ? 1 : 0,
        duration: COLLAPSE_DURATION_MS,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(chevronProgress, {
        toValue: expanded ? 1 : 0,
        duration: COLLAPSE_DURATION_MS,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [expanded, progress, chevronProgress]);

  const animatedHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(bodyHeight, 1)],
  });

  const bodyOpacity = progress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.7, 1],
  });

  const chevronRotate = chevronProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const bodyContent = (
    <View style={styles.collapsibleBody}>
      <Text style={styles.instructionSectionHeading}>{heading}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.instructionItem}>{item}</Text>
      ))}
    </View>
  );

  return (
    <View style={styles.instructionCard}>
      <Pressable
        style={styles.collapsibleHeader}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text style={styles.instructionSectionHeading}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Text style={styles.collapseIcon}>▸</Text>
        </Animated.View>
      </Pressable>

      <View
        style={styles.measureWrap}
        pointerEvents="none"
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          if (nextHeight > 0 && nextHeight !== bodyHeight) {
            setBodyHeight(nextHeight);
          }
        }}
      >
        {bodyContent}
      </View>

      <Animated.View style={[styles.collapsibleAnimatedWrap, { height: animatedHeight, opacity: bodyOpacity }]}>
        {bodyContent}
      </Animated.View>
    </View>
  );
}

type InstructionPageProps = {
  onStartGame: () => void;
  onContinueGame: () => void;
  hasSavedGame: boolean;
  onOpenSettings: () => void;
  onOpenCareer: () => void;
};

export default function InstructionPage({
  onStartGame,
  onContinueGame,
  hasSavedGame,
  onOpenSettings,
  onOpenCareer,
}: InstructionPageProps) {
  const { strings } = useI18n();
  const { instruction, leaderboard } = strings;
  const { settings } = useSettings();
  const { careerState, loaded: careerLoaded } = useCareer();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [entries, setEntries] = useState<ILeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [playStylesExpanded, setPlayStylesExpanded] = useState(false);

  const careerBadge =
    settings.careerModeEnabled && careerLoaded
      ? getCareerProgressCopy(strings, careerState).primary
      : null;

  const basicsSection = instruction.sections[0];
  const playStylesSection = instruction.sections[1];

  useEffect(() => {
    if (!showLeaderboard) return;

    let cancelled = false;
    setLoadingLeaderboard(true);
    loadLeaderboard()
      .then((loaded) => {
        if (!cancelled) setEntries(loaded);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingLeaderboard(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showLeaderboard]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          <View style={styles.titleSpacer} />
          <Text style={styles.appTitle}>{strings.app.title}</Text>
          <Pressable
            style={styles.settingsButton}
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel={strings.settings.title}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.heroRow}>
          <PlayerAvatar avatarId={settings.playerAvatarId} size="lg" />
          <View style={styles.heroText}>
            {careerBadge ? (
              <Pressable accessibilityRole="button" onPress={onOpenCareer}>
                <Text style={styles.careerBadge}>{careerBadge}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.instructionScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.instructionContainer}>
          {basicsSection ? (
            <View style={styles.instructionCard}>
              <Text style={styles.instructionSectionHeading}>{basicsSection.heading}</Text>
              {basicsSection.items.map((item) => (
                <Text key={item} style={styles.instructionItem}>{item}</Text>
              ))}
            </View>
          ) : null}

          {playStylesSection ? (
            <PlayStylesCollapsible
              title={instruction.playStylesHeading}
              heading={playStylesSection.heading}
              items={playStylesSection.items}
              expanded={playStylesExpanded}
              onToggle={() => setPlayStylesExpanded((prev) => !prev)}
            />
          ) : null}

          {hasSavedGame && (
            <Pressable style={styles.continueGameButton} onPress={onContinueGame}>
              <Text style={styles.continueGameButtonText}>{instruction.buttonResume}</Text>
            </Pressable>
          )}
          <Pressable style={styles.leaderboardButton} onPress={() => setShowLeaderboard(true)}>
            <Text style={styles.leaderboardButtonText}>{leaderboard.button}</Text>
          </Pressable>
          <Pressable style={styles.startGameButton} onPress={onStartGame}>
            <Text style={styles.startGameButtonText}>{instruction.buttonStart}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={showLeaderboard}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaderboard(false)}
      >
        {loadingLeaderboard ? (
          <View style={styles.loadingBackdrop}>
            <ActivityIndicator size="large" color="#ffd166" />
          </View>
        ) : (
          <LeaderboardView
            entries={entries}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b132b',
  },
  headerContainer: {
    paddingTop: ANDROID_TOP_PADDING + 12,
    paddingHorizontal: 16,
    paddingBottom: 6,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSpacer: {
    width: 40,
  },
  appTitle: {
    flex: 1,
    color: '#fdf0d5',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    color: '#ffd166',
    fontSize: 24,
    fontWeight: '700',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  heroText: {
    flexShrink: 1,
  },
  careerBadge: {
    color: '#ffd166',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  instructionScrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  instructionContainer: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  instructionCard: {
    width: '100%',
    backgroundColor: '#1c2541',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsibleBody: {
    gap: 8,
    marginTop: 4,
  },
  collapsibleAnimatedWrap: {
    overflow: 'hidden',
  },
  measureWrap: {
    position: 'absolute',
    opacity: 0,
    zIndex: -1,
    left: 12,
    right: 12,
  },
  collapseIcon: {
    color: '#ffd166',
    fontSize: 16,
    fontWeight: '800',
  },
  instructionSectionHeading: {
    color: '#ffd166',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  instructionItem: {
    color: '#fdf0d5',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  leaderboardButton: {
    marginTop: 4,
    width: '100%',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a4a6b',
  },
  leaderboardButtonText: {
    color: '#ffd166',
    fontSize: 15,
    fontWeight: '800',
  },
  startGameButton: {
    marginTop: 4,
    width: '100%',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a506b',
  },
  continueGameButton: {
    marginTop: 4,
    width: '100%',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e63946',
  },
  continueGameButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  startGameButtonText: {
    color: '#fdf0d5',
    fontSize: 15,
    fontWeight: '800',
  },
  loadingBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 43, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
