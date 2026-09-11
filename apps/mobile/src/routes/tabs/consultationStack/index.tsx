import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConsultationScreen from '~src/features/patient/screens/ConsultationScreen';

const Stack = createNativeStackNavigator();

const ConsultationStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="ConsultationMain"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ConsultationMain"
        component={ConsultationScreen}
      />
    </Stack.Navigator>
  );
};

export default ConsultationStack;
