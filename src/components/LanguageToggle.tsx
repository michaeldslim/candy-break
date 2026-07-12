import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { Language } from '../i18n/types';

export default function LanguageToggle() {
  const { language, setLanguage } = useI18n();

  const renderButton = (lang: Language, label: string) => (
    <Pressable
      key={lang}
      style={[styles.button, language === lang && styles.buttonActive]}
      onPress={() => setLanguage(lang)}
    >
      <Text style={[styles.text, language === lang && styles.textActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.row}>
      {renderButton('ko', 'KO')}
      {renderButton('en', 'EN')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  button: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fdf0d5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  buttonActive: {
    backgroundColor: '#fdf0d5',
  },
  text: {
    color: '#fdf0d5',
    fontWeight: '700',
  },
  textActive: {
    color: '#0b132b',
  },
});
