import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeTestData } from '../data/testData';

export interface User {
  id: string;
  nombre: string;
  codigo: string;
  correo: string;
  materiasVistas: string[];
  horariosGuardados: {
    id: string;
    nombre: string;
    fecha: string;
    materias: any[];
  }[];
}

interface AuthContextType {
  user: User | null;
  login: (correo: string, password: string) => boolean;
  register: (data: { nombre: string; codigo: string; correo: string; password: string }) => boolean;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Inicializar datos de prueba
    initializeTestData();
    
    const storedUser = localStorage.getItem('nexoud_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (correoOrCodigo: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem('nexoud_users') || '[]');
    const foundUser = users.find(
      (u: any) =>
        (u.correo === correoOrCodigo || u.codigo === correoOrCodigo) &&
        u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('nexoud_user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const register = (data: { nombre: string; codigo: string; correo: string; password: string }): boolean => {
    const users = JSON.parse(localStorage.getItem('nexoud_users') || '[]');
    
    // Verificar si el correo o código ya existe
    const exists = users.find((u: any) => u.correo === data.correo || u.codigo === data.codigo);
    if (exists) {
      return false;
    }

    const newUser = {
      id: Date.now().toString(),
      ...data,
      materiasVistas: [],
      horariosGuardados: []
    };

    users.push(newUser);
    localStorage.setItem('nexoud_users', JSON.stringify(users));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nexoud_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('nexoud_user', JSON.stringify(updatedUser));

    // También actualizar en la lista de usuarios
    const users = JSON.parse(localStorage.getItem('nexoud_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      localStorage.setItem('nexoud_users', JSON.stringify(users));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}