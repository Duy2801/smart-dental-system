import type { LoginState } from "@/providers/loginSlice";

const AUTH_STORAGE_KEY = "patient_auth";
const ACCESS_TOKEN_KEY = "access_token";
const USER_INFO_KEY = "user_info";
const ROLE_KEY = "role";

export type StoredPatientSession = {
  accessToken: string;
  role: string;
  startDate: string | null;
  user: NonNullable<LoginState["user"]>;
};

const isBrowser = () => typeof window !== "undefined";

const isStoredPatientSession = (
  value: StoredPatientSession | null,
): value is StoredPatientSession =>
  Boolean(value?.accessToken && value?.user && value?.role);

export function savePatientSession(state: LoginState) {
  if (!isBrowser()) return;

  if (!state.accessToken || !state.user || !state.isAuthenticated) {
    return;
  }

  const session: StoredPatientSession = {
    accessToken: state.accessToken,
    role: state.role || state.user.roles?.[0] || "PATIENT",
    startDate: state.startDate,
    user: state.user,
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(USER_INFO_KEY, JSON.stringify(session.user));
  window.localStorage.setItem(ROLE_KEY, session.role);
}

export function loadPatientSession() {
  if (!isBrowser()) return null;

  const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (rawSession) {
    try {
      const session = JSON.parse(rawSession) as StoredPatientSession;
      if (isStoredPatientSession(session)) return session;
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const rawUser = window.localStorage.getItem(USER_INFO_KEY);
  const role = window.localStorage.getItem(ROLE_KEY) || "PATIENT";

  if (!accessToken || !rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as StoredPatientSession["user"];
    const session: StoredPatientSession = {
      accessToken,
      role,
      startDate: null,
      user,
    };
    return isStoredPatientSession(session) ? session : null;
  } catch {
    return null;
  }
}

export function clearPatientSession() {
  if (!isBrowser()) return;

  [AUTH_STORAGE_KEY, ACCESS_TOKEN_KEY, USER_INFO_KEY, ROLE_KEY].forEach(
    (key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    },
  );
}
