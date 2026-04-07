import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, SafeAreaView, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';

const ANDROID_TOP_PADDING = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0;

type InstructionPageProps = {
  onStartGame: () => void;
};

export default function InstructionPage({ onStartGame }: InstructionPageProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.instructionScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>How to Play</Text>

          <View style={styles.instructionCard}>
            <Text style={styles.instructionSectionTitle}>KO</Text>
            <Text style={styles.instructionItem}>1. 블록 하나를 탭한 뒤, 인접한 블록을 탭해서 위치를 바꾸세요.</Text>
            <Text style={styles.instructionItem}>2. 같은 색 3개 이상이 가로/세로로 맞춰지면 제거되고 점수를 얻습니다.</Text>
            <Text style={styles.instructionItem}>3. 제한된 이동 횟수 안에 Goal을 채우면 다음 스테이지(Shape)로 진행합니다.</Text>
            <Text style={styles.instructionItem}>4. Hint 버튼으로 가능한 이동을 확인할 수 있습니다.</Text>
            <Text style={styles.instructionItem}>5. 색 구분이 어려우면 ♿ 버튼으로 Color Blind 모드를 켜세요.</Text>
          </View>

          <View style={styles.instructionCard}>
            <Text style={styles.instructionSectionTitle}>EN</Text>
            <Text style={styles.instructionItem}>1. Tap one candy, then tap an adjacent candy to swap.</Text>
            <Text style={styles.instructionItem}>2. Match 3+ of the same color in a row or column to clear and score.</Text>
            <Text style={styles.instructionItem}>3. Reach the Goal within the move limit to advance to the next shape.</Text>
            <Text style={styles.instructionItem}>4. Use the Hint button if you need help finding a move.</Text>
            <Text style={styles.instructionItem}>5. Toggle ♿ mode for color-blind-friendly symbols.</Text>
          </View>

          <Pressable style={styles.startGameButton} onPress={onStartGame}>
            <Text style={styles.startGameButtonText}>Start Game</Text>
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
  instructionScrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  instructionContainer: {
    paddingTop: ANDROID_TOP_PADDING + 14,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  instructionTitle: {
    color: '#fdf0d5',
    fontSize: 30,
    fontWeight: '800',
  },
  instructionCard: {
    width: '100%',
    backgroundColor: '#1c2541',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  instructionSectionTitle: {
    color: '#ffd166',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
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
  startGameButtonText: {
    color: '#fdf0d5',
    fontSize: 17,
    fontWeight: '800',
  },
});
