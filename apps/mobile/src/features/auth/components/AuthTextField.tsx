import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

type AuthTextFieldProps = TextInputProps & {
  icon: 'envelope' | 'key' | 'lock' | 'shield-halved' | 'user';
  label: string;
  isPassword?: boolean;
  error?: string;
};

const AuthTextField = ({
  icon,
  label,
  isPassword = false,
  error,
  ...inputProps
}: AuthTextFieldProps) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <FontAwesome6 name={icon} size={17} color="#8E96A8" iconStyle="solid" />
        <TextInput
          {...inputProps}
          style={styles.input}
          placeholderTextColor="#A8AFBD"
          secureTextEntry={isPassword && !passwordVisible}
        />
        {isPassword && (
          <TouchableOpacity
            accessibilityLabel={
              passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
            }
            hitSlop={10}
            onPress={() => setPasswordVisible(value => !value)}
          >
            <FontAwesome6
              name={passwordVisible ? 'eye-slash' : 'eye'}
              size={17}
              color="#8E96A8"
              iconStyle="solid"
            />
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    color: '#475467',
    fontSize: 13,
    fontWeight: '700',
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderColor: '#DDE3EC',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: 16,
  },
  input: {
    color: '#172033',
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  inputError: { borderColor: '#E5484D' },
  errorText: { color: '#D92D20', fontSize: 12, lineHeight: 17 },
});

export default AuthTextField;
