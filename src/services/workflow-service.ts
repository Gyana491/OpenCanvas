import { getDatabase } from '../db/db'
import { workflows, workflowNodes, workflowEdges, workflowAssets } from '../db/schema'
import type { NewWorkflow, NewWorkflowNode, NewWorkflowEdge, NewWorkflowAsset } from '../db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { Node, Edge, Viewport } from '@xyflow/react'

// Debounce timer for auto-save
let autoSaveTimer: NodeJS.Timeout | null = null
const AUTO_SAVE_DELAY = 2000 // 2 seconds

/**
 * Workflow data structure for loading
 */
export interface WorkflowData {
    id: string
    name: string
    nodes: Node[]
    edges: Edge[]
    viewport: Viewport
    createdAt: Date
    updatedAt: Date
}

// Track ongoing workflow creation to prevent duplicates
const creationInProgress = new Set<string>()

/**
 * Create a new workflow with idempotency check
 */
export async function createWorkflow(name?: string): Promise<WorkflowData> {
    const db = getDatabase()
    const id = nanoid()
    const now = new Date()
    
    // Generate a unique key for this creation request
    const creationKey = name || `workflow-${now.getTime()}`
    
    // Check if creation is already in progress for this key
    if (creationInProgress.has(creationKey)) {
        console.log(`[Workflow Service] Creation already in progress for: ${creationKey}`)
        // Wait a bit and try to find the existing workflow
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Try to find recently created workflow with same name
        const existingWorkflows = await db
            .select()
            .from(workflows)
            .where(eq(workflows.name, name || `Workflow ${new Date().toLocaleDateString()}`))
            .orderBy(workflows.createdAt)
            .limit(1)
            
        if (existingWorkflows.length > 0) {
            const existing = existingWorkflows[0]
            console.log(`[Workflow Service] Returning existing workflow: ${existing.id}`)
            return {
                id: existing.id,
                name: existing.name,
                nodes: [],
                edges: [],
                viewport: existing.viewport ? JSON.parse(existing.viewport) : { x: 0, y: 0, zoom: 1 },
                createdAt: new Date(existing.createdAt),
                updatedAt: new Date(existing.updatedAt),
            }
        }
    }
    
    try {
        creationInProgress.add(creationKey)

        const newWorkflow: NewWorkflow = {
            id,
            name: name || `Workflow ${new Date().toLocaleDateString()}`,
            createdAt: now,
            updatedAt: now,
            viewport: JSON.stringify({ x: 0, y: 0, zoom: 1 }),
        }

        await db.insert(workflows).values(newWorkflow)

        console.log(`[Workflow Service] Created workflow: ${id}`)

        return {
            id,
            name: newWorkflow.name,
            nodes: [],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 },
            createdAt: now,
            updatedAt: now,
        }
    } finally {
        // Clean up tracking after a delay
        setTimeout(() => {
            creationInProgress.delete(creationKey)
        }, 5000) // 5 second cleanup delay
    }
}

/**
 * Save or update a workflow with its nodes and edges using transaction
 */
export async function saveWorkflow(
    id: string,
    nodes: Node[],
    edges: Edge[],
    viewport?: Viewport
): Promise<void> {
    const db = getDatabase()
    const now = new Date()

    try {
        // Use transaction for atomic operations
        await db.transaction(async (tx) => {
            // Update workflow metadata
            await tx
                .update(workflows)
                .set({
                    updatedAt: now,
                    viewport: viewport ? JSON.stringify(viewport) : undefined,
                })
                .where(eq(workflows.id, id))

            // Delete existing nodes and edges (cascade will handle cleanup)
            await tx.delete(workflowNodes).where(eq(workflowNodes.workflowId, id))
            await tx.delete(workflowEdges).where(eq(workflowEdges.workflowId, id))

            // Insert new nodes
            if (nodes.length > 0) {
                const nodeRows: NewWorkflowNode[] = nodes.map((node) => ({
                    id: node.id,
                    workflowId: id,
                    type: node.type || 'default',
                    position: JSON.stringify(node.position),
                    data: JSON.stringify(node.data),
                    createdAt: now,
                }))

                await tx.insert(workflowNodes).values(nodeRows)
            }

            // Insert new edges
            if (edges.length > 0) {
                const edgeRows: NewWorkflowEdge[] = edges.map((edge) => ({
                    id: edge.id,
                    workflowId: id,
                    source: edge.source,
                    target: edge.target,
                    sourceHandle: edge.sourceHandle || null,
                    targetHandle: edge.targetHandle || null,
                    animated: edge.animated ?? true,
                    style: edge.style ? JSON.stringify(edge.style) : null,
                    createdAt: now,
                }))

                await tx.insert(workflowEdges).values(edgeRows)
            }
        })

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
    // Clear existing timer
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
    }

    // Set new timer
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
    const db = getDatabase()

    try {
        // Load workflow metadata
        const workflowRows = await db.select().from(workflows).where(eq(workflows.id, id))

        if (workflowRows.length === 0) {
            console.log(`[Workflow Service] Workflow not found: ${id}`)
            return null
        }

        const workflow = workflowRows[0]

        // Load nodes
        const nodeRows = await db.select().from(workflowNodes).where(eq(workflowNodes.workflowId, id))

        const nodes: Node[] = nodeRows.map((row) => ({
            id: row.id,
            type: row.type,
            position: JSON.parse(row.position),
            data: JSON.parse(row.data),
        }))

        // Load edges
        const edgeRows = await db.select().from(workflowEdges).where(eq(workflowEdges.workflowId, id))

        const edges: Edge[] = edgeRows.map((row) => ({
            id: row.id,
            source: row.source,
            target: row.target,
            sourceHandle: row.sourceHandle || undefined,
            targetHandle: row.targetHandle || undefined,
            animated: row.animated ?? true,
            style: row.style ? JSON.parse(row.style) : undefined,
        }))

        // Parse viewport
        const viewport: Viewport = workflow.viewport
            ? JSON.parse(workflow.viewport)
            : { x: 0, y: 0, zoom: 1 }

        console.log(`[Workflow Service] Loaded workflow: ${id} (${nodes.length} nodes, ${edges.length} edges)`)

        return {
            id: workflow.id,
            name: workflow.name,
            nodes,
            edges,
            viewport,
            createdAt: new Date(workflow.createdAt),
            updatedAt: new Date(workflow.updatedAt),
        }
    } catch (error) {
        console.error('[Workflow Service] Failed to load workflow:', error)
        throw error
    }
}

/**
 * Delete a workflow and all its associated data
 */
export async function deleteWorkflow(id: string): Promise<void> {
    const db = getDatabase()

    try {
        // Delete workflow (cascade will handle nodes, edges, assets)
        await db.delete(workflows).where(eq(workflows.id, id))

        // Delete associated media files
        const { deleteWorkflowAssets } = await import('../db/storage')
        await deleteWorkflowAssets(id)

        console.log(`[Workflow Service] Deleted workflow: ${id}`)
    } catch (error) {
        console.error('[Workflow Service] Failed to delete workflow:', error)
        throw error
    }
}

/**
 * List all workflows, sorted by most recently updated
 */
export async function listWorkflows(): Promise<WorkflowData[]> {
    const db = getDatabase()

    try {
        const workflowRows = await db
            .select()
            .from(workflows)
            .orderBy(workflows.updatedAt)

        const workflowList: WorkflowData[] = workflowRows.map((row) => ({
            id: row.id,
            name: row.name,
            nodes: [], // Don't load full node data for list view
            edges: [],
            viewport: row.viewport ? JSON.parse(row.viewport) : { x: 0, y: 0, zoom: 1 },
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        }))

        console.log(`[Workflow Service] Listed ${workflowList.length} workflows`)

        return workflowList.reverse() // Most recent first
    } catch (error) {
        console.error('[Workflow Service] Failed to list workflows:', error)
        throw error
    }
}

/**
 * Check if a workflow exists
 */
export async function workflowExists(id: string): Promise<boolean> {
    const db = getDatabase()

    try {
        const result = await db.select().from(workflows).where(eq(workflows.id, id))
        return result.length > 0
    } catch (error) {
        console.error('[Workflow Service] Failed to check workflow existence:', error)
        return false
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
    const db = getDatabase()
    const { saveAsset, getAssetSize } = await import('../db/storage')

    try {
        // Save file to disk
        const { assetId, filePath } = await saveAsset(workflowId, nodeId, fileBuffer, fileName, assetType)

        // Get file size
        const fileSize = await getAssetSize(filePath)

        // Save asset metadata to database
        const newAsset: NewWorkflowAsset = {
            id: assetId,
            workflowId,
            nodeId,
            type: assetType,
            fileName,
            filePath,
            mimeType: mimeType || null,
            fileSize,
            createdAt: new Date(),
        }

        await db.insert(workflowAssets).values(newAsset)

        console.log(`[Workflow Service] Saved asset: ${assetId} for node: ${nodeId}`)

        return filePath
    } catch (error) {
        console.error('[Workflow Service] Failed to save asset:', error)
        throw error
    }
}
