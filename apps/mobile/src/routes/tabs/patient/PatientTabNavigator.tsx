import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import React from 'react';
import { SCREEN_NAME } from '~src/constants/screenName';
import AIStack from '../aiStack';
import CustomTabBar from '../CustomTabBar';
import FunctionStack from '../functionStack';
import PersonalStack from '../personalStack';
import ReportStack from '../reportStack';
import ServicesStack from '../servicesStack';
import PatientHomeStack from './PatientHomeStack';

const Tab = createBottomTabNavigator();
const renderTabBar = (props: BottomTabBarProps) => <CustomTabBar {...props} />;

const PatientTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
    tabBar={renderTabBar}
  >
    <Tab.Screen
      component={PatientHomeStack}
      name={SCREEN_NAME.HOME}
      options={{ title: 'Trang chủ' }}
    />
    <Tab.Screen
      component={FunctionStack}
      name={SCREEN_NAME.FUNCTION}
      options={{ title: 'Lịch hẹn' }}
    />
    <Tab.Screen
      component={ServicesStack}
      name={SCREEN_NAME.PATIENT_SERVICES}
      options={{ title: 'Dịch vụ' }}
    />
    <Tab.Screen
      component={ReportStack}
      name={SCREEN_NAME.REPORT}
      options={{ title: 'Hồ sơ' }}
    />
    <Tab.Screen
      component={PersonalStack}
      name={SCREEN_NAME.PERSONAL}
      options={{ title: 'Tôi' }}
    />
    <Tab.Screen
      component={AIStack}
      name={SCREEN_NAME.AI}
      options={{
        tabBarItemStyle: { display: 'none' },
        title: 'AI',
      }}
    />
  </Tab.Navigator>
);

export default PatientTabNavigator;
