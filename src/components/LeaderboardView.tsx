import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { ILeaderboardEntry } from '../types';

type LeaderboardViewProps = {
  entries: ILeaderboardEntry[];
  onClose: () => void;
  highlightRank?: number;
};

const formatScore = (score: number): string => score.toLocaleString();

export default function LeaderboardView({ entries, onClose, highlightRank }: LeaderboardViewProps) {
  const { strings } = useI18n();
  const { leaderboard } = strings;

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>{leaderboard.title}</Text>

        {entries.length === 0 ? (
          <Text style={styles.emptyText}>{leaderboard.empty}</Text>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Text style={[styles.headerCell, styles.rankCol]}>{leaderboard.rank}</Text>
              <Text style={[styles.headerCell, styles.initialsCol]} />
              <Text style={[styles.headerCell, styles.scoreCol]}>{leaderboard.score}</Text>
            </View>
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {entries.map((entry, index) => {
                const rank = index + 1;
                const highlighted = highlightRank === rank;
                return (
                  <View
                    key={`${entry.savedAt}-${entry.initials}-${entry.score}`}
                    style={[styles.row, highlighted ? styles.rowHighlighted : null]}
                  >
                    <Text style={[styles.rankText, styles.rankCol]}>#{rank}</Text>
                    <Text style={[styles.initialsText, styles.initialsCol]}>{entry.initials}</Text>
                    <Text style={[styles.scoreText, styles.scoreCol]}>{formatScore(entry.score)}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}

        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>{leaderboard.close}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 43, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1c2541',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 12,
  },
  title: {
    color: '#ffd166',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    color: '#fdf0d5',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 209, 102, 0.25)',
  },
  headerCell: {
    color: '#ffd166',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  list: {
    maxHeight: 280,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(253, 240, 213, 0.12)',
  },
  rowHighlighted: {
    backgroundColor: 'rgba(255, 209, 102, 0.12)',
    borderRadius: 8,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  rankCol: {
    width: 44,
  },
  initialsCol: {
    flex: 1,
    textAlign: 'center',
  },
  scoreCol: {
    flex: 1,
    textAlign: 'right',
  },
  rankText: {
    color: '#5c6b8a',
    fontSize: 14,
    fontWeight: '800',
  },
  initialsText: {
    color: '#fdf0d5',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scoreText: {
    color: '#fdf0d5',
    fontSize: 15,
    fontWeight: '700',
  },
  closeButton: {
    marginTop: 4,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a506b',
  },
  closeButtonText: {
    color: '#fdf0d5',
    fontSize: 15,
    fontWeight: '800',
  },
});
