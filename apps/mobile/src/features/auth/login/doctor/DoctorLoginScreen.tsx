import React from 'react';
import LoginForm from '../components/LoginForm';
import { SECONDARY_COLOR } from '~src/constants/color';

const DoctorLoginScreen = () => (
  <LoginForm
    accentColor={SECONDARY_COLOR}
    role="DOCTOR"
    subtitle="Cổng làm việc dành riêng cho bác sĩ nha khoa"
    title="Đăng nhập bác sĩ"
  />
);

export default DoctorLoginScreen;
