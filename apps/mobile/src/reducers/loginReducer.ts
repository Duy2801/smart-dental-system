import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthSession, AuthUser, UserRole } from '~src/features/auth/types';

export type LoginState = {
  user: AuthUser | null;
  accessToken: string;
  role: UserRole | null;
  isHydrated: boolean;
};

const initialState: LoginState = {
  user: null,
  accessToken: '',
  role: null,
  isHydrated: false,
};

const loginSlice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    setSession: (
      state,
      action: PayloadAction<AuthSession & { role: UserRole }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.role = action.payload.role;
      state.isHydrated = true;
    },
    hydrateSession: (state, action: PayloadAction<LoginState | null>) => {
      if (action.payload) {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.role = action.payload.role;
      }
      state.isHydrated = true;
    },
    clearSession: state => {
      state.user = null;
      state.accessToken = '';
      state.role = null;
      state.isHydrated = true;
    },
  },
});

export const { clearSession, hydrateSession, setSession } = loginSlice.actions;
export default loginSlice.reducer;
