import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type PatientHomeStackParamList = {
  Home: undefined;
  PatientServices: { keyword?: string } | undefined;
  PatientDoctors: { serviceId?: string; keyword?: string } | undefined;
  PatientConsultation: undefined;
  PatientPayment: undefined;
  PatientNotifications: undefined;
  PatientPromotions: undefined;
};

export type PatientHomeScreenProps<T extends keyof PatientHomeStackParamList> =
  NativeStackScreenProps<PatientHomeStackParamList, T>;
