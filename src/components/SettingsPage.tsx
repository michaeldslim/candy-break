import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, SafeAreaView, ScrollView, StatusBar as RNStatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { useSettings } from '../settings/SettingsProvider';
import AvatarPicker from './AvatarPicker';
import LanguageToggle from './LanguageToggle';

const ANDROID_TOP_PADDING = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;

type SettingsPageProps = {
  onBack: () => void;
  onOpenCareer: () => void;
};

export default function SettingsPage({ onBack, onOpenCareer }: SettingsPageProps) {
  const { strings } = useI18n();
  const { settings, updateSettings } = useSettings();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{strings.common.back}</Text>
        </Pressable>
        <Text style={styles.title}>{strings.settings.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{strings.settings.language}</Text>
          <LanguageToggle />
        </View>

        <View style={styles.section}>
          <AvatarPicker
            label={strings.settings.playerAvatar}
            description={strings.settings.playerAvatarDesc}
            value={settings.playerAvatarId}
            onChange={(playerAvatarId) => updateSettings({ playerAvatarId })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{strings.settings.gameplay}</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>{strings.career.modeLabel}</Text>
              <Text style={styles.toggleDesc}>{strings.career.modeDesc}</Text>
            </View>
            <Switch
              value={settings.careerModeEnabled}
              onValueChange={(value) => updateSettings({ careerModeEnabled: value })}
              trackColor={{ false: '#3a506b', true: '#ffd166' }}
              thumbColor="#fdf0d5"
            />
          </View>
          {settings.careerModeEnabled ? (
            <View style={styles.careerBlock}>
              <Text style={styles.winDefinition}>{strings.career.winDefinition}</Text>
              <Text style={styles.careerRules}>{strings.career.rulesSnippet}</Text>
              <Pressable style={styles.careerButton} onPress={onOpenCareer}>
                <Text style={styles.careerButtonText}>{strings.home.career}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>v{appVersion}</Text>
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
    gap: 28,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    color: '#ffd166',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#1c2541',
    borderRadius: 12,
    padding: 14,
  },
  toggleText: {
    flex: 1,
    gap: 4,
  },
  toggleLabel: {
    color: '#fdf0d5',
    fontSize: 15,
    fontWeight: '700',
  },
  toggleDesc: {
    color: '#a9bcd0',
    fontSize: 13,
    lineHeight: 18,
  },
  careerBlock: {
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 12,
  },
  winDefinition: {
    color: '#ffd166',
    fontSize: 14,
    fontWeight: '700',
  },
  careerRules: {
    color: '#a9bcd0',
    fontSize: 13,
    lineHeight: 20,
  },
  careerButton: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a4a6b',
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.35)',
    marginTop: 12,
  },
  careerButtonText: {
    color: '#ffd166',
    fontSize: 15,
    fontWeight: '800',
  },
  footer: {
    marginTop: 8,
    alignItems: 'center',
  },
  version: {
    color: '#5c6b8a',
    fontSize: 12,
    fontWeight: '600',
  },
});
