import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AVATAR_IDS, type AvatarId } from '../constants/avatars';
import PlayerAvatar from './PlayerAvatar';

const COLLAPSE_DURATION_MS = 300;

interface AvatarPickerProps {
  label: string;
  description?: string;
  value: AvatarId;
  onChange: (value: AvatarId) => void;
}

export default function AvatarPicker({ label, description, value, onChange }: AvatarPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const chevronProgress = useRef(new Animated.Value(0)).current;
  const [bodyHeight, setBodyHeight] = useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progress, {
        toValue: expanded ? 1 : 0,
        duration: COLLAPSE_DURATION_MS,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(chevronProgress, {
        toValue: expanded ? 1 : 0,
        duration: COLLAPSE_DURATION_MS,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [expanded, progress, chevronProgress]);

  const animatedHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(bodyHeight, 1)],
  });

  const bodyOpacity = progress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.7, 1],
  });

  const chevronRotate = chevronProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const grid = (
    <View style={styles.grid}>
      {AVATAR_IDS.map((avatarId) => {
        const selected = avatarId === value;
        return (
          <Pressable
            key={avatarId}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(avatarId)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <PlayerAvatar avatarId={avatarId} size="lg" selected={selected} />
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.header}
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerText}>
          <Text style={styles.label}>{label}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        <View style={styles.headerRight}>
          <PlayerAvatar avatarId={value} size="md" selected />
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Text style={styles.collapseIcon}>▸</Text>
          </Animated.View>
        </View>
      </Pressable>

      <View
        style={styles.measureWrap}
        pointerEvents="none"
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          if (nextHeight > 0 && nextHeight !== bodyHeight) {
            setBodyHeight(nextHeight);
          }
        }}
      >
        {grid}
      </View>

      <Animated.View style={[styles.collapsibleWrap, { height: animatedHeight, opacity: bodyOpacity }]}>
        {grid}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c2541',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: '#fdf0d5',
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    color: '#a9bcd0',
    fontSize: 13,
    lineHeight: 18,
  },
  collapseIcon: {
    color: '#ffd166',
    fontSize: 18,
    fontWeight: '700',
  },
  collapsibleWrap: {
    overflow: 'hidden',
  },
  measureWrap: {
    position: 'absolute',
    opacity: 0,
    zIndex: -1,
    left: 14,
    right: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingTop: 4,
  },
  option: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: 'rgba(255, 209, 102, 0.55)',
    backgroundColor: 'rgba(255, 209, 102, 0.1)',
  },
});
