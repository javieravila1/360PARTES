import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useBusinessStore } from '../store/businessStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const currentBusiness = useBusinessStore.getState().currentBusiness;
  if (currentBusiness && !config.headers['X-Business-ID'] && !config.headers['x-business-id']) {
    config.headers['X-Business-ID'] = currentBusiness.id;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
      // Only reload if we are not already on the login page to avoid infinite loops
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (!error.response || error.code === 'ERR_NETWORK' || error.response.status === 502 || error.response.status === 503 || error.response.status === 504) {
      window.dispatchEvent(new Event('backend_down'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
