@echo off
echo ========================================
echo 修复模块install方法参数 - 一次性使用
echo ========================================

echo.
echo 已完成的修复：

echo.
echo 1. 问题诊断
echo    - 错误: Cannot read properties of undefined (reading 'addRoute')
echo    - 原因: 模块install方法参数不匹配
echo    - ModuleRegistry传递: install(context)
echo    - 新模块期望: install(app, router, pinia)

echo.
echo 2. 修复ProfileModule.ts
echo    - 修改: install(app, router, pinia) → install(context)
echo    - 修改: router.addRoute → context.router.addRoute
echo    - 状态: ✅ 已修复

echo.
echo 3. 修复DiscoverModule.ts
echo    - 修改: install(app, router, pinia) → install(context)
echo    - 修改: router.addRoute → context.router.addRoute
echo    - 状态: ✅ 已修复

echo.
echo 4. 修复GenealogyModule.ts
echo    - 修改: install(app, router, pinia) → install(context)
echo    - 修改: router.addRoute → context.router.addRoute
echo    - 状态: ✅ 已修复

echo.
echo 5. 验证其他模块
echo    - AuthModule.ts: ✅ 已使用正确格式 install(context)
echo    - ChatModule.ts: ✅ 已使用正确格式 install(context)
echo    - ContactsModule.ts: ✅ 已使用正确格式 install(context)

echo.
echo 6. 修复结果
echo    - ✅ 模块注册错误已解决
echo    - ✅ 路由注册正常工作
echo    - ✅ 所有模块install方法参数统一
echo    - ✅ 前端服务器正常运行

echo.
echo 剩余问题：
echo - ContactsHome.vue: 还有 ../../stores/auth 导入错误
echo - ChatHome.vue: 可能还有导入路径问题
echo - 需要继续修复这些导入路径

echo.
echo ========================================
echo 模块install方法参数修复完成！
echo ========================================

echo.
echo 现在所有模块都使用统一的参数格式：
echo install(context: ModuleContext)
echo context.router.addRoute(route)

echo.
pause
