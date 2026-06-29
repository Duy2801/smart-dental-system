import { KEY_STORAGE } from '~src/constants/keyStorage';
import { LoginState } from '~src/reducers/loginReducer';
import { getItem, removeItem, setItem } from '~src/utils/storage';
import { AuthSession, UserRole } from './types';

type StoredSession = Pick<LoginState, 'accessToken' | 'role' | 'user'>;

export const saveAuthSession = async (session: AuthSession, role: UserRole) => {
  const storedSession: StoredSession = { ...session, role };
  await Promise.all([
    setItem(KEY_STORAGE.session, storedSession),
    setItem(KEY_STORAGE.token, session.accessToken),
  ]);
};

export const loadAuthSession = () =>
  getItem<StoredSession>(KEY_STORAGE.session);

export const removeAuthSession = async () => {
  await Promise.all([
    removeItem(KEY_STORAGE.session),
    removeItem(KEY_STORAGE.token),
  ]);
};
