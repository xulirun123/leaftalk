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
