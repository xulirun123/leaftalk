# 叶语新版 - 数据库配置说明

## 数据库配置

### 当前配置
- **主机**: localhost
- **端口**: 3306
- **用户**: root
- **密码**: password
- **数据库**: leaftalk-new

### 环境变量配置

可以通过环境变量覆盖默认配置：

```bash
# 数据库主机
DB_HOST=localhost

# 数据库端口
DB_PORT=3306

# 数据库用户
DB_USER=root

# 数据库密码
DB_PASSWORD=password

# 数据库名称
DB_NAME=leaftalk-new
```

### 生产环境建议

1. **修改默认密码**: 不要使用默认密码 "password"
2. **创建专用用户**: 不要使用 root 用户
3. **限制权限**: 只授予必要的数据库权限
4. **使用SSL**: 启用数据库SSL连接

### 安全配置示例

```sql
-- 创建专用数据库用户
CREATE USER 'leaftalk_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- 创建数据库
CREATE DATABASE leaftalk_enterprise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 授予权限
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX ON leaftalk_enterprise.* TO 'leaftalk_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

### 环境变量设置

```bash
# 设置环境变量
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=leaftalk_user
export DB_PASSWORD=your_secure_password
export DB_NAME=leaftalk_enterprise
```

### 数据库表结构

系统会自动创建以下表：

1. **users** - 用户表
2. **genealogies** - 族谱表
3. **genealogy_members** - 族谱成员表
4. **user_identities** - 身份认证表
5. **chats** - 聊天表
6. **chat_participants** - 聊天参与者表
7. **messages** - 消息表
8. **friendships** - 好友关系表
9. **ocr_history** - OCR历史表

### 故障排除

如果数据库连接失败，请检查：

1. MySQL服务是否启动
2. 用户名和密码是否正确
3. 数据库是否存在
4. 网络连接是否正常
5. 防火墙设置是否正确

### 备份建议

定期备份数据库：

```bash
# 备份数据库
mysqldump -u root -p leaftalk_enterprise > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
mysql -u root -p leaftalk_enterprise < backup_file.sql
```
    console.error('❌ 服务器拒绝连接，可能服务器未启动')
  } else if (error.message.includes('timeout')) {
    console.error('❌ 连接超时，网络可能有问题')
  }
  handleReconnect()
})
```

## 🚀 快速启动指南

### 1. 启动监控服务器
```bash
cd leaftalk-new/server
npm run monitor
```

### 2. 测试 WebSocket 连接
打开浏览器访问: `file:///f:/leaftalk/leaftalk-new/websocket-test.html`

### 3. 检查服务器状态
- **健康检查**: http://localhost:8893/health
- **服务器状态**: 查看控制台输出
- **监控日志**: `server/logs/monitor.log`

## 📊 监控和诊断

### 服务器状态检查
```bash
# 检查端口占用
netstat -an | findstr :8893

# 检查进程
tasklist | findstr node

# 查看日志
type server\logs\monitor.log
```

### WebSocket 连接测试
使用提供的测试工具 `websocket-test.html`:
- ✅ 连接状态监控
- ✅ 自动重连测试
- ✅ 健康检查测试
- ✅ 详细日志记录

## 🔧 故障排除

### 常见问题和解决方案

#### 1. 端口被占用
```bash
# 查找占用进程
netstat -ano | findstr :8893

# 结束进程
taskkill /PID <进程ID> /F
```

#### 2. 数据库连接失败
- 检查 MySQL 服务是否运行
- 验证 `.env` 文件中的数据库配置
- 确认数据库 `leaftalk-new` 存在

#### 3. 依赖缺失
```bash
cd server
npm install
```

#### 4. 权限问题
- 以管理员身份运行命令提示符
- 检查防火墙设置

## 📈 性能优化建议

### 1. 服务器配置
- 使用 PM2 进行生产环境部署
- 配置负载均衡
- 启用 Redis 缓存

### 2. 网络优化
- 使用 CDN 加速静态资源
- 启用 gzip 压缩
- 优化 WebSocket 心跳间隔

### 3. 监控告警
- 集成监控系统 (如 Prometheus)
- 配置告警通知
- 定期性能分析

## 📝 日志文件说明

- `logs/monitor.log`: 监控器日志
- `logs/application-*.log`: 应用程序日志
- `logs/error-*.log`: 错误日志
- `logs/access-*.log`: 访问日志

## 🎯 最佳实践

1. **始终使用监控器启动服务器**
2. **定期检查日志文件**
3. **监控服务器资源使用情况**
4. **及时更新依赖包**
5. **备份重要数据**

---

通过以上解决方案，WebSocket 连接的稳定性将大大提升，服务器崩溃问题也会得到有效解决。
