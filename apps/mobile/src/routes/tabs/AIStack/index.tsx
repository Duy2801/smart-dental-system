import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { SCREEN_NAME } from '~src/constants/screenName';
import DentalAIScreen from '~src/features/ai/DentalAIScreen';

const Stack = createNativeStackNavigator();

const AIStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen component={DentalAIScreen} name={SCREEN_NAME.AI} />
  </Stack.Navigator>
);

export default AIStack;
