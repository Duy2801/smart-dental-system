import React from 'react';
import RoleTabNavigator from '../components/RoleTabNavigator';
import DoctorHomeStack from './DoctorHomeStack';

const DoctorTabNavigator = () => (
  <RoleTabNavigator
    functionLabel="Chức năng"
    homeComponent={DoctorHomeStack}
    reportLabel="Báo cáo"
  />
);

export default DoctorTabNavigator;
