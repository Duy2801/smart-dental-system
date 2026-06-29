import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREEN_NAME } from '~src/constants/screenName';
import HomeScreen from '~src/features/home/HomeScreen';

const Stack = createNativeStackNavigator();

const HomeStack = () => {
    return (
        <Stack.Navigator
            initialRouteName={SCREEN_NAME.HOME}
            screenOptions={{
                headerStyle: {},
            }}
        >
            <Stack.Screen
                name={SCREEN_NAME.HOME}
                component={HomeScreen}
                options={{
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    );
};

export default HomeStack;
