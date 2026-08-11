import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BEST_SCORE_STORAGE_KEY,
  LEADERBOARD_MAX_ENTRIES,
  LEADERBOARD_STORAGE_KEY,
} from '../constants/game';
import { ILeaderboardEntry } from '../types';

export const normalizeInitials = (raw: string): string =>
  raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);

const isLeaderboardEntry = (value: unknown): value is ILeaderboardEntry => {
  if (!value || typeof value !== 'object') return false;
  const entry = value as ILeaderboardEntry;
  return (
    typeof entry.initials === 'string'
    && typeof entry.score === 'number'
    && Number.isFinite(entry.score)
    && typeof entry.savedAt === 'number'
    && Number.isFinite(entry.savedAt)
  );
};

const parseLeaderboard = (raw: string | null): ILeaderboardEntry[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isLeaderboardEntry)
      .map((entry) => ({
        initials: normalizeInitials(entry.initials) || '---',
        score: Math.max(0, Math.floor(entry.score)),
        savedAt: entry.savedAt,
      }));
  } catch {
    return [];
  }
};

export const sortLeaderboard = (entries: ILeaderboardEntry[]): ILeaderboardEntry[] =>
  [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.savedAt - b.savedAt;
  });

const persistLeaderboard = async (entries: ILeaderboardEntry[]): Promise<ILeaderboardEntry[]> => {
  const sorted = sortLeaderboard(entries).slice(0, LEADERBOARD_MAX_ENTRIES);
  await AsyncStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(sorted));
  return sorted;
};

const migrateFromBestScore = async (): Promise<ILeaderboardEntry[]> => {
  const bestRaw = await AsyncStorage.getItem(BEST_SCORE_STORAGE_KEY);
  const bestScore = bestRaw ? parseInt(bestRaw, 10) : 0;
  if (!Number.isFinite(bestScore) || bestScore <= 0) return [];

  const seeded: ILeaderboardEntry = {
    initials: '---',
    score: bestScore,
    savedAt: Date.now(),
  };
  return persistLeaderboard([seeded]);
};

export const loadLeaderboard = async (): Promise<ILeaderboardEntry[]> => {
  const raw = await AsyncStorage.getItem(LEADERBOARD_STORAGE_KEY);
  const entries = parseLeaderboard(raw);
  if (entries.length > 0) {
    return sortLeaderboard(entries).slice(0, LEADERBOARD_MAX_ENTRIES);
  }
  return migrateFromBestScore();
};

export const saveLeaderboardEntry = async (
  initials: string,
  score: number,
): Promise<{ entries: ILeaderboardEntry[]; rank: number }> => {
  const normalized = normalizeInitials(initials);
  if (normalized.length === 0) {
    throw new Error('Initials required');
  }

  const existing = await loadLeaderboard();
  const entry: ILeaderboardEntry = {
    initials: normalized,
    score: Math.max(0, Math.floor(score)),
    savedAt: Date.now(),
  };
  const merged = sortLeaderboard([...existing, entry]).slice(0, LEADERBOARD_MAX_ENTRIES);
  const rank = merged.findIndex(
    (item) => item.savedAt === entry.savedAt && item.score === entry.score && item.initials === entry.initials,
  ) + 1;
  const entries = await persistLeaderboard(merged);
  const resolvedRank = rank > 0 ? rank : entries.findIndex((item) => item.savedAt === entry.savedAt) + 1;
  return { entries, rank: resolvedRank > 0 ? resolvedRank : 1 };
};
