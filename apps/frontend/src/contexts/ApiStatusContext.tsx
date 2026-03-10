'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface ApiStatusContextValue {
  apiError: string | null;
  setApiError: (err: string | null) => void;
  sseConnected: boolean;
  setSseConnected: (connected: boolean) => void;
}

const ApiStatusContext = createContext<ApiStatusContextValue | null>(null);

export function ApiStatusProvider({ children }: { children: ReactNode }) {
  const [apiError, setApiErrorState] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState(false);

  const setApiError = useCallback((err: string | null) => {
    setApiErrorState(err);
  }, []);

  return (
    <ApiStatusContext.Provider
      value={{ apiError, setApiError, sseConnected, setSseConnected }}
    >
      {children}
    </ApiStatusContext.Provider>
  );
}

export function useApiStatus() {
  const ctx = useContext(ApiStatusContext);
  if (!ctx) {
    return {
      apiError: null,
      setApiError: () => {},
      sseConnected: true,
      setSseConnected: () => {},
    };
  }
  return ctx;
}
