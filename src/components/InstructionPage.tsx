import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';

const ANDROID_TOP_PADDING = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;

type InstructionPageProps = {
  onStartGame: () => void;
  onContinueGame: () => void;
  hasSavedGame: boolean;
};

type Language = 'ko' | 'en';

type Section = {
  heading: string;
  items: string[];
};

type Locale = {
  title: string;
  buttonResume: string;
  buttonStart: string;
  sections: Section[];
};

const instructions: Record<'ko' | 'en', Locale> = {
  ko: {
    title: '게임 방법',
    buttonResume: '지난 게임 계속하기',
    buttonStart: '새 게임',
    sections: [
      {
        heading: '기본',
        items: [
          '인접한 캔디 두 개를 탭해 위치를 바꾸세요.',
          '같은 모양 3개 이상이 가로/세로로 맞춰지면 제거됩니다.',
          '4개 매치 → 줄무늬(열/행 제거), 5개 이상 → 무지개(같은 종류 전부 제거)',
        ],
      },
      {
        heading: '플레이 스타일',
        items: [
          '🍬 클래식 — 제한 이동 안에 목표 수 제거',
          '🎯 컬러 타겟 — 지정 색상 캔디만 Goal에 반영',
          '❄️ 잠긴 타일 — 인접 매치로 얼어붙은 칸 해제',
          '✖️ 멀티플라이어 — 연속 콤보로 배율 최대 8배',
          '💣 폭탄 스톰 — 탭으로 폭탄을 터뜨려 주변 제거',
          '⏱️ 타이머 어택 — 90초 안에 최대한 많이 제거',
          '📋 오더 콜렉트 — 색상을 순서대로 수집 (다른 색은 Goal에 반영 안 됨)',
          '🔗 콤보 골 — 연쇄 매치(캐스케이드)만 Goal에 반영',
          '💾 무브 세이버 — 2연쇄 이상 시 이동 1회 환급 (스테이지당 최대 3회)',
          '🧩 퓨어 매치 — 스트라이프·무지개 캔디 없이 순수 매칭만',
        ],
      },
    ],
  },
  en: {
    title: 'How to Play',
    buttonResume: 'Resume Last Game',
    buttonStart: 'New Game',
    sections: [
      {
        heading: 'Basics',
        items: [
          'Tap two adjacent candies to swap them.',
          'Match 3+ of the same shape in a row or column to clear and score.',
          '4-match → stripe (clears a row/column), 5+ → rainbow (clears all of that kind)',
        ],
      },
      {
        heading: 'Play Styles',
        items: [
          '🍬 Classic — clear the target count within limited moves',
          '🎯 Color Target — only the chosen color counts toward your Goal',
          '❄️ Locked Tiles — thaw frozen cells with adjacent matches',
          '✖️ Multiplier Rush — chain combos to boost score up to 8×',
          '💣 Bomb Storm — tap bombs to blast nearby candies',
          '⏱️ Timer Attack — no move limit, clear as many as you can in 90s',
          '📋 Order Collect — clear colors in sequence; only the active color counts',
          '🔗 Combo Goal — only cascade matches (not your first match) count toward Goal',
          '💾 Move Saver — 2+ cascades refund 1 move (max 3 per stage)',
          '🧩 Pure Match — no striped or rainbow candies; basic matches only',
        ],
      },
    ],
  },
};

export default function InstructionPage({ onStartGame, onContinueGame, hasSavedGame }: InstructionPageProps) {
  const [language, setLanguage] = useState<Language>('ko');
  const locale = instructions[language];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.headerContainer}>
        <Text style={styles.appTitle}>Candy Break</Text>
        <View style={styles.languageToggleRow}>
          <Pressable
            style={[styles.languageToggleButton, language === 'ko' && styles.languageToggleButtonActive]}
            onPress={() => setLanguage('ko')}
          >
            <Text style={[styles.languageToggleText, language === 'ko' && styles.languageToggleTextActive]}>KO</Text>
          </Pressable>
          <Pressable
            style={[styles.languageToggleButton, language === 'en' && styles.languageToggleButtonActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.languageToggleText, language === 'en' && styles.languageToggleTextActive]}>EN</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.instructionScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionSectionTitleCenter}>{locale.title}</Text>

          {locale.sections.map((section) => (
            <View key={section.heading} style={styles.instructionCard}>
              <Text style={styles.instructionSectionHeading}>{section.heading}</Text>
              {section.items.map((item) => (
                <Text key={item} style={styles.instructionItem}>{item}</Text>
              ))}
            </View>
          ))}

          {hasSavedGame && (
            <Pressable style={styles.continueGameButton} onPress={onContinueGame}>
              <Text style={styles.continueGameButtonText}>{locale.buttonResume}</Text>
            </Pressable>
          )}
          <Pressable style={styles.startGameButton} onPress={onStartGame}>
            <Text style={styles.startGameButtonText}>{locale.buttonStart}</Text>
          </Pressable>
          <Text style={styles.versionText}>v{Constants.expoConfig?.version}</Text>
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
  headerContainer: {
    paddingTop: ANDROID_TOP_PADDING + 12,
    paddingHorizontal: 16,
    paddingBottom: 6,
    alignItems: 'center',
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
  appTitle: {
    color: '#fdf0d5',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  languageToggleRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  languageToggleButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fdf0d5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  languageToggleButtonActive: {
    backgroundColor: '#fdf0d5',
  },
  languageToggleText: {
    color: '#fdf0d5',
    fontWeight: '700',
  },
  languageToggleTextActive: {
    color: '#0b132b',
  },
  instructionCard: {
    width: '100%',
    backgroundColor: '#1c2541',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  instructionSectionHeading: {
    color: '#ffd166',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  instructionSectionTitleCenter: {
    color: '#ffd166',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionItem: {
    color: '#fdf0d5',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
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
    fontSize: 17,
    fontWeight: '800',
  },
  startGameButtonText: {
    color: '#fdf0d5',
    fontSize: 17,
    fontWeight: '800',
  },
  versionText: {
    marginTop: 0,
    color: '#5c6b8a',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
