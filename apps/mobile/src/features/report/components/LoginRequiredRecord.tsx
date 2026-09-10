import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SCREEN_NAME } from '~src/constants/screenName';

export function LoginRequiredRecord() {
  const navigation = useNavigation<any>();

  const handleLogin = () => {
    navigation.navigate(SCREEN_NAME.PATIENT_LOGIN);
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <FontAwesome6 color="#0863c5" iconStyle="solid" name="file-medical" size={32} />
      </View>

      <Text style={styles.title}>Xem hồ sơ bệnh án điện tử</Text>

      <Text style={styles.description}>
        Đăng nhập để chọn người khám trong gia đình, xem phác đồ điều trị, lịch sử khám và các thông tin y tế cá nhân được lưu trữ an toàn.
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleLogin}
        style={styles.loginButton}
      >
        <FontAwesome6 color="#FFFFFF" iconStyle="solid" name="arrow-right-to-bracket" size={16} />
        <Text style={styles.loginButtonText}>Đăng nhập để xem hồ sơ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 40,
    padding: 24,
  },
  description: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 16,
    textAlign: 'center',
  },
});
