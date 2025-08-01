"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const themes = [
  {
    id: "default",
    colors: {
      primary: "hsl(var(--primary))",
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
    },
    font: "Inter",
  },
  {
    id: "ocean",
    colors: {
      primary: "hsl(210, 100%, 50%)",
      background: "hsl(210, 40%, 98%)",
      foreground: "hsl(210, 10%, 10%)",
    },
    font: "Inter",
  },
  {
    id: "sunset",
    colors: {
      primary: "hsl(25, 95%, 53%)",
      background: "hsl(25, 40%, 98%)",
      foreground: "hsl(25, 10%, 10%)",
    },
    font: "Inter",
  },
  {
    id: "forest",
    colors: {
      primary: "hsl(142, 76%, 36%)",
      background: "hsl(142, 40%, 98%)",
      foreground: "hsl(142, 10%, 10%)",
    },
    font: "Inter",
  },
  {
    id: "royal",
    colors: {
      primary: "hsl(262, 83%, 58%)",
      background: "hsl(262, 40%, 98%)",
      foreground: "hsl(262, 10%, 10%)",
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
