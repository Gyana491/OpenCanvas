import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import * as schema from './schema'

const DB_DIR = path.join(os.homedir(), '.opencanvas')
const DB_PATH = path.join(DB_DIR, 'database.db')

let db: ReturnType<typeof drizzle> | null = null
let sqlite: Database.Database | null = null

/**
 * Initialize the database connection and ensure the directory exists
 */
export function initDatabase() {
    if (db) {
        return db // Already initialized
    }

    try {
        // Ensure the directory exists
        fs.ensureDirSync(DB_DIR)

        // Create SQLite connection
        sqlite = new Database(DB_PATH)

        // Enable foreign keys
        sqlite.pragma('foreign_keys = ON')

        // Enable WAL mode for better performance
        sqlite.pragma('journal_mode = WAL')

        // Create Drizzle instance
        db = drizzle(sqlite, { schema })

        console.log(`[Database] Initialized at: ${DB_PATH}`)

        return db
    } catch (error) {
        console.error('[Database] Failed to initialize:', error)
        throw error
    }
}

/**
 * Run database migrations - creates tables if they don't exist
 */
export async function runMigrations() {
    if (!sqlite) {
        throw new Error('[Database] SQLite instance not available')
    }

    try {
        console.log('[Database] Running migrations...')

        // Create tables directly using SQL
        // This is more reliable than file-based migrations with Vite bundling
        sqlite.exec(`
      -- Create workflows table
      CREATE TABLE IF NOT EXISTS "workflows" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text DEFAULT 'Untitled Workflow' NOT NULL,
        "description" text,
        "viewport" text NOT NULL,
        "created_at" integer DEFAULT (unixepoch()) NOT NULL,
        "updated_at" integer DEFAULT (unixepoch()) NOT NULL
      );

      -- Create workflow_nodes table
      CREATE TABLE IF NOT EXISTS "workflow_nodes" (
        "id" text PRIMARY KEY NOT NULL,
        "workflow_id" text NOT NULL,
        "type" text NOT NULL,
        "position" text NOT NULL,
        "data" text NOT NULL,
        "created_at" integer DEFAULT (unixepoch()) NOT NULL,
        FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON UPDATE no action ON DELETE cascade
      );

      -- Create workflow_edges table
      CREATE TABLE IF NOT EXISTS "workflow_edges" (
        "id" text PRIMARY KEY NOT NULL,
        "workflow_id" text NOT NULL,
        "source" text NOT NULL,
        "target" text NOT NULL,
        "source_handle" text,
        "target_handle" text,
        "animated" integer DEFAULT 1,
        "style" text,
        "created_at" integer DEFAULT (unixepoch()) NOT NULL,
        FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON UPDATE no action ON DELETE cascade
      );

      -- Create workflow_assets table
      CREATE TABLE IF NOT EXISTS "workflow_assets" (
        "id" text PRIMARY KEY NOT NULL,
        "workflow_id" text NOT NULL,
        "node_id" text NOT NULL,
        "type" text NOT NULL,
        "file_name" text NOT NULL,
        "file_path" text NOT NULL,
        "mime_type" text,
        "file_size" integer,
        "created_at" integer DEFAULT (unixepoch()) NOT NULL,
        FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON UPDATE no action ON DELETE cascade
      );

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS "idx_workflow_nodes_workflow_id" ON "workflow_nodes" ("workflow_id");
      CREATE INDEX IF NOT EXISTS "idx_workflow_edges_workflow_id" ON "workflow_edges" ("workflow_id");
      CREATE INDEX IF NOT EXISTS "idx_workflow_assets_workflow_id" ON "workflow_assets" ("workflow_id");
      CREATE INDEX IF NOT EXISTS "idx_workflow_assets_node_id" ON "workflow_assets" ("node_id");
    `)

        console.log('[Database] Migrations completed successfully')
    } catch (error) {
        console.error('[Database] Migration failed:', error)
        throw error
    }
}

/**
 * Get the database instance (must be initialized first)
 */
export function getDatabase() {
    if (!db) {
        throw new Error('[Database] Database not initialized. Call initDatabase() first.')
    }
    return db
}

/**
 * Close the database connection
 */
export function closeDatabase() {
    if (db) {
        // Better-SQLite3 doesn't have a close method on the drizzle instance
        // We need to access the underlying sqlite instance
        console.log('[Database] Closing database connection')
        db = null
    }
}

// Export database path for other utilities
export const DATABASE_PATH = DB_PATH
export const DATABASE_DIR = DB_DIR
