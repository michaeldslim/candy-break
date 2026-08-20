import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LEADERBOARD_MAX_ENTRIES,
  LEADERBOARD_STORAGE_KEY,
  PLAYER_INITIALS_KEY,
} from '../constants/game';
import { ILeaderboardEntry } from '../types';

export const normalizeInitials = (raw: string): string =>
  raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);

/** Only entries the player explicitly saved via the record card count. */
const isSubmittedEntry = (entry: ILeaderboardEntry): boolean =>
  normalizeInitials(entry.initials).length > 0;

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
        initials: normalizeInitials(entry.initials),
        score: Math.max(0, Math.floor(entry.score)),
        savedAt: entry.savedAt,
      }))
      .filter(isSubmittedEntry);
  } catch {
    return [];
  }
};

export const sortLeaderboard = (entries: ILeaderboardEntry[]): ILeaderboardEntry[] =>
  [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.savedAt - b.savedAt;
  });

export type LeaderboardRow = ILeaderboardEntry | null;

export const buildLeaderboardRows = (entries: ILeaderboardEntry[]): LeaderboardRow[] => {
  const sorted = sortLeaderboard(entries).slice(0, LEADERBOARD_MAX_ENTRIES);
  return Array.from({ length: LEADERBOARD_MAX_ENTRIES }, (_, index) => sorted[index] ?? null);
};

/** True when score would land in the top-10 list (strictly above 10th place when full). */
export const qualifiesForLeaderboardScore = (
  score: number,
  entries: ILeaderboardEntry[],
): boolean => {
  const normalized = Math.max(0, Math.floor(score));
  if (normalized <= 0) return false;
  if (entries.length < LEADERBOARD_MAX_ENTRIES) return true;
  const sorted = sortLeaderboard(entries);
  const cutoff = sorted[LEADERBOARD_MAX_ENTRIES - 1]?.score ?? 0;
  return normalized > cutoff;
};

const persistLeaderboard = async (entries: ILeaderboardEntry[]): Promise<ILeaderboardEntry[]> => {
  const sorted = sortLeaderboard(entries).slice(0, LEADERBOARD_MAX_ENTRIES);
  await AsyncStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(sorted));
  return sorted;
};

const hasUnsubmittedStoredRows = (raw: string | null): boolean => {
  if (!raw) return false;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return true;
    return parsed.some((item) => {
      if (!isLeaderboardEntry(item)) return true;
      return !isSubmittedEntry({
        initials: normalizeInitials(item.initials),
        score: Math.max(0, Math.floor(item.score)),
        savedAt: item.savedAt,
      });
    });
  } catch {
    return true;
  }
};

export const loadLeaderboard = async (): Promise<ILeaderboardEntry[]> => {
  const raw = await AsyncStorage.getItem(LEADERBOARD_STORAGE_KEY);
  const entries = parseLeaderboard(raw);
  const sorted = sortLeaderboard(entries).slice(0, LEADERBOARD_MAX_ENTRIES);

  if (hasUnsubmittedStoredRows(raw)) {
    await persistLeaderboard(sorted);
  }

  return sorted;
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

export const loadPlayerInitials = async (): Promise<string> => {
  const raw = await AsyncStorage.getItem(PLAYER_INITIALS_KEY);
  return raw ? normalizeInitials(raw) : '';
};

export const savePlayerInitials = async (initials: string): Promise<void> => {
  const normalized = normalizeInitials(initials);
  if (normalized.length === 0) return;
  await AsyncStorage.setItem(PLAYER_INITIALS_KEY, normalized);
};
