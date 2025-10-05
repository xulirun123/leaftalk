@echo off
echo 开始构建叶语前端应用...

cd leaftalk-new

echo 检查依赖...
if not exist node_modules (
    echo 安装依赖...
    npm install
    if errorlevel 1 (
        echo 依赖安装失败！
        pause
        exit /b 1
    )
)

echo 开始构建...
npm run build

if errorlevel 1 (
    echo 构建失败！
    pause
    exit /b 1
) else (
    echo 构建成功！
    echo 构建文件位于: leaftalk-new\dist
    dir dist
)

pause
