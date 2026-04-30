import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, userApi, ApiError } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  nickname: string;
  roles: string[];
  active: boolean;
  createdAt: string;
  // Datos locales persistidos en localStorage (no están en el backend)
  materiasVistas: string[];
  horariosGuardados: any[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { nickname: string; email: string; password: string; studentCode: string }) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

// ─── Local data helpers ───────────────────────────────────────────────────────

function loadLocalData(email: string): { materiasVistas: string[]; horariosGuardados: any[] } {
  try {
    const raw = localStorage.getItem('nexoud_local_data');
    if (!raw) return { materiasVistas: [], horariosGuardados: [] };
    const all = JSON.parse(raw);
    return all[email] ?? { materiasVistas: [], horariosGuardados: [] };
  } catch {
    return { materiasVistas: [], horariosGuardados: [] };
  }
}

function saveLocalData(email: string, data: { materiasVistas: string[]; horariosGuardados: any[] }) {
  try {
    const raw = localStorage.getItem('nexoud_local_data');
    const all = raw ? JSON.parse(raw) : {};
    all[email] = data;
    localStorage.setItem('nexoud_local_data', JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('nexoud_token');
    const stored = localStorage.getItem('nexoud_user');
    if (token && stored) {
      try {
        const parsed: User = JSON.parse(stored);
        const localData = loadLocalData(parsed.email);
        setUser({ ...parsed, ...localData });

        // Refresh profile silently in background
        userApi.me().then(profile => {
          const refreshed: User = {
            ...parsed,
            ...localData,
            id: profile.id,
            nickname: profile.nickname,
            active: profile.active,
            createdAt: profile.createdAt,
            roles: profile.roles,
          };
          setUser(refreshed);
          localStorage.setItem('nexoud_user', JSON.stringify(refreshed));
        }).catch(() => {
          // Token might be expired — clear session
          localStorage.removeItem('nexoud_token');
          localStorage.removeItem('nexoud_user');
          setUser(null);
        }).finally(() => {
          setIsRestoring(false);
        });
        return;
      } catch {
        localStorage.removeItem('nexoud_token');
        localStorage.removeItem('nexoud_user');
      }
    }
    setIsRestoring(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('nexoud_token', data.token);

    const localData = loadLocalData(data.email);
    const baseUser: User = {
      id: 0,
      email: data.email,
      nickname: data.nickname,
      roles: data.roles,
      active: true,
      createdAt: '',
      ...localData,
    };
    setUser(baseUser);
    localStorage.setItem('nexoud_user', JSON.stringify(baseUser));

    // Enrich with full profile
    try {
      const profile = await userApi.me();
      const fullUser: User = {
        ...baseUser,
        id: profile.id,
        active: profile.active,
        createdAt: profile.createdAt,
      };
      setUser(fullUser);
      localStorage.setItem('nexoud_user', JSON.stringify(fullUser));
    } catch {
      // Non-fatal: we already have the basic user
    }
  };

  const register = async (data: { nickname: string; email: string; password: string; studentCode: string }): Promise<void> => {
    await authApi.register(data);
  };

  const logout = (): void => {
    authApi.logout().catch(() => {});
    setUser(null);
    localStorage.removeItem('nexoud_token');
    localStorage.removeItem('nexoud_user');
  };

  const updateUser = (updates: Partial<User>): void => {
    if (!user) return;
    const updated: User = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('nexoud_user', JSON.stringify(updated));

    const localChanged =
      updates.materiasVistas !== undefined || updates.horariosGuardados !== undefined;
    if (localChanged) {
      saveLocalData(user.email, {
        materiasVistas: updated.materiasVistas,
        horariosGuardados: updated.horariosGuardados,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isRestoring, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export { ApiError };
