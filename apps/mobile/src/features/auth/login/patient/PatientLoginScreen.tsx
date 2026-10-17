import React from 'react';
import LoginForm from '../components/LoginForm';

const PatientLoginScreen = () => (
  <LoginForm
    accentColor="#0875D1"
    initialEmail="patient01@smartdental.test"
    initialPassword="Test@123456"
    role="PATIENT"
    showPatientActions
    subtitle="Chào mừng trở lại! Vui lòng nhập thông tin để tiếp tục."
    title="Đăng nhập tài khoản"
  />
);

export default PatientLoginScreen;
