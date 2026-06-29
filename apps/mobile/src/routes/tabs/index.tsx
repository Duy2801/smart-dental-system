import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import React from 'react';
import { useSelector } from 'react-redux';
import { SCREEN_NAME } from '~src/constants/screenName';
import { RootState } from '~src/reducers/store';
import CustomTabBar from './CustomTabBar';
import AIStack from './AIStack';
import FunctionStack from './FunctionStack';
import HomeStack from './HomStack';
import PersonalStack from './PersonalStack';
import ReportStack from './ReportStack';

const Tab = createBottomTabNavigator();
const renderTabBar = (props: BottomTabBarProps) => <CustomTabBar {...props} />;

function TabNavigator() {
  const role = useSelector((state: RootState) => state.login.role);
  const isDoctor = role === 'DOCTOR';

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
      tabBar={renderTabBar}
    >
      <Tab.Screen
        component={HomeStack}
        name={SCREEN_NAME.HOME}
        options={{ title: 'Trang chủ' }}
      />
      <Tab.Screen
        component={FunctionStack}
        name={SCREEN_NAME.FUNCTION}
        options={{ title: isDoctor ? 'Chức năng' : 'Lịch hẹn' }}
      />
      <Tab.Screen
        component={AIStack}
        name={SCREEN_NAME.AI}
        options={{ title: 'AI' }}
      />
      <Tab.Screen
        component={ReportStack}
        name={SCREEN_NAME.REPORT}
        options={{ title: isDoctor ? 'Báo cáo' : 'Hồ sơ' }}
      />
      <Tab.Screen
        component={PersonalStack}
        name={SCREEN_NAME.PERSONAL}
        options={{ title: 'Cá nhân' }}
      />
    </Tab.Navigator>
  );
}

export default TabNavigator;
