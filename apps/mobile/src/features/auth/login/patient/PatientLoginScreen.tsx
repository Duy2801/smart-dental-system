import React from 'react';
import LoginForm from '../components/LoginForm';

const PatientLoginScreen = () => (
  <LoginForm
    accentColor="#0875D1"
    initialEmail="patient01@smartdental.test"
    initialPassword="Test@123456"
    role="PATIENT"
    showPatientActions
    subtitle=""
    title="Đăng nhập"
  />
);

export default PatientLoginScreen;
