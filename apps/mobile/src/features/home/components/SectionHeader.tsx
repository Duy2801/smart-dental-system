import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = { title: string; action?: string; onPress?: () => void };

const SectionHeader = ({ action, onPress, title }: Props) => (
  <View style={styles.row}>
    <Text style={styles.title}>{title}</Text>
    {!!action && (
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.action}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: { color: '#101828', fontSize: 20, fontWeight: '800' },
  action: { color: '#0875D1', fontSize: 12, fontWeight: '700' },
});

export default SectionHeader;
