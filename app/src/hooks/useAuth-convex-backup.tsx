"use client";

import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface User {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "staff";
  profileImageUrl?: string;
}

interface Organization {
  name: string;
  logo?: string;
}

interface AuthState {
  user: User | null;
  orgId: string | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionToken: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; requiresOTP?: boolean; otpMethod?: string; error?: string }>;
  loginWithGoogle: (googleData: any) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  createAccount: (data: any) => Promise<{ success: boolean; requiresVerification?: boolean; error?: string }>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Auth hook implementation
function useAuthImplementation(): AuthContextType {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    orgId: null,
    organization: null,
    isLoading: true,
    isAuthenticated: false,
    sessionToken: null,
  });
  
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  // Mutations
  const loginWithEmailMutation = useMutation(api.auth.loginWithEmail);
  const loginWithGoogleMutation = useMutation(api.auth.loginWithGoogle);
  const verifyOTPMutation = useMutation(api.auth.verifyOTP);
  const createAccountMutation = useMutation(api.auth.createAccount);
  const logoutMutation = useMutation(api.auth.logout);
  const createTestOrgMutation = useMutation(api.auth.createTestOrg);

  // Query for current user (only when we have a session token)
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    authState.sessionToken ? { sessionToken: authState.sessionToken } : "skip"
  );

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const sessionToken = localStorage.getItem("sessionToken");
      
      if (sessionToken) {
        setAuthState(prev => ({ 
          ...prev, 
          sessionToken,
          isLoading: true // Will be set to false when currentUser query completes
        }));
      } else {
        // No session token, ensure we have a test org for development
        try {
          await createTestOrgMutation({});
        } catch (error) {
          console.log("Test org already exists or creation failed:", error);
        }
        
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []); // Removed createTestOrgMutation from dependencies to prevent infinite loop

  // Update auth state when currentUser query resolves
  useEffect(() => {
    if (currentUser !== undefined) {
      if (currentUser) {
        setAuthState(prev => ({
          ...prev,
          user: {
            userId: currentUser.userId,
            email: currentUser.email,
            name: currentUser.name,
            role: currentUser.role,
            profileImageUrl: currentUser.profileImageUrl,
          },
          orgId: currentUser.orgId,
          organization: currentUser.organization,
          isAuthenticated: true,
          isLoading: false,
        }));
      } else {
        // Invalid session token
        localStorage.removeItem("sessionToken");
        setAuthState(prev => ({
          user: null,
          orgId: null,
          organization: null,
          isAuthenticated: false,
          isLoading: false,
          sessionToken: null,
        }));
      }
    }
  }, [currentUser]);

  // Login with email/password
  const login = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await loginWithEmailMutation({
        email,
        password,
        deviceInfo: {
          userAgent: navigator.userAgent,
          ip: "0.0.0.0", // Would get real IP in production
          deviceName: navigator.platform,
        },
      });

      if (result.requiresOTP) {
        setPendingUserId(result.userId);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { 
          success: true, 
          requiresOTP: true, 
          otpMethod: result.otpMethod 
        };
      } else {
        // Login successful, store session
        localStorage.setItem("sessionToken", result.sessionToken);
        setAuthState(prev => ({ 
          ...prev, 
          sessionToken: result.sessionToken,
          isLoading: true // Will update when currentUser query resolves
        }));
        return { success: true };
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Login failed" 
      };
    }
  }, [loginWithEmailMutation]);

  // Login with Google OAuth
  const loginWithGoogle = useCallback(async (googleData: any) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await loginWithGoogleMutation({
        email: googleData.email,
        googleId: googleData.id,
        name: googleData.name,
        profileImageUrl: googleData.picture,
        deviceInfo: {
          userAgent: navigator.userAgent,
          ip: "0.0.0.0",
          deviceName: navigator.platform,
        },
      });

      // Store session
      localStorage.setItem("sessionToken", result.sessionToken);
      setAuthState(prev => ({ 
        ...prev, 
        sessionToken: result.sessionToken,
        isLoading: true // Will update when currentUser query resolves
      }));
      
      return { success: true };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Google login failed" 
      };
    }
  }, [loginWithGoogleMutation]);

  // Verify OTP
  const verifyOTP = useCallback(async (code: string) => {
    if (!pendingUserId) {
      return { success: false, error: "No pending login" };
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await verifyOTPMutation({
        userId: pendingUserId as any,
        code,
        deviceInfo: {
          userAgent: navigator.userAgent,
          ip: "0.0.0.0",
          deviceName: navigator.platform,
        },
      });

      // Store session and clear pending
      localStorage.setItem("sessionToken", result.sessionToken);
      setPendingUserId(null);
      setAuthState(prev => ({ 
        ...prev, 
        sessionToken: result.sessionToken,
        isLoading: true // Will update when currentUser query resolves
      }));
      
      return { success: true };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "OTP verification failed" 
      };
    }
  }, [verifyOTPMutation, pendingUserId]);

  // Create account
  const createAccount = useCallback(async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: "admin" | "manager" | "staff";
  }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Get or create test org for development
      const testOrgId = await createTestOrgMutation({});
      
      const result = await createAccountMutation({
        orgId: testOrgId,
        ...data,
      });

      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      return { 
        success: true, 
        requiresVerification: result.requiresVerification 
      };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Account creation failed" 
      };
    }
  }, [createAccountMutation, createTestOrgMutation]);

  // Logout
  const logout = useCallback(async () => {
    if (authState.sessionToken) {
      try {
        await logoutMutation({ sessionToken: authState.sessionToken });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    
    localStorage.removeItem("sessionToken");
    setPendingUserId(null);
    setAuthState({
      user: null,
      orgId: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,
      sessionToken: null,
    });
    
    window.location.href = "/login";
  }, [authState.sessionToken, logoutMutation]);

  return {
    ...authState,
    login,
    loginWithGoogle,
    verifyOTP,
    logout,
    createAccount,
  };
}

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authValue = useAuthImplementation();
  
  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
} 