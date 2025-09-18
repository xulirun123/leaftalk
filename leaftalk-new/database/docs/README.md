# 叶语企业版数据库

## 📁 数据库文件

### 主要文件
- `leaftalk.mysql` - **叶语企业版MySQL数据库架构** (v3.0)

## 🚀 快速使用

### 数据库初始化
```bash
# MySQL命令行
mysql -u root -p < database/leaftalk.mysql

# 或在MySQL客户端中
source database/leaftalk.mysql;
```

### 数据库信息
- **数据库名**: `leaftalk_enterprise`
- **字符集**: `utf8mb4`
- **排序规则**: `utf8mb4_unicode_ci`
- **MySQL版本**: 8.0+

## 📊 表结构

### 核心表
1. **users** - 用户基础信息表
2. **user_settings** - 用户设置表
3. **user_friends** - 用户好友关系表
4. **chat_conversations** - 聊天会话表
5. **group_members** - 群组成员表
6. **chat_messages** - 聊天消息表
7. **videos** - 视频表
8. **video_likes** - 视频点赞表
9. **video_comments** - 视频评论表
10. **genealogy_surnames** - 族谱姓氏表
11. **genealogy_families** - 族谱家族表
12. **genealogy_members** - 族谱成员表

### 视图
- **user_friends_view** - 好友列表视图
- **conversation_list_view** - 会话列表视图
- **genealogy_families_view** - 族谱家族视图
- **videos_view** - 视频列表视图

## 📝 测试数据

包含完整的测试数据：
- 4个测试用户（admin, zhangsan, lisi, wangwu）
- 用户设置配置
- 好友关系网络
- 私聊和群聊会话
- 群组成员管理
- 示例聊天消息
- 族谱姓氏和家族数据
- 族谱成员信息

## ✅ 特点

- ✅ **无语法错误** - VS Code完美支持
- ✅ **标准MySQL** - 完全兼容MySQL 8.0+
- ✅ **完整约束** - 外键、索引、唯一约束
- ✅ **测试数据** - 开箱即用
- ✅ **简洁设计** - 核心功能齐全

## 🔧 使用建议

1. 确保MySQL版本8.0+
2. 使用utf8mb4字符集
3. 启用外键约束
4. 定期备份数据

## 📞 说明

使用 `.mysql` 扩展名确保VS Code正确识别MySQL语法，避免MSSQL语法检查器的干扰。
