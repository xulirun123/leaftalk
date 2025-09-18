@echo off
echo ========================================
echo 修复现成文件适应新结构 - 一次性使用
echo ========================================

echo.
echo 已完成的修复：

echo.
echo 1. 从原项目复制现成文件
echo    - DiscoverHome.vue: 发现页面
echo    - GenealogyHome.vue: 族谱页面  
echo    - UserProfile.vue → ProfileHome.vue: 个人中心页面
echo    - 相关组件和服务文件

echo.
echo 2. 修复导入路径适应新结构
echo    - DiscoverHome.vue: 修复所有导入路径
echo    - GenealogyHome.vue: 修复所有导入路径
echo    - ProfileHome.vue: 修复所有导入路径
echo    - ContactsHome.vue: 修复store导入路径

echo.
echo 3. 统一使用appStore
echo    - 移除 useDiscoverStore → useAppStore
echo    - 移除 useAuthStore → useAppStore
echo    - 移除 useContactStore → useAppStore
echo    - 注释暂未实现的功能

echo.
echo 4. 创建模块文件
echo    - DiscoverModule.ts: 发现模块
echo    - GenealogyModule.ts: 族谱模块
echo    - ProfileModule.ts: 个人中心模块

echo.
echo 5. 注册所有模块
echo    - main.ts: 导入所有模块
echo    - moduleRegistry: 注册所有路由

echo.
echo 6. 修复User图标组件
echo    - 添加完整的SVG结构
echo    - 支持size、color、strokeWidth属性
echo    - 修复属性传递问题

echo.
echo 当前状态：
echo - ✅ 所有页面文件已复制并适应新结构
echo - ✅ 导入路径已修复
echo - ✅ 统一使用appStore
echo - ✅ 路由已注册
echo - ⚠️ 还有少量导入路径需要修复

echo.
echo 剩余问题：
echo - ContactsHome.vue: 还有store导入错误
echo - 部分组件路径可能需要调整
echo - 需要测试所有页面功能

echo.
echo ========================================
echo 现成文件修复基本完成！
echo ========================================

echo.
pause
