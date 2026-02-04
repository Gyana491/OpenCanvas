import { defineConfig } from 'drizzle-kit'
import os from 'os'
import path from 'path'

const dbPath = path.join(os.homedir(), '.opencanvas', 'database.db')

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: dbPath,
    },
})
