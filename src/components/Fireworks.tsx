import { useEffect, useRef } from 'react';
import { Animated, View, useWindowDimensions } from 'react-native';

const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C084FC', '#FF9F43', '#FF6BFF'];
const NUM_BURSTS = 10;
const PARTICLES_PER_BURST = 10;

interface IParticleConfig {
  dx: number;
  dy: number;
  color: string;
  size: number;
  burstXRatio: number;
  burstYRatio: number;
  delay: number;
}

interface IParticle extends IParticleConfig {
  progress: Animated.Value;
}

interface IFireworksProps {
  visible: boolean;
}

const BURST_CONFIGS: IParticleConfig[] = Array.from({ length: NUM_BURSTS }, (_, burstIndex) => {
  const burstXRatio = 0.1 + (burstIndex % 3) * 0.35 + Math.random() * 0.1;
  const burstYRatio = 0.1 + Math.floor(burstIndex / 3) * 0.4 + Math.random() * 0.15;
  const delay = burstIndex * 250;

  return Array.from({ length: PARTICLES_PER_BURST }, (_, particleIndex) => {
    const angle =
      (particleIndex / PARTICLES_PER_BURST) * Math.PI * 2 +
      (Math.random() * 0.4 - 0.2);
    const radius = 90 + Math.random() * 80;

    return {
      dx: Math.cos(angle) * radius,
      dy: Math.sin(angle) * radius,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? COLORS[0],
      size: 8 + Math.random() * 8,
      burstXRatio,
      burstYRatio,
      delay,
    };
  });
}).flat();

export default function Fireworks({ visible }: IFireworksProps) {
  const { width, height } = useWindowDimensions();

  const particles = useRef<IParticle[]>(
    BURST_CONFIGS.map((config) => ({ ...config, progress: new Animated.Value(0) })),
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    particles.current.forEach((particle) => particle.progress.setValue(0));

    const animations = particles.current.map((particle) =>
      Animated.sequence([
        Animated.delay(particle.delay),
        Animated.timing(particle.progress, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.parallel(animations).start();
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, width, height }}
    >
      {particles.current.map((particle, index) => {
        const translateX = particle.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.dx],
        });
        const translateY = particle.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.dy],
        });
        const opacity = particle.progress.interpolate({
          inputRange: [0, 0.1, 0.6, 1],
          outputRange: [0, 1, 1, 0],
        });
        const scale = particle.progress.interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0, 1.2, 0.4],
        });

        return (
          <Animated.View
            key={`firework-particle-${index}`}
            style={{
              position: 'absolute',
              left: particle.burstXRatio * width,
              top: particle.burstYRatio * height,
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: particle.color,
              opacity,
              transform: [{ translateX }, { translateY }, { scale }],
            }}
          />
        );
      })}
    </View>
  );
}
