import React from 'react';
import LoginForm from '../components/LoginForm';

const PatientLoginScreen = () => (
  <LoginForm
    accentColor="#0875D1"
    role="PATIENT"
    showPatientActions
    subtitle="Đăng nhập để tiếp tục chăm sóc nụ cười của bạn"
    title="Chào mừng trở lại"
  />
);

export default PatientLoginScreen;
