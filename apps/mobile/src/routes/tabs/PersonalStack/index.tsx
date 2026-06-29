import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREEN_NAME } from '~src/constants/screenName';
import PersonalScreen from '~src/features/personal/PersonalScreen';

const Stack = createNativeStackNavigator();

const PersonalStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={SCREEN_NAME.PERSONAL}
      screenOptions={{
        headerStyle: {},
      }}
    >
      <Stack.Screen
        name={SCREEN_NAME.PERSONAL}
        component={PersonalScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default PersonalStack;
