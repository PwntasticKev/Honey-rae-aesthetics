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
      const fontFamily = (org.theme as any).fontFamily || "Inter";
      const theme = themes.find((t) => t.id === themeId);
      if (theme) {
        const root = document.documentElement;
        root.style.setProperty("--primary", theme.colors.primary);
        root.style.setProperty("--background", theme.colors.background);
        root.style.setProperty("--foreground", theme.colors.foreground);
        root.style.setProperty("--font-family", fontFamily);
        root.style.setProperty("--hover-primary", theme.colors.primary + "20");
        root.style.setProperty("--hover-text", theme.colors.primary);
        root.style.setProperty("--primary-light", theme.colors.primary + "20");
        root.style.setProperty("--primary-dark", theme.colors.primary);

        // Apply theme to body for background gradient
        const body = document.body;
        body.style.setProperty("--theme-primary", theme.colors.primary);
        body.style.setProperty("--theme-background", theme.colors.background);
        body.style.setProperty("--theme-foreground", theme.colors.foreground);
        body.style.setProperty("--theme-font", fontFamily);
        body.style.setProperty(
          "--theme-gradient",
          `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.background} 50%, ${theme.colors.primary}20 100%)`,
        );

        // Update main background gradient
        const mainElement = document.querySelector("main") as HTMLElement;
        if (mainElement) {
          mainElement.style.background = `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.background} 50%, ${theme.colors.primary}20 100%)`;
        }

        // Apply font family to body
        document.body.style.fontFamily = theme.font;

        // Update sidebar colors and elements
        const sidebar = document.querySelector("[data-sidebar]") as HTMLElement;
        if (sidebar) {
          // Update sidebar background
          sidebar.style.backgroundColor = theme.colors.background;

          // Update sidebar text colors
          const sidebarTexts = sidebar.querySelectorAll("h1, span, p");
          sidebarTexts.forEach((text) => {
            (text as HTMLElement).style.color = theme.colors.foreground;
          });

          // Update sidebar icons
          const sidebarIcons = sidebar.querySelectorAll("svg");
          sidebarIcons.forEach((icon) => {
            (icon as unknown as HTMLElement).style.color =
              theme.colors.foreground;
          });

          // Update active sidebar items
          const activeItems = sidebar.querySelectorAll(
            ".bg-orange-50, .text-orange-600, .text-orange-900",
          );
          activeItems.forEach((item) => {
            (item as HTMLElement).style.backgroundColor =
              theme.colors.primary + "20";
            (item as HTMLElement).style.color = theme.colors.primary;
            (item as HTMLElement).style.borderColor = theme.colors.primary;
          });
        }

        // Update theme-aware elements
        const themeElements = document.querySelectorAll(
          "[data-theme-aware='true']",
        );
        themeElements.forEach((element) => {
          const el = element as HTMLElement;

          // Check if it's a button, badge, or avatar fallback
          if (
            el.tagName === "BUTTON" ||
            el.classList.contains("badge") ||
            el.classList.contains("avatar-fallback") ||
            el.getAttribute("data-slot") === "badge"
          ) {
            el.style.backgroundColor = theme.colors.primary;
            el.style.color = theme.colors.background;
          } else {
            // For text elements, only change color, not background
            el.style.color = theme.colors.foreground;
          }
        });

        // Update hover-aware elements
        const hoverElements = document.querySelectorAll(
          "[data-hover-aware='true']",
        );
        hoverElements.forEach((element) => {
          const el = element as HTMLElement;

          // Add hover event listeners
          el.addEventListener("mouseenter", () => {
            el.style.backgroundColor = theme.colors.primary + "10";
          });

          el.addEventListener("mouseleave", () => {
            if (!el.getAttribute("data-theme-aware")) {
              el.style.backgroundColor = "";
            }
          });
        });

        // Update page headers
        const pageHeaders = document.querySelectorAll("h1, h2, h3");
        pageHeaders.forEach((header) => {
          if (header.classList.contains("text-gray-900")) {
            (header as HTMLElement).style.color = theme.colors.foreground;
          }
        });

        // Update all orange-colored elements
        const orangeElements = document.querySelectorAll(
          ".bg-orange-500, .text-orange-600, .text-orange-900, .border-orange-500",
        );
        orangeElements.forEach((element) => {
          (element as HTMLElement).style.backgroundColor =
            element.classList.contains("bg-orange-500")
              ? theme.colors.primary
              : "";
          (element as HTMLElement).style.color =
            element.classList.contains("text-orange-600") ||
            element.classList.contains("text-orange-900")
              ? theme.colors.primary
              : "";
          (element as HTMLElement).style.borderColor =
            element.classList.contains("border-orange-500")
              ? theme.colors.primary
              : "";
        });

        // Update all pink-colored elements
        const pinkElements = document.querySelectorAll(
          ".bg-pink-600, .text-pink-600, .border-pink-600, .bg-pink-500, .text-pink-500, .border-pink-500",
        );
        pinkElements.forEach((element) => {
          (element as HTMLElement).style.backgroundColor =
            element.classList.contains("bg-pink-600") ||
            element.classList.contains("bg-pink-500")
              ? theme.colors.primary
              : "";
          (element as HTMLElement).style.color =
            element.classList.contains("text-pink-600") ||
            element.classList.contains("text-pink-500")
              ? theme.colors.primary
              : "";
          (element as HTMLElement).style.borderColor =
            element.classList.contains("border-pink-600") ||
            element.classList.contains("border-pink-500")
              ? theme.colors.primary
              : "";
        });

        // Update rose elements
        const roseElements = document.querySelectorAll(
          ".bg-rose-500, .text-rose-500, .border-rose-500",
        );
        roseElements.forEach((element) => {
          (element as HTMLElement).style.backgroundColor =
            element.classList.contains("bg-rose-500")
              ? theme.colors.primary
              : "";
          (element as HTMLElement).style.color = element.classList.contains(
            "text-rose-500",
          )
            ? theme.colors.primary
            : "";
          (element as HTMLElement).style.borderColor =
            element.classList.contains("border-rose-500")
              ? theme.colors.primary
              : "";
        });

        // Update blue elements (for consistency)
        const blueElements = document.querySelectorAll(
          ".bg-blue-500, .text-blue-500, .border-blue-500, .bg-blue-600, .text-blue-600, .border-blue-600",
        );
        blueElements.forEach((element) => {
          (element as HTMLElement).style.backgroundColor =
            element.classList.contains("bg-blue-500") ||
            element.classList.contains("bg-blue-600")
              ? theme.colors.primary
              : "";
          (element as HTMLElement).style.color =
            element.classList.contains("text-blue-500") ||
            element.classList.contains("text-blue-600")
              ? theme.colors.primary
              : "";
          (element as HTMLElement).style.borderColor =
            element.classList.contains("border-blue-500") ||
            element.classList.contains("border-blue-600")
              ? theme.colors.primary
              : "";
        });

        // Update red elements
        const redElements = document.querySelectorAll(
          ".bg-red-500, .text-red-500, .border-red-500, .bg-red-600, .text-red-600, .border-red-600, .bg-red-700, .text-red-700, .border-red-700",
        );
        redElements.forEach((element) => {
          (element as HTMLElement).style.backgroundColor =
            element.classList.contains("bg-red-500") ||
            element.classList.contains("bg-red-600") ||
            element.classList.contains("bg-red-700")
              ? theme.colors.primary
              : "";
          (element as HTMLElement).style.color =
            element.classList.contains("text-red-500") ||
            element.classList.contains("text-red-600") ||
            element.classList.contains("text-red-700")
              ? theme.colors.primary
              : "";
          (element as HTMLElement).style.borderColor =
            element.classList.contains("border-red-500") ||
            element.classList.contains("border-red-600") ||
            element.classList.contains("border-red-700")
              ? theme.colors.primary
              : "";
        });

        // Update input focus states
        const inputs = document.querySelectorAll(
          "input[data-theme-aware='true'], textarea[data-theme-aware='true']",
        );
        inputs.forEach((input) => {
          const el = input as HTMLElement;
          // Add CSS custom properties for focus states only
          el.style.setProperty("--focus-border-color", theme.colors.primary);
          el.style.setProperty(
            "--focus-ring-color",
            theme.colors.primary + "50",
          );
          // Don't change background color
        });

        // Reapply theme periodically to catch any missed elements
        setTimeout(() => {
          if (org?.theme && "themeId" in org.theme) {
            const themeId = (org.theme as any).themeId;
            const theme = themes.find((t) => t.id === themeId);
            if (theme) {
              // Reapply the same theme logic here
              const root = document.documentElement;
              root.style.setProperty("--primary", theme.colors.primary);
              root.style.setProperty("--background", theme.colors.background);
              root.style.setProperty("--foreground", theme.colors.foreground);
              root.style.setProperty("--font-family", theme.font);
              root.style.setProperty(
                "--hover-primary",
                theme.colors.primary + "20",
              );
              root.style.setProperty("--hover-text", theme.colors.primary);
            }
          }
        }, 1000);
      }
    }
  }, [org]);

  return null; // This component doesn't render anything
}
