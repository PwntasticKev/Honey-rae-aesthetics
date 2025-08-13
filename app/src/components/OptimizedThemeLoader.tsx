"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { themes, generateThemeCSS } from "@/lib/theme-preloader";

export function OptimizedThemeLoader() {
  const { user } = useAuth();
  const lastAppliedKeyRef = useRef<string | null>(null);

  const userData = useQuery(
    api.users.getByEmail,
    user?.email ? { email: user.email } : "skip",
  );

  const org = useQuery(
    api.orgs.get,
    userData?.orgId ? { id: userData.orgId as any } : "skip",
  );

  const applyThemeToCSS = useCallback((theme: any, fontFamily: string) => {
    // Remove preload theme
    const preloadStyle = document.getElementById("theme-preload");
    if (preloadStyle) {
      preloadStyle.remove();
    }

    // Remove any existing dynamic theme styles
    const existingStyle = document.getElementById("dynamic-theme-styles");
    if (existingStyle) {
      existingStyle.remove();
    }

    // Apply new theme
    const style = document.createElement("style");
    style.id = "dynamic-theme-styles";
    style.textContent = generateThemeCSS(theme.id, fontFamily);
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    let themeId = "ocean"; // Default to ocean theme
    let fontFamily = "Inter";

    // Get theme from database or use ocean as fallback
    if (org?.theme && "themeId" in org.theme) {
      themeId = (org.theme as any).themeId;
      fontFamily = (org.theme as any).fontFamily || "Inter";
    }

    const key = `${themeId}__${fontFamily}`;
    if (lastAppliedKeyRef.current === key) {
      return;
    }

    const currentTheme =
      themes.find((t) => t.id === themeId) ||
      themes.find((t) => t.id === "ocean")!;
    applyThemeToCSS(currentTheme, fontFamily);
    lastAppliedKeyRef.current = key;
  }, [org, applyThemeToCSS]);

  return null;
}
