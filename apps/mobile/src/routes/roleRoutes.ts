import { SCREEN_NAME } from '~src/constants/screenName';
import { UserRole } from '~src/features/auth/types';

export const getLoginRoute = (role: UserRole) =>
  role === 'DOCTOR' ? SCREEN_NAME.DOCTOR_LOGIN : SCREEN_NAME.PATIENT_LOGIN;

export const getHomeRoute = (role: UserRole) =>
  role === 'DOCTOR' ? SCREEN_NAME.DOCTOR_HOME : SCREEN_NAME.PATIENT_HOME;
