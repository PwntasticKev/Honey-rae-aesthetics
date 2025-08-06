export const themes = [
  {
    id: "default",
    name: "Default",
    description: "Clean and professional",
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
    name: "Ocean Blue",
    description: "Calming blue tones",
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
    name: "Sunset Orange",
    description: "Warm and inviting",
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
    name: "Forest Green",
    description: "Natural and organic",
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
    name: "Royal Purple",
    description: "Elegant and sophisticated",
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
    name: "Rose Pink",
    description: "Feminine and elegant",
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

export const fonts = [
  { id: "inter", name: "Inter", value: "Inter" },
  { id: "pp-mori", name: "PP Mori", value: "PP Mori, sans-serif" },
  { id: "system", name: "System", value: "system-ui, sans-serif" },
  { id: "georgia", name: "Georgia", value: "Georgia, serif" },
  { id: "arial", name: "Arial", value: "Arial, sans-serif" },
];

export function applyTheme(themeId: string, fontId: string = "inter") {
  const theme = themes.find((t) => t.id === themeId);
  const font = fonts.find((f) => f.id === fontId);
  
  if (!theme || !font) return;

  const root = document.documentElement;
  
  // Update CSS custom properties
  root.style.setProperty("--primary", theme.colors.primary);
  root.style.setProperty("--primary-foreground", "oklch(0.98 0.005 300)");
  root.style.setProperty("--background", theme.colors.background);
  root.style.setProperty("--foreground", theme.colors.foreground);
  root.style.setProperty("--font-family", font.value);
  
  // Computed colors
  root.style.setProperty("--primary-light", theme.colors.primaryLight);
  root.style.setProperty("--primary-dark", theme.colors.primaryDark);
  
  // Secondary colors
  root.style.setProperty("--secondary", theme.colors.primaryLight);
  root.style.setProperty("--secondary-foreground", theme.colors.primaryDark);
  
  // Update body font
  document.body.style.fontFamily = font.value;
}

export function getThemeById(themeId: string) {
  return themes.find((t) => t.id === themeId) || themes[0];
}

export function getFontById(fontId: string) {
  return fonts.find((f) => f.id === fontId) || fonts[0];
}