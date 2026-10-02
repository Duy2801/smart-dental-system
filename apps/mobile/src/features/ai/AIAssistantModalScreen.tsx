import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import DentalAIScreen from './DentalAIScreen';

/** Modal entry point used by the floating button; preserves the caller's screen on close. */
export default function AIAssistantModalScreen() {
  const navigation = useNavigation<any>();
  const handleDismiss = useCallback(() => navigation.goBack(), [navigation]);

  return <DentalAIScreen onDismiss={handleDismiss} />;
}
