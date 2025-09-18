import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 将iconify-icon标记为自定义元素
          isCustomElement: (tag) => {
            return tag === 'iconify-icon' || tag.startsWith('iconify-')
          }
        }
      }
    })
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'vue': 'vue/dist/vue.esm-bundler.js'
    }
  },
  optimizeDeps: {
    // 排除HTML测试文件
    exclude: ['*.html'],
    entries: ['src/main.ts', 'index.html']
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: true,
    hmr: true,
    // 代理配置，转发API请求到后端
    proxy: {
      '/api': {
        target: 'http://localhost:8893',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        followRedirects: true,
        ws: false
      },
      '/socket.io': {
        target: 'http://localhost:8893',  // WebSocket代理到生产服务器
        changeOrigin: true,
        ws: true
      },
      '/ws': {
        target: 'ws://localhost:8893',  // WebSocket代理到生产服务器
        changeOrigin: true,
        ws: true
      }
    }
  },
  build: {
    // 增加chunk大小限制
    chunkSizeWarningLimit: 2000,
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          // 将Vue相关库打包到一个chunk
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // 将UI组件库打包到一个chunk
          'ui-vendor': ['@iconify/iconify'],
          // 将工具库打包到一个chunk
          'utils-vendor': ['axios']
        }
      }
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // 资源内联阈值
    assetsInlineLimit: 4096,
    // 启用CSS代码分割
    cssCodeSplit: true
  }
})
