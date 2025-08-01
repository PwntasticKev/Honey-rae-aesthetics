"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Palette } from "lucide-react";

const themes = [
  {
    id: "default",
    name: "Default",
    description: "Clean and professional",
    colors: {
      primary: "hsl(var(--primary))",
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
    },
    font: "Inter",
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    description: "Calming blue tones",
    colors: {
      primary: "hsl(210, 100%, 50%)",
      background: "hsl(210, 40%, 98%)",
      foreground: "hsl(210, 10%, 10%)",
    },
    font: "Inter",
  },
  {
    id: "sunset",
    name: "Sunset Orange",
    description: "Warm and inviting",
    colors: {
      primary: "hsl(25, 95%, 53%)",
      background: "hsl(25, 40%, 98%)",
      foreground: "hsl(25, 10%, 10%)",
    },
    font: "Inter",
  },
  {
    id: "forest",
    name: "Forest Green",
    description: "Natural and organic",
    colors: {
      primary: "hsl(142, 76%, 36%)",
      background: "hsl(142, 40%, 98%)",
      foreground: "hsl(142, 10%, 10%)",
    },
    font: "Inter",
  },
  {
    id: "royal",
    name: "Royal Purple",
    description: "Elegant and sophisticated",
    colors: {
      primary: "hsl(262, 83%, 58%)",
      background: "hsl(262, 40%, 98%)",
      foreground: "hsl(262, 10%, 10%)",
    },
    font: "Inter",
  },
];

export function ThemeSelector() {
  const { user } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState("default");

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

  // Update theme mutation
  const updateTheme = useMutation(api.orgs.updateTheme);

  // Load saved theme on mount
  useEffect(() => {
    if (org?.theme?.themeId) {
      setSelectedTheme(org.theme.themeId);
      applyTheme(org.theme.themeId);
    }
  }, [org]);

  const applyTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (!theme) return;

    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty("--primary", theme.colors.primary);
    root.style.setProperty("--background", theme.colors.background);
    root.style.setProperty("--foreground", theme.colors.foreground);
    root.style.setProperty("--font-family", theme.font);
  };

  const handleThemeSelect = async (themeId: string) => {
    setSelectedTheme(themeId);
    applyTheme(themeId);

    // Save to database
    if (userData?.orgId) {
      await updateTheme({
        orgId: userData.orgId as any,
        theme: {
          themeId,
          appliedAt: Date.now(),
        },
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Settings
        </CardTitle>
        <CardDescription>
          Choose a theme to customize your experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <Card
              key={theme.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTheme === theme.id
                  ? "ring-2 ring-primary border-primary"
                  : "hover:border-primary/50"
              }`}
              onClick={() => handleThemeSelect(theme.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{theme.name}</h3>
                  {selectedTheme === theme.id && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {theme.description}
                </p>
                <div className="flex gap-2">
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: theme.colors.background }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: theme.colors.foreground }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
