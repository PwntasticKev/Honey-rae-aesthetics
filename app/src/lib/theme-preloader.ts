// Theme preloader for server-side injection
// This ensures themes are applied before DOM paint to prevent flashing

export const themes = [
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

export function generateThemeCSS(themeId: string = "ocean", fontFamily: string = "Inter") {
  const theme = themes.find((t) => t.id === themeId) || themes.find((t) => t.id === "ocean")!;
  
  return `
    :root {
      --primary: ${theme.colors.primary};
      --primary-foreground: oklch(0.98 0.005 300);
      --background: ${theme.colors.background};
      --foreground: ${theme.colors.foreground};
      --font-family: ${fontFamily};
      --primary-light: ${theme.colors.primaryLight};
      --primary-dark: ${theme.colors.primaryDark};
      --secondary: ${theme.colors.primaryLight};
      --secondary-foreground: ${theme.colors.primaryDark};
      --sidebar: ${theme.colors.background};
      --sidebar-foreground: ${theme.colors.foreground};
      --sidebar-primary: ${theme.colors.primary};
      --sidebar-primary-foreground: oklch(0.98 0.005 300);
      --sidebar-accent: ${theme.colors.primaryLight};
      --sidebar-accent-foreground: ${theme.colors.primaryDark};
    }
    
    body {
      font-family: ${fontFamily};
      background-color: ${theme.colors.background};
      color: ${theme.colors.foreground};
    }
    
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
}

export function getThemePreloadScript() {
  return `
    (function() {
      // Apply ocean theme immediately to prevent flash
      const css = \`${generateThemeCSS("ocean", "Inter").replace(/`/g, '\\`')}\`;
      const style = document.createElement('style');
      style.id = 'theme-preload';
      style.textContent = css;
      document.head.appendChild(style);
    })();
  `;
}