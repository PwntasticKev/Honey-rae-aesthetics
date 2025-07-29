"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Environment = "development" | "production";

interface EnvironmentContextType {
  environment: Environment;
  setEnvironment: (env: Environment) => void;
  isDevelopment: boolean;
  isProduction: boolean;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(
  undefined,
);

export function EnvironmentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [environment, setEnvironment] = useState<Environment>("development");

  // Load environment from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEnv = localStorage.getItem(
        "honey-rae-environment",
      ) as Environment;
      if (
        savedEnv &&
        (savedEnv === "development" || savedEnv === "production")
      ) {
        setEnvironment(savedEnv);
      }
    }
  }, []);

  // Save environment to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("honey-rae-environment", environment);
    }
  }, [environment]);

  const value: EnvironmentContextType = {
    environment,
    setEnvironment,
    isDevelopment: environment === "development",
    isProduction: environment === "production",
  };

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error(
      "useEnvironment must be used within an EnvironmentProvider",
    );
  }
  return context;
}
