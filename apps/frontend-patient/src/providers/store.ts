import { configureStore } from "@reduxjs/toolkit";
import { savePatientSession } from "@/features/auth/session-storage";
import { loginReducer } from ".";

const store = configureStore({
  reducer: {
    login: loginReducer,
  },
});

let lastPersistedSignature = "";

store.subscribe(() => {
  const state = store.getState().login;
  if (!state.isHydrated) return;

  const signature = JSON.stringify({
    accessToken: state.accessToken,
    isAuthenticated: state.isAuthenticated,
    role: state.role,
    startDate: state.startDate,
    user: state.user,
  });

  if (signature === lastPersistedSignature) return;
  lastPersistedSignature = signature;

  savePatientSession(state);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
