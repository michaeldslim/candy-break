import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, SafeAreaView, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import LanguageToggle from './LanguageToggle';

const ANDROID_TOP_PADDING = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;

type InstructionPageProps = {
  onStartGame: () => void;
  onContinueGame: () => void;
  hasSavedGame: boolean;
};

export default function InstructionPage({ onStartGame, onContinueGame, hasSavedGame }: InstructionPageProps) {
  const { strings } = useI18n();
  const { instruction } = strings;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.headerContainer}>
        <Text style={styles.appTitle}>{strings.app.title}</Text>
        <LanguageToggle />
      </View>
      <ScrollView contentContainerStyle={styles.instructionScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionSectionTitleCenter}>{instruction.title}</Text>

          {instruction.sections.map((section) => (
            <View key={section.heading} style={styles.instructionCard}>
              <Text style={styles.instructionSectionHeading}>{section.heading}</Text>
              {section.items.map((item) => (
                <Text key={item} style={styles.instructionItem}>{item}</Text>
              ))}
            </View>
          ))}

          {hasSavedGame && (
            <Pressable style={styles.continueGameButton} onPress={onContinueGame}>
              <Text style={styles.continueGameButtonText}>{instruction.buttonResume}</Text>
            </Pressable>
          )}
          <Pressable style={styles.startGameButton} onPress={onStartGame}>
            <Text style={styles.startGameButtonText}>{instruction.buttonStart}</Text>
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
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  instructionSectionTitleCenter: {
    color: '#ffd166',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionItem: {
    color: '#fdf0d5',
    fontSize: 11,
    lineHeight: 16,
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
    fontSize: 15,
    fontWeight: '800',
  },
  startGameButtonText: {
    color: '#fdf0d5',
    fontSize: 15,
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
