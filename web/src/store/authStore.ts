import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';

interface AuthState {
  isAuthenticated: boolean;
  setAuthenticated: (status: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      setAuthenticated: (status) => set({ isAuthenticated: status }),
      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
        } catch (e) {
          console.error(e);
        }
        set({ isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
