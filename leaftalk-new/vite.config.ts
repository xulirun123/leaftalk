import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 生产环境完全模拟开发环境
  const isDev = mode === 'development'

  return {
    // 定义环境变量，让生产环境和开发环境功能一致
    define: {
      __ENABLE_ALL_FEATURES__: true,  // 启用所有功能，不区分开发/生产环境
      __DEV_MODE__: true,  // 保持开发模式的功能
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'development'), // 强制为development
      'import.meta.env.DEV': true,  // 强制为开发模式
      'import.meta.env.PROD': false  // 强制不为生产模式
    },

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
        target: 'http://127.0.0.1:8893',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        followRedirects: true,
        ws: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('❌ 代理错误:', err.message)
          })
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 代理请求:', req.method, req.url, '→', options.target + req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('✅ 代理响应:', proxyRes.statusCode, req.url)
          })
        }
      },
      '/socket.io': {
        target: 'http://127.0.0.1:8893',  // WebSocket代理到生产服务器
        changeOrigin: true,
        ws: true
      },
      '/ws': {
        target: 'ws://127.0.0.1:8893',  // WebSocket代理到生产服务器
        changeOrigin: true,
        ws: true
      }
    }
  },
    build: {
      // 生产构建完全模拟开发环境
      minify: false,  // 不压缩，保持开发环境一致
      sourcemap: true,  // 生成源码映射，方便调试
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'ui-vendor': ['@iconify/iconify'],
            'utils-vendor': ['axios']
          }
        }
      },
      assetsInlineLimit: 4096,
      cssCodeSplit: false  // 禁用CSS代码分割，确保所有样式都在主CSS文件中
    }
  }
})
