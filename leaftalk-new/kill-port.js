#!/usr/bin/env node

const net = require('net');
const { exec } = require('child_process');

const PORT = 8893;

// 尝试连接到端口，如果能连接说明有进程在运行
const socket = new net.Socket();

socket.setTimeout(1000);

socket.on('connect', () => {
  console.log(`⚠️ 端口 ${PORT} 已被占用，正在尝试释放...`);
  socket.destroy();
  
  // 在 Windows 上使用 netstat 和 taskkill
  if (process.platform === 'win32') {
    exec(`netstat -ano | findstr :${PORT}`, (error, stdout, stderr) => {
      if (stdout) {
        const lines = stdout.trim().split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== 'PID') {
            console.log(`🔍 找到占用进程 PID: ${pid}`);
            exec(`taskkill /PID ${pid} /F`, (err) => {
              if (!err) {
                console.log(`✅ 已杀死进程 ${pid}`);
              }
            });
          }
        });
      }
    });
  } else {
    // 在 Mac/Linux 上使用 lsof
    exec(`lsof -i :${PORT} | grep -v COMMAND | awk '{print $2}' | xargs kill -9`, (error) => {
      if (!error) {
        console.log(`✅ 已释放端口 ${PORT}`);
      }
    });
  }
});

socket.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.log(`✅ 端口 ${PORT} 未被占用，可以启动服务器`);
  }
});

socket.connect(PORT, '127.0.0.1');

