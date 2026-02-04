import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { nanoid } from 'nanoid'

// Persistent storage directory (survives uninstall)
const STORAGE_DIR = path.join(os.homedir(), '.opencanvas')
const MEDIA_DIR = path.join(STORAGE_DIR, 'media')
const WORKFLOWS_MEDIA_DIR = path.join(MEDIA_DIR, 'workflows')

/**
 * Initialize storage directory structure
 */
export function initStorage() {
    try {
        // Create all necessary directories
        fs.ensureDirSync(STORAGE_DIR)
        fs.ensureDirSync(MEDIA_DIR)
        fs.ensureDirSync(WORKFLOWS_MEDIA_DIR)

        console.log(`[Storage] Initialized at: ${STORAGE_DIR}`)
        console.log(`[Storage] Media directory: ${MEDIA_DIR}`)
    } catch (error) {
        console.error('[Storage] Failed to initialize storage:', error)
        throw error
    }
}

/**
 * Get the workflow-specific media directory path
 */
export function getWorkflowMediaDir(workflowId: string): string {
    return path.join(WORKFLOWS_MEDIA_DIR, workflowId)
}

/**
 * Save an asset file to storage
 * @returns Object with assetId and filePath
 */
export async function saveAsset(
    workflowId: string,
    nodeId: string,
    fileBuffer: Buffer,
    fileName: string,
    assetType: 'image' | 'video' | 'file'
): Promise<{ assetId: string; filePath: string; fullPath: string }> {
    try {
        // Generate unique asset ID
        const assetId = nanoid()

        // Create workflow media directory if it doesn't exist
        const workflowMediaDir = getWorkflowMediaDir(workflowId)
        fs.ensureDirSync(workflowMediaDir)

        // Create asset subdirectory by type
        const assetTypeDir = path.join(workflowMediaDir, assetType)
        fs.ensureDirSync(assetTypeDir)

        // Preserve file extension
        const ext = path.extname(fileName)
        const safeFileName = `${nodeId}_${assetId}${ext}`
        const fullPath = path.join(assetTypeDir, safeFileName)

        // Write file to disk
        await fs.writeFile(fullPath, fileBuffer)

        // Return relative path from media directory
        const relativePath = path.relative(MEDIA_DIR, fullPath)

        console.log(`[Storage] Saved asset: ${relativePath}`)

        return {
            assetId,
            filePath: relativePath,
            fullPath,
        }
    } catch (error) {
        console.error('[Storage] Failed to save asset:', error)
        throw error
    }
}

/**
 * Load an asset file from storage
 */
export async function loadAsset(relativePath: string): Promise<Buffer> {
    try {
        const fullPath = path.join(MEDIA_DIR, relativePath)

        if (!fs.existsSync(fullPath)) {
            throw new Error(`Asset not found: ${relativePath}`)
        }

        return await fs.readFile(fullPath)
    } catch (error) {
        console.error('[Storage] Failed to load asset:', error)
        throw error
    }
}

/**
 * Get the full path for an asset
 */
export function getAssetFullPath(relativePath: string): string {
    return path.join(MEDIA_DIR, relativePath)
}

/**
 * Delete all assets for a workflow
 */
export async function deleteWorkflowAssets(workflowId: string): Promise<void> {
    try {
        const workflowMediaDir = getWorkflowMediaDir(workflowId)

        if (fs.existsSync(workflowMediaDir)) {
            await fs.remove(workflowMediaDir)
            console.log(`[Storage] Deleted assets for workflow: ${workflowId}`)
        }
    } catch (error) {
        console.error('[Storage] Failed to delete workflow assets:', error)
        throw error
    }
}

/**
 * Check if an asset exists
 */
export function assetExists(relativePath: string): boolean {
    const fullPath = path.join(MEDIA_DIR, relativePath)
    return fs.existsSync(fullPath)
}

/**
 * Get file size in bytes
 */
export async function getAssetSize(relativePath: string): Promise<number> {
    try {
        const fullPath = path.join(MEDIA_DIR, relativePath)
        const stats = await fs.stat(fullPath)
        return stats.size
    } catch (error) {
        console.error('[Storage] Failed to get asset size:', error)
        return 0
    }
}

// Export storage paths for other utilities
export const STORAGE_PATH = STORAGE_DIR
export const MEDIA_PATH = MEDIA_DIR
export const WORKFLOWS_MEDIA_PATH = WORKFLOWS_MEDIA_DIR
