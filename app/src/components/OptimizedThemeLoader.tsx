"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const themes = [
  {
    id: "default",
    colors: {
      primary: "oklch(0.65 0.15 350)",
      background: "oklch(0.99 0.005 300)",
      foreground: "oklch(0.15 0.02 300)",
      primaryLight: "oklch(0.65 0.15 350 / 0.2)",
      primaryDark: "oklch(0.55 0.2 350)",
    },
    font: "Inter",
  },
  {
    id: "ocean",
    colors: {
      primary: "oklch(0.6 0.2 240)",
      background: "oklch(0.98 0.01 240)",
      foreground: "oklch(0.2 0.02 240)",
      primaryLight: "oklch(0.6 0.2 240 / 0.2)",
      primaryDark: "oklch(0.5 0.25 240)",
    },
    font: "Inter",
  },
  {
    id: "sunset",
    colors: {
      primary: "oklch(0.7 0.15 30)",
      background: "oklch(0.98 0.01 30)",
      foreground: "oklch(0.2 0.02 30)",
      primaryLight: "oklch(0.7 0.15 30 / 0.2)",
      primaryDark: "oklch(0.6 0.2 30)",
    },
    font: "Inter",
  },
  {
    id: "forest",
    colors: {
      primary: "oklch(0.6 0.15 140)",
      background: "oklch(0.98 0.01 140)",
      foreground: "oklch(0.2 0.02 140)",
      primaryLight: "oklch(0.6 0.15 140 / 0.2)",
      primaryDark: "oklch(0.5 0.2 140)",
    },
    font: "Inter",
  },
  {
    id: "royal",
    colors: {
      primary: "oklch(0.65 0.2 280)",
      background: "oklch(0.98 0.01 280)",
      foreground: "oklch(0.2 0.02 280)",
      primaryLight: "oklch(0.65 0.2 280 / 0.2)",
      primaryDark: "oklch(0.55 0.25 280)",
    },
    font: "Inter",
  },
  {
    id: "rose",
    colors: {
      primary: "oklch(0.7 0.2 330)",
      background: "oklch(0.98 0.01 330)",
      foreground: "oklch(0.2 0.02 330)",
      primaryLight: "oklch(0.7 0.2 330 / 0.2)",
      primaryDark: "oklch(0.6 0.25 330)",
    },
    font: "Inter",
  },
];

export function OptimizedThemeLoader() {
  const { user } = useAuth();

  const userData = useQuery(
    api.users.getByEmail,
    user?.email ? { email: user.email } : "skip",
  );

  const org = useQuery(
    api.orgs.get,
    userData?.orgId ? { id: userData.orgId as any } : "skip",
  );

  // Apply default theme immediately on mount to prevent flash
  useEffect(() => {
    if (!document.getElementById('default-theme-applied')) {
      const defaultTheme = themes.find((t) => t.id === "default") || themes[0];
      applyThemeToCSS(defaultTheme, "Inter", true);
      
      // Mark default theme as applied
      const marker = document.createElement('meta');
      marker.id = 'default-theme-applied';
      document.head.appendChild(marker);
    }
  }, []);

  useEffect(() => {
    let themeId = "default";
    let fontFamily = "Inter";

    // Get theme from database or use default
    if (org?.theme && "themeId" in org.theme) {
      themeId = (org.theme as any).themeId;
      fontFamily = (org.theme as any).fontFamily || "Inter";
    }

    const theme = themes.find((t) => t.id === themeId) || themes[0];
    applyThemeToCSS(theme, fontFamily, false);
  }, [org]);

  const applyThemeToCSS = (theme: any, fontFamily: string, isDefault: boolean = false) => {
    const root = document.documentElement;
    
    // Update CSS custom properties - these will automatically apply to all elements using them
    root.style.setProperty("--primary", theme.colors.primary);
    root.style.setProperty("--primary-foreground", "oklch(0.98 0.005 300)");
    root.style.setProperty("--background", theme.colors.background);
    root.style.setProperty("--foreground", theme.colors.foreground);
    root.style.setProperty("--font-family", fontFamily);
    
    // Computed colors for hover states and variants
    root.style.setProperty("--primary-light", theme.colors.primaryLight);
    root.style.setProperty("--primary-dark", theme.colors.primaryDark);
    
    // Secondary colors based on primary
    root.style.setProperty("--secondary", theme.colors.primaryLight);
    root.style.setProperty("--secondary-foreground", theme.colors.primaryDark);
    
    // Update sidebar colors
    root.style.setProperty("--sidebar", theme.colors.background);
    root.style.setProperty("--sidebar-foreground", theme.colors.foreground);
    root.style.setProperty("--sidebar-primary", theme.colors.primary);
    root.style.setProperty("--sidebar-primary-foreground", "oklch(0.98 0.005 300)");
    root.style.setProperty("--sidebar-accent", theme.colors.primaryLight);
    root.style.setProperty("--sidebar-accent-foreground", theme.colors.primaryDark);
    
    // Update body font
    document.body.style.fontFamily = fontFamily;
    
    // Create a style element for dynamic theme-specific rules
    const existingStyle = document.getElementById('dynamic-theme-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'dynamic-theme-styles';
    style.textContent = `
      /* Theme-aware hover states */
      [data-theme-aware="true"]:not(input):not(textarea):not(select):hover {
        background-color: var(--primary-light) !important;
        color: var(--primary-dark) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease-in-out;
      }
      
      /* Sidebar hover animations */
      [data-sidebar] .group:hover {
        background-color: var(--primary-light) !important;
        transform: translateX(4px) !important;
        transition: all 0.2s ease-in-out !important;
      }
      
      [data-sidebar] .group:hover svg,
      [data-sidebar] .group:hover span {
        color: var(--primary-dark) !important;
      }
      
      /* Force theme colors on legacy color classes */
      .text-orange-600, .text-orange-500, .text-rose-500, .text-pink-500, .text-blue-500, .text-red-500 {
        color: var(--primary) !important;
      }
      
      .bg-orange-500, .bg-rose-500, .bg-pink-500, .bg-blue-500, .bg-red-500 {
        background-color: var(--primary) !important;
      }
      
      .border-orange-500, .border-rose-500, .border-pink-500, .border-blue-500, .border-red-500 {
        border-color: var(--primary) !important;
      }
    `;
    
    document.head.appendChild(style);
  };

  return null;
}