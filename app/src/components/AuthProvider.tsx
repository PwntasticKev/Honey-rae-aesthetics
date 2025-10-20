"use client";

import { ReactNode } from "react";
import { AuthProvider as AuthContextProvider } from "@/contexts/AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <AuthContextProvider>
      {children}
    </AuthContextProvider>
  );
}