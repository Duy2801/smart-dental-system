import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { SCREEN_NAME } from '~src/constants/screenName';
import SplashScreen from '~src/features/splash/SplashScreen';
import OnboardingScreen from '~src/features/onboarding/OnboardingScreen';
import LoginScreen from '~src/features/auth/login/login';
import RegisterScreen from '~src/features/auth/register/register';
import VerifyEmailScreen from '~src/features/auth/verifyEmail/VerifyEmailScreen';
import TabNavigator from './tabs';
const Stack = createNativeStackNavigator();
function ApplicationNavigator() {
  const ref: any = useNavigationContainerRef();

  const routes = [
    { name: SCREEN_NAME.SPASH, component: SplashScreen },
    { name: SCREEN_NAME.ONBOARDING, component: OnboardingScreen },
    { name: SCREEN_NAME.LOGIN, component: LoginScreen },
    { name: SCREEN_NAME.REGISTER, component: RegisterScreen },
    { name: SCREEN_NAME.VERIFY_EMAIL, component: VerifyEmailScreen },
    { name: SCREEN_NAME.HOME, component: TabNavigator },
  ];

  return (
    <>
      <NavigationContainer ref={ref}>
        <Stack.Navigator initialRouteName={SCREEN_NAME.SPASH}>
          {routes.map(route => (
            <Stack.Screen
              key={route.name}
              name={route.name}
              component={route.component}
              options={{ headerShown: false }}
            />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
export default ApplicationNavigator;
