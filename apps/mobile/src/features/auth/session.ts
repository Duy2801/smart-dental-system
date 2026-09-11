import { KEY_STORAGE } from '~src/constants/keyStorage';
import { LoginState } from '~src/reducers/loginReducer';
import { getItem, removeItem, setItem } from '~src/utils/storage';
import { AuthSession, UserRole } from './types';

export type StoredSession = Pick<LoginState, 'accessToken' | 'role' | 'user'> & {
  refreshToken?: string;
};

export const saveAuthSession = async (session: AuthSession, role: UserRole) => {
  const storedSession: StoredSession = { ...session, role };
  const promises: Promise<unknown>[] = [
    setItem(KEY_STORAGE.session, storedSession),
    setItem(KEY_STORAGE.token, session.accessToken),
  ];
  if (session.refreshToken) {
    promises.push(setItem(KEY_STORAGE.refreshToken, session.refreshToken));
  }
  await Promise.all(promises);
};

export const loadAuthSession = () =>
  getItem<StoredSession>(KEY_STORAGE.session);

export const removeAuthSession = async () => {
  await Promise.all([
    removeItem(KEY_STORAGE.session),
    removeItem(KEY_STORAGE.token),
    removeItem(KEY_STORAGE.refreshToken),
  ]);
};
