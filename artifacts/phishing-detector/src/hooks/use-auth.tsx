import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

export interface DecodedUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  exp?: number;
}

function decodeToken(token: string): DecodedUser | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null; // Token expired
    }
    return {
      id: decoded.userId ?? decoded.id,
      email: decoded.email,
      name: decoded.name ?? decoded.email?.split('@')[0] ?? 'User',
      role: decoded.role ?? 'user',
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
}

interface AuthContextType {
  user: DecodedUser | null;
  token: string | null;
  isLoaded: boolean;
  login: (newToken: string, userData?: { id: number; email: string; name: string; role: 'user' | 'admin' }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DecodedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedToken = localStorage.getItem('phishing_token');
    if (storedToken) {
      const decoded = decodeToken(storedToken);
      if (decoded) {
        setUser(decoded);
        setToken(storedToken);
      } else {
        localStorage.removeItem('phishing_token');
      }
    }
    setIsLoaded(true);
  }, []);

  const login = useCallback((newToken: string, userData?: { id: number; email: string; name: string; role: 'user' | 'admin' }) => {
    localStorage.setItem('phishing_token', newToken);
    if (userData) {
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      });
    } else {
      const decoded = decodeToken(newToken);
      if (decoded) {
        setUser(decoded);
      }
    }
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('phishing_token');
    setUser(null);
    setToken(null);
    setLocation('/login');
  }, [setLocation]);

  return (
    <AuthContext.Provider value={{ user, token, isLoaded, login, logout }}>
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
