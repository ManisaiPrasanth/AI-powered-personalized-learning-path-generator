import axios from 'axios';
import { useAuth } from '../state/AuthContext';

export const api = axios.create({
  baseURL: '/api'
});

let authInterceptorId: number | null = null;

export function attachAuthInterceptor(getToken: () => string | null) {
  // Ensure we don't stack interceptors on every render.
  if (authInterceptorId !== null) {
    api.interceptors.request.eject(authInterceptorId);
  }

  authInterceptorId = api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

// Hook wrapper for typed usage in components
export function useApi() {
  const { token } = useAuth();
  attachAuthInterceptor(() => token);
  return api;
}
