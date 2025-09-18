<template>
  <div class="message-display-demo">
    <h2>聊天项消息显示演示</h2>
    
    <!-- 功能说明 -->
    <div class="demo-info">
      <h3>消息显示功能</h3>
      <ul>
        <li>✅ 文本消息：显示完整内容</li>
        <li>✅ 表情符号：正确显示 emoji</li>
        <li>✅ 图片消息：显示 [图片] 标识</li>
        <li>✅ 语音消息：显示 [语音] 标识</li>
        <li>✅ 视频消息：显示 [视频] 标识</li>
        <li>✅ 文件消息：显示 [文件] 标识</li>
        <li>✅ 位置消息：显示 [位置] 标识</li>
        <li>✅ 长文本：自动截断显示</li>
      </ul>
    </div>

    <!-- 消息类型演示 -->
    <div class="demo-section">
      <h3>不同消息类型演示</h3>
      <div class="chat-list">
        <!-- 文本消息 -->
        <div class="chat-item">
          <div class="user-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1" alt="张三" />
            <div class="unread-badge">1</div>
          </div>
          <div class="chat-user-info">
            <div class="user-details">
              <div class="user-name">张三</div>
              <div class="message-time-row">
                <div class="last-message" v-html="formatLastMessage('你好，最近怎么样？')"></div>
                <div class="chat-time">15:30</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 表情消息 -->
        <div class="chat-item">
          <div class="user-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user2" alt="李四" />
          </div>
          <div class="chat-user-info">
            <div class="user-details">
              <div class="user-name">李四</div>
              <div class="message-time-row">
                <div class="last-message" v-html="formatLastMessage('哈哈 :D 太好了 :) <3')"></div>
                <div class="chat-time">15:25</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 图片消息 -->
        <div class="chat-item">
          <div class="user-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user3" alt="王五" />
            <div class="unread-badge">3</div>
          </div>
          <div class="chat-user-info">
            <div class="user-details">
              <div class="user-name">王五</div>
              <div class="message-time-row">
                <div class="last-message" v-html="formatLastMessage({ type: 'image', content: 'image.jpg' })"></div>
                <div class="chat-time">15:20</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 语音消息 -->
        <div class="chat-item">
          <div class="user-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user4" alt="赵六" />
            <div class="unread-badge">2</div>
          </div>
          <div class="chat-user-info">
            <div class="user-details">
              <div class="user-name">赵六</div>
              <div class="message-time-row">
                <div class="last-message" v-html="formatLastMessage({ type: 'voice', content: 'voice.mp3' })"></div>
                <div class="chat-time">15:15</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 视频消息 -->
        <div class="chat-item">
          <div class="user-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user5" alt="钱七" />
          </div>
          <div class="chat-user-info">
            <div class="user-details">
              <div class="user-name">钱七</div>
              <div class="message-time-row">
                <div class="last-message" v-html="formatLastMessage({ type: 'video', content: 'video.mp4' })"></div>
                <div class="chat-time">15:10</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 文件消息 -->
        <div class="chat-item">
          <div class="user-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user6" alt="孙八" />
            <div class="unread-badge">1</div>
          </div>
          <div class="chat-user-info">
            <div class="user-details">
              <div class="user-name">孙八</div>
              <div class="message-time-row">
                <div class="last-message" v-html="formatLastMessage({ type: 'file', content: 'document.pdf' })"></div>
                <div class="chat-time">15:05</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 位置消息 -->
        <div class="chat-item">
          <div class="user-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user7" alt="周九" />
          </div>
          <div class="chat-user-info">
            <div class="user-details">
              <div class="user-name">周九</div>
              <div class="message-time-row">
                <div class="last-message" v-html="formatLastMessage({ type: 'location', content: '北京市朝阳区' })"></div>
                <div class="chat-time">15:00</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 长文本消息 -->
        <div class="chat-item">
          <div class="user-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user8" alt="吴十" />
            <div class="unread-badge">5</div>
          </div>
          <div class="chat-user-info">
            <div class="user-details">
              <div class="user-name">吴十</div>
              <div class="message-time-row">
                <div class="last-message" v-html="formatLastMessage('这是一条很长很长的消息内容，用来测试长文本的显示效果和截断功能，看看是否能正确处理')"></div>
                <div class="chat-time">14:55</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 自定义表情 -->
        <div class="chat-item">
          <div class="user-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user9" alt="郑十一" />
          </div>
          <div class="chat-user-info">
            <div class="user-details">
              <div class="user-name">郑十一</div>
              <div class="message-time-row">
                <div class="last-message" v-html="formatLastMessage('好的 [微笑] 没问题 [赞]')"></div>
                <div class="chat-time">14:50</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试工具 -->
    <div class="demo-section">
      <h3>消息格式化测试</h3>
      <div class="test-area">
        <div class="input-group">
          <label>输入消息内容：</label>
          <input v-model="testMessage" placeholder="输入要测试的消息内容" />
        </div>
        <div class="input-group">
          <label>消息类型：</label>
          <select v-model="testMessageType">
            <option value="text">文本</option>
            <option value="image">图片</option>
            <option value="voice">语音</option>
            <option value="video">视频</option>
            <option value="file">文件</option>
            <option value="location">位置</option>
          </select>
        </div>
        <div class="result">
          <strong>格式化结果：</strong>
          <div class="formatted-message" v-html="getTestResult()"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 测试数据
const testMessage = ref('你好 :) 这是测试 [微笑]')
const testMessageType = ref('text')

// 格式化最后一条消息内容（复制主组件的逻辑）
const formatLastMessage = (lastMessage: any): string => {
  if (!lastMessage) {
    return '暂无消息'
  }

  if (typeof lastMessage === 'string') {
    return formatMessageText(lastMessage)
  }

  if (typeof lastMessage === 'object') {
    switch (lastMessage.type) {
      case 'text':
        return formatMessageText(lastMessage.content || '')
      case 'image':
        return '<span class="message-type-indicator">[图片]</span>'
      case 'voice':
        return '<span class="message-type-indicator">[语音]</span>'
      case 'video':
        return '<span class="message-type-indicator">[视频]</span>'
      case 'file':
        return '<span class="message-type-indicator">[文件]</span>'
      case 'location':
        return '<span class="message-type-indicator">[位置]</span>'
      case 'emoji':
        return formatMessageText(lastMessage.content || '')
      case 'sticker':
        return '<span class="message-type-indicator">[表情]</span>'
      default:
        return formatMessageText(lastMessage.content || lastMessage.text || '未知消息')
    }
  }

  return '暂无消息'
}

const formatMessageText = (text: string): string => {
  if (!text) return ''
  
  let formattedText = text
  
  const emojiMap: Record<string, string> = {
    ':)': '😊',
    ':-)': '😊',
    ':(': '😢',
    ':-(': '😢',
    ':D': '😃',
    ':-D': '😃',
    ':P': '😛',
    ':-P': '😛',
    ';)': '😉',
    ';-)': '😉',
    ':o': '😮',
    ':-o': '😮',
    ':*': '😘',
    ':-*': '😘',
    '<3': '❤️',
    '</3': '💔',
    ':thumbsup:': '👍',
    ':thumbsdown:': '👎',
    ':heart:': '❤️',
    ':fire:': '🔥',
    ':100:': '💯'
  }

  Object.entries(emojiMap).forEach(([text, emoji]) => {
    const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    formattedText = formattedText.replace(regex, emoji)
  })

  formattedText = formattedText.replace(/\[([^\]]+)\]/g, (match, emojiName) => {
    const customEmojiMap: Record<string, string> = {
      '微笑': '😊',
      '大笑': '😂',
      '哭泣': '😭',
      '生气': '😠',
      '惊讶': '😱',
      '爱心': '❤️',
      '赞': '👍',
      '踩': '👎',
      '握手': '🤝',
      '拥抱': '🤗'
    }
    
    return customEmojiMap[emojiName] || match
  })

  if (formattedText.length > 30) {
    formattedText = formattedText.substring(0, 30) + '...'
  }

  return formattedText
}

// 获取测试结果
const getTestResult = () => {
  if (testMessageType.value === 'text') {
    return formatLastMessage(testMessage.value)
  } else {
    return formatLastMessage({
      type: testMessageType.value,
      content: testMessage.value
    })
  }
}
</script>

<style scoped>
/* 引入聊天项样式 */
@import '../styles/ChatItemStyles.css';

.message-display-demo {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.demo-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.demo-info ul {
  margin: 10px 0;
  padding-left: 20px;
}

.demo-info li {
  margin: 5px 0;
  color: #333;
  font-size: 14px;
}

.demo-section {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.demo-section h3 {
  padding: 15px 20px;
  margin: 0;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  color: #333;
}

.chat-list {
  background: white;
}

.test-area {
  padding: 20px;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.result {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #07c160;
}

.formatted-message {
  margin-top: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  font-family: inherit;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

/* 消息类型指示器样式 */
.message-type-indicator {
  color: #666;
  font-style: italic;
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 12px;
}
</style>
