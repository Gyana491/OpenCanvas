
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

export function ExportDialog({ isOpen, onClose, workflowId, workflowName = 'workflow' }: ExportDialogProps) {
    const { getNodes, getEdges, getViewport } = useReactFlow()
    const [isExporting, setIsExporting] = React.useState(false)

    const handleExportJson = async () => {
        try {
            const nodes = getNodes()
            const edges = getEdges()
            const viewport = getViewport()

            const data = {
                id: workflowId,
                name: workflowName,
                nodes,
                edges,
                viewport,
                exportedAt: new Date().toISOString(),
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

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
            // First ensure the latest state is saved
            const nodes = getNodes()
            const edges = getEdges()
            const viewport = getViewport()

            // Save current state first to ensure zip is up to date
            await window.electron.saveWorkflow(workflowId, nodes, edges, viewport)

            // Request export
            const result = await window.electron.exportProject(workflowId)

            if (result.success && result.data) {
                // Create blob from buffer (Uint8Array)
                const blob = new Blob([result.data as any], { type: 'application/zip' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}.zip`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

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
                        onClick={handleExportZip}
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
                        onClick={handleExportJson}
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
