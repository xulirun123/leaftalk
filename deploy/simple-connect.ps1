# 简化的服务器连接脚本
$serverIP = "120.24.148.204"
$username = "root"
$password = "314077060@qq.com"

Write-Host "=========================================="
Write-Host "叶语项目服务器连接信息"
Write-Host "服务器: $serverIP"
Write-Host "用户: $username"
Write-Host "=========================================="

# 检查是否有SSH客户端
Write-Host ""
Write-Host "🔍 检查SSH客户端..."

if (Get-Command ssh -ErrorAction SilentlyContinue) {
    Write-Host "✅ 找到OpenSSH客户端"
    Write-Host "连接命令: ssh $username@$serverIP"
    Write-Host "密码: $password"
} elseif (Get-Command plink -ErrorAction SilentlyContinue) {
    Write-Host "✅ 找到PuTTY plink"
    Write-Host "连接命令: plink -ssh $username@$serverIP"
    Write-Host "密码: $password"
} else {
    Write-Host "❌ 未找到SSH客户端"
    Write-Host ""
    Write-Host "请安装SSH客户端："
    Write-Host "1. 启用Windows OpenSSH:"
    Write-Host "   Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0"
    Write-Host "2. 或下载PuTTY: https://www.putty.org/"
}

Write-Host ""
Write-Host "📋 部署准备清单："
Write-Host "1. 服务器连接信息已确认"
Write-Host "2. 需要检查服务器当前状态"
Write-Host "3. 准备叶语项目部署文件"
Write-Host "4. 配置生产环境"

Write-Host ""
Write-Host "🚀 下一步操作："
Write-Host "1. 手动SSH连接到服务器"
Write-Host "2. 运行系统检查脚本"
Write-Host "3. 根据检查结果决定部署策略"

Write-Host ""
Write-Host "=========================================="
