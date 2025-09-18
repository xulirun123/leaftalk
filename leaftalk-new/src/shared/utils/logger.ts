// 简单的日志工具
class Logger {
  private isDev = import.meta.env.DEV

  info(message: string, ...args: any[]) {
    if (this.isDev) {
      console.log(`[INFO] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  }

  error(message: string, ...args: any[]) {
    console.error(`[ERROR] ${message}`, ...args)
  }

  debug(message: string, ...args: any[]) {
    if (this.isDev) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  }
}

const logger = new Logger()
export default logger
