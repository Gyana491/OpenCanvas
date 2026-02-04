import { defineConfig } from "vite";
import path from "path";
import { builtinModules } from "module";

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Make sure better-sqlite3 and fs-extra use commonjs resolution
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  build: {
    rollupOptions: {
      external: [
        'electron',
        ...builtinModules.flatMap((p: string) => [p, `node:${p}`]),
      ],
      output: {
        // Ensure proper interop for cjs modules
        interop: 'auto',
      },
    },
    // Don't minify to help with debugging
    minify: process.env.NODE_ENV === 'production',
  },
});
