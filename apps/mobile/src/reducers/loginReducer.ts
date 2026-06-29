import { createSlice } from "@reduxjs/toolkit";
import { KEY_STORAGE } from "~src/constants/keyStorage";
import { setItem } from "~src/utils/storage";

const initialState = {
    user: null,
    accessToken: '',
    role: '',
    startDate: null,
}

export const loginSlice = createSlice({
    name: 'login',
    initialState: initialState,
    reducers: {
        login: (state, action) => {
            setItem(KEY_STORAGE.role, action.payload.role);
            setItem(KEY_STORAGE.token, action.payload.accessToken);
            setItem(KEY_STORAGE.user, action.payload.user);
            return {
                user: action.payload.user,
                accessToken: action.payload.accessToken,
                role: action.payload.role,
                startDate: action.payload.startDate
            }
        },
        updateStartdate: (state, action) => {
            setItem(KEY_STORAGE.startDate, action.payload);
            return {
                ...state,
                startDate: action.payload,
            };
        },
        logout: () => {
            setItem(KEY_STORAGE.token, '');
            setItem(KEY_STORAGE.user, '');
            setItem(KEY_STORAGE.role, '');
            setItem(KEY_STORAGE.startDate, '');
            return initialState;
        },
    }
})

export const { login, logout } = loginSlice.actions;

export default loginSlice.reducer;