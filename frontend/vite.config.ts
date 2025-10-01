import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,  // fail if 5173 is taken instead of hopping ports
    host: true, // Expose to network for mobile testing
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true
  },
  build: {
    // Optimize for mobile performance
    target: 'esnext', // Use modern JS for smaller bundles
    minify: 'terser', // Better minification than esbuild
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        // Better code splitting
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', '@heroicons/react'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    },
    // Increase chunk size warning limit (we're optimizing)
    chunkSizeWarningLimit: 1000
  }
})
