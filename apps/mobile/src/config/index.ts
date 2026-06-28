import axios from "axios"
import { clearItem, getItem } from "../utils/storage";
import { KEY_STORAGE } from "../constants/keyStorage";
import RNRestart from 'react-native-restart-newarch';
import Config from 'react-native-config';

export const api = axios.create({
    baseURL: Config.BACKEND_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    }
});

axios.interceptors.request.use(
    async function (config) {
        const token = await getItem(KEY_STORAGE.token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
)

axios.interceptors.response.use(
    reponse => {
        return reponse.data;
    },
    async error => {
        if (error.reponse) {
            if (error.reponse.status === 401) {
                await clearItem();
                RNRestart.restart();
            }
            return Promise.reject(error.reponse.data);
        }
        return Promise.reject(error);
    }
)
