# VS Code MySQL配置指南

## 配置说明

为了确保所有SQL文件都使用MySQL语法检查，请将以下配置添加到你的VS Code设置中：

### 方法1：项目级配置（推荐）
项目已配置 `.vscode/settings.json` 文件，配置已自动生效。

### 方法2：用户级配置
在VS Code中按 `Ctrl+,` 打开设置，搜索 "files.associations"，添加：
```json
{
  "files.associations": {
    "*.sql": "mysql"
  },
  "sql.dialect": "mysql",
  "mssql.enableIntelliSense": false
}
```

## 配置效果

✅ **配置已生效！** 你现在拥有：
- ✅ 正确的MySQL语法高亮
- ✅ MySQL语法检查
- ✅ MySQL自动完成
- ✅ 无MSSQL语法错误干扰
- ✅ 所有SQL文件语法检查正常

## 数据库连接

如果需要在VS Code中连接MySQL数据库，推荐安装 "SQLTools" 扩展，并使用项目中预配置的连接信息。

## 统一标准

本项目统一使用MySQL数据库，所有SQL文件都应该遵循MySQL语法标准。
