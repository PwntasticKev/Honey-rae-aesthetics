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
import { themes, fonts, applyTheme } from "@/lib/theme-utils";

export function ThemeSelector() {
  const { user } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [selectedFont, setSelectedFont] = useState("inter");

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
    if (org?.theme && "themeId" in org.theme) {
      const themeId = (org.theme as any).themeId;
      const savedFontFamily = (org.theme as any).fontFamily;

      console.log("🎨 Loading saved theme:", {
        themeId,
        savedFontFamily,
        orgTheme: org.theme,
      });

      // Find the font ID based on the saved font family
      let fontId = "inter"; // default
      if (savedFontFamily) {
        const savedFont = fonts.find((f) => f.value === savedFontFamily);
        if (savedFont) {
          fontId = savedFont.id;
          setSelectedFont(fontId);
          console.log("🎨 Found saved font:", { savedFontFamily, fontId });
        } else {
          console.log(
            "⚠️ Saved font not found in fonts array:",
            savedFontFamily,
          );
        }
      } else {
        console.log("⚠️ No saved font family found, using default");
      }

      setSelectedTheme(themeId);
      applyTheme(themeId, fontId);
    }
  }, [org]);

  const handleThemeSelect = async (themeId: string) => {
    setSelectedTheme(themeId);
    applyTheme(themeId, selectedFont);

    // Save to database immediately
    if (userData?.orgId) {
      const selectedFontData = fonts.find((f) => f.id === selectedFont);
      await updateTheme({
        orgId: userData.orgId as any,
        theme: {
          themeId,
          fontFamily: selectedFontData?.value || "Inter",
          appliedAt: Date.now(),
        },
      });
    }
  };

  const handleFontSelect = async (fontId: string) => {
    console.log("🎨 Font selected:", fontId);
    setSelectedFont(fontId);
    applyTheme(selectedTheme, fontId);

    // Save to database immediately
    if (userData?.orgId) {
      const selectedFontData = fonts.find((f) => f.id === fontId);
      const fontFamily = selectedFontData?.value || "Inter";
      console.log("💾 Saving font to database:", {
        fontId,
        fontFamily,
        orgId: userData.orgId,
      });

      await updateTheme({
        orgId: userData.orgId as any,
        theme: {
          themeId: selectedTheme,
          fontFamily,
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
          Choose a theme and font to customize your experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Color Themes</h3>
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
                  {/* Live Preview */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{
                          backgroundColor: theme.colors.primary,
                        }}
                      />
                      <span className="text-xs">Primary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{
                          backgroundColor: theme.colors.background,
                        }}
                      />
                      <span className="text-xs">Background</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{
                          backgroundColor: theme.colors.foreground,
                        }}
                      />
                      <span className="text-xs">Text</span>
                    </div>
                  </div>
                  {/* Button Preview */}
                  <Button
                    size="sm"
                    className="w-full"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.background,
                    }}
                  >
                    Sample Button
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Font Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Font Family</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fonts.map((font) => (
              <Card
                key={font.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedFont === font.id
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => handleFontSelect(font.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{font.name}</h3>
                    {selectedFont === font.id && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  {/* Font Preview */}
                  <div className="text-sm" style={{ fontFamily: font.value }}>
                    The quick brown fox jumps over the lazy dog
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
