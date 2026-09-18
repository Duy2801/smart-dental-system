import { KEY_STORAGE } from '~src/constants/keyStorage';
import type { LoginState } from '~src/reducers/loginReducer';
import { getItem, removeItem, setItem } from '~src/utils/storage';
import type { AuthSession, AuthUser, UserRole } from './types';

export type StoredSession = Pick<
  LoginState,
  'accessToken' | 'role' | 'user'
> & {
  refreshToken?: string;
};

export const saveAuthSession = async (session: AuthSession, role: UserRole) => {
  const storedSession: StoredSession = { ...session, role };
  const promises: Promise<unknown>[] = [
    setItem(KEY_STORAGE.session, storedSession),
    setItem(KEY_STORAGE.token, session.accessToken),
    setItem(KEY_STORAGE.user, session.user),
    setItem(KEY_STORAGE.role, role),
  ];
  if (session.refreshToken) {
    promises.push(setItem(KEY_STORAGE.refreshToken, session.refreshToken));
  }
  await Promise.all(promises);
};

export const saveHydratedLoginSession = async (session: StoredSession) => {
  await Promise.all([
    setItem(KEY_STORAGE.session, session),
    setItem(KEY_STORAGE.token, session.accessToken),
    setItem(KEY_STORAGE.user, session.user),
    setItem(KEY_STORAGE.role, session.role),
  ]);
};

const isStoredSession = (value: StoredSession | null): value is StoredSession =>
  Boolean(value?.accessToken && value?.user && value?.role);

export const loadAuthSession = async () => {
  const session = await getItem<StoredSession>(KEY_STORAGE.session);
  if (isStoredSession(session)) return session;

  const [accessToken, user, role] = await Promise.all([
    getItem<string>(KEY_STORAGE.token),
    getItem<AuthUser>(KEY_STORAGE.user),
    getItem<UserRole>(KEY_STORAGE.role),
  ]);

  if (!accessToken || !user || !role) return null;

  const refreshToken = await getItem<string>(KEY_STORAGE.refreshToken);
  const restoredSession: StoredSession = {
    accessToken,
    refreshToken: refreshToken ?? undefined,
    role,
    user,
  };
  await setItem(KEY_STORAGE.session, restoredSession);
  return restoredSession;
};

export const removeAuthSession = async () => {
  await Promise.all([
    removeItem(KEY_STORAGE.session),
    removeItem(KEY_STORAGE.token),
    removeItem(KEY_STORAGE.refreshToken),
    removeItem(KEY_STORAGE.user),
    removeItem(KEY_STORAGE.role),
  ]);
};
