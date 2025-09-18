/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 应用配置
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_DESCRIPTION: string

  // API配置
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_BASE_URL: string
  readonly VITE_CDN_BASE_URL: string

  // 数据库配置
  readonly VITE_DB_HOST: string
  readonly VITE_DB_PORT: string
  readonly VITE_DB_USERNAME: string
  readonly VITE_DB_PASSWORD: string
  readonly VITE_DB_NAME: string

  // Redis配置
  readonly VITE_REDIS_HOST: string
  readonly VITE_REDIS_PORT: string
  readonly VITE_REDIS_PASSWORD: string
  readonly VITE_REDIS_DB: string

  // 开发配置
  readonly VITE_DEV_MODE: string
  readonly VITE_DEBUG_LEVEL: string
  readonly VITE_MOCK_API: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
