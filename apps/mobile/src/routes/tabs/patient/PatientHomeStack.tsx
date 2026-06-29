import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { SCREEN_NAME } from '~src/constants/screenName';
import PatientHomeScreen from '~src/features/home/patient/PatientHomeScreen';

const Stack = createNativeStackNavigator();

const PatientHomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen component={PatientHomeScreen} name={SCREEN_NAME.HOME} />
  </Stack.Navigator>
);

export default PatientHomeStack;
