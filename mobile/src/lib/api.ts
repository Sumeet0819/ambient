import axios from 'axios';
import { store } from '../store';

// We'll run the backend on localhost:3001, but for Android emulator we need 10.0.2.2
// If you test on physical device, change this to your computer's local IP (e.g. 192.168.x.x)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
