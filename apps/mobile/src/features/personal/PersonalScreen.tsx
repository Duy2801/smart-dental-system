import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiLogout } from '~src/features/auth/api';
import { removeAuthSession } from '~src/features/auth/session';
import { clearSession } from '~src/reducers/loginReducer';
import { AppDispatch, RootState } from '~src/reducers/store';
import { SCREEN_NAME } from '~src/constants/screenName';

const PersonalScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { role, user } = useSelector((state: RootState) => state.login);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await apiLogout();
    } catch {
      // Local logout must still work when the access token has expired.
    } finally {
      await removeAuthSession();
      dispatch(clearSession());
      navigation
        .getParent()
        ?.getParent()
        ?.reset({
          index: 0,
          routes: [{ name: SCREEN_NAME.LOGIN }],
        });
      setIsLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi tài khoản?', [
      { style: 'cancel', text: 'Hủy' },
      { onPress: logout, style: 'destructive', text: 'Đăng xuất' },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F8FC" />
      <View style={styles.container}>
        <Text style={styles.title}>Tài khoản</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>
              {user?.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.role}>
            {role === 'DOCTOR' ? 'Bác sĩ' : 'Bệnh nhân'}
          </Text>
        </View>
        <TouchableOpacity
          disabled={isLoggingOut}
          onPress={confirmLogout}
          style={styles.logoutButton}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#D92D20" />
          ) : (
            <>
              <FontAwesome6
                name="arrow-right-from-bracket"
                size={16}
                color="#D92D20"
                iconStyle="solid"
              />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F6F8FC', flex: 1 },
  container: { flex: 1, padding: 20 },
  title: {
    color: '#101828',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    elevation: 2,
    padding: 24,
    shadowColor: '#344054',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#0875D1',
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  initial: { color: '#FFFFFF', fontSize: 27, fontWeight: '800' },
  name: { color: '#101828', fontSize: 19, fontWeight: '800', marginTop: 13 },
  email: { color: '#667085', fontSize: 13, marginTop: 5 },
  role: {
    backgroundColor: '#EAF5FF',
    borderRadius: 12,
    color: '#0875D1',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 12,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#FECACA',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    height: 52,
    justifyContent: 'center',
    marginTop: 20,
  },
  logoutText: { color: '#D92D20', fontSize: 15, fontWeight: '700' },
});

export default PersonalScreen;
