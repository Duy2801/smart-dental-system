import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ServicesScreen from '~src/features/patient/screens/ServicesScreen';
import ServiceDetailScreen from '~src/features/service/screens/ServiceDetailScreen';

const Stack = createNativeStackNavigator();

const ServicesStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="ServiceCatalogMain"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ServiceCatalogMain"
        component={ServicesScreen}
      />
      <Stack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
      />
    </Stack.Navigator>
  );
};

export default ServicesStack;
