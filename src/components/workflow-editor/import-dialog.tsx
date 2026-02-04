
import React, { useRef, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileArchive, FileJson, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from '@tanstack/react-router'

interface ImportDialogProps {
    isOpen: boolean
    onClose: () => void
}

export function importWorkflowAction(
    file: File,
    navigate: (opts: any) => void,
    setNodes?: (nodes: any) => void,
    setEdges?: (edges: any) => void,
    setViewport?: (viewport: any) => void,
    beforeImport?: () => Promise<void>
) {
    return new Promise<void>(async (resolve, reject) => {
        try {
            if (!window.electron) throw new Error('Electron API not found')

            if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
                // Handle ZIP import
                const arrayBuffer = await file.arrayBuffer()
                // Convert ArrayBuffer to Buffer (Node.js buffer)
                // In electron renderer, we might need to be careful. 
                // The preload exposes it, and ipcRenderer.invoke handles the serialization.
                // Usually sending ArrayBuffer over IPC works fine.

                const result = await window.electron.importProject(arrayBuffer)

                if (result.success && result.data) {
                    const workflowData = result.data
                    toast.success('Project imported successfully')

                    // Save current workflow before navigating (if callback provided)
                    if (beforeImport) {
                        await beforeImport()
                    }

                    // Navigate to the imported workflow
                    navigate({ to: '/editor/$id', params: { id: workflowData.id } })
                    resolve()
                } else {
                    throw new Error(result.error || 'Import failed')
                }

            } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
                // Handle JSON import
                const text = await file.text()
                const data = JSON.parse(text)

                // Basic validation
                if (!data.nodes || !data.edges) {
                    throw new Error('Invalid workflow JSON')
                }

                // Sanitize nodes to remove broken asset URLs
                const sanitizedNodes = data.nodes.map((node: any) => {
                    const sanitizedData = { ...node.data }

                    // Delete asset-related keys entirely
                    delete sanitizedData.imageUrl
                    delete sanitizedData.imageOutput
                    delete sanitizedData.output
                    delete sanitizedData.videoUrl
                    delete sanitizedData.connectedImage
                    delete sanitizedData.connectedVideo
                    delete sanitizedData.assetPath

                    return {
                        ...node,
                        data: sanitizedData
                    }
                })

                // Create a new workflow for this import
                const createResult = await window.electron.createWorkflow(data.name || 'Imported Workflow')

                if (createResult.success && createResult.data) {
                    const newId = createResult.data.id

                    // Save the imported data to this new workflow
                    await window.electron.saveWorkflow(
                        newId,
                        sanitizedNodes,
                        data.edges,
                        data.viewport || { x: 0, y: 0, zoom: 1 }
                    )

                    toast.success('Workflow imported successfully')

                    // Save current workflow before navigating (if callback provided)
                    if (beforeImport) {
                        await beforeImport()
                    }

                    navigate({ to: '/editor/$id', params: { id: newId } })

                    // If we are already on the editor and just need to update state (optional, router usually handles this)
                    if (setNodes) setNodes(sanitizedNodes)
                    if (setEdges) setEdges(data.edges)
                    if (setViewport && data.viewport) setViewport(data.viewport)

                    resolve()
                } else {
                    throw new Error(createResult.error || 'Failed to create new workflow')
                }
            } else {
                throw new Error('Unsupported file type. Please upload a .json or .zip file.')
            }
        } catch (error) {
            console.error('Import error:', error)
            toast.error(error instanceof Error ? error.message : 'Import failed')
            reject(error)
        }
    })
}

export function ImportDialog({ isOpen, onClose }: ImportDialogProps) {
    const router = useRouter()
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // We can't access ReactFlow state here easily if we are navigating away, 
    // but for JSON import we might want to just set state if we are creating a new one.
    // Actually, navigating to the new ID is the best way to load it.

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            await importWorkflowAction(file, router.navigate)
            onClose()
        } catch (error) {
            // toast handled in logic
        } finally {
            setIsUploading(false)
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDrop = async (event: React.DragEvent) => {
        event.preventDefault()
        const file = event.dataTransfer.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            await importWorkflowAction(file, router.navigate)
            onClose()
        } catch (error) {
            // toast handled in logic
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Workflow</DialogTitle>
                    <DialogDescription>
                        Upload a .json workflow file or a .zip project archive.
                    </DialogDescription>
                </DialogHeader>

                <div
                    className={`
            border-2 border-dashed rounded-lg p-8 
            flex flex-col items-center justify-center text-center 
            transition-colors
            ${isUploading ? 'bg-muted opacity-50 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer border-muted-foreground/25 hover:border-primary/50'}
          `}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Importing...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex gap-4 mb-4">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <FileJson className="h-6 w-6 text-primary" />
                                </div>
                                <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <FileArchive className="h-6 w-6 text-amber-500" />
                                </div>
                            </div>
                            <h3 className="text-sm font-semibold mb-1">Click to upload or drag and drop</h3>
                            <p className="text-xs text-muted-foreground max-w-[200px]">
                                Supports .json (Workflow only) or .zip (Project with assets)
                            </p>
                        </>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json,.zip,application/json,application/zip,application/x-zip-compressed"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                </div>

                <div className="flex justify-end">
                    <Button variant="ghost" onClick={onClose} disabled={isUploading}>
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
