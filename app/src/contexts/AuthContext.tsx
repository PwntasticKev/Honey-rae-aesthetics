"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  orgId: number;
  isMasterOwner: boolean;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User; requiresOTP?: boolean }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Session storage keys
  const SESSION_KEY = 'honey_rae_session';
  const SESSION_EXPIRY_KEY = 'honey_rae_session_expiry';

  // Check for existing session on mount
  useEffect(() => {
    const restoreSession = () => {
      try {
        const storedSession = localStorage.getItem(SESSION_KEY);
        const sessionExpiry = localStorage.getItem(SESSION_EXPIRY_KEY);
        
        if (storedSession && sessionExpiry) {
          const expiryTime = new Date(sessionExpiry);
          const now = new Date();
          
          if (now < expiryTime) {
            // Session is still valid
            const userData = JSON.parse(storedSession);
            setUser(userData);
            console.log('Session restored:', userData.email);
          } else {
            // Session expired, clear it
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(SESSION_EXPIRY_KEY);
            console.log('Session expired, cleared');
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        // Clear corrupted session data
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_EXPIRY_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/public/test-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Store user session with 24-hour expiry
        const userData = data.user;
        const expiryTime = new Date();
        expiryTime.setHours(expiryTime.getHours() + 24); // 24 hour session
        
        localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toISOString());
        
        setUser(userData);
        console.log("Login successful, session stored:", userData.email);
        
        return {
          success: true,
          user: userData,
          requiresOTP: false,
        };
      } else {
        const errorMessage = data.error || "Login failed";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear session storage
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      
      // Clear state
      setUser(null);
      setError(null);
      
      console.log("Logout successful, session cleared");
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
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