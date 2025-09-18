<template>
  <div class="help">
    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 搜索帮助 -->
      <div class="search-section">
        <div class="search-bar">
          <iconify-icon icon="heroicons:magnifying-glass" width="20" style="color: #999;"></iconify-icon>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索帮助内容" 
            class="search-input"
          />
        </div>
      </div>

      <!-- 常见问题 -->
      <div class="settings-section">
        <div class="section-title">常见问题</div>
        <div class="setting-item" @click="viewFAQ('login')">
          <div class="setting-info">
            <span>登录问题</span>
            <span class="setting-desc">无法登录、忘记密码等</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="viewFAQ('message')">
          <div class="setting-info">
            <span>消息问题</span>
            <span class="setting-desc">消息发送失败、接收延迟等</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="viewFAQ('payment')">
          <div class="setting-info">
            <span>支付问题</span>
            <span class="setting-desc">支付失败、退款等</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="viewFAQ('account')">
          <div class="setting-info">
            <span>账户安全</span>
            <span class="setting-desc">账户被盗、安全设置等</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 功能指南 -->
      <div class="settings-section">
        <div class="section-title">功能指南</div>
        <div class="setting-item" @click="viewGuide('chat')">
          <div class="setting-info">
            <span>聊天功能</span>
            <span class="setting-desc">如何发送消息、语音、图片等</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="viewGuide('moments')">
          <div class="setting-info">
            <span>朋友圈使用</span>
            <span class="setting-desc">发布动态、查看朋友圈等</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="viewGuide('video')">
          <div class="setting-info">
            <span>视频号功能</span>
            <span class="setting-desc">发布视频、观看视频等</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="viewGuide('privacy')">
          <div class="setting-info">
            <span>隐私设置</span>
            <span class="setting-desc">保护个人隐私的设置方法</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 联系客服 -->
      <div class="settings-section">
        <div class="section-title">联系客服</div>
        <div class="setting-item" @click="contactOnlineService">
          <div class="setting-info">
            <iconify-icon icon="heroicons:chat-bubble-left-right" width="20" style="color: #07C160;"></iconify-icon>
            <span>在线客服</span>
            <span class="setting-desc">7×24小时在线服务</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="callService">
          <div class="setting-info">
            <iconify-icon icon="heroicons:phone" width="20" style="color: #07C160;"></iconify-icon>
            <span>客服电话</span>
            <span class="setting-desc">400-123-4567</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="sendEmail">
          <div class="setting-info">
            <iconify-icon icon="heroicons:envelope" width="20" style="color: #07C160;"></iconify-icon>
            <span>邮件反馈</span>
            <span class="setting-desc">support@yeyu.com</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 意见反馈 -->
      <div class="settings-section">
        <div class="section-title">意见反馈</div>
        <div class="setting-item" @click="submitFeedback">
          <div class="setting-info">
            <span>提交反馈</span>
            <span class="setting-desc">告诉我们您的建议和问题</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="viewFeedbackHistory">
          <div class="setting-info">
            <span>反馈历史</span>
            <span class="setting-desc">查看您的反馈记录</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>

      <!-- 其他 -->
      <div class="settings-section">
        <div class="section-title">其他</div>
        <div class="setting-item" @click="reportBug">
          <div class="setting-info">
            <span>问题举报</span>
            <span class="setting-desc">举报违规内容或用户</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
        <div class="setting-item" @click="viewTerms">
          <div class="setting-info">
            <span>服务条款</span>
            <span class="setting-desc">查看用户服务协议</span>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="16" style="color: #999;"></iconify-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const searchQuery = ref('')

const goBack = () => {
  router.back()
}

// 查看FAQ
const viewFAQ = (type: string) => {
  console.log('查看FAQ:', type)
}

// 查看指南
const viewGuide = (type: string) => {
  console.log('查看指南:', type)
}

// 联系客服
const contactOnlineService = () => {
  console.log('联系在线客服')
}

const callService = () => {
  console.log('拨打客服电话')
}

const sendEmail = () => {
  console.log('发送邮件反馈')
}

// 反馈相关
const submitFeedback = () => {
  console.log('提交反馈')
}

const viewFeedbackHistory = () => {
  console.log('查看反馈历史')
}

// 其他
const reportBug = () => {
  console.log('问题举报')
}

const viewTerms = () => {
  console.log('查看服务条款')
}
</script>

<style scoped>
.help {
  height: 100vh;
  background: #f5f5f5;
  overflow-y: auto;
}

.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
}

.back-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
}

.header-title {
  font-size: 13px;
  font-weight: normal;
  color: #333;
}

.settings-content {
  margin-top: 0; /* 让第一项与导航栏重合 */
  padding: 0; /* 移除padding，让第一项与导航栏重合 */
}

.search-section {
  margin-bottom: 16px;
}

.search-bar {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: #333;
}

.search-input::placeholder {
  color: #999;
}

.settings-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.section-title {
  padding: 16px 16px 8px;
  font-size: 13px;
  color: #666;
  font-weight: normal;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: #f8f8f8;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.setting-info span:first-child {
  font-size: 13px;
  color: #333;
}

.setting-desc {
  font-size: 12px;
  color: #999;
}
</style>
