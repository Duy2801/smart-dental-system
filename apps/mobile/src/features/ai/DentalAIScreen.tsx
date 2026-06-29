import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const DentalAIScreen = () => (
  <View style={styles.container}>
    <View style={styles.iconContainer}>
      <FontAwesome6 color="#FFFFFF" iconStyle="solid" name="robot" size={34} />
    </View>
    <Text style={styles.title}>Trợ lý nha khoa AI</Text>
    <Text style={styles.description}>
      Tính năng AI đang được phát triển và sẽ sớm sẵn sàng.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: '#0875D1',
    borderRadius: 36,
    elevation: 8,
    height: 72,
    justifyContent: 'center',
    shadowColor: '#0875D1',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    width: 72,
  },
  title: {
    color: '#101828',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
  },
  description: {
    color: '#667085',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DentalAIScreen;
