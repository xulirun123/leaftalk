// 叶语服务器监控脚本
// 监控服务器状态，自动重启崩溃的服务器

const { spawn } = require('child_process')
const http = require('http')
const fs = require('fs')
const path = require('path')

class ServerMonitor {
    constructor() {
        this.serverProcess = null
        this.isMonitoring = false
        this.restartCount = 0
        this.maxRestarts = 10
        this.checkInterval = 30000 // 30秒检查一次
        this.healthCheckUrl = 'http://localhost:8893/health'
        this.logFile = path.join(__dirname, 'logs', 'monitor.log')
        
        // 确保日志目录存在
        const logDir = path.dirname(this.logFile)
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true })
        }
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString()
        const logMessage = `[${timestamp}] [${level}] ${message}\n`
        
        console.log(logMessage.trim())
        
        // 写入日志文件
        fs.appendFileSync(this.logFile, logMessage)
    }

    async checkServerHealth() {
        return new Promise((resolve) => {
            const req = http.get(this.healthCheckUrl, { timeout: 5000 }, (res) => {
                if (res.statusCode === 200) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            })

            req.on('error', () => {
                resolve(false)
            })

            req.on('timeout', () => {
                req.destroy()
                resolve(false)
            })
        })
    }

    startServer() {
        if (this.serverProcess) {
            this.log('服务器进程已存在，先停止现有进程')
            this.stopServer()
        }

        this.log('启动叶语服务器...')
        
        this.serverProcess = spawn('node', ['app.js'], {
            cwd: __dirname,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, NODE_ENV: 'production' }
        })

        this.serverProcess.stdout.on('data', (data) => {
            const message = data.toString().trim()
            if (message) {
                this.log(`[SERVER] ${message}`)
            }
        })

        this.serverProcess.stderr.on('data', (data) => {
            const message = data.toString().trim()
            if (message) {
                this.log(`[SERVER ERROR] ${message}`, 'ERROR')
            }
        })

        this.serverProcess.on('close', (code) => {
            this.log(`服务器进程退出，退出码: ${code}`, code === 0 ? 'INFO' : 'ERROR')
            this.serverProcess = null
            
            if (this.isMonitoring && code !== 0) {
                this.handleServerCrash()
            }
        })

        this.serverProcess.on('error', (error) => {
            this.log(`服务器进程错误: ${error.message}`, 'ERROR')
            this.serverProcess = null
            
            if (this.isMonitoring) {
                this.handleServerCrash()
            }
        })

        // 等待服务器启动
        setTimeout(async () => {
            const isHealthy = await this.checkServerHealth()
            if (isHealthy) {
                this.log('✅ 服务器启动成功，健康检查通过')
                this.restartCount = 0 // 重置重启计数
            } else {
                this.log('❌ 服务器启动失败，健康检查未通过', 'ERROR')
            }
        }, 5000)
    }

    stopServer() {
        if (this.serverProcess) {
            this.log('停止服务器进程...')
            this.serverProcess.kill('SIGTERM')
            
            // 如果 5 秒后还没停止，强制杀死
            setTimeout(() => {
                if (this.serverProcess) {
                    this.log('强制停止服务器进程', 'WARN')
                    this.serverProcess.kill('SIGKILL')
                }
            }, 5000)
        }
    }

    handleServerCrash() {
        this.restartCount++
        this.log(`检测到服务器崩溃，重启次数: ${this.restartCount}/${this.maxRestarts}`, 'WARN')

        if (this.restartCount >= this.maxRestarts) {
            this.log('达到最大重启次数，停止监控', 'ERROR')
            this.stopMonitoring()
            return
        }

        // 延迟重启，避免快速重启循环
        const delay = Math.min(5000 * this.restartCount, 30000)
        this.log(`${delay / 1000} 秒后重启服务器...`)
        
        setTimeout(() => {
            this.startServer()
        }, delay)
    }

    async startMonitoring() {
        if (this.isMonitoring) {
            this.log('监控已在运行中')
            return
        }

        this.isMonitoring = true
        this.log('🔍 开始监控叶语服务器...')
        
        // 启动服务器
        this.startServer()

        // 定期健康检查
        const healthCheckInterval = setInterval(async () => {
            if (!this.isMonitoring) {
                clearInterval(healthCheckInterval)
                return
            }

            const isHealthy = await this.checkServerHealth()
            
            if (!isHealthy) {
                this.log('❌ 健康检查失败，服务器可能已崩溃', 'ERROR')
                
                if (this.serverProcess) {
                    // 服务器进程存在但健康检查失败，可能是挂起状态
                    this.log('服务器进程存在但无响应，重启服务器', 'WARN')
                    this.stopServer()
                    setTimeout(() => {
                        this.handleServerCrash()
                    }, 2000)
                } else {
                    // 服务器进程不存在
                    this.handleServerCrash()
                }
            } else {
                // 健康检查通过，记录正常状态
                if (this.restartCount > 0) {
                    this.log('✅ 服务器恢复正常')
                }
            }
        }, this.checkInterval)
    }

    stopMonitoring() {
        this.isMonitoring = false
        this.log('停止监控服务器')
        this.stopServer()
    }

    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            hasServerProcess: !!this.serverProcess,
            restartCount: this.restartCount,
            maxRestarts: this.maxRestarts
        }
    }
}

// 创建监控实例
const monitor = new ServerMonitor()

// 处理进程信号
process.on('SIGINT', () => {
    monitor.log('收到 SIGINT 信号，停止监控...')
    monitor.stopMonitoring()
    process.exit(0)
})

process.on('SIGTERM', () => {
    monitor.log('收到 SIGTERM 信号，停止监控...')
    monitor.stopMonitoring()
    process.exit(0)
})

process.on('uncaughtException', (error) => {
    monitor.log(`未捕获的异常: ${error.message}`, 'ERROR')
    monitor.log(error.stack, 'ERROR')
})

process.on('unhandledRejection', (reason, promise) => {
    monitor.log(`未处理的 Promise 拒绝: ${reason}`, 'ERROR')
})

// 启动监控
if (require.main === module) {
    console.log('🚀 叶语服务器监控器启动')
    console.log('================================')
    console.log('功能:')
    console.log('- 自动启动服务器')
    console.log('- 定期健康检查')
    console.log('- 自动重启崩溃的服务器')
    console.log('- 记录详细日志')
    console.log('================================')
    
    monitor.startMonitoring()
}

module.exports = ServerMonitor
