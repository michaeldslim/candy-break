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
        heading: '기본 조작',
        items: [
          '캔디 하나를 탭한 뒤, 인접한 캔디를 탭해 두 위치를 바꾸세요.',
          '같은 모양 3개 이상이 가로/세로로 나란히 맞춰지면 제거되고 점수를 얻습니다.',
          'Goal을 채우면 다음 스테이지로 진행됩니다. 클리어하면 별(★)을 획득합니다.',
          '막히면 Hint를 사용하고, Restart로 언제든 다시 시작할 수 있습니다.',
        ],
      },
      {
        heading: '특수 캔디',
        items: [
          '4개 가로 매치 → 세로 줄무늬: 탭하면 세로 한 줄을 제거합니다.',
          '4개 세로 매치 → 가로 줄무늬: 탭하면 가로 한 줄을 제거합니다.',
          '5개 이상 매치 → 무지개: 탭하면 같은 종류의 모든 캔디를 제거합니다.',
        ],
      },
      {
        heading: '플레이 스타일',
        items: [
          '🍬 클래식 — 제한 이동 안에 목표 캔디 수를 제거하세요.',
          '🎯 컬러 타겟 — 지정된 색상의 캔디만 Goal에 반영됩니다.',
          '❄️ 잠긴 타일 — 인접 매치로 얼어붙은 칸을 해제하면 Goal이 채워집니다.',
          '✖️ 멀티플라이어 러시 — 연속 콤보 시 점수 배율이 최대 8배까지 상승합니다.',
          '💣 폭탄 스톰 — 이동이 줄어들면 폭탄이 등장합니다. 탭하면 주변을 터뜨립니다.',
          '⏱️ 타이머 어택 — 이동 제한 없이 90초 안에 최대한 많은 캔디를 제거하세요.',
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
          'Tap a candy, then tap an adjacent candy to swap their positions.',
          'Match 3+ of the same shape in a row or column to clear them and score.',
          'Fill the Goal to advance to the next stage and earn stars (★).',
          'Use Hint when stuck, or tap Restart to start over anytime.',
        ],
      },
      {
        heading: 'Special Candies',
        items: [
          '4-in-a-row (horizontal) → Vertical stripe: clears an entire column when tapped.',
          '4-in-a-row (vertical) → Horizontal stripe: clears an entire row when tapped.',
          '5+ match → Rainbow: clears all candies of the same kind when tapped.',
        ],
      },
      {
        heading: 'Play Styles',
        items: [
          '🍬 Classic — Clear the target number of candies within limited moves.',
          '🎯 Color Target — Only the designated candy color counts toward your Goal.',
          '❄️ Locked Tiles — Thaw frozen cells with adjacent matches to fill the Goal.',
          '✖️ Multiplier Rush — Chain combos to boost your score multiplier up to 8×.',
          '💣 Bomb Storm — A bomb appears as moves run low. Tap it to blast nearby candies.',
          '⏱️ Timer Attack — No move limit! Clear as many candies as you can in 90 seconds.',
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
});
