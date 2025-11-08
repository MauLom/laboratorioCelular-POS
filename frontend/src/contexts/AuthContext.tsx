import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { LoginRequest } from '../types';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  fullName?: string;
  franchiseLocation?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isReadOnly: () => boolean;
  canEditSales: () => boolean;
  canEditExpenses: () => boolean;
  token: string;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        setIsAuthenticated(true);
        console.log("🟢 Usuario cargado desde localStorage:", parsedUser);
        if (parsedUser?.franchiseLocation) {
          console.log("🏪 Sucursal asignada:", parsedUser.franchiseLocation);
        } else {
          console.warn("⚠️ El usuario no tiene sucursal asignada en localStorage");
        } 
      } catch (err) {
        console.error("❌ Error al parsear usuario del localStorage:", err);
      } 
    }
  }, []);

  const login = async (data: LoginRequest) => {
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, data);

      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userRole', user.role);

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setToken(token);
      setIsAuthenticated(true);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    setUser(null);
    setToken('');
    setIsAuthenticated(false);
  };

  const isAdmin = () => {
    const role = user?.role || '';
    return (
      role === 'Master admin' ||
      role === 'Supervisor de sucursales' ||
      role === 'Supervisor de sucursal'
    );
  };

  const isReadOnly = () => 
    user?.role === 'Cajero' || user?.role === 'Vendedor';

  const canEditSales = () => !isReadOnly() && isAdmin();
  const canEditExpenses = () => !isReadOnly() && isAdmin();

  const hasRole = (roles: string[]) => roles.includes(user?.role || '');

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        isAdmin,
        isReadOnly,
        canEditSales,
        canEditExpenses,
        token, 
        hasRole 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};