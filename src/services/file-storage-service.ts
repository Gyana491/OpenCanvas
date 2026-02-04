import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { nanoid } from 'nanoid'
import type { Node, Edge, Viewport } from '@xyflow/react'
import JSZip from 'jszip'

export interface WorkflowData {
    id: string
    name: string
    nodes: Node[]
    edges: Edge[]
    viewport: Viewport
    thumbnail?: Buffer | ArrayBuffer
    createdAt: Date
    updatedAt: Date
}

export interface WorkflowFileSchema {
    id: string
    name: string
    nodes: Node[]
    edges: Edge[]
    viewport: Viewport
    createdAt: string
    updatedAt: string
}

const HOME_DIR = os.homedir()
const STORAGE_ROOT = path.join(HOME_DIR, '.opencanvas')

// Initialize storage directory
export function initStorage() {
    fs.ensureDirSync(STORAGE_ROOT)
    console.log(`[FileStorage] Initialized at: ${STORAGE_ROOT}`)
}

export class FileStorageService {
    // Helper to get workflow directory path
    private getWorkflowDir(workflowId: string): string {
        return path.join(STORAGE_ROOT, `opencanvas_${workflowId}`)
    }

    // Helper to get workflow.json path
    private getWorkflowJsonPath(workflowId: string): string {
        return path.join(this.getWorkflowDir(workflowId), `opencanvas_workflow_${workflowId}.json`)
    }

    // Helper to get legacy workflow.json path
    private getLegacyWorkflowJsonPath(workflowId: string): string {
        return path.join(this.getWorkflowDir(workflowId), 'workflow.json')
    }

    // Helper to get assets directory path
    private getAssetsDir(workflowId: string): string {
        return path.join(this.getWorkflowDir(workflowId), 'assets')
    }

    /**
     * Save a workflow to disk
     */
    async saveWorkflow(data: WorkflowData): Promise<void> {
        const workflowDir = this.getWorkflowDir(data.id)
        const assetsDir = this.getAssetsDir(data.id)

        // Ensure directories exist
        await fs.ensureDir(workflowDir)
        await fs.ensureDir(assetsDir)

        const fileData: WorkflowFileSchema = {
            id: data.id,
            name: data.name,
            nodes: data.nodes,
            edges: data.edges,
            viewport: data.viewport,
            createdAt: data.createdAt.toISOString(),
            updatedAt: data.updatedAt.toISOString(),
        }

        await fs.writeJson(this.getWorkflowJsonPath(data.id), fileData, { spaces: 2 })

        // Remove legacy file if exists
        const legacyPath = this.getLegacyWorkflowJsonPath(data.id)
        if (await fs.pathExists(legacyPath)) {
            await fs.remove(legacyPath)
        }

        // Save thumbnail if present
        if (data.thumbnail) {
            const thumbnailPath = path.join(workflowDir, `opencanvas_thumbnail_${data.id}.png`)
            // Ensure buffer
            const buffer = Buffer.from(data.thumbnail as any)
            await fs.writeFile(thumbnailPath, buffer)
            console.log(`[FileStorage] Saved thumbnail: ${thumbnailPath}`)
        }

        console.log(`[FileStorage] Saved workflow: ${data.id}`)
    }

    /**
     * Load a workflow from disk
     */
    async loadWorkflow(id: string): Promise<WorkflowData | null> {
        let filePath = this.getWorkflowJsonPath(id)

        // Check for new naming first, then legacy
        if (!await fs.pathExists(filePath)) {
            const legacyPath = this.getLegacyWorkflowJsonPath(id)
            if (await fs.pathExists(legacyPath)) {
                filePath = legacyPath
            } else {
                return null
            }
        }

        try {
            const fileData: WorkflowFileSchema = await fs.readJson(filePath)
            return {
                ...fileData,
                createdAt: new Date(fileData.createdAt),
                updatedAt: new Date(fileData.updatedAt),
            }
        } catch (error) {
            console.error(`[FileStorage] Failed to load workflow ${id}:`, error)
            return null
        }
    }

    /**
     * List all workflows
     */
    async listWorkflows(): Promise<WorkflowData[]> {
        await fs.ensureDir(STORAGE_ROOT)
        const entries = await fs.readdir(STORAGE_ROOT, { withFileTypes: true })

        const workflows: WorkflowData[] = []

        for (const entry of entries) {
            if (entry.isDirectory() && entry.name.startsWith('opencanvas_')) {
                const id = entry.name.replace('opencanvas_', '')
                const workflow = await this.loadWorkflow(id)
                if (workflow) {
                    workflows.push(workflow)
                }
            }
        }

        // Sort by updatedAt desc
        return workflows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    }

    /**
     * Delete a workflow
     */
    async deleteWorkflow(id: string): Promise<void> {
        const workflowDir = this.getWorkflowDir(id)
        if (await fs.pathExists(workflowDir)) {
            await fs.remove(workflowDir)
            console.log(`[FileStorage] Deleted workflow: ${id}`)
        }
    }

    /**
     * Save an asset file
     */
    async saveAsset(
        workflowId: string,
        nodeId: string,
        buffer: Buffer,
        fileName: string,
        assetType: 'image' | 'video' | 'file'
    ): Promise<{ assetId: string, filePath: string }> {
        const assetId = nanoid()
        const assetsDir = this.getAssetsDir(workflowId)
        await fs.ensureDir(assetsDir)

        const ext = path.extname(fileName)
        const safeFileName = `${nodeId}_${assetId}${ext}`
        const filePath = path.join(assetsDir, safeFileName)

        await fs.writeFile(filePath, buffer)

        // Return relative path to be stored in the node data
        // We'll store it as 'assets/filename' so it's relative to the workflow root
        const relativePath = `assets/${safeFileName}`
        return { assetId, filePath: relativePath }
    }

    /**
     * Get absolute path for an asset
     */
    getAssetPath(workflowId: string, relativePath: string): string {
        return path.join(this.getWorkflowDir(workflowId), relativePath)
    }

    /**
     * Export a workflow as a ZIP buffer
     */
    async exportProject(id: string): Promise<Buffer> {
        const workflowDir = this.getWorkflowDir(id)
        if (!await fs.pathExists(workflowDir)) {
            throw new Error(`Workflow ${id} not found`)
        }

        const zip = new JSZip()

        // Read all files recursively
        const addToZip = async (dir: string, zipFolder: JSZip) => {
            const files = await fs.readdir(dir, { withFileTypes: true })
            for (const file of files) {
                const fullPath = path.join(dir, file.name)
                if (file.isDirectory()) {
                    const newZipFolder = zipFolder.folder(file.name)
                    if (newZipFolder) {
                        await addToZip(fullPath, newZipFolder)
                    }
                } else {
                    const content = await fs.readFile(fullPath)
                    zipFolder.file(file.name, content)
                }
            }
        }

        await addToZip(workflowDir, zip)

        return await zip.generateAsync({ type: 'nodebuffer' })
    }

    /**
     * Import a project from a ZIP buffer
     * Returns the ID of the imported workflow
     */
    async importProject(zipBuffer: Buffer): Promise<string> {
        const zip = await JSZip.loadAsync(zipBuffer)

        // Find workflow file (check for new name format usually, or just workflow.json if we enforce strict export)
        // But simpler: just look for ANY valid json file OR workflow.json
        // Wait, the id is unknown before we read.

        let workflowJsonFile = zip.file('workflow.json')
        if (!workflowJsonFile) {
            // Look for opencanvas_workflow_*.json
            const fileNames = Object.keys(zip.files)
            const specificFile = fileNames.find(f => f.match(/^opencanvas_workflow_.*\.json$/))
            if (specificFile) {
                workflowJsonFile = zip.file(specificFile)
            }
        }

        if (!workflowJsonFile) {
            throw new Error('Invalid project: workflow.json or opencanvas_workflow_<id>.json not found')
        }

        const workflowJsonContent = await workflowJsonFile.async('string')
        const workflowData: WorkflowFileSchema = JSON.parse(workflowJsonContent)

        // Check if ID exists, if so, generate a new one
        let newId = workflowData.id
        const targetDir = this.getWorkflowDir(newId)

        if (await fs.pathExists(targetDir)) {
            // ID conflict, generate new ID
            newId = nanoid()
            workflowData.id = newId
            workflowData.name = `${workflowData.name} (Imported)`
            // Update the JSON content
            // We will write the updated JSON later
        }

        const newWorkflowDir = this.getWorkflowDir(newId)
        await fs.ensureDir(newWorkflowDir)

        // Extract all files
        const entries = Object.keys(zip.files)
        for (const filename of entries) {
            const file = zip.file(filename)
            if (file && !file.dir) {
                // Determine if this is the workflow file
                const isWorkflowFile = filename === 'workflow.json' || filename.match(/^opencanvas_workflow_.*\.json$/)

                if (isWorkflowFile) {
                    // Always write using the canonical naming for this ID
                    await fs.writeJson(path.join(newWorkflowDir, `opencanvas_workflow_${newId}.json`), workflowData, { spaces: 2 })
                } else {
                    const content = await file.async('nodebuffer')
                    const destPath = path.join(newWorkflowDir, filename)
                    await fs.ensureDir(path.dirname(destPath))
                    await fs.writeFile(destPath, content)
                }
            }
        }

        console.log(`[FileStorage] Imported workflow: ${newId}`)
        return newId
    }
}

export const fileStorage = new FileStorageService()
