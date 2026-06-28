import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { SCREEN_NAME } from '~src/constants/screenName';
import SplashScreen from '~src/features/splash/SplashScreen';
const Stack = createNativeStackNavigator();
function ApplicationNavigator () {
    const ref: any = useNavigationContainerRef();

    const routes = [
        {name : SCREEN_NAME.SPASH, component : SplashScreen}
    ]

    return(
        <>
            <NavigationContainer ref={ref}>
                <Stack.Navigator>
                    {routes.map(route => (
                        <Stack.Screen
                        key={route.name}
                        name={route.name}
                        component={route.component}
                        options={{headerShown: false}}
                        />
                    ))}
                </Stack.Navigator>
            </NavigationContainer>
        </>
    )
}
export default ApplicationNavigator;