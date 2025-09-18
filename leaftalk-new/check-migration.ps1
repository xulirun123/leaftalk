# 检查迁移完整性脚本

Write-Host "检查迁移完整性..." -ForegroundColor Green

$modules = @("auth", "chat", "contacts", "genealogy", "moments", "payment", "wallet", "settings", "discover", "video", "user", "admin")

foreach ($module in $modules) {
    Write-Host "`n=== 检查模块: $module ===" -ForegroundColor Cyan
    
    $modulePath = "src\modules\$module"
    
    # 检查services
    $servicesPath = "$modulePath\services"
    $servicesCount = (Get-ChildItem $servicesPath -File -ErrorAction SilentlyContinue).Count
    Write-Host "  Services: $servicesCount 个文件" -ForegroundColor Yellow
    
    # 检查stores
    $storesPath = "$modulePath\stores"
    $storesCount = (Get-ChildItem $storesPath -File -ErrorAction SilentlyContinue).Count
    Write-Host "  Stores: $storesCount 个文件" -ForegroundColor Yellow
    
    # 检查pages
    $pagesPath = "$modulePath\pages"
    $pagesCount = (Get-ChildItem $pagesPath -File -ErrorAction SilentlyContinue).Count
    Write-Host "  Pages: $pagesCount 个文件" -ForegroundColor Yellow
    
    # 检查components
    $componentsPath = "$modulePath\components"
    $componentsCount = (Get-ChildItem $componentsPath -File -ErrorAction SilentlyContinue).Count
    Write-Host "  Components: $componentsCount 个文件" -ForegroundColor Yellow
    
    # 检查utils
    $utilsPath = "$modulePath\utils"
    $utilsCount = (Get-ChildItem $utilsPath -File -ErrorAction SilentlyContinue).Count
    Write-Host "  Utils: $utilsCount 个文件" -ForegroundColor Yellow
    
    $totalFiles = $servicesCount + $storesCount + $pagesCount + $componentsCount + $utilsCount
    Write-Host "  总计: $totalFiles 个文件" -ForegroundColor White
    
    if ($totalFiles -eq 0) {
        Write-Host "  ⚠️  模块为空!" -ForegroundColor Red
    } elseif ($totalFiles -lt 5) {
        Write-Host "  ⚠️  文件较少，可能不完整" -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ 模块看起来完整" -ForegroundColor Green
    }
}

Write-Host "`n=== 检查shared目录 ===" -ForegroundColor Cyan
$sharedDirs = @("api", "core", "services", "stores", "types", "utils", "composables", "router", "config", "constants", "i18n", "plugins")

foreach ($dir in $sharedDirs) {
    $dirPath = "src\shared\$dir"
    if (Test-Path $dirPath) {
        $fileCount = (Get-ChildItem $dirPath -File -Recurse -ErrorAction SilentlyContinue).Count
        Write-Host "  $dir : $fileCount 个文件 ✅" -ForegroundColor Green
    } else {
        Write-Host "  $dir : 目录不存在 ❌" -ForegroundColor Red
    }
}

Write-Host "`n=== 检查design-system目录 ===" -ForegroundColor Cyan
$designDirs = @("components", "layouts", "icons")

foreach ($dir in $designDirs) {
    $dirPath = "src\design-system\$dir"
    if (Test-Path $dirPath) {
        $fileCount = (Get-ChildItem $dirPath -File -Recurse -ErrorAction SilentlyContinue).Count
        Write-Host "  $dir : $fileCount 个文件 ✅" -ForegroundColor Green
    } else {
        Write-Host "  $dir : 目录不存在 ❌" -ForegroundColor Red
    }
}

Write-Host "`n=== 总体统计 ===" -ForegroundColor Cyan
$totalModuleFiles = 0
foreach ($module in $modules) {
    $modulePath = "src\modules\$module"
    $moduleFiles = (Get-ChildItem $modulePath -File -Recurse -ErrorAction SilentlyContinue).Count
    $totalModuleFiles += $moduleFiles
}

$totalSharedFiles = (Get-ChildItem "src\shared" -File -Recurse -ErrorAction SilentlyContinue).Count
$totalDesignFiles = (Get-ChildItem "src\design-system" -File -Recurse -ErrorAction SilentlyContinue).Count
$totalStyleFiles = (Get-ChildItem "src\styles" -File -Recurse -ErrorAction SilentlyContinue).Count
$totalAssetFiles = (Get-ChildItem "src\assets" -File -Recurse -ErrorAction SilentlyContinue).Count

Write-Host "  模块文件总数: $totalModuleFiles" -ForegroundColor White
Write-Host "  共享文件总数: $totalSharedFiles" -ForegroundColor White
Write-Host "  设计系统文件: $totalDesignFiles" -ForegroundColor White
Write-Host "  样式文件: $totalStyleFiles" -ForegroundColor White
Write-Host "  资源文件: $totalAssetFiles" -ForegroundColor White

$grandTotal = $totalModuleFiles + $totalSharedFiles + $totalDesignFiles + $totalStyleFiles + $totalAssetFiles
Write-Host "  项目文件总数: $grandTotal" -ForegroundColor Green

Write-Host "`n检查完成!" -ForegroundColor Green
