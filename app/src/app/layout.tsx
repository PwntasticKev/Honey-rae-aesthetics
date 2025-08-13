"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConvexProviderWrapper } from "@/components/ConvexProvider";
import { EnvironmentProvider } from "@/contexts/EnvironmentContext";
import { OptimizedThemeLoader } from "@/components/OptimizedThemeLoader";
import { AuthProvider } from "@/hooks/useAuth";
import { getThemePreloadScript } from "@/lib/theme-preloader";
import "./globals.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script 
          dangerouslySetInnerHTML={{ __html: getThemePreloadScript() }}
        />
      </head>
      <body>
        <ConvexProviderWrapper>
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
        </ConvexProviderWrapper>
      </body>
    </html>
  );
}
