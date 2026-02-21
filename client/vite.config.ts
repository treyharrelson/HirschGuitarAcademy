import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    // This tells esbuild to use the 'jsx' loader for these file extensions
    loader: 'jsx', 
    include: /src\/.*\.jsx?$/, // Targets .js and .jsx files in the src folder
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
      },
    },
  },
});
