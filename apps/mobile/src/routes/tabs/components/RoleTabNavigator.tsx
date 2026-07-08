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

type RoleTabNavigatorProps = {
  homeComponent: React.ComponentType;
  functionLabel: string;
  reportLabel: string;
};

const Tab = createBottomTabNavigator();
const renderTabBar = (props: BottomTabBarProps) => <CustomTabBar {...props} />;

const RoleTabNavigator = ({
  functionLabel,
  homeComponent,
  reportLabel,
}: RoleTabNavigatorProps) => (
  <Tab.Navigator
    screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
    tabBar={renderTabBar}
  >
    <Tab.Screen
      component={homeComponent}
      name={SCREEN_NAME.HOME}
      options={{ title: 'Trang chủ' }}
    />
    <Tab.Screen
      component={FunctionStack}
      name={SCREEN_NAME.FUNCTION}
      options={{ title: functionLabel }}
    />
    <Tab.Screen
      component={AIStack}
      name={SCREEN_NAME.AI}
      options={{ title: 'AI' }}
    />
    <Tab.Screen
      component={ReportStack}
      name={SCREEN_NAME.REPORT}
      options={{ title: reportLabel }}
    />
    <Tab.Screen
      component={PersonalStack}
      name={SCREEN_NAME.PERSONAL}
      options={{ title: 'Cá nhân' }}
    />
  </Tab.Navigator>
);

export default RoleTabNavigator;
