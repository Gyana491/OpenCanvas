import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <main className="h-screen w-screen overflow-hidden bg-background">
        {children}
      </main>
      <Toaster />
    </TooltipProvider>
  );
}
