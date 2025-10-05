# 叶语项目部署问题修复指南

## 问题描述
在项目打包部署时遇到 JavaScript 语法错误：
```
SyntaxError: Invalid or unexpected token (at index-n-p0kvY0.js:1:13)
```

## 问题原因
这个错误通常由以下原因引起：
1. 构建过程中文件损坏
2. 文件编码问题
3. 缓存问题
4. 构建配置问题

## 解决方案

### 方法一：使用自动修复脚本（推荐）
```bash
# 在项目根目录运行
node fix-deployment.js
```

这个脚本会自动：
1. 检查项目结构
2. 清理旧的构建文件
3. 重新安装依赖
4. 重新构建项目
5. 验证构建结果
6. 启动预览服务器

### 方法二：手动修复步骤

#### 1. 清理构建缓存
```bash
# 删除 dist 目录
Remove-Item -Recurse -Force dist

# 清理 node_modules（可选）
Remove-Item -Recurse -Force node_modules
npm install
```

#### 2. 重新构建
```bash
npm run build
```

#### 3. 验证构建
```bash
node test-build.js
```

#### 4. 测试应用
```bash
npm run preview
```

### 方法三：检查特定问题

#### 检查 Vite 配置
确保 `vite.config.ts` 中的构建配置正确：
```typescript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    assetsInlineLimit: 4096,
    cssCodeSplit: true
  }
})
```

#### 检查文件编码
确保所有源文件都是 UTF-8 编码，特别是包含中文的文件。

#### 检查依赖版本
确保所有依赖都是兼容的版本：
```bash
npm audit
npm update
```

## 预防措施

1. **定期清理构建缓存**
   ```bash
   npm run build -- --force
   ```

2. **使用固定的依赖版本**
   在 `package.json` 中使用精确版本号而不是范围版本。

3. **设置正确的编码**
   确保编辑器和构建环境都使用 UTF-8 编码。

4. **监控构建过程**
   注意构建过程中的警告信息。

## 常见错误和解决方案

### 错误：模块未找到
```bash
npm install
```

### 错误：权限问题
```bash
# Windows PowerShell 以管理员身份运行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 错误：内存不足
```bash
# 增加 Node.js 内存限制
set NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

## 验证部署成功

1. 构建完成后，检查 `dist` 目录是否包含所有必要文件
2. 运行 `npm run preview` 启动预览服务器
3. 在浏览器中访问 `http://127.0.0.1:1420/`
4. 检查浏览器控制台是否有错误
5. 测试应用的基本功能

## 联系支持

如果问题仍然存在，请提供：
1. 完整的错误信息
2. 构建日志
3. 浏览器控制台错误
4. 系统环境信息（Node.js 版本、npm 版本等）

---

**注意**: 本地开发环境正常但部署失败通常是构建配置或环境差异导致的。按照上述步骤操作通常可以解决问题。
