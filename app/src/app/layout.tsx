"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Providers } from "@/components/Providers";
import { EnvironmentProvider } from "@/contexts/EnvironmentContext";
import { OptimizedThemeLoader } from "@/components/OptimizedThemeLoader";
import AuthProvider from "@/components/AuthProvider";
import { Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-open-sans",
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={openSans.className}>
        <Providers>
          <AuthProvider>
            <EnvironmentProvider>
              <OptimizedThemeLoader />
              <ErrorBoundary>
                <div className="app-layout" data-testid="app-layout">
                  {children}
                </div>
              </ErrorBoundary>
            </EnvironmentProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
