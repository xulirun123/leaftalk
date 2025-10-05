const fs = require('fs');
const path = require('path');

// 读取主应用文件
const mainJsPath = path.join(__dirname, 'dist/assets/index-n-p0kvY0.js');
const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

console.log('📁 主应用文件信息:');
console.log(`文件路径: ${mainJsPath}`);
console.log(`文件大小: ${(mainJsContent.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`字符数量: ${mainJsContent.length.toLocaleString()}`);

// 创建上传脚本
const uploadScript = `#!/bin/bash
# 上传主应用JavaScript文件

echo "🚀 开始上传主应用文件..."

# 方法1: 直接SCP上传
echo "📤 尝试SCP直接上传..."
scp dist/assets/index-n-p0kvY0.js root@120.24.148.204:/var/www/leaftalk/frontend/assets/

if [ $? -eq 0 ]; then
    echo "✅ SCP上传成功!"
    exit 0
fi

echo "❌ SCP上传失败，尝试分块上传..."

# 方法2: 分块上传
echo "📦 创建压缩包..."
tar -czf main-app.tar.gz -C dist/assets index-n-p0kvY0.js

echo "📤 上传压缩包..."
scp main-app.tar.gz root@120.24.148.204:/var/www/leaftalk/

echo "📂 在服务器上解压..."
ssh root@120.24.148.204 "cd /var/www/leaftalk && tar -xzf main-app.tar.gz -C frontend/assets/ && rm main-app.tar.gz"

if [ $? -eq 0 ]; then
    echo "✅ 分块上传成功!"
    rm main-app.tar.gz
else
    echo "❌ 分块上传也失败了"
fi
`;

fs.writeFileSync('upload-main-js.sh', uploadScript);

// 创建Windows批处理文件
const windowsScript = `@echo off
echo 🚀 开始上传主应用文件...

echo 📤 尝试SCP直接上传...
scp dist/assets/index-n-p0kvY0.js root@120.24.148.204:/var/www/leaftalk/frontend/assets/

if %errorlevel% equ 0 (
    echo ✅ SCP上传成功!
    goto :end
)

echo ❌ SCP上传失败，尝试压缩上传...

echo 📦 创建压缩包...
powershell -Command "Compress-Archive -Path 'dist/assets/index-n-p0kvY0.js' -DestinationPath 'main-app.zip' -Force"

echo 📤 上传压缩包...
scp main-app.zip root@120.24.148.204:/var/www/leaftalk/

echo 📂 在服务器上解压...
ssh root@120.24.148.204 "cd /var/www/leaftalk && unzip -o main-app.zip -d frontend/assets/ && rm main-app.zip"

if %errorlevel% equ 0 (
    echo ✅ 压缩上传成功!
    del main-app.zip
) else (
    echo ❌ 压缩上传也失败了
)

:end
pause
`;

fs.writeFileSync('upload-main-js.bat', windowsScript);

console.log('\n📝 已创建上传脚本:');
console.log('- upload-main-js.sh (Linux/Mac)');
console.log('- upload-main-js.bat (Windows)');

// 检查文件内容的前几行，确保是正确的JavaScript
const firstLines = mainJsContent.split('\n').slice(0, 5).join('\n');
console.log('\n🔍 文件内容预览:');
console.log(firstLines);

// 检查是否包含Vue相关内容
const hasVue = mainJsContent.includes('Vue') || mainJsContent.includes('vue');
const hasVite = mainJsContent.includes('vite') || mainJsContent.includes('Vite');
const hasApp = mainJsContent.includes('createApp') || mainJsContent.includes('mount');

console.log('\n✅ 文件验证:');
console.log(`包含Vue: ${hasVue ? '✅' : '❌'}`);
console.log(`包含Vite: ${hasVite ? '✅' : '❌'}`);
console.log(`包含App: ${hasApp ? '✅' : '❌'}`);

if (hasVue && hasApp) {
    console.log('🎉 文件验证通过，这是正确的Vue3主应用文件!');
} else {
    console.log('⚠️ 文件验证失败，可能不是正确的主应用文件');
}
