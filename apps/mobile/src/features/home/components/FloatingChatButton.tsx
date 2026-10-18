import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCREEN_NAME } from '~src/constants/screenName';

type FloatingChatButtonProps = {
  onPress?: () => void;
};

/** Opens the AI assistant as a modal screen so its composer stays above the keyboard. */
export function FloatingChatButton({ onPress }: FloatingChatButtonProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }
    navigation.navigate(SCREEN_NAME.AI_CHAT);
  }, [navigation, onPress]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 8) + 20 }]}
    >
      <TouchableOpacity
        accessibilityLabel="Mở trợ lý nha khoa AI"
        activeOpacity={0.88}
        onPress={handlePress}
        style={styles.button}
      >
        <FontAwesome6
          color="#FFFFFF"
          iconStyle="solid"
          name="comment-dots"
          size={20}
        />
        <View style={styles.onlineRing} />
        <View style={styles.onlineDot} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 3,
    elevation: 8,
    height: 52,
    justifyContent: 'center',
    shadowColor: '#0756AA',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    width: 52,
  },
  onlineDot: {
    backgroundColor: '#10B981',
    borderColor: '#FFFFFF',
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    position: 'absolute',
    right: -3,
    top: -3,
    width: 14,
  },
  onlineRing: {
    backgroundColor: 'rgba(16,185,129,0.25)',
    borderRadius: 10,
    height: 20,
    position: 'absolute',
    right: -6,
    top: -6,
    width: 20,
  },
  wrapper: {
    position: 'absolute',
    right: 18,
    zIndex: 80,
  },
});
