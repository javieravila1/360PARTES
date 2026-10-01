import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Business {
  id: string;
  name: string;
  logo?: string;
  currency: string;
}

interface BusinessState {
  currentBusiness: Business | null;
  setCurrentBusiness: (business: Business) => void;
  clearBusiness: () => void;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      currentBusiness: null,
      setCurrentBusiness: (business) => set({ currentBusiness: business }),
      clearBusiness: () => set({ currentBusiness: null }),
    }),
    {
      name: 'business-storage',
    }
  )
);
