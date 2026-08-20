import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AVATAR_IMAGES, type AvatarId } from '../constants/avatars';

export type PlayerAvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<PlayerAvatarSize, number> = {
  sm: 32,
  md: 44,
  lg: 56,
  xl: 72,
};

interface PlayerAvatarProps {
  avatarId: AvatarId;
  size?: PlayerAvatarSize;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function PlayerAvatar({
  avatarId,
  size = 'md',
  selected = false,
  style,
}: PlayerAvatarProps) {
  const dimension = SIZES[size];
  const borderWidth = selected ? 3 : 2;

  return (
    <View
      style={[
        styles.frame,
        {
          width: dimension + borderWidth * 2,
          height: dimension + borderWidth * 2,
          borderRadius: (dimension + borderWidth * 2) / 2,
          borderWidth,
          borderColor: selected ? '#ffd166' : 'rgba(253, 240, 213, 0.35)',
        },
        style,
      ]}
    >
      <Image
        source={AVATAR_IMAGES[avatarId]}
        style={{
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
