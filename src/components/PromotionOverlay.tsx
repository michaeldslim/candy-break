import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { AvatarId } from '../constants/avatars';
import PlayerAvatar from './PlayerAvatar';

interface PromotionOverlayProps {
  visible: boolean;
  title: string;
  subtitle: string;
  isCeo: boolean;
  playerAvatarId: AvatarId;
  onComplete: () => void;
}

const DISPLAY_MS = 1200;
const CEO_DISPLAY_MS = 1800;
const FADE_MS = 400;

export default function PromotionOverlay({
  visible,
  title,
  subtitle,
  isCeo,
  playerAvatarId,
  onComplete,
}: PromotionOverlayProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(0.45)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    const displayMs = isCeo ? CEO_DISPLAY_MS : DISPLAY_MS;

    backdropOpacity.setValue(0);
    bannerScale.setValue(0.45);
    bannerOpacity.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(backdropOpacity, {
          toValue: 0.62,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: FADE_MS,
          easing: Easing.in(Easing.quad),
          delay: displayMs,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(bannerScale, {
          toValue: 1.14,
          duration: 260,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.timing(bannerScale, {
          toValue: 1,
          duration: 160,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(bannerOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: FADE_MS,
          easing: Easing.in(Easing.quad),
          delay: displayMs,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });
  }, [visible, isCeo, onComplete, backdropOpacity, bannerOpacity, bannerScale]);

  if (!visible) {
    return null;
  }

  const accent = '#ffd166';

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />

      <Animated.View
        style={[
          styles.bannerWrap,
          {
            opacity: bannerOpacity,
            transform: [{ scale: bannerScale }],
          },
        ]}
      >
        <View style={[styles.banner, { borderColor: accent }]}>
          <View style={[styles.accentBar, { backgroundColor: accent }]} />
          <PlayerAvatar avatarId={playerAvatarId} size="xl" style={styles.promotionAvatar} />
          <Text style={[styles.title, { color: accent }]}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    elevation: 2000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  bannerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  banner: {
    minWidth: 240,
    maxWidth: 340,
    backgroundColor: '#0b132b',
    borderRadius: 18,
    borderWidth: 3,
    paddingVertical: 22,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  accentBar: {
    width: 48,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
    opacity: 0.9,
  },
  promotionAvatar: {
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    marginTop: 10,
    color: '#fdf0d5',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
  },
});
