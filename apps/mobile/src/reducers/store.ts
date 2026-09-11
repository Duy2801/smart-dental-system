import { configureStore } from '@reduxjs/toolkit';
import {
  removeAuthSession,
  saveHydratedLoginSession,
} from '~src/features/auth/session';
import { KEY_STORAGE } from '~src/constants/keyStorage';
import { getItem } from '~src/utils/storage';
import { loginReducer } from './index';

const store = configureStore({
  reducer: {
    login: loginReducer,
  },
});

let lastPersistedSignature = '';

store.subscribe(() => {
  const { accessToken, isHydrated, role, user } = store.getState().login;
  if (!isHydrated) return;

  const signature = JSON.stringify({
    accessToken,
    role,
    userId: user?.id ?? null,
    userName: user?.fullName ?? null,
    userEmail: user?.email ?? null,
    userPhone: user?.phone ?? null,
  });

  if (signature === lastPersistedSignature) return;
  lastPersistedSignature = signature;

  if (!accessToken || !role || !user) {
    void removeAuthSession();
    return;
  }

  void getItem<string>(KEY_STORAGE.refreshToken).then(refreshToken =>
    saveHydratedLoginSession({
      accessToken,
      refreshToken: refreshToken ?? undefined,
      role,
      user,
    }),
  );
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
