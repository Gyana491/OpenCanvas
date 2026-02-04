import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { useRouter } from "@tanstack/react-router";
import { importWorkflowAction } from "@/components/workflow-editor/import-dialog";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleGlobalDrop = async (e: React.DragEvent) => {
    // Check if files were dropped
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.json') || file.name.endsWith('.zip')) {
        e.preventDefault();
        e.stopPropagation();
        try {
          // Create beforeImport callback to save current workflow if in editor
          const beforeImport = async () => {
            const currentPath = window.location.pathname;
            // Check if we're in the editor route (e.g., /editor/{id})
            const editorMatch = currentPath.match(/^\/editor\/([^\/]+)$/);

            if (editorMatch && window.electron) {
              const workflowId = editorMatch[1];
              try {
                // Trigger save via custom event that the editor can listen to
                const saveEvent = new CustomEvent('save-before-import', {
                  detail: { workflowId }
                });
                window.dispatchEvent(saveEvent);

                // Give the editor a moment to save
                await new Promise(resolve => setTimeout(resolve, 500));
                console.log('[BaseLayout] Triggered save before import for workflow:', workflowId);
              } catch (error) {
                console.error('[BaseLayout] Failed to save before import:', error);
              }
            }
          };

          await importWorkflowAction(file, router.navigate, undefined, undefined, undefined, beforeImport);
        } catch (err) {
          console.error('Global import failed:', err);
        }
      }
    }
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    // We only want to preventDefault if it's a file drop we can handle
    // but typically for global drop we just prevent default to allow drop
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <main
          className="h-screen w-screen overflow-hidden bg-background"
          onDrop={handleGlobalDrop}
          onDragOver={handleGlobalDragOver}
        >
          {children}
        </main>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
