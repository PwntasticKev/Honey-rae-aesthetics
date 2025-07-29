"use client";

import { useEnvironment } from "@/contexts/EnvironmentContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

export function EnvironmentToggle() {
  const { environment, setEnvironment, isDevelopment, isProduction } =
    useEnvironment();

  const toggleEnvironment = () => {
    setEnvironment(isDevelopment ? "production" : "development");
  };

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={isDevelopment ? "secondary" : "default"}
        className="cursor-pointer"
        onClick={toggleEnvironment}
        data-testid="environment-toggle"
      >
        <Settings className="w-3 h-3 mr-1" />
        {environment.toUpperCase()}
      </Badge>
    </div>
  );
}
