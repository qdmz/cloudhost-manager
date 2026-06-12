import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from "path"

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    },
    dedupe: ["vue", "vue-router", "pinia", "ant-design-vue"]
  },
  base: "/",
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    cssCodeSplit: false,
    commonjsOptions: {
      transformMixedEsModules: true
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8111",
        changeOrigin: true
      }
    }
  }
})
