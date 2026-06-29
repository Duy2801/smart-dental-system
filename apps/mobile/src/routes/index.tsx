import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { SCREEN_NAME } from '~src/constants/screenName';
import SplashScreen from '~src/features/splash/SplashScreen';
import OnboardingScreen from '~src/features/onboarding/OnboardingScreen';
import PatientLoginScreen from '~src/features/auth/login/patient/PatientLoginScreen';
import DoctorLoginScreen from '~src/features/auth/login/doctor/DoctorLoginScreen';
import RegisterScreen from '~src/features/auth/register/register';
import VerifyEmailScreen from '~src/features/auth/verifyEmail/VerifyEmailScreen';
import PatientTabNavigator from './tabs/patient/PatientTabNavigator';
import DoctorTabNavigator from './tabs/doctor/DoctorTabNavigator';
const Stack = createNativeStackNavigator();
function ApplicationNavigator() {
  const ref: any = useNavigationContainerRef();

  const routes = [
    { name: SCREEN_NAME.SPLASH, component: SplashScreen },
    { name: SCREEN_NAME.ONBOARDING, component: OnboardingScreen },
    { name: SCREEN_NAME.PATIENT_LOGIN, component: PatientLoginScreen },
    { name: SCREEN_NAME.DOCTOR_LOGIN, component: DoctorLoginScreen },
    { name: SCREEN_NAME.REGISTER, component: RegisterScreen },
    { name: SCREEN_NAME.VERIFY_EMAIL, component: VerifyEmailScreen },
    { name: SCREEN_NAME.PATIENT_HOME, component: PatientTabNavigator },
    { name: SCREEN_NAME.DOCTOR_HOME, component: DoctorTabNavigator },
  ];

  return (
    <>
      <NavigationContainer ref={ref}>
        <Stack.Navigator initialRouteName={SCREEN_NAME.SPLASH}>
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
