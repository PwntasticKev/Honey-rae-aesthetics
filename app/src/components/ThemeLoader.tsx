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

        // Apply theme to body for background gradient
        const body = document.body;
        body.style.setProperty("--theme-primary", theme.colors.primary);
        body.style.setProperty("--theme-background", theme.colors.background);
        body.style.setProperty("--theme-foreground", theme.colors.foreground);
        body.style.setProperty("--theme-font", theme.font);
        body.style.setProperty(
          "--theme-gradient",
          `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.background} 50%, ${theme.colors.primary}20 100%)`,
        );

        // Update main background gradient
        const mainElement = document.querySelector("main") as HTMLElement;
        if (mainElement) {
          mainElement.style.background = `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.background} 50%, ${theme.colors.primary}20 100%)`;
        }

        // Update sidebar colors
        const sidebar = document.querySelector("[data-sidebar]") as HTMLElement;
        if (sidebar) {
          sidebar.style.setProperty(
            "--sidebar-background",
            theme.colors.background,
          );
          sidebar.style.setProperty(
            "--sidebar-foreground",
            theme.colors.foreground,
          );
          sidebar.style.setProperty("--sidebar-primary", theme.colors.primary);
        }

        // Update theme-aware buttons only (not default UI components)
        const themeButtons = document.querySelectorAll(
          "[data-theme-aware='true']",
        );
        themeButtons.forEach((button) => {
          (button as HTMLElement).style.backgroundColor = theme.colors.primary;
          (button as HTMLElement).style.color = theme.colors.background;
        });

        // Update theme-aware text elements only
        const themeTextElements = document.querySelectorAll(
          "[data-theme-aware='true']",
        );
        themeTextElements.forEach((element) => {
          (element as HTMLElement).style.color = theme.colors.foreground;
        });

        // Update page headers
        const pageHeaders = document.querySelectorAll("h1, h2, h3");
        pageHeaders.forEach((header) => {
          if (header.classList.contains("text-gray-900")) {
            (header as HTMLElement).style.color = theme.colors.foreground;
          }
        });
      }
    }
  }, [org]);

  return null; // This component doesn't render anything
}
