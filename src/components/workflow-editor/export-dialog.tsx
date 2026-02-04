
import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileJson, Package, Download } from "lucide-react"
import { toast } from "sonner"
import { useReactFlow } from '@xyflow/react'

interface ExportDialogProps {
    isOpen: boolean
    onClose: () => void
    workflowId: string | null
    workflowName?: string
}

interface BaseExportDialogProps {
    isOpen: boolean
    onClose: () => void
    onExportZip: () => void
    onExportJson: () => void
    isExporting: boolean
}

function BaseExportDialog({ isOpen, onClose, onExportZip, onExportJson, isExporting }: BaseExportDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Workflow</DialogTitle>
                    <DialogDescription>
                        Choose how you want to export your workflow.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 py-4">
                    <Card
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/50"
                        onClick={onExportZip}
                    >
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Package className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-base">Export with Assets</CardTitle>
                                <CardDescription>
                                    Download as a ZIP file including all images and videos.
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/50"
                        onClick={onExportJson}
                    >
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <FileJson className="h-6 w-6 text-foreground" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-base">Workflow Only</CardTitle>
                                <CardDescription>
                                    Download the JSON structure only. (No assets included)
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button variant="secondary" onClick={onClose} disabled={isExporting}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function ExportDialog({ isOpen, onClose, workflowId, workflowName = 'workflow' }: ExportDialogProps) {
    const { getNodes, getEdges, getViewport } = useReactFlow()
    const [isExporting, setIsExporting] = React.useState(false)

    const handleExportJson = async () => {
        try {
            const rawNodes = getNodes()
            const edges = getEdges()
            const viewport = getViewport()

            // Sanitize nodes to remove asset URLs (opencanvas:// references)
            const nodes = rawNodes.map(node => {
                const sanitizedData = { ...node.data }
                // Delete asset-related keys entirely
                delete sanitizedData.imageUrl
                delete sanitizedData.imageOutput
                delete sanitizedData.output
                delete sanitizedData.videoUrl
                delete sanitizedData.connectedImage
                delete sanitizedData.connectedVideo
                delete sanitizedData.assetPath
                return { ...node, data: sanitizedData }
            })

            const data = {
                id: workflowId,
                name: workflowName,
                nodes,
                edges,
                viewport,
                exportedAt: new Date().toISOString(),
            }

            downloadJson(data, `opencanvas_workflow_${workflowId || 'unknown'}.json`)
            toast.success('Workflow JSON exported successfully')
            onClose()
        } catch (error) {
            console.error('Failed to export JSON:', error)
            toast.error('Failed to export workflow JSON')
        }
    }

    const handleExportZip = async () => {
        if (!workflowId || !window.electron) return
        setIsExporting(true)
        try {
            const rawNodes = getNodes()
            const edges = getEdges()
            const viewport = getViewport()
            const nodes = sanitizeNodesForSave(rawNodes)

            await window.electron.saveWorkflow(workflowId, nodes, edges, viewport)
            const result = await window.electron.exportProject(workflowId)

            if (result.success && result.data) {
                downloadZip(result.data, `opencanvas_${workflowId}.zip`)
                toast.success('Project exported successfully')
                onClose()
            } else {
                throw new Error(result.error || 'Export failed')
            }
        } catch (error) {
            console.error('Failed to export project:', error)
            toast.error('Failed to export project')
        } finally {
            setIsExporting(false)
        }
    }

    return <BaseExportDialog isOpen={isOpen} onClose={onClose} onExportZip={handleExportZip} onExportJson={handleExportJson} isExporting={isExporting} />
}

export function DashboardExportDialog({ isOpen, onClose, workflowId, workflowName = 'workflow' }: ExportDialogProps) {
    const [isExporting, setIsExporting] = React.useState(false)

    const handleExportJson = async () => {
        if (!workflowId || !window.electron) return
        try {
            const result = await window.electron.loadWorkflow(workflowId)
            if (!result.success || !result.data) throw new Error(result.error)

            const workflow = result.data
            const rawNodes = workflow.nodes

            // Sanitize nodes logic (duplicated from above, could be shared)
            const nodes = rawNodes.map((node: any) => {
                const sanitizedData = { ...node.data }
                delete sanitizedData.imageUrl
                delete sanitizedData.imageOutput
                delete sanitizedData.output
                delete sanitizedData.videoUrl
                delete sanitizedData.connectedImage
                delete sanitizedData.connectedVideo
                delete sanitizedData.assetPath
                return { ...node, data: sanitizedData }
            })

            const data = {
                id: workflow.id,
                name: workflow.name,
                nodes,
                edges: workflow.edges,
                viewport: workflow.viewport,
                exportedAt: new Date().toISOString(),
            }

            downloadJson(data, `opencanvas_workflow_${workflowId}.json`)
            toast.success('Workflow JSON exported successfully')
            onClose()
        } catch (error) {
            console.error('Failed to export JSON:', error)
            toast.error('Failed to export workflow JSON')
        }
    }

    const handleExportZip = async () => {
        if (!workflowId || !window.electron) return
        setIsExporting(true)
        try {
            const result = await window.electron.exportProject(workflowId)
            if (result.success && result.data) {
                downloadZip(result.data, `opencanvas_${workflowName.replace(/\s+/g, '_')}.zip`)
                toast.success('Project exported successfully')
                onClose()
            } else {
                throw new Error(result.error || 'Export failed')
            }
        } catch (error) {
            console.error('Failed to export project:', error)
            toast.error('Failed to export project')
        } finally {
            setIsExporting(false)
        }
    }

    return <BaseExportDialog isOpen={isOpen} onClose={onClose} onExportZip={handleExportZip} onExportJson={handleExportJson} isExporting={isExporting} />
}

// Helpers
function sanitizeNodesForSave(rawNodes: any[]) {
    return rawNodes.map(node => {
        const { data, ...rest } = node
        const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
            if (typeof value !== 'function') {
                acc[key] = value
            }
            return acc
        }, {} as Record<string, any>)
        return { ...rest, data: cleanData }
    })
}

function downloadJson(data: any, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

function downloadZip(data: Uint8Array, filename: string) {
    const blob = new Blob([data as any], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
