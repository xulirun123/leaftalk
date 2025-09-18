/**
 * 叶语应用统一启动脚本
 * 自动启动Redis、后端服务器和前端开发服务器
 */

const { spawn, exec } = require('child_process')
const path = require('path')
const os = require('os')

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// 检查Redis服务状态
function checkRedisService() {
  return new Promise((resolve) => {
    if (os.platform() === 'win32') {
      exec('sc query redis', (error, stdout) => {
        if (error) {
          resolve(false)
        } else {
          resolve(stdout.includes('RUNNING'))
        }
      })
    } else {
      exec('pgrep redis-server', (error) => {
        resolve(!error)
      })
    }
  })
}

// 启动Redis服务
function startRedis() {
  return new Promise((resolve) => {
    log('🔄 启动Redis服务...', 'blue')
    
    if (os.platform() === 'win32') {
      // Windows系统
      exec('net start redis', (error, stdout, stderr) => {
        if (error && !stderr.includes('已经启动')) {
          log('⚠️ 无法通过服务启动Redis，尝试直接启动...', 'yellow')
          
          // 尝试直接启动Redis
          const redisPath = '"C:\\Program Files\\Redis\\redis-server.exe"'
          const configPath = path.join(__dirname, 'redis.conf')
          
          const redisProcess = spawn('cmd', ['/c', `${redisPath} "${configPath}"`], {
            detached: true,
            stdio: 'ignore'
          })
          
          redisProcess.unref()
          
          setTimeout(() => {
            testRedisConnection().then(resolve)
          }, 3000)
        } else {
          log('✅ Redis服务启动成功', 'green')
          resolve(true)
        }
      })
    } else {
      // Linux/Mac系统
      exec('redis-server redis.conf &', (error) => {
        if (error) {
          log('❌ Redis启动失败', 'red')
          resolve(false)
        } else {
          log('✅ Redis启动成功', 'green')
          resolve(true)
        }
      })
    }
  })
}

// 测试Redis连接
function testRedisConnection() {
  return new Promise((resolve) => {
    const redisCliPath = os.platform() === 'win32' 
      ? '"C:\\Program Files\\Redis\\redis-cli.exe"'
      : 'redis-cli'
    
    exec(`${redisCliPath} ping`, (error, stdout) => {
      if (error || !stdout.includes('PONG')) {
        log('❌ Redis连接失败', 'red')
        resolve(false)
      } else {
        log('✅ Redis连接正常', 'green')
        resolve(true)
      }
    })
  })
}

// 启动后端服务器
function startBackend() {
  return new Promise((resolve) => {
    log('🔄 启动后端服务器...', 'blue')
    
    const backendProcess = spawn('node', ['server/app.js'], {
      stdio: 'inherit',
      cwd: __dirname
    })
    
    backendProcess.on('error', (error) => {
      log(`❌ 后端服务器启动失败: ${error.message}`, 'red')
      resolve(false)
    })
    
    // 等待后端启动
    setTimeout(() => {
      log('✅ 后端服务器启动成功', 'green')
      resolve(true)
    }, 3000)
  })
}

// 启动前端开发服务器
function startFrontend() {
  return new Promise((resolve) => {
    log('🔄 启动前端开发服务器...', 'blue')
    
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      cwd: __dirname,
      shell: true
    })
    
    frontendProcess.on('error', (error) => {
      log(`❌ 前端服务器启动失败: ${error.message}`, 'red')
      resolve(false)
    })
    
    // 等待前端启动
    setTimeout(() => {
      log('✅ 前端服务器启动成功', 'green')
      resolve(true)
    }, 5000)
  })
}

// 显示启动完成信息
function showCompletionInfo() {
  log('\n========================================', 'cyan')
  log('🎉 所有服务启动完成！', 'green')
  log('========================================', 'cyan')
  log('\n📊 服务状态:', 'cyan')
  log('  🔧 Redis:     127.0.0.1:6379')
  log('  🚀 后端:      http://localhost:8893')
  log('  🌐 前端:      http://127.0.0.1:5173')
  log('  🔍 健康检查:  http://localhost:8893/health')
  log('\n📝 常用命令:', 'cyan')
  log('  - 查看Redis状态: redis-cli ping')
  log('  - 停止所有服务: Ctrl+C')
  log('  - 重启服务: 重新运行此脚本')
  log('\n⚠️  请保持此进程运行以维持服务', 'yellow')
  log('========================================\n', 'cyan')
  
  // 尝试打开浏览器
  setTimeout(() => {
    const openCommand = os.platform() === 'win32' ? 'start' : 
                       os.platform() === 'darwin' ? 'open' : 'xdg-open'
    exec(`${openCommand} http://127.0.0.1:5173`)
  }, 2000)
}

// 主启动函数
async function main() {
  log('\n========================================', 'cyan')
  log('🍃 叶语应用 - 统一启动脚本', 'green')
  log('========================================\n', 'cyan')
  
  try {
    // 1. 检查Redis状态
    log('🔍 检查Redis服务状态...', 'blue')
    const redisRunning = await checkRedisService()
    
    if (redisRunning) {
      log('✅ Redis服务已运行', 'green')
    } else {
      // 启动Redis
      const redisStarted = await startRedis()
      if (!redisStarted) {
        log('❌ Redis启动失败，请手动启动Redis服务', 'red')
        process.exit(1)
      }
    }
    
    // 2. 测试Redis连接
    const redisConnected = await testRedisConnection()
    if (!redisConnected) {
      log('❌ Redis连接失败，请检查Redis服务', 'red')
      process.exit(1)
    }
    
    // 3. 启动后端服务器
    await startBackend()
    
    // 4. 启动前端服务器
    await startFrontend()
    
    // 5. 显示完成信息
    showCompletionInfo()
    
  } catch (error) {
    log(`❌ 启动过程中发生错误: ${error.message}`, 'red')
    process.exit(1)
  }
}

// 处理进程退出
process.on('SIGINT', () => {
  log('\n🔄 正在停止所有服务...', 'yellow')
  process.exit(0)
})

process.on('SIGTERM', () => {
  log('\n🔄 正在停止所有服务...', 'yellow')
  process.exit(0)
})

// 运行主函数
if (require.main === module) {
  main()
}

module.exports = { main }
