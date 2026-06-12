import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from "path"

export default defineConfig({
  plugins: [
    vue(),
    {
      name: "fix-vue-chunks",
      // Ensure vue-router and pinia end up in the vue-core chunk alongside vue
      buildStart() {
        console.log("fix-vue-chunks: build started")
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  base: "/",
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Put vue, vue-router, pinia into their own chunk
          'vue-core': ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8111",
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'ant-design-vue'],
  },
})
