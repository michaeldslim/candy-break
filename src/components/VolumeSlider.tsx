import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';

type VolumeSliderProps = {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
};

export default function VolumeSlider({ value, onChange, disabled }: VolumeSliderProps) {
  const { format, strings } = useI18n();
  const percent = Math.round(value * 100);

  return (
    <View style={styles.wrap} accessibilityRole="adjustable" accessibilityLabel={strings.settings.volume}>
      <Slider
        style={styles.slider}
        value={value}
        onValueChange={onChange}
        minimumValue={0}
        maximumValue={1}
        step={0.05}
        minimumTrackTintColor="#ffd166"
        maximumTrackTintColor="#3a506b"
        thumbTintColor="#fdf0d5"
        disabled={disabled}
      />
      <Text style={styles.percent}>{format(strings.settings.volumePercent, { percent })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
    paddingTop: 4,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  percent: {
    color: '#a9bcd0',
    fontSize: 13,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
});
