import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import {
  loadPlayerInitials,
  normalizeInitials,
  saveLeaderboardEntry,
  savePlayerInitials,
} from '../utils/leaderboard';

type RecordCardOverlayProps = {
  score: number;
  onPlayAgain: () => void;
};

export default function RecordCardOverlay({ score, onPlayAgain }: RecordCardOverlayProps) {
  const { strings, format } = useI18n();
  const { recordCard } = strings;
  const [initials, setInitials] = useState('');
  const [savedRank, setSavedRank] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    loadPlayerInitials().then(setInitials).catch(() => undefined);
  }, []);

  const handleSave = async (): Promise<void> => {
    const normalized = normalizeInitials(initials);
    if (normalized.length === 0 || saving || savedRank !== null) return;

    setSaving(true);
    setSaveError(false);
    try {
      const { rank } = await saveLeaderboardEntry(normalized, score);
      await savePlayerInitials(normalized);
      setInitials(normalized);
      setSavedRank(rank);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{recordCard.title}</Text>

        <Text style={styles.scoreLabel}>{recordCard.score}</Text>
        <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>

        <Text style={styles.initialsLabel}>{recordCard.initialsLabel}</Text>
        <TextInput
          style={styles.initialsInput}
          value={initials}
          onChangeText={(text) => setInitials(normalizeInitials(text))}
          placeholder={recordCard.initialsPlaceholder}
          placeholderTextColor="#5c6b8a"
          maxLength={3}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={savedRank === null}
        />

        {savedRank !== null ? (
          <Text style={styles.rankText}>{format(recordCard.rank, { rank: savedRank })}</Text>
        ) : null}

        {saveError ? (
          <Text style={styles.errorText}>{recordCard.saveError}</Text>
        ) : null}

        <Pressable
          style={[
            styles.saveButton,
            (initials.length === 0 || saving || savedRank !== null) ? styles.buttonDisabled : null,
          ]}
          onPress={handleSave}
          disabled={initials.length === 0 || saving || savedRank !== null}
        >
          {saving ? (
            <ActivityIndicator color="#fdf0d5" />
          ) : (
            <Text style={styles.saveButtonText}>
              {savedRank !== null ? recordCard.saved : recordCard.save}
            </Text>
          )}
        </Pressable>

        <Pressable style={styles.playAgainButton} onPress={onPlayAgain}>
          <Text style={styles.playAgainButtonText}>{recordCard.playAgain}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
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
  card: {
    marginHorizontal: 20,
    width: '100%',
    maxWidth: 320,
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: 'rgba(28, 37, 65, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(255, 209, 102, 0.35)',
    alignItems: 'center',
  },
  title: {
    color: '#ffd166',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  scoreLabel: {
    marginTop: 14,
    color: '#5c6b8a',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: {
    marginTop: 4,
    color: '#fdf0d5',
    fontSize: 36,
    fontWeight: '900',
  },
  initialsLabel: {
    marginTop: 18,
    color: '#ffd166',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
  },
  initialsInput: {
    marginTop: 8,
    width: '100%',
    height: 52,
    borderRadius: 10,
    backgroundColor: '#0b132b',
    borderWidth: 2,
    borderColor: 'rgba(255, 209, 102, 0.35)',
    color: '#fdf0d5',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 8,
    textAlign: 'center',
  },
  rankText: {
    marginTop: 12,
    color: '#6bcb77',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    color: '#e63946',
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 16,
    width: '100%',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e63946',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  playAgainButton: {
    marginTop: 10,
    width: '100%',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a506b',
  },
  playAgainButtonText: {
    color: '#fdf0d5',
    fontSize: 15,
    fontWeight: '800',
  },
});
