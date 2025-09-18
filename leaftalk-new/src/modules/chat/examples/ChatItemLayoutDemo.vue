<template>
  <div class="layout-demo">
    <h2>56px 聊天项布局演示</h2>
    
    <!-- 布局说明 -->
    <div class="layout-info">
      <h3>布局规格</h3>
      <ul>
        <li>📏 聊天项容器：56px 高度</li>
        <li>🖼️ 头像尺寸：44px × 44px</li>
        <li>📐 头像右边距：12px</li>
        <li>📝 昵称：单独一行</li>
        <li>💬 最后消息：下方一行</li>
        <li>⏰ 时间显示：与最后消息平行，右侧对齐</li>
        <li>🔴 未读徽章：头像右上角</li>
      </ul>
    </div>

    <!-- 聊天项演示 -->
    <div class="demo-container">
      <h3>聊天项样式演示</h3>
      
      <!-- 标准聊天项 -->
      <div class="chat-item">
        <div class="user-avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1" alt="张三" />
          <div class="unread-badge">3</div>
        </div>
        <div class="chat-user-info">
          <div class="user-details">
            <div class="user-name">张三</div>
            <div class="message-time-row">
              <div class="last-message">你好，最近怎么样？</div>
              <div class="chat-time">15:30</div>
            </div>
          </div>
          <div class="chat-meta">
            <div class="chat-status"></div>
          </div>
        </div>
      </div>

      <!-- 群聊项 -->
      <div class="chat-item">
        <div class="user-avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=group1" alt="技术交流群" />
          <div class="unread-badge large-count">99+</div>
        </div>
        <div class="chat-user-info">
          <div class="user-details">
            <div class="user-name">技术交流群</div>
            <div class="message-time-row">
              <div class="last-message">王五: 大家讨论一下新项目的技术方案</div>
              <div class="chat-time">昨天</div>
            </div>
          </div>
          <div class="chat-meta">
            <div class="chat-status"></div>
          </div>
        </div>
      </div>

      <!-- 静音聊天项 -->
      <div class="chat-item muted">
        <div class="user-avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user2" alt="李四" />
          <div class="red-dot"></div>
        </div>
        <div class="chat-user-info">
          <div class="user-details">
            <div class="user-name">李四</div>
            <div class="last-message">发送了一张图片</div>
          </div>
          <div class="chat-meta">
            <div class="chat-time">周三</div>
            <div class="chat-status">
              <iconify-icon icon="heroicons:speaker-x-mark" class="mute-icon" />
            </div>
          </div>
        </div>
      </div>

      <!-- 置顶聊天项 -->
      <div class="chat-item pinned">
        <div class="user-avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=family" alt="家庭群" />
          <div class="unread-badge">5</div>
        </div>
        <div class="chat-user-info">
          <div class="user-details">
            <div class="user-name">家庭群</div>
            <div class="last-message">妈妈: 晚上回来吃饭吗？</div>
          </div>
          <div class="chat-meta">
            <div class="chat-time">12:45</div>
            <div class="chat-status">
              <iconify-icon icon="heroicons:bookmark" class="pin-icon" />
            </div>
          </div>
        </div>
      </div>

      <!-- 无未读消息 -->
      <div class="chat-item">
        <div class="user-avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=user3" alt="王五" />
        </div>
        <div class="chat-user-info">
          <div class="user-details">
            <div class="user-name">王五</div>
            <div class="last-message">周末一起吃饭吧</div>
          </div>
          <div class="chat-meta">
            <div class="chat-time">上周</div>
          </div>
        </div>
      </div>

      <!-- 长昵称和长消息测试 -->
      <div class="chat-item">
        <div class="user-avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=longname" alt="很长很长的昵称测试用户" />
          <div class="unread-badge">1</div>
        </div>
        <div class="chat-user-info">
          <div class="user-details">
            <div class="user-name">很长很长的昵称测试用户名称</div>
            <div class="last-message">这是一条很长很长的消息内容，用来测试文本溢出的处理效果</div>
          </div>
          <div class="chat-meta">
            <div class="chat-time">10:20</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 尺寸标注 -->
    <div class="size-annotation">
      <h3>尺寸标注</h3>
      <div class="annotation-item">
        <div class="size-demo">
          <div class="container-outline">
            <span class="size-label">56px</span>
            <div class="avatar-outline">
              <span class="size-label">44px</span>
            </div>
            <div class="margin-outline">
              <span class="size-label">12px</span>
            </div>
            <div class="content-outline">
              <div class="name-line">昵称</div>
              <div class="message-time-line">
                <span class="message-part">最后消息</span>
                <span class="time-part">时间</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 这是一个纯展示组件，不需要逻辑
</script>

<style scoped>
/* 引入聊天项样式 */
@import '../styles/ChatItemStyles.css';

.layout-demo {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.layout-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.layout-info ul {
  margin: 10px 0;
  padding-left: 20px;
}

.layout-info li {
  margin: 8px 0;
  color: #333;
  font-size: 14px;
}

.demo-container {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.demo-container h3 {
  padding: 15px 20px;
  margin: 0;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  color: #333;
}

/* 图标样式 */
.mute-icon {
  color: #999;
  font-size: 16px;
}

.pin-icon {
  color: #07c160;
  font-size: 14px;
}

/* 尺寸标注样式 */
.size-annotation {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.size-annotation h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.size-demo {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.container-outline {
  position: relative;
  height: 56px;
  border: 2px dashed #007bff;
  display: flex;
  align-items: center;
  padding: 6px 16px;
  background: rgba(0, 123, 255, 0.1);
}

.container-outline > .size-label {
  position: absolute;
  top: -25px;
  left: 0;
  background: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.avatar-outline {
  position: relative;
  width: 44px;
  height: 44px;
  border: 2px dashed #28a745;
  background: rgba(40, 167, 69, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.avatar-outline .size-label {
  background: #28a745;
  color: white;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: bold;
}

.margin-outline {
  position: relative;
  width: 12px;
  height: 44px;
  border: 2px dashed #ffc107;
  background: rgba(255, 193, 7, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.margin-outline .size-label {
  background: #ffc107;
  color: #333;
  padding: 1px 2px;
  border-radius: 2px;
  font-size: 8px;
  font-weight: bold;
  writing-mode: vertical-rl;
}

.content-outline {
  flex: 1;
  height: 44px;
  border: 2px dashed #dc3545;
  background: rgba(220, 53, 69, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 8px;
}

.name-line {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.message-time-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-part {
  color: #666;
  font-size: 12px;
  flex: 1;
}

.time-part {
  color: #999;
  font-size: 10px;
  margin-left: 8px;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}
</style>
