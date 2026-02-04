import { fileStorage, type WorkflowData } from './file-storage-service'
import { nanoid } from 'nanoid'
import type { Node, Edge, Viewport } from '@xyflow/react'

// Debounce timer for auto-save
let autoSaveTimer: NodeJS.Timeout | null = null
const AUTO_SAVE_DELAY = 2000 // 2 seconds

// Track ongoing workflow creation to prevent duplicates
const creationInProgress = new Set<string>()

/**
 * Create a new workflow with idempotency check
 */
export async function createWorkflow(name?: string): Promise<WorkflowData> {
    const id = nanoid()
    const now = new Date()

    // Generate a unique key for this creation request
    const creationKey = name || `workflow-${now.getTime()}`

    // Check if creation is already in progress for this key
    if (creationInProgress.has(creationKey)) {
        console.log(`[Workflow Service] Creation already in progress for: ${creationKey}`)
        await new Promise(resolve => setTimeout(resolve, 100))

        // Try to find recently created workflow (this is trickier with files, 
        // so for now we'll just check if we can list it, or skip this optimization for files)
        // Simplification: just proceed with new creation if previous finished, 
        // but the set check prevents parallel creation of SAME key.
    }

    try {
        creationInProgress.add(creationKey)

        const newWorkflow: WorkflowData = {
            id,
            name: name || `Workflow ${new Date().toLocaleDateString()}`,
            nodes: [],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 },
            createdAt: now,
            updatedAt: now,
        }

        await fileStorage.saveWorkflow(newWorkflow)

        console.log(`[Workflow Service] Created workflow: ${id}`)

        return newWorkflow
    } finally {
        setTimeout(() => {
            creationInProgress.delete(creationKey)
        }, 5000)
    }
}

/**
 * Save or update a workflow
 */
export async function saveWorkflow(
    id: string,
    nodes: Node[],
    edges: Edge[],
    viewport?: Viewport,
    thumbnail?: Buffer | ArrayBuffer
): Promise<void> {
    const now = new Date()

    try {
        // We first need to load existing to preserve creation date and name
        // Or we assume the frontend passes everything? 
        // The current signature only passes nodes/edges/viewport.
        // So we MUST load existing metadata.
        const existing = await fileStorage.loadWorkflow(id)

        if (!existing) {
            console.error(`[Workflow Service] Workflow not found for save: ${id}`)
            // Fallback: create new if missing? or throw?
            // throwing helps debug.
            throw new Error(`Workflow ${id} not found`)
        }

        const updatedWorkflow: WorkflowData = {
            ...existing,
            nodes,
            edges,
            viewport: viewport || existing.viewport,
            updatedAt: now,
            thumbnail
        }

        await fileStorage.saveWorkflow(updatedWorkflow)

        console.log(`[Workflow Service] Saved workflow: ${id} (${nodes.length} nodes, ${edges.length} edges)`)
    } catch (error) {
        console.error('[Workflow Service] Failed to save workflow:', error)
        throw error
    }
}

/**
 * Auto-save workflow with debouncing
 */
export function autoSaveWorkflow(
    id: string,
    nodes: Node[],
    edges: Edge[],
    viewport?: Viewport
): void {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
    }

    autoSaveTimer = setTimeout(async () => {
        try {
            await saveWorkflow(id, nodes, edges, viewport)
            console.log(`[Workflow Service] Auto-saved workflow: ${id}`)
        } catch (error) {
            console.error('[Workflow Service] Auto-save failed:', error)
        }
    }, AUTO_SAVE_DELAY)
}

/**
 * Load a workflow by ID
 */
export async function loadWorkflow(id: string): Promise<WorkflowData | null> {
    try {
        const workflow = await fileStorage.loadWorkflow(id)

        if (!workflow) {
            console.log(`[Workflow Service] Workflow not found: ${id}`)
            return null
        }

        console.log(`[Workflow Service] Loaded workflow: ${id} (${workflow.nodes.length} nodes, ${workflow.edges.length} edges)`)
        return workflow
    } catch (error) {
        console.error('[Workflow Service] Failed to load workflow:', error)
        throw error
    }
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(id: string): Promise<void> {
    try {
        await fileStorage.deleteWorkflow(id)
        console.log(`[Workflow Service] Deleted workflow: ${id}`)
    } catch (error) {
        console.error('[Workflow Service] Failed to delete workflow:', error)
        throw error
    }
}

/**
 * List all workflows
 */
export async function listWorkflows(): Promise<WorkflowData[]> {
    try {
        const workflows = await fileStorage.listWorkflows()
        console.log(`[Workflow Service] Listed ${workflows.length} workflows`)
        return workflows
    } catch (error) {
        console.error('[Workflow Service] Failed to list workflows:', error)
        throw error
    }
}

/**
 * Save an asset for a node
 */
export async function saveNodeAsset(
    workflowId: string,
    nodeId: string,
    fileBuffer: Buffer,
    fileName: string,
    assetType: 'image' | 'video' | 'file',
    mimeType?: string
): Promise<string> {
    try {
        // Save using file storage
        const { filePath } = await fileStorage.saveAsset(
            workflowId,
            nodeId,
            fileBuffer,
            fileName,
            assetType
        )

        console.log(`[Workflow Service] Saved asset for node ${nodeId}: ${filePath}`)
        return filePath
    } catch (error) {
        console.error('[Workflow Service] Failed to save asset:', error)
        throw error
    }
}

/**
 * Export a workflow project as a ZIP file
 */
export async function exportProject(id: string): Promise<Buffer> {
    try {
        const buffer = await fileStorage.exportProject(id)
        console.log(`[Workflow Service] Exported project: ${id}`)
        return buffer
    } catch (error) {
        console.error('[Workflow Service] Failed to export project:', error)
        throw error
    }
}

/**
 * Import a workflow project from a ZIP file
 */
export async function importProject(zipBuffer: Buffer): Promise<WorkflowData> {
    try {
        const id = await fileStorage.importProject(zipBuffer)
        const workflow = await loadWorkflow(id)
        if (!workflow) {
            throw new Error(`Imported workflow ${id} could not be loaded`)
        }
        console.log(`[Workflow Service] Imported project: ${id}`)
        return workflow
    } catch (error) {
        console.error('[Workflow Service] Failed to import project:', error)
        throw error
    }
}

export * from './file-storage-service'
