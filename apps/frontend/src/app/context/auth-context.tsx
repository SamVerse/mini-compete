"use client"; 

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; 

interface AuthUser {
  userId: number;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      try {
        const decoded = jwtDecode<AuthUser & { sub: number }>(storedToken);
        setUser({ userId: decoded.sub, email: decoded.email, role: decoded.role });
        setToken(storedToken);
      } catch (e) {
        console.error("Invalid token");
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  const login = (newToken: string) => {
    try {
      const decoded = jwtDecode<AuthUser & { sub: number }>(newToken);
      setUser({ userId: decoded.sub, email: decoded.email, role: decoded.role });
      setToken(newToken);
      localStorage.setItem('authToken', newToken);
    } catch (e) {
      console.error("Failed to decode token", e);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};