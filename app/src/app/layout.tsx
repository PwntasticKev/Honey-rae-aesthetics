import type { Metadata } from "next";
import "./globals.css";
import { ConvexProviderWrapper } from "@/components/ConvexProvider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Honey Rae Aesthetics",
  description: "Complete aesthetics practice management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConvexProviderWrapper>
          {children}
          <Toaster />
        </ConvexProviderWrapper>
      </body>
    </html>
  );
}
