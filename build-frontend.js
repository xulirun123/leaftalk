const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建叶语前端...');

// 进入项目目录
process.chdir('leaftalk-new');

try {
  // 检查是否存在dist目录，如果存在则删除
  if (fs.existsSync('dist')) {
    console.log('🗑️ 清理旧的构建文件...');
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // 执行构建
  console.log('📦 开始构建...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ 构建完成！');
  
  // 检查构建结果
  if (fs.existsSync('dist')) {
    const files = fs.readdirSync('dist');
    console.log('📁 构建文件:', files);
    
    // 检查主要文件
    const indexExists = fs.existsSync('dist/index.html');
    const assetsExists = fs.existsSync('dist/assets');
    
    console.log('📄 index.html:', indexExists ? '✅' : '❌');
    console.log('📂 assets目录:', assetsExists ? '✅' : '❌');
    
    if (indexExists && assetsExists) {
      console.log('🎉 前端构建成功！');
      return true;
    }
  }
  
  console.log('❌ 构建失败：缺少必要文件');
  return false;
  
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  return false;
}
