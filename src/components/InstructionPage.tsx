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
            <Text style={styles.instructionItem}>2. 같은 모양(아이콘) 3개 이상이 가로/세로로 맞춰지면 제거되고 점수를 얻습니다.</Text>
            <Text style={styles.instructionItem}>3. 제한된 Moves 안에 Goal을 채우면 다음 Shape(스테이지)로 진행됩니다.</Text>
            <Text style={styles.instructionItem}>4. 스테이지를 클리어하면 별(★)을 획득하고, 상단에 최고 점수/최고 별 개수가 표시됩니다.</Text>
            <Text style={styles.instructionItem}>5. 막히면 Hint를 사용하고, 처음부터 다시 하려면 Restart를 누르세요.</Text>
          </View>

          <View style={styles.instructionCard}>
            <Text style={styles.instructionSectionTitle}>EN</Text>
            <Text style={styles.instructionItem}>1. Tap one candy, then tap an adjacent candy to swap.</Text>
            <Text style={styles.instructionItem}>2. Match 3+ of the same shape/icon in a row or column to clear and score.</Text>
            <Text style={styles.instructionItem}>3. Reach the Goal within limited Moves to advance to the next Shape.</Text>
            <Text style={styles.instructionItem}>4. Clearing a stage earns stars (★), and your best score/stars are shown at the top.</Text>
            <Text style={styles.instructionItem}>5. Use Hint when stuck, and tap Restart to start over anytime.</Text>
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
