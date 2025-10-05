# 聊天内容查找功能说明

## 功能概述

聊天内容查找功能允许用户按照不同的类型和时间范围搜索聊天记录，支持多种消息类型的分类查找。

## 访问方式

### 路由地址
```
/chat-search/:chatId?
```

### 访问方法
1. **搜索所有聊天记录**：
   ```javascript
router.push('/chat-search')
   // 或者带关键词
   router.push({ path: '/chat-search', query: { keyword: '搜索关键词' } })
```

2. **搜索特定聊天的记录**：
   ```javascript
// 搜索特定聊天（如 chat_15_2）
   router.push('/chat-search/chat_15_2')
```

3. **直接访问**：
   - 搜索所有：`http://localhost:3000/chat-search`
   - 搜索特定聊天：`http://localhost:3000/chat-search/chat_15_2`

## 功能特性

### 1. 搜索筛选

#### 日期筛选
- **全部时间**：显示所有时间范围的消息
- **今天**：只显示今天的消息
- **最近一周**：显示最近7天的消息
- **最近一月**：显示最近30天的消息
- **最近一年**：显示最近365天的消息

#### 类型筛选
支持以下13种消息类型的分类查找：

1. **全部** - 显示所有类型的消息
2. **文字** - 文本消息
3. **图片** - 图片消息
4. **视频** - 视频消息
5. **语音** - 语音消息
6. **文件** - 文件消息
7. **链接** - 链接消息
8. **音乐** - 音乐消息
9. **小程序** - 小程序消息
10. **视频号** - 视频号消息
11. **位置** - 位置消息
12. **红包** - 红包消息
13. **转账** - 转账消息

### 2. 搜索功能

- **关键词搜索**：支持搜索消息内容、聊天名称、发送者名称
- **关键词高亮**：搜索结果中的关键词会被高亮显示
- **实时搜索**：输入关键词后自动搜索
- **清除搜索**：点击清除按钮快速清空搜索内容

### 3. 搜索历史

- **最近搜索**：自动保存最近10次搜索记录
- **快速搜索**：点击历史记录快速重新搜索
- **删除记录**：可以删除单条搜索历史

### 4. 搜索结果

每条搜索结果显示：
- **聊天头像**：发送者或群组头像
- **聊天名称**：联系人或群组名称
- **消息时间**：消息发送时间（智能显示）
- **发送者**：群聊中显示发送者名称
- **消息内容**：根据消息类型显示不同的内容
- **消息类型**：显示消息类型图标和文字

### 5. 消息类型显示

不同类型的消息有不同的显示方式：

- **文字消息**：直接显示文本内容，关键词高亮
- **图片消息**：显示 `[图片]` 标识和文件名
- **视频消息**：显示 `[视频]` 标识和时长
- **语音消息**：显示 `[语音]` 标识和时长
- **文件消息**：显示 `[文件]` 标识、文件名和大小
- **链接消息**：显示 `[链接]` 标识和链接标题
- **音乐消息**：显示 `[音乐]` 标识、歌曲名和歌手
- **小程序消息**：显示 `[小程序]` 标识和小程序名称
- **视频号消息**：显示 `[视频号]` 标识和视频标题
- **位置消息**：显示 `[位置]` 标识、地点名称和地址
- **红包消息**：显示 `[红包]` 标识和金额
- **转账消息**：显示 `[转账]` 标识和金额

## 使用示例

### 示例1：搜索文字消息
1. 打开聊天搜索页面
2. 在搜索框输入关键词，如"家族聚会"
3. 点击"文字"筛选标签
4. 查看搜索结果

### 示例2：查找最近一周的图片
1. 打开聊天搜索页面
2. 点击"最近一周"日期筛选
3. 点击"图片"类型筛选
4. 浏览所有最近一周的图片消息

### 示例3：查找红包记录
1. 打开聊天搜索页面
2. 点击"红包"类型筛选
3. 查看所有红包消息记录

### 示例4：搜索特定聊天的内容
1. 从聊天详情页点击"查找聊天内容"
2. 自动跳转到该聊天的搜索页面
3. 输入关键词搜索该聊天中的消息
4. 页面标题显示为"搜索"聊天名称""

## 技术实现

### 组件位置
```
leaftalk-new/src/modules/chat/pages/ChatSearch.vue
```

### 路由配置
```javascript
{
  path: '/chat-search',
  name: 'ChatSearch',
  component: () => import('../modules/chat/pages/ChatSearch.vue'),
  meta: {
    title: '搜索聊天记录',
    requiresAuth: true,
    keepAlive: false,
    hideTabBar: true
  }
}
```

### 数据结构

#### 搜索结果数据结构
```javascript
{
  id: Number,              // 消息ID
  chatId: String,          // 聊天ID
  chatName: String,        // 聊天名称
  chatAvatar: String,      // 聊天头像
  isGroup: Boolean,        // 是否群聊
  senderId: String,        // 发送者ID
  senderName: String,      // 发送者名称
  type: String,            // 消息类型
  content: String,         // 消息内容
  timestamp: Date,         // 消息时间
  // 以下字段根据消息类型可选
  imageUrl: String,        // 图片URL
  fileSize: String,        // 文件大小
  duration: String,        // 时长
  linkUrl: String,         // 链接URL
  linkTitle: String,       // 链接标题
  musicTitle: String,      // 音乐标题
  artist: String,          // 歌手
  miniprogramName: String, // 小程序名称
  videoChannelTitle: String, // 视频号标题
  locationName: String,    // 地点名称
  address: String,         // 地址
  amount: String           // 金额
}
```

## 后续优化建议

1. **连接真实数据**：当前使用模拟数据，需要连接真实的聊天记录数据库
2. **性能优化**：大量数据时使用虚拟滚动提升性能
3. **高级搜索**：支持按发送者、按聊天筛选
4. **导出功能**：支持导出搜索结果
5. **消息定位**：点击搜索结果后跳转到聊天页面并定位到具体消息

## 注意事项

1. 当前页面使用模拟数据，实际使用时需要连接真实的聊天记录API
2. 搜索历史保存在组件内存中，刷新页面后会丢失，建议使用 localStorage 持久化
3. 日期筛选和类型筛选可以组合使用
4. 搜索结果按时间倒序排列（最新的在前）


  }
}));

// 处理 SPA 路由 - 所有非API和非静态资源请求都返回index.html
app.get('*', (req, res) => {
  // 排除API请求
  if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // 排除静态资源请求（assets目录下的文件）
  if (req.path.startsWith('/assets/')) {
    return res.status(404).send('File not found');
  }

  console.log(`📄 SPA路由: ${req.path} -> index.html`);

  // 设置 index.html 的缓存控制头
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.FRONTEND_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 前端服务器运行在 http://localhost:${PORT}`);
});