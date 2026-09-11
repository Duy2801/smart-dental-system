import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { ReactNode, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

type AuthTextFieldProps = TextInputProps & {
  icon: 'envelope' | 'key' | 'lock' | 'shield-halved' | 'user' | 'phone';
  label: string;
  isPassword?: boolean;
  error?: string;
  labelAccessory?: ReactNode;
};

const AuthTextField = ({
  icon,
  label,
  isPassword = false,
  error,
  labelAccessory,
  ...inputProps
}: AuthTextFieldProps) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {labelAccessory}
      </View>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <FontAwesome6 color="#8AA0BC" iconStyle="solid" name={icon} size={15} />
        <TextInput
          {...inputProps}
          placeholderTextColor="#A8AFBD"
          secureTextEntry={isPassword && !passwordVisible}
          style={styles.input}
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
              color="#8E96A8"
              iconStyle="regular"
              name={passwordVisible ? 'eye-slash' : 'eye'}
              size={16}
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
    gap: 9,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#18233D',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: '#FBFCFF',
    borderColor: '#DDE3EC',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  input: {
    color: '#071A3D',
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  inputError: { borderColor: '#E5484D' },
  errorText: { color: '#D92D20', fontSize: 12, lineHeight: 17 },
});

export default AuthTextField;
