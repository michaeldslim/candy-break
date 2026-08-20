import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, SafeAreaView, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import {
  careerRankLabel,
  getCareerLadderRows,
  getCareerLadderStatus,
  getCareerProgressCopy,
  getPromotionRequirementCopy,
  isMaxCareerRank,
  type CareerLadderStatus,
} from '../career/careerLabels';
import { getPromotionTarget } from '../career/careerRules';
import { useCareer } from '../career/CareerProvider';
import { useI18n } from '../i18n/I18nContext';
import { format } from '../i18n/format';
import { useSettings } from '../settings/SettingsProvider';
import type { AvatarId } from '../constants/avatars';
import type { CareerRank, CareerState } from '../types/career';
import PlayerAvatar from './PlayerAvatar';

const ANDROID_TOP_PADDING = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;

type CareerPageProps = {
  onBack: () => void;
  onOpenSettings: () => void;
};

function ladderStatusLabel(strings: ReturnType<typeof useI18n>['strings'], status: CareerLadderStatus): string {
  switch (status) {
    case 'achieved':
      return strings.career.ladder.achieved;
    case 'current':
      return strings.career.ladder.current;
    default:
      return strings.career.ladder.locked;
  }
}

function ladderDetailCopy(
  strings: ReturnType<typeof useI18n>['strings'],
  state: CareerState,
  rank: CareerRank,
  status: CareerLadderStatus,
): string {
  if (status === 'current') {
    const target = getPromotionTarget(state.rank);
    if (!target) {
      return format(strings.career.maxRank, { rank: careerRankLabel(strings, rank) });
    }

    return format(strings.career.ladder.progressToNext, {
      current: state.promotionWins,
      required: target.requiredWins,
      nextRank: careerRankLabel(strings, target.nextRank),
    });
  }

  if (rank === 'intern') {
    return strings.career.ladder.startingRank;
  }

  return getPromotionRequirementCopy(strings, rank) ?? '';
}

function CareerSummary({ state, playerAvatarId }: { state: CareerState; playerAvatarId: AvatarId }) {
  const { strings } = useI18n();
  const progress = getCareerProgressCopy(strings, state);
  const highestLabel = careerRankLabel(strings, state.highestRankAchieved);
  const showHighest = state.highestRankAchieved !== state.rank || isMaxCareerRank(state);

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <PlayerAvatar avatarId={playerAvatarId} size="lg" />
        <View style={styles.summaryText}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{strings.career.screen.currentRank}</Text>
            <Text style={styles.summaryValue}>{progress.primary}</Text>
          </View>
          {progress.secondary ? <Text style={styles.summaryHint}>{progress.secondary}</Text> : null}
        </View>
      </View>
      {showHighest ? (
        <View style={[styles.summaryRow, styles.summaryRowSpaced]}>
          <Text style={styles.summaryLabel}>{strings.career.screen.highestRank}</Text>
          <Text style={styles.summaryValue}>{highestLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

function LadderRow({
  rank,
  state,
  isLast,
}: {
  rank: CareerRank;
  state: CareerState;
  isLast: boolean;
}) {
  const { strings } = useI18n();
  const status = getCareerLadderStatus(state, rank);
  const detail = ladderDetailCopy(strings, state, rank, status);
  const isHighlighted = status === 'current' || rank === state.highestRankAchieved;

  return (
    <View style={styles.ladderRow}>
      <View style={styles.ladderRail}>
        <View
          style={[
            styles.ladderDot,
            status === 'achieved' && styles.ladderDotAchieved,
            status === 'current' && styles.ladderDotCurrent,
            status === 'locked' && styles.ladderDotLocked,
          ]}
        />
        {!isLast ? <View style={styles.ladderLine} /> : null}
      </View>

      <View
        style={[
          styles.ladderCard,
          isHighlighted && styles.ladderCardHighlighted,
          status === 'locked' && styles.ladderCardLocked,
        ]}
      >
        <View style={styles.ladderHeader}>
          <Text
            style={[
              styles.ladderRank,
              status === 'current' && styles.ladderRankCurrent,
              status === 'locked' && styles.ladderRankLocked,
            ]}
          >
            {careerRankLabel(strings, rank)}
          </Text>
          <Text
            style={[
              styles.ladderStatus,
              status === 'achieved' && styles.ladderStatusAchieved,
              status === 'current' && styles.ladderStatusCurrent,
            ]}
          >
            {ladderStatusLabel(strings, status)}
          </Text>
        </View>
        {detail ? <Text style={styles.ladderDetail}>{detail}</Text> : null}
      </View>
    </View>
  );
}

function CareerDisabledState({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { strings } = useI18n();

  return (
    <View style={styles.disabledCard}>
      <Text style={styles.disabledTitle}>{strings.career.screen.disabledTitle}</Text>
      <Text style={styles.disabledBody}>{strings.career.screen.disabledBody}</Text>
      <Pressable style={styles.linkButton} onPress={onOpenSettings}>
        <Text style={styles.linkButtonText}>{strings.career.screen.enableInSettings}</Text>
      </Pressable>
    </View>
  );
}

export default function CareerPage({ onBack, onOpenSettings }: CareerPageProps) {
  const { strings } = useI18n();
  const { settings } = useSettings();
  const { careerState, loaded } = useCareer();
  const ladderRows = getCareerLadderRows();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{strings.common.back}</Text>
        </Pressable>
        <Text style={styles.title}>{strings.career.screen.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!settings.careerModeEnabled ? (
          <CareerDisabledState onOpenSettings={onOpenSettings} />
        ) : !loaded ? null : (
          <>
            <CareerSummary state={careerState} playerAvatarId={settings.playerAvatarId} />

            <Text style={styles.winHint}>{strings.career.screen.winHint}</Text>

            <View style={styles.ladderSection}>
              <Text style={styles.sectionTitle}>{strings.career.screen.ladderTitle}</Text>
              {ladderRows.map((rank, index) => (
                <LadderRow
                  key={rank}
                  rank={rank}
                  state={careerState}
                  isLast={index === ladderRows.length - 1}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b132b',
  },
  header: {
    paddingTop: ANDROID_TOP_PADDING + 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#ffd166',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: '#fdf0d5',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 20,
  },
  summaryCard: {
    backgroundColor: '#1c2541',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.35)',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryText: {
    flex: 1,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  summaryRowSpaced: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(253, 240, 213, 0.2)',
  },
  summaryLabel: {
    color: '#a9bcd0',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryValue: {
    color: '#ffd166',
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  summaryHint: {
    color: '#a9bcd0',
    fontSize: 13,
    lineHeight: 18,
  },
  winHint: {
    color: '#ffd166',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  ladderSection: {
    gap: 0,
  },
  sectionTitle: {
    color: '#ffd166',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  ladderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ladderRail: {
    width: 18,
    alignItems: 'center',
  },
  ladderDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 18,
    backgroundColor: '#fdf0d5',
    opacity: 0.35,
  },
  ladderDotAchieved: {
    backgroundColor: '#ffd166',
    opacity: 1,
  },
  ladderDotCurrent: {
    backgroundColor: '#ffd166',
    opacity: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 17,
  },
  ladderDotLocked: {
    backgroundColor: '#fdf0d5',
    opacity: 0.2,
  },
  ladderLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(253, 240, 213, 0.18)',
    marginVertical: 4,
  },
  ladderCard: {
    flex: 1,
    backgroundColor: '#1c2541',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    gap: 4,
  },
  ladderCardHighlighted: {
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.45)',
  },
  ladderCardLocked: {
    opacity: 0.72,
  },
  ladderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  ladderRank: {
    color: '#fdf0d5',
    fontSize: 17,
    fontWeight: '700',
  },
  ladderRankCurrent: {
    color: '#ffd166',
  },
  ladderRankLocked: {
    opacity: 0.75,
  },
  ladderStatus: {
    color: '#a9bcd0',
    opacity: 0.55,
    fontSize: 12,
    fontWeight: '600',
  },
  ladderStatusAchieved: {
    color: '#ffd166',
    opacity: 0.9,
  },
  ladderStatusCurrent: {
    color: '#ffd166',
    opacity: 1,
  },
  ladderDetail: {
    color: '#a9bcd0',
    fontSize: 13,
    lineHeight: 18,
  },
  disabledCard: {
    backgroundColor: '#1c2541',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  disabledTitle: {
    color: '#fdf0d5',
    fontSize: 18,
    fontWeight: '700',
  },
  disabledBody: {
    color: '#a9bcd0',
    fontSize: 15,
    lineHeight: 22,
  },
  linkButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#ffd166',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  linkButtonText: {
    color: '#ffd166',
    fontSize: 15,
    fontWeight: '600',
  },
});
