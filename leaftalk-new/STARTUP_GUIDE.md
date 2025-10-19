# 群管理功能 - 启动指南

## 🚀 快速启动

### 方式 1: 一键启动（推荐）

```bash
npm run start:simple
```

这个命令会同时启动后端和前端服务器。

**预期输出**:
```
[SERVER] 服务器运行在 http://localhost:8893
[CLIENT] 前端运行在 http://localhost:5173
```

---

### 方式 2: 分别启动

#### 步骤 1: 启动后端服务器

打开第一个终端，运行：
```bash
npm run server
```

**预期输出**:
```
✅ 服务器运行在 http://localhost:8893
✅ 数据库连接成功
✅ Redis 连接成功
```

#### 步骤 2: 启动前端开发服务器

打开第二个终端，运行：
```bash
npm run dev
```

**预期输出**:
```
✅ 前端运行在 http://localhost:5173
✅ HMR 已启用
```

---

## 🌐 访问应用

### 打开浏览器

访问: **http://localhost:5173**

### 登录应用

使用测试账号登录（具体账号信息请咨询项目管理员）

---

## 📍 进入群管理页面

### 导航路径

```
1. 点击底部导航栏的"聊天"
   ↓
2. 选择任意一个群聊
   ↓
3. 点击顶部的群聊名称或信息按钮
   ↓
4. 进入群聊信息页面
   ↓
5. 向下滚动找到"群管理"按钮
   ↓
6. 点击"群管理"进入群管理页面
```

### 直接访问

如果知道群聊 ID，可以直接访问：
```
http://localhost:5173/group-management/{groupId}
```

例如：
```
http://localhost:5173/group-management/group_1760709734798
```

---

## 🔍 验证启动成功

### 检查后端

打开浏览器，访问：
```
http://localhost:8893/health
```

**预期响应**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 检查前端

打开浏览器，访问：
```
http://localhost:5173
```

**预期结果**: 看到叶语应用的登录页面

### 检查群管理页面

登录后，按照上面的导航路径进入群管理页面。

**预期结果**: 看到完整的群管理界面，包括：
- ✅ 群信息卡片
- ✅ 成员管理区域
- ✅ 群设置区域
- ✅ 高级设置区域

---

## 🐛 常见问题排查

### 问题 1: 后端连接失败

**症状**: 浏览器控制台显示 `net::ERR_CONNECTION_REFUSED`

**原因**: 后端服务器未启动或端口被占用

**解决方案**:
```bash
# 1. 确保后端服务器正在运行
npm run server

# 2. 如果端口被占用，杀死占用进程
# Windows:
netstat -ano | findstr :8893
taskkill /PID {PID} /F

# Mac/Linux:
lsof -i :8893
kill -9 {PID}
```

### 问题 2: 前端页面显示"功能建设中"

**症状**: 群管理页面显示"功能建设中"

**原因**: 前端代码未热更新

**解决方案**:
```bash
# 1. 刷新浏览器
Ctrl+R (Windows) 或 Cmd+R (Mac)

# 2. 清除浏览器缓存
Ctrl+Shift+Delete (Windows) 或 Cmd+Shift+Delete (Mac)

# 3. 重启前端开发服务器
npm run dev
```

### 问题 3: API 返回 401 Unauthorized

**症状**: 浏览器控制台显示 `401 Unauthorized`

**原因**: 用户未认证或 token 过期

**解决方案**:
```bash
# 1. 重新登录应用
# 2. 检查 localStorage 中的 token
# 3. 检查 Authorization 请求头
```

### 问题 4: 群组信息加载失败

**症状**: 浏览器控制台显示 `❌ 加载群组信息失败`

**原因**: 后端 API 未实现或返回错误

**解决方案**:
```bash
# 1. 检查后端是否实现了 API
# 2. 查看浏览器 Network 标签中的请求
# 3. 参考 BACKEND_API_REQUIREMENTS.md 实现 API
```

---

## 📊 浏览器控制台日志

### 成功的日志

```
✅ 群组信息加载成功: {
  id: 'group_1760709734798',
  name: '测试群聊',
  avatar: 'https://...',
  memberCount: 5,
  createTime: 1234567890
}

✅ 群成员加载成功: [
  { id: 1, nickname: '张三', avatar: '...', role: 'owner' },
  { id: 2, nickname: '李四', avatar: '...', role: 'member' }
]
```

### 错误的日志

```
❌ 加载群组信息失败: TypeError: Failed to fetch
❌ 加载群成员失败: TypeError: Failed to fetch
```

---

## 🔧 环境要求

### 系统要求
- Node.js 14.0 或更高版本
- npm 6.0 或更高版本
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 依赖要求
- MySQL 5.7 或更高版本
- Redis 5.0 或更高版本（可选）

### 端口要求
- 前端: 5173
- 后端: 8893
- MySQL: 3306
- Redis: 6379

---

## 📝 启动脚本

### 查看所有可用脚本

```bash
npm run
```

### 常用脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动前端开发服务器 |
| `npm run server` | 启动后端服务器 |
| `npm run start:simple` | 同时启动前后端 |
| `npm run build` | 构建前端生产版本 |
| `npm run preview` | 预览生产版本 |

---

## 🎯 下一步

### 1. 启动应用
```bash
npm run start:simple
```

### 2. 打开浏览器
访问 http://localhost:5173

### 3. 登录应用
使用测试账号登录

### 4. 进入群管理
按照导航路径进入群管理页面

### 5. 验证功能
检查群信息是否正确显示

### 6. 查看日志
打开浏览器控制台（F12）查看日志

---

## 📞 获取帮助

### 查看文档
- `README_GROUP_MANAGEMENT.md` - 完整指南
- `QUICK_REFERENCE.md` - 快速参考
- `GROUP_MANAGEMENT_TESTING_GUIDE.md` - 测试指南
- `BACKEND_API_REQUIREMENTS.md` - API 需求

### 检查日志
- 浏览器控制台 (F12)
- 后端服务器输出
- 前端开发服务器输出

### 常见问题
- 查看本文档的"常见问题排查"部分

---

## ✅ 启动检查清单

启动前检查:
- [ ] Node.js 已安装
- [ ] npm 依赖已安装 (`npm install`)
- [ ] 数据库已初始化 (`npm run init`)
- [ ] 端口 5173 和 8893 未被占用

启动后检查:
- [ ] 后端运行在 http://localhost:8893
- [ ] 前端运行在 http://localhost:5173
- [ ] 可以正常登录
- [ ] 可以进入群聊
- [ ] 可以打开群管理页面
- [ ] 浏览器控制台无错误

---

## 🎉 启动成功

当以下条件都满足时，启动成功：

- [x] 后端服务器正在运行
- [x] 前端开发服务器正在运行
- [x] 可以访问 http://localhost:5173
- [x] 可以登录应用
- [x] 可以进入群管理页面
- [x] 群信息正确显示
- [x] 浏览器控制台无错误

---

**启动指南完成**
**最后更新**: 2024年
**版本**: 1.0

