"use client";

import { ConvexProvider } from "convex/react";
import { convex } from "@/lib/convex";

export function ConvexProviderWrapper({ children }: { children: React.ReactNode }) {
	return <ConvexProvider client={convex}>{children}</ConvexProvider>;
} 