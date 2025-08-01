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
    },
    font: "Inter",
  },
  {
    id: "ocean",
    colors: {
      primary: "oklch(0.6 0.2 240)",
      background: "oklch(0.98 0.01 240)",
      foreground: "oklch(0.2 0.02 240)",
    },
    font: "Inter",
  },
  {
    id: "sunset",
    colors: {
      primary: "oklch(0.7 0.15 30)",
      background: "oklch(0.98 0.01 30)",
      foreground: "oklch(0.2 0.02 30)",
    },
    font: "Inter",
  },
  {
    id: "forest",
    colors: {
      primary: "oklch(0.6 0.15 140)",
      background: "oklch(0.98 0.01 140)",
      foreground: "oklch(0.2 0.02 140)",
    },
    font: "Inter",
  },
  {
    id: "royal",
    colors: {
      primary: "oklch(0.65 0.2 280)",
      background: "oklch(0.98 0.01 280)",
      foreground: "oklch(0.2 0.02 280)",
    },
    font: "Inter",
  },
  {
    id: "rose",
    colors: {
      primary: "oklch(0.7 0.2 330)",
      background: "oklch(0.98 0.01 330)",
      foreground: "oklch(0.2 0.02 330)",
    },
    font: "Inter",
  },
];

export function ThemeLoader() {
  const { user } = useAuth();

  // Get user's organization
  const userData = useQuery(
    api.users.getByEmail,
    user?.email ? { email: user.email } : "skip",
  );

  // Get organization theme
  const org = useQuery(
    api.orgs.get,
    userData?.orgId ? { id: userData.orgId as any } : "skip",
  );

  useEffect(() => {
    if (org?.theme && "themeId" in org.theme) {
      const themeId = (org.theme as any).themeId;
      const theme = themes.find((t) => t.id === themeId);
      if (theme) {
        const root = document.documentElement;
        root.style.setProperty("--primary", theme.colors.primary);
        root.style.setProperty("--background", theme.colors.background);
        root.style.setProperty("--foreground", theme.colors.foreground);
        root.style.setProperty("--font-family", theme.font);
      }
    }
  }, [org]);

  return null; // This component doesn't render anything
}
