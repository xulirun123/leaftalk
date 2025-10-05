#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 检查构建文件...');

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// 检查 dist 目录是否存在
if (!fs.existsSync(distPath)) {
  console.error('❌ dist 目录不存在');
  process.exit(1);
}

// 检查 index.html 是否存在
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html 不存在');
  process.exit(1);
}

// 读取 index.html 内容
const indexContent = fs.readFileSync(indexPath, 'utf8');

// 检查是否包含必要的脚本标签
const scriptMatch = indexContent.match(/<script[^>]*src="([^"]*index[^"]*\.js)"[^>]*>/);
if (!scriptMatch) {
  console.error('❌ 未找到主要的 JavaScript 文件引用');
  process.exit(1);
}

const scriptPath = path.join(distPath, scriptMatch[1].replace(/^\//, ''));

// 检查 JavaScript 文件是否存在
if (!fs.existsSync(scriptPath)) {
  console.error(`❌ JavaScript 文件不存在: ${scriptPath}`);
  process.exit(1);
}

// 检查 JavaScript 文件内容
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// 检查文件是否为空或损坏
if (scriptContent.length < 1000) {
  console.error('❌ JavaScript 文件内容过短，可能损坏');
  process.exit(1);
}

// 检查是否包含基本的 JavaScript 语法
if (!scriptContent.includes('function') && !scriptContent.includes('=>')) {
  console.error('❌ JavaScript 文件不包含有效的函数定义');
  process.exit(1);
}

// 检查文件编码
try {
  // 尝试解析为 UTF-8
  const buffer = fs.readFileSync(scriptPath);
  const decoded = buffer.toString('utf8');
  // 检查是否有明显的编码问题（连续的替换字符）
  const replacementChars = (decoded.match(/�/g) || []).length;
  if (replacementChars > 10) {
    console.error('❌ JavaScript 文件编码可能有问题');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ 读取 JavaScript 文件时出错:', error.message);
  process.exit(1);
}

// 检查 CSS 文件
const cssMatch = indexContent.match(/<link[^>]*href="([^"]*\.css)"[^>]*>/);
if (cssMatch) {
  const cssPath = path.join(distPath, cssMatch[1].replace(/^\//, ''));
  if (!fs.existsSync(cssPath)) {
    console.warn(`⚠️  CSS 文件不存在: ${cssPath}`);
  } else {
    console.log('✅ CSS 文件存在');
  }
}

console.log('✅ 构建文件检查通过');
console.log(`📁 dist 目录大小: ${getDirSize(distPath)} bytes`);
console.log(`📄 index.html 大小: ${fs.statSync(indexPath).size} bytes`);
console.log(`📜 主 JS 文件大小: ${fs.statSync(scriptPath).size} bytes`);

function getDirSize(dirPath) {
  let totalSize = 0;
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += getDirSize(filePath);
    } else {
      totalSize += stats.size;
    }
  }
  
  return totalSize;
}

console.log('\n🎉 构建验证完成！');
