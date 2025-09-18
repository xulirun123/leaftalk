# 创建叶语新项目结构

Write-Host "创建叶语新项目结构..." -ForegroundColor Green

# 创建根目录结构
$rootDirs = @(
    "src",
    "public", 
    "docs",
    "scripts",
    "tests"
)

foreach ($dir in $rootDirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "创建: $dir" -ForegroundColor Yellow
}

# 创建src下的主要目录
$srcDirs = @(
    "src\modules",
    "src\shared", 
    "src\design-system",
    "src\assets",
    "src\styles"
)

foreach ($dir in $srcDirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "创建: $dir" -ForegroundColor Yellow
}

# 创建模块目录
$modules = @("auth", "chat", "contacts", "genealogy", "moments", "payment", "wallet", "settings", "discover", "video", "user", "admin")
$moduleSubDirs = @("components", "pages", "services", "stores", "types", "utils", "composables")

foreach ($module in $modules) {
    foreach ($subDir in $moduleSubDirs) {
        $path = "src\modules\$module\$subDir"
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
    Write-Host "创建模块: $module" -ForegroundColor Cyan
}

# 创建shared目录结构
$sharedDirs = @(
    "src\shared\api",
    "src\shared\core", 
    "src\shared\services",
    "src\shared\stores",
    "src\shared\types",
    "src\shared\utils",
    "src\shared\composables",
    "src\shared\constants"
)

foreach ($dir in $sharedDirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}
Write-Host "创建共享目录结构" -ForegroundColor Cyan

# 创建设计系统目录
$designDirs = @(
    "src\design-system\components",
    "src\design-system\layouts", 
    "src\design-system\icons",
    "src\design-system\tokens"
)

foreach ($dir in $designDirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}
Write-Host "创建设计系统目录" -ForegroundColor Cyan

# 创建样式目录
$styleDirs = @(
    "src\styles\base",
    "src\styles\components",
    "src\styles\layouts", 
    "src\styles\themes"
)

foreach ($dir in $styleDirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}
Write-Host "创建样式目录" -ForegroundColor Cyan

Write-Host "新项目结构创建完成！" -ForegroundColor Green
