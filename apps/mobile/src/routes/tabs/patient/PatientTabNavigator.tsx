import React from 'react';
import RoleTabNavigator from '../components/RoleTabNavigator';
import PatientHomeStack from './PatientHomeStack';

const PatientTabNavigator = () => (
  <RoleTabNavigator
    functionLabel="Lịch hẹn"
    homeComponent={PatientHomeStack}
    reportLabel="Hồ sơ"
  />
);

export default PatientTabNavigator;
