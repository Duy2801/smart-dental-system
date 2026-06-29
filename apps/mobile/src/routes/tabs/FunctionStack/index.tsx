import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREEN_NAME } from '~src/constants/screenName';
import FunctionScreen from '~src/features/function/functionScreen';

const Stack = createNativeStackNavigator();

const FunctionStack = () => {
    return (
        <Stack.Navigator
            initialRouteName={SCREEN_NAME.FUNCTION}
            screenOptions={{
                headerStyle: {},
            }}
        >
            <Stack.Screen
                name={SCREEN_NAME.FUNCTION}
                component={FunctionScreen}
                options={{
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    );
};

export default FunctionStack;
