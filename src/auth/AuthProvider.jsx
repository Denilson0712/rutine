import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadSession, onAuthChange, signOut as doSignOut } from '../services/auth.js';
import { backendConfigured } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: backendConfigured, user: null, workspaces: null });

  const refresh = useCallback(async () => {
    const s = await loadSession();
    setState({ loading: false, ...s });
  }, []);

  useEffect(() => {
    if (!backendConfigured) return undefined;
    let unsub = () => {};
    refresh();
    onAuthChange(() => refresh()).then((fn) => {
      unsub = fn;
    });
    return () => unsub();
  }, [refresh]);

  const value = useMemo(
    () => ({
      ...state,
      backendConfigured,
      refresh,
      signOut: async () => {
        await doSignOut();
        setState({ loading: false, user: null, workspaces: null });
      },
    }),
    [state, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
