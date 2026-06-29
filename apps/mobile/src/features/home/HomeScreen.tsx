import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '~src/reducers/store';
import DoctorHome from './doctor/DoctorHomeScreen';
import PatientHome from './patient/PatientHomeScreen';

const HomeScreen = () => {
  const role = useSelector((state: RootState) => state.login.role);
  return role === 'DOCTOR' ? <DoctorHome /> : <PatientHome />;
};

export default HomeScreen;
