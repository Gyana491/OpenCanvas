// Electron API and Workflow types exposed to renderer process
declare global {
    interface Window {
        electron: {
            // Workflow operations
            createWorkflow: (name?: string) => Promise<{
                success: boolean
                data?: {
                    id: string
                    name: string
                    nodes: any[]
                    edges: any[]
                    viewport: { x: number; y: number; zoom: number }
                    createdAt: Date
                    updatedAt: Date
                }
                error?: string
            }>

            saveWorkflow: (
                id: string,
                nodes: any[],
                edges: any[],
                viewport?: { x: number; y: number; zoom: number }
            ) => Promise<{
                success: boolean
                error?: string
            }>

            loadWorkflow: (id: string) => Promise<{
                success: boolean
                data?: {
                    id: string
                    name: string
                    nodes: any[]
                    edges: any[]
                    viewport: { x: number; y: number; zoom: number }
                    createdAt: Date
                    updatedAt: Date
                }
                error?: string
            }>

            deleteWorkflow: (id: string) => Promise<{
                success: boolean
                error?: string
            }>

            listWorkflows: () => Promise<{
                success: boolean
                data?: Array<{
                    id: string
                    name: string
                    nodes: any[]
                    edges: any[]
                    viewport: { x: number; y: number; zoom: number }
                    createdAt: Date
                    updatedAt: Date
                }>
                error?: string
            }>

            saveAsset: (
                workflowId: string,
                nodeId: string,
                fileBuffer: Buffer,
                fileName: string,
                assetType: 'image' | 'video' | 'file',
                mimeType?: string
            ) => Promise<{
                success: boolean
                data?: { filePath: string }
                error?: string
            }>
        }
    }
}

export { }
