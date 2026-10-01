import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useBusinessStore } from '../store/businessStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const currentBusiness = useBusinessStore.getState().currentBusiness;
  if (currentBusiness) {
    config.headers['X-Business-ID'] = currentBusiness.id;
  }

  return config;
});

export default apiClient;
