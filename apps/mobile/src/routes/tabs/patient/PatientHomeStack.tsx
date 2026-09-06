import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { SCREEN_NAME } from '~src/constants/screenName';
import PatientHomeScreen from '~src/features/home/patient/PatientHomeScreen';
import ConsultationScreen from '~src/features/patient/screens/ConsultationScreen';
import DoctorsScreen from '~src/features/patient/screens/DoctorsScreen';
import NotificationsScreen from '~src/features/patient/screens/NotificationsScreen';
import PaymentScreen from '~src/features/patient/screens/PaymentScreen';
import PromotionsScreen from '~src/features/patient/screens/PromotionsScreen';
import type { PatientHomeStackParamList } from '~src/routes/types';

const Stack = createNativeStackNavigator<PatientHomeStackParamList>();

const PatientHomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen component={PatientHomeScreen} name={SCREEN_NAME.HOME} />
    <Stack.Screen component={DoctorsScreen} name={SCREEN_NAME.PATIENT_DOCTORS} />
    <Stack.Screen
      component={ConsultationScreen}
      name={SCREEN_NAME.PATIENT_CONSULTATION}
    />
    <Stack.Screen component={PaymentScreen} name={SCREEN_NAME.PATIENT_PAYMENT} />
    <Stack.Screen
      component={NotificationsScreen}
      name={SCREEN_NAME.PATIENT_NOTIFICATIONS}
    />
    <Stack.Screen component={PromotionsScreen} name={SCREEN_NAME.PATIENT_PROMOTIONS} />
  </Stack.Navigator>
);

export default PatientHomeStack;
