import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { SCREEN_NAME } from '~src/constants/screenName';
import DoctorHomeScreen from '~src/features/home/doctor/DoctorHomeScreen';

const Stack = createNativeStackNavigator();

const DoctorHomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen component={DoctorHomeScreen} name={SCREEN_NAME.HOME} />
  </Stack.Navigator>
);

export default DoctorHomeStack;
