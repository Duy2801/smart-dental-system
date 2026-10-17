import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SCREEN_NAME } from '~src/constants/screenName';
import { PatientFooter } from '~src/features/home/components/PatientFooter';

type LoginRequiredViewProps = {
  /** Tên icon FontAwesome6 (solid) */
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
};

/**
 * Nội dung chung cho các tab cần đăng nhập (Lịch hẹn, Tư vấn, Hồ sơ, Tôi).
 * Cùng kích thước thẻ, cùng lề và luôn có chân trang ngay bên dưới, để khi chuyển tab
 * thẻ và chân trang không bị nhảy vị trí.
 */
export function LoginRequiredView({ icon, title, description, actionLabel }: LoginRequiredViewProps) {
  const navigation = useNavigation<any>();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <FontAwesome6 color="#0863c5" iconStyle="solid" name={icon as never} size={30} />
        </View>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {/* Cố định 3 dòng để mọi thẻ cao bằng nhau */}
        <Text numberOfLines={3} style={styles.description}>
          {description}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={() => navigation.navigate(SCREEN_NAME.PATIENT_LOGIN as never)}
          style={styles.button}
        >
          <FontAwesome6 color="#FFFFFF" iconStyle="solid" name="arrow-right-to-bracket" size={16} />
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>

      <PatientFooter />
    </ScrollView>
  );
}

const DESCRIPTION_LINE_HEIGHT = 20;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 32,
    marginHorizontal: 16,
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 16,
    textAlign: 'center',
  },
  description: {
    color: '#64748B',
    fontSize: 13,
    // Luôn chiếm đúng 3 dòng dù nội dung ngắn hay dài
    height: DESCRIPTION_LINE_HEIGHT * 3,
    lineHeight: DESCRIPTION_LINE_HEIGHT,
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
