import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type LoginUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  roles?: string[];
  status: string;
  emailVerified: boolean;
};

export type LoginState = {
  user: LoginUser | null;
  accessToken: string;
  role: string;
  startDate: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
};

type LoginPayload = {
  user: LoginUser;
  accessToken: string;
};

type SessionTokensPayload = {
  accessToken: string;
};

const initialState: LoginState = {
  user: null,
  accessToken: "",
  role: "",
  startDate: null,
  isAuthenticated: false,
  isHydrated: false,
};

export const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<LoginPayload>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.role = action.payload.user.roles?.[0] ?? "PATIENT";
      state.startDate = new Date().toISOString();
      state.isAuthenticated = true;
      state.isHydrated = true;
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = Boolean(state.user && action.payload);
    },
    updateSessionTokens: (
      state,
      action: PayloadAction<SessionTokensPayload>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = Boolean(state.user && action.payload.accessToken);
    },
    finishHydration: (state) => {
      state.isHydrated = true;
    },
    logout: () => {
      return {
        ...initialState,
        isHydrated: true,
      };
    },
  },
});

export const {
  login,
  logout,
  updateAccessToken,
  updateSessionTokens,
  finishHydration,
} = loginSlice.actions;

export default loginSlice.reducer;
