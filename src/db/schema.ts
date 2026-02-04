import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// Main workflow table
export const workflows = sqliteTable('workflows', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    // Store viewport position as JSON string
    viewport: text('viewport').default('{"x":0,"y":0,"zoom":1}'),
})

// Workflow nodes table
export const workflowNodes = sqliteTable('workflow_nodes', {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id')
        .notNull()
        .references(() => workflows.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'imagen', 'textInput', 'imageUpload', etc.
    // Store position as JSON: {x: number, y: number}
    position: text('position').notNull(),
    // Store all node data as JSON string
    data: text('data').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Workflow edges (connections between nodes)
export const workflowEdges = sqliteTable('workflow_edges', {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id')
        .notNull()
        .references(() => workflows.id, { onDelete: 'cascade' }),
    source: text('source').notNull(), // Source node ID
    target: text('target').notNull(), // Target node ID
    sourceHandle: text('source_handle'), // Output handle ID
    targetHandle: text('target_handle'), // Input handle ID
    animated: integer('animated', { mode: 'boolean' }).default(true),
    // Store style as JSON string for edge colors
    style: text('style'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Asset files (images, videos) referenced by nodes
export const workflowAssets = sqliteTable('workflow_assets', {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id')
        .notNull()
        .references(() => workflows.id, { onDelete: 'cascade' }),
    nodeId: text('node_id').notNull(),
    type: text('type').notNull(), // 'image', 'video', 'file'
    fileName: text('file_name').notNull(),
    filePath: text('file_path').notNull(), // Relative path from media directory
    mimeType: text('mime_type'),
    fileSize: integer('file_size'), // In bytes
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// TypeScript types inferred from schema
export type Workflow = typeof workflows.$inferSelect
export type NewWorkflow = typeof workflows.$inferInsert

export type WorkflowNode = typeof workflowNodes.$inferSelect
export type NewWorkflowNode = typeof workflowNodes.$inferInsert

export type WorkflowEdge = typeof workflowEdges.$inferSelect
export type NewWorkflowEdge = typeof workflowEdges.$inferInsert

export type WorkflowAsset = typeof workflowAssets.$inferSelect
export type NewWorkflowAsset = typeof workflowAssets.$inferInsert
