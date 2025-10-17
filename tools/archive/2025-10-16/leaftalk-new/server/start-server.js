// 叶语服务器启动脚本
// 用于诊断和修复服务器启动问题

console.log('🔧 叶语服务器启动诊断工具')
console.log('================================')

// 检查环境
console.log('📋 环境检查:')
console.log('- Node.js版本:', process.version)
console.log('- 工作目录:', process.cwd())
console.log('- 平台:', process.platform)

// 检查依赖
console.log('\n📦 依赖检查:')
try {
    require('express')
    console.log('✅ Express 已安装')
} catch (e) {
    console.log('❌ Express 未安装:', e.message)
}

try {
    require('socket.io')
    console.log('✅ Socket.IO 已安装')
} catch (e) {
    console.log('❌ Socket.IO 未安装:', e.message)
}

try {
    require('mysql2/promise')
    console.log('✅ MySQL2 已安装')
} catch (e) {
    console.log('❌ MySQL2 未安装:', e.message)
}

// 检查端口
console.log('\n🔌 端口检查:')
const net = require('net')

function checkPort(port) {
    return new Promise((resolve) => {
        const server = net.createServer()
        server.listen(port, () => {
            server.close(() => {
                resolve(true) // 端口可用
            })
        })
        server.on('error', () => {
            resolve(false) // 端口被占用
        })
    })
}

async function diagnose() {
    const port8893Available = await checkPort(8893)
    console.log(`- 端口 8893: ${port8893Available ? '✅ 可用' : '❌ 被占用'}`)
    
    if (!port8893Available) {
        console.log('⚠️ 端口 8893 被占用，尝试查找占用进程...')
        // 在 Windows 上查找占用端口的进程
        const { exec } = require('child_process')
        exec('netstat -ano | findstr :8893', (error, stdout, stderr) => {
            if (stdout) {
                console.log('占用端口的进程:')
                console.log(stdout)
            }
        })
    }
    
    // 尝试启动服务器
    console.log('\n🚀 尝试启动服务器...')
    try {
        // 导入并启动主服务器
        const app = require('./app.js')
        console.log('✅ 服务器模块加载成功')
        
        // 如果服务器没有自动启动，手动启动
        if (typeof app.listen === 'function') {
            const server = app.listen(8893, () => {
                console.log('✅ 服务器启动成功！')
                console.log('📍 地址: http://localhost:8893')
                console.log('🔌 WebSocket: ws://localhost:8893')
                
                // 测试健康检查
                setTimeout(async () => {
                    try {
                        const response = await fetch('http://localhost:8893/health')
                        if (response.ok) {
                            console.log('✅ 健康检查通过')
                        } else {
                            console.log('⚠️ 健康检查失败')
                        }
                    } catch (e) {
                        console.log('❌ 健康检查错误:', e.message)
                    }
                }, 2000)
            })
            
            server.on('error', (error) => {
                console.error('❌ 服务器启动失败:', error.message)
                if (error.code === 'EADDRINUSE') {
                    console.log('💡 解决方案: 端口 8893 被占用，请关闭占用进程或更换端口')
                }
            })
        } else {
            console.log('✅ 服务器已在 app.js 中启动')
        }
        
    } catch (error) {
        console.error('❌ 服务器启动失败:', error.message)
        console.error('详细错误:', error.stack)
        
        // 提供解决方案
        console.log('\n💡 可能的解决方案:')
        console.log('1. 检查 .env 文件是否存在')
        console.log('2. 检查数据库连接配置')
        console.log('3. 运行 npm install 安装依赖')
        console.log('4. 检查端口 8893 是否被占用')
        console.log('5. 检查 MySQL 服务是否运行')
    }
}

// 运行诊断
diagnose().catch(console.error)

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 服务器正在关闭...')
    process.exit(0)
})

process.on('SIGTERM', () => {
    console.log('\n👋 服务器正在关闭...')
    process.exit(0)
})
