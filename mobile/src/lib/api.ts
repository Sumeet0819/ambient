import axios from 'axios';
import { store } from '../store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.136:3000/api/v1';

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
