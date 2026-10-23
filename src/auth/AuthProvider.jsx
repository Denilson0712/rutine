import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadSession, onAuthChange, signOut as doSignOut } from '../services/auth.js';
import { backendConfigured } from '../lib/supabase.js';
import { DEMO_GYM } from '../data/demoGym.js';

const AuthContext = createContext(null);
const DEMO_KEY = 'rutine:demo-session';

/**
 * Sesión de DEMOSTRACIÓN (solo sin backend): permite recorrer el panel del
 * dueño o el espacio del atleta tal como se verán tras iniciar sesión.
 * No es una cuenta real: no hay contraseña ni datos guardados en un servidor,
 * y la interfaz lo indica. Con Supabase configurado esto no existe.
 */
function demoSession(role) {
  if (role === 'owner') {
    return {
      user: { id: 'demo-owner', email: 'dueno@demo', name: 'Dueño de demostración', demo: true, role: 'owner' },
      workspaces: {
        platform_roles: ['athlete'],
        gyms: [{ gym_id: DEMO_GYM.id, trade_name: DEMO_GYM.trade_name, slug: DEMO_GYM.slug, role: 'owner', affiliation_status: 'approved' }],
      },
    };
  }
  return {
    user: { id: 'demo-athlete', email: 'atleta@demo', name: 'Atleta de demostración', demo: true, role: 'athlete' },
    workspaces: { platform_roles: ['athlete'], gyms: [] },
  };
}

function readDemo() {
  try {
    const role = window.sessionStorage.getItem(DEMO_KEY);
    return role ? demoSession(role) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => {
    if (backendConfigured) return { loading: true, user: null, workspaces: null };
    const demo = readDemo();
    return { loading: false, user: demo?.user ?? null, workspaces: demo?.workspaces ?? null };
  });

  const refresh = useCallback(async () => {
    if (!backendConfigured) return;
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
      isDemoSession: Boolean(state.user?.demo),
      refresh,
      /** Solo en modo demostración. role: 'owner' | 'athlete' */
      enterDemo: (role) => {
        if (backendConfigured) return null;
        try { window.sessionStorage.setItem(DEMO_KEY, role); } catch { /* sin almacenamiento: dura hasta recargar */ }
        const s = demoSession(role);
        setState({ loading: false, ...s });
        return s;
      },
      signOut: async () => {
        if (backendConfigured) await doSignOut();
        try { window.sessionStorage.removeItem(DEMO_KEY); } catch { /* nada */ }
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
