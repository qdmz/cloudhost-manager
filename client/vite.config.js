import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from "path"

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  base: "/",
  build: {
    rollupOptions: {
      output: {
        // 彻底禁用 code splitting，所有代码打包到一个文件
        inlineDynamicImports: true
      }
    },
    cssCodeSplit: false,
    commonjsOptions: {
      transformMixedEsModules: true
    },
    chunkSizeWarningLimit: 5000
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
