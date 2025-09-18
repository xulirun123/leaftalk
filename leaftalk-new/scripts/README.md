# 叶语项目脚本说明

## 📁 脚本目录结构

```
scripts/
├── install-all.bat          # 一键安装所有依赖
├── install-client-deps.bat  # 安装前端依赖
├── install-server-deps.bat  # 安装后端依赖
├── start-dev.bat           # 启动开发环境
├── show-users.bat          # 查询用户数据
├── quick-login.bat         # 快速登录助手
└── README.md              # 本说明文件
```

## 🚀 快速开始

### 1. 首次部署
```bash
# 安装所有依赖
scripts\install-all.bat

# 启动开发环境
scripts\start-dev.bat
```

### 2. 日常开发
```bash
# 启动开发环境
scripts\start-dev.bat

# 查看用户数据
scripts\show-users.bat

# 快速登录
scripts\quick-login.bat
```

## 📊 测试账号

### 已实名认证用户
- **阳静达** (ID: 1) - 真实姓名: 谭如英
- **兴海清** (ID: 2) - 真实姓名: 徐礼润

### 测试用户
- **用户名**: testuser
- **密码**: 123456
- **手机号**: 17872886600

## 🔧 服务地址

- **前端应用**: http://127.0.0.1:5173
- **后端API**: http://127.0.0.1:8893
- **健康检查**: http://127.0.0.1:8893/api/health
- **用户列表**: http://127.0.0.1:8893/api/dev/users

## ⚠️ 注意事项

1. **数据库**: 确保MySQL服务已启动 (端口3306)
2. **缓存**: 确保Redis服务已启动 (端口6379)
3. **环境**: 需要Node.js 16+ 版本

## 📝 实名认证说明

- 已认证用户访问 `/verify-identity` 会自动跳转到聊天页面
- 未认证用户可以正常进行实名认证流程
- 数据库字段使用 `is_verified` 标识认证状态

## 🛠️ 开发工具

- **Vite**: 前端构建工具
- **Vue 3**: 前端框架
- **Express**: 后端框架
- **MySQL**: 数据库
- **Redis**: 缓存
- **Socket.IO**: WebSocket通信
