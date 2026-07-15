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

type LoginState = {
  user: LoginUser | null;
  accessToken: string;
  role: string;
  startDate: string | null;
  isAuthenticated: boolean;
};

type LoginPayload = {
  user: LoginUser;
  accessToken: string;
};

const initialState: LoginState = {
  user: null,
  accessToken: "",
  role: "",
  startDate: null,
  isAuthenticated: false,
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
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = Boolean(state.user && action.payload);
    },
    logout: () => initialState,
  },
});

export const { login, logout, updateAccessToken } = loginSlice.actions;

export default loginSlice.reducer;
