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
  deviceLocation?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  requiresPasswordChange: boolean;
  login: (data: LoginRequest) => Promise<{ requiresPasswordChange: boolean }>;
  logout: () => void;
  setRequiresPasswordChange: (value: boolean) => void;
  isAdmin: () => boolean;
  isReadOnly: () => boolean;
  canEditSales: () => boolean;
  canEditExpenses: () => boolean;
  token: string;
  hasRole: (roles: string[]) => boolean;
  isReparto: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string>('');
  const [requiresPasswordChange, setRequiresPasswordChange] = useState<boolean>(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedDeviceLocation = localStorage.getItem("deviceLocation");
    const storedFranchiseLocation = localStorage.getItem("franchiseLocation");
    const storedRequiresPasswordChange = localStorage.getItem("requiresPasswordChange");

    if (storedToken && storedUser) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      try {
        const parsedUser = JSON.parse(storedUser);

        parsedUser.deviceLocation = storedDeviceLocation
          ? JSON.parse(storedDeviceLocation)
          : parsedUser.deviceLocation || null;

        parsedUser.franchiseLocation = storedFranchiseLocation
          ? JSON.parse(storedFranchiseLocation)
          : parsedUser.franchiseLocation || null;

        setUser(parsedUser);
        setToken(storedToken);
        setIsAuthenticated(true);

      } catch (err) {
        console.error("Error al parsear usuario:", err);
      }
    }
  }, []);

  const login = async (data: LoginRequest): Promise<{ requiresPasswordChange: boolean }> => {
    setLoading(true);
    try {
      const deviceLocation = JSON.parse(localStorage.getItem("deviceLocation") || "null");

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        ...data,
        deviceLocation
      });  

      const {
        token,
        user,
        deviceLocation: returnedDeviceLocation,
        franchiseLocation,
        requiresPasswordChange: requiresChange = false
      } = res.data;

      const finalUser = {
        ...user,
        deviceLocation: returnedDeviceLocation || deviceLocation || user.deviceLocation || null,
        franchiseLocation: franchiseLocation || user.franchiseLocation || null,
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(finalUser));
      localStorage.setItem("deviceLocation", JSON.stringify(finalUser.deviceLocation));
      localStorage.setItem("franchiseLocation", JSON.stringify(finalUser.franchiseLocation));
      localStorage.setItem("userRole", finalUser.role);

      if (requiresChange) {
        localStorage.setItem("requiresPasswordChange", "true");
      } else {
        localStorage.removeItem("requiresPasswordChange");
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(finalUser);
      setToken(token);
      setIsAuthenticated(true);

      console.log("📌 User final con Device Tracker:", finalUser);

      return { requiresPasswordChange: requiresChange };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("deviceLocation");
    localStorage.removeItem("franchiseLocation");
    localStorage.removeItem("requiresPasswordChange");
    
    setUser(null);
    setToken('');
    setIsAuthenticated(false);
    setRequiresPasswordChange(false);
  };

  const isAdmin = () =>
    ["Master admin", "Supervisor de sucursales", "Supervisor de sucursal"].includes(user?.role || "");

  const isReadOnly = () =>
    ["Cajero", "Vendedor", "Reparto"].includes(user?.role || "");

  const canEditSales = () => !isReadOnly() && isAdmin();
  const canEditExpenses = () => !isReadOnly() && isAdmin();

  const hasRole = (roles: string[]) => roles.includes(user?.role || "");

  const isReparto = () => user?.role === "Reparto";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        requiresPasswordChange,
        login,
        logout,
        setRequiresPasswordChange,
        isAdmin,
        isReadOnly,
        canEditSales,
        canEditExpenses,
        token,
        hasRole,
        isReparto
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};