import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FunctionScreen from '~src/features/function/functionScreen';

const Stack = createNativeStackNavigator();

const FunctionStack = () => {
    return (
        <Stack.Navigator
            initialRouteName="AppointmentMain"
            screenOptions={{
                headerStyle: {},
            }}
        >
            <Stack.Screen
                name="AppointmentMain"
                component={FunctionScreen}
                options={{
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    );
};

export default FunctionStack;
