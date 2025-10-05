# 叶语项目服务器连接脚本
# 服务器: 120.24.148.204
# 用户: root
# 密码: 314077060@qq.com

$serverIP = "120.24.148.204"
$username = "root"
$password = "314077060@qq.com"

Write-Host "=========================================="
Write-Host "连接叶语项目服务器"
Write-Host "服务器: $serverIP"
Write-Host "用户: $username"
Write-Host "=========================================="

# 检查SSH连接
Write-Host ""
Write-Host "🔌 测试SSH连接..."

try {
    # 使用plink测试连接（如果有PuTTY）
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        Write-Host "使用PuTTY plink连接..."
        $result = echo y | plink -ssh -l $username -pw $password $serverIP "echo 'SSH连接成功'"
        Write-Host "连接结果: $result"
    }
    # 或者使用PowerShell的SSH模块
    elseif (Get-Module -ListAvailable -Name Posh-SSH) {
        Write-Host "使用Posh-SSH模块连接..."
        Import-Module Posh-SSH
        $securePassword = ConvertTo-SecureString $password -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential ($username, $securePassword)
        $session = New-SSHSession -ComputerName $serverIP -Credential $credential -AcceptKey
        if ($session) {
            Write-Host "✅ SSH连接成功"
            $result = Invoke-SSHCommand -SessionId $session.SessionId -Command "echo 'SSH连接测试成功'"
            Write-Host "测试结果: $($result.Output)"
            Remove-SSHSession -SessionId $session.SessionId
        }
    }
    else {
        Write-Host "⚠️ 未找到SSH客户端工具"
        Write-Host "请安装以下工具之一："
        Write-Host "1. PuTTY (包含plink)"
        Write-Host "2. PowerShell SSH模块: Install-Module -Name Posh-SSH"
        Write-Host "3. Windows OpenSSH客户端"
    }
}
catch {
    Write-Host "❌ SSH连接失败: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "📝 手动连接命令："
Write-Host "ssh root@$serverIP"
Write-Host "密码: $password"

Write-Host ""
Write-Host "🔧 如果需要安装SSH工具："
Write-Host "1. 安装PuTTY: https://www.putty.org/"
Write-Host "2. 安装PowerShell SSH模块:"
Write-Host "   Install-Module -Name Posh-SSH -Force"
Write-Host "3. 启用Windows OpenSSH:"
Write-Host "   Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0"

Write-Host ""
Write-Host "=========================================="
