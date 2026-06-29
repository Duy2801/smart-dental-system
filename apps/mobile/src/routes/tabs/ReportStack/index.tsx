import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREEN_NAME } from '~src/constants/screenName';
import ReportScreen from '~src/features/report/ReportScreen';

const Stack = createNativeStackNavigator();

const ReportStack = () => {
    return (
        <Stack.Navigator
            initialRouteName={SCREEN_NAME.REPORT}
            screenOptions={{
                headerStyle: {},
            }}
        >
            <Stack.Screen
                name={SCREEN_NAME.REPORT}
                component={ReportScreen}
                options={{
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    );
};

export default ReportStack;
