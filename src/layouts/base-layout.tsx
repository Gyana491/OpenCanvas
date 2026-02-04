import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <main className="h-screen w-screen overflow-hidden bg-background">
          {children}
        </main>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
