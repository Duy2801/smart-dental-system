import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SCREEN_NAME } from '~src/constants/screenName';
import { apiLogout } from '~src/features/auth/api';
import { removeAuthSession } from '~src/features/auth/session';
import { clearSession } from '~src/reducers/loginReducer';
import type { AppDispatch, RootState } from '~src/reducers/store';
import { getLoginRoute } from '~src/routes/roleRoutes';

type PatientDrawerRouteId =
  | 'appointment'
  | 'consultation'
  | 'doctors'
  | 'home'
  | 'promotions'
  | 'records'
  | 'services';

export function usePatientDrawerActions() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const role = useSelector((state: RootState) => state.login?.role ?? 'PATIENT');

  const getTabNavigation = useCallback(
    () => navigation?.getParent?.() || navigation,
    [navigation],
  );

  const navigateHomeStack = useCallback(
    (screen?: string, params?: object) => {
      const tabNavigation = getTabNavigation();
      tabNavigation?.navigate?.(
        SCREEN_NAME.HOME as never,
        screen ? ({ screen, params } as never) : undefined,
      );
    },
    [getTabNavigation],
  );

  const handleDrawerNavigate = useCallback(
    (routeId: string) => {
      const tabNavigation = getTabNavigation();

      switch (routeId as PatientDrawerRouteId) {
        case 'home':
          tabNavigation?.navigate?.(SCREEN_NAME.HOME as never);
          break;
        case 'appointment':
          tabNavigation?.navigate?.(SCREEN_NAME.FUNCTION as never, {
            screen: 'AppointmentMain',
          } as never);
          break;
        case 'consultation':
          navigateHomeStack(SCREEN_NAME.PATIENT_CONSULTATION);
          break;
        case 'services':
          tabNavigation?.navigate?.(SCREEN_NAME.PATIENT_SERVICES as never, {
            screen: 'ServiceCatalogMain',
          } as never);
          break;
        case 'doctors':
          navigateHomeStack(SCREEN_NAME.PATIENT_DOCTORS);
          break;
        case 'records':
          tabNavigation?.navigate?.(SCREEN_NAME.REPORT as never);
          break;
        case 'promotions':
          navigateHomeStack(SCREEN_NAME.PATIENT_PROMOTIONS);
          break;
        default:
          break;
      }
    },
    [getTabNavigation, navigateHomeStack],
  );

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Local logout still works even if the server request fails.
    } finally {
      await removeAuthSession();
      dispatch(clearSession());
      let rootNavigation = navigation;
      let parentNavigation = rootNavigation?.getParent?.();
      while (parentNavigation) {
        rootNavigation = parentNavigation;
        parentNavigation = rootNavigation?.getParent?.();
      }
      rootNavigation?.reset?.({
        index: 0,
        routes: [{ name: getLoginRoute(role || 'PATIENT') }],
      });
    }
  }, [dispatch, navigation, role]);

  return {
    handleDrawerNavigate,
    handleLogout,
  };
}
