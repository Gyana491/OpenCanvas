import { ipcMain } from 'electron'
import {
    createWorkflow,
    saveWorkflow,
    loadWorkflow,
    deleteWorkflow,
    listWorkflows,
    saveNodeAsset,
} from '../services/workflow-service'
import type { Node, Edge, Viewport } from '@xyflow/react'

/**
 * Register all workflow-related IPC handlers
 */
export function registerWorkflowHandlers() {
    // Create a new workflow
    ipcMain.handle('workflow:create', async (_event, name?: string) => {
        try {
            const workflow = await createWorkflow(name)
            return { success: true, data: workflow }
        } catch (error) {
            console.error('[IPC] workflow:create error:', error)
            return { success: false, error: (error as Error).message }
        }
    })

    // Save workflow state
    ipcMain.handle(
        'workflow:save',
        async (_event, id: string, nodes: Node[], edges: Edge[], viewport?: Viewport) => {
            try {
                await saveWorkflow(id, nodes, edges, viewport)
                return { success: true }
            } catch (error) {
                console.error('[IPC] workflow:save error:', error)
                return { success: false, error: (error as Error).message }
            }
        }
    )

    // Load workflow by ID
    ipcMain.handle('workflow:load', async (_event, id: string) => {
        try {
            const workflow = await loadWorkflow(id)
            if (!workflow) {
                return { success: false, error: 'Workflow not found' }
            }
            return { success: true, data: workflow }
        } catch (error) {
            console.error('[IPC] workflow:load error:', error)
            return { success: false, error: (error as Error).message }
        }
    })

    // Delete workflow
    ipcMain.handle('workflow:delete', async (_event, id: string) => {
        try {
            await deleteWorkflow(id)
            return { success: true }
        } catch (error) {
            console.error('[IPC] workflow:delete error:', error)
            return { success: false, error: (error as Error).message }
        }
    })

    // List all workflows
    ipcMain.handle('workflow:list', async () => {
        try {
            const workflows = await listWorkflows()
            return { success: true, data: workflows }
        } catch (error) {
            console.error('[IPC] workflow:list error:', error)
            return { success: false, error: (error as Error).message }
        }
    })

    // Save asset (image/video file)
    ipcMain.handle(
        'workflow:save-asset',
        async (
            _event,
            workflowId: string,
            nodeId: string,
            fileBuffer: Buffer,
            fileName: string,
            assetType: 'image' | 'video' | 'file',
            mimeType?: string
        ) => {
            try {
                const filePath = await saveNodeAsset(
                    workflowId,
                    nodeId,
                    fileBuffer,
                    fileName,
                    assetType,
                    mimeType
                )
                return { success: true, data: { filePath } }
            } catch (error) {
                console.error('[IPC] workflow:save-asset error:', error)
                return { success: false, error: (error as Error).message }
            }
        }
    )

    console.log('[IPC] Workflow handlers registered')
}
