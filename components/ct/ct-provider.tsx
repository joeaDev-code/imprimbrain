'use client';

import { createContext, useContext, useState } from 'react';
import { useStore } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';
import type { CTInitialState, CTStoreState } from '@/lib/stores/ct-store';
import { createCTStore } from '@/lib/stores/ct-store';

const CTStoreContext = createContext<StoreApi<CTStoreState> | null>(null);

export function CTProvider({ children, initialState }: { children: React.ReactNode; initialState: CTInitialState }) {
  const [store] = useState(() => createCTStore(initialState));
  return <CTStoreContext.Provider value={store}>{children}</CTStoreContext.Provider>;
}

export function useCTStore<T>(selector: (state: CTStoreState) => T) {
  const store = useContext(CTStoreContext);
  if (!store) throw new Error('useCTStore must be used inside CTProvider');
  return useStore(store, selector);
}
