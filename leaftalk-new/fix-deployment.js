#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 叶语项目部署修复工具');
console.log('================================');

function runCommand(command, description) {
  console.log(`\n📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    console.log(`✅ ${description} 完成`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message);
    return false;
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description} 存在`);
    return true;
  } else {
    console.log(`❌ ${description} 不存在`);
    return false;
  }
}

function main() {
  console.log('\n🔍 步骤 1: 检查项目结构');
  
  const requiredFiles = [
    { path: 'package.json', desc: 'package.json' },
    { path: 'vite.config.ts', desc: 'Vite 配置文件' },
    { path: 'src/main.ts', desc: '主入口文件' },
    { path: 'src/MobileApp.vue', desc: '主应用组件' }
  ];
  
  let allFilesExist = true;
  for (const file of requiredFiles) {
    if (!checkFile(file.path, file.desc)) {
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    console.error('\n❌ 项目文件不完整，请检查项目结构');
    process.exit(1);
  }
  
  console.log('\n🧹 步骤 2: 清理旧的构建文件');
  if (fs.existsSync('dist')) {
    try {
      fs.rmSync('dist', { recursive: true, force: true });
      console.log('✅ 清理 dist 目录完成');
    } catch (error) {
      console.error('❌ 清理 dist 目录失败:', error.message);
    }
  }
  
  console.log('\n📦 步骤 3: 安装依赖');
  if (!runCommand('npm install', '安装项目依赖')) {
    console.error('\n❌ 依赖安装失败，请检查网络连接和 package.json');
    process.exit(1);
  }
  
  console.log('\n🏗️  步骤 4: 构建项目');
  if (!runCommand('npm run build', '构建生产版本')) {
    console.error('\n❌ 构建失败，请检查代码错误');
    process.exit(1);
  }
  
  console.log('\n🔍 步骤 5: 验证构建结果');
  if (!runCommand('node test-build.js', '验证构建文件')) {
    console.error('\n❌ 构建验证失败');
    process.exit(1);
  }
  
  console.log('\n🚀 步骤 6: 启动预览服务器');
  console.log('正在启动预览服务器...');
  console.log('服务器将在 http://127.0.0.1:1420/ 启动');
  console.log('请在浏览器中访问该地址测试应用');
  console.log('\n按 Ctrl+C 停止服务器');
  
  try {
    execSync('npm run preview', { stdio: 'inherit', cwd: __dirname });
  } catch (error) {
    console.log('\n服务器已停止');
  }
}

// 添加错误处理
process.on('uncaughtException', (error) => {
  console.error('\n❌ 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

main();
