<template>
  <div v-if="visible" class="policy-modal-overlay" @click="closeModal">
    <div class="policy-modal" @click.stop>
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="closeModal">
          <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
        </button>
      </div>
      
      <div class="modal-content">
        <div v-if="type === 'terms'" class="policy-content">
          <h4>1. 服务条款</h4>
          <p>欢迎使用叶语（YeYu）即时通讯服务。在使用我们的服务之前，请仔细阅读以下条款。</p>
          
          <h4>2. 服务描述</h4>
          <p>叶语是一款提供即时通讯、朋友圈、支付等功能的综合性社交应用。</p>
          
          <h4>3. 用户责任</h4>
          <p>用户在使用本服务时，应当：</p>
          <ul>
            <li>遵守相关法律法规</li>
            <li>不发布违法、有害信息</li>
            <li>保护个人账户安全</li>
            <li>尊重他人权益</li>
          </ul>
          
          <h4>4. 隐私保护</h4>
          <p>我们承诺保护用户隐私，详细信息请参阅《隐私政策》。</p>
          
          <h4>5. 服务变更</h4>
          <p>我们保留随时修改或终止服务的权利，并会提前通知用户。</p>
          
          <h4>6. 免责声明</h4>
          <p>在法律允许的范围内，我们不对因使用本服务而产生的任何损失承担责任。</p>
          
          <h4>7. 联系我们</h4>
          <p>如有疑问，请联系客服：support@yeyu.com</p>
        </div>
        
        <div v-else-if="type === 'privacy'" class="policy-content">
          <h4>1. 信息收集</h4>
          <p>我们可能收集以下信息：</p>
          <ul>
            <li>注册信息：手机号、昵称等</li>
            <li>使用信息：聊天记录、朋友圈动态等</li>
            <li>设备信息：设备型号、操作系统等</li>
            <li>位置信息：用于附近的人等功能</li>
          </ul>
          
          <h4>2. 信息使用</h4>
          <p>我们使用收集的信息用于：</p>
          <ul>
            <li>提供和改进服务</li>
            <li>个性化推荐</li>
            <li>安全防护</li>
            <li>客户支持</li>
          </ul>
          
          <h4>3. 信息共享</h4>
          <p>我们不会向第三方出售、出租或以其他方式披露您的个人信息，除非：</p>
          <ul>
            <li>获得您的明确同意</li>
            <li>法律法规要求</li>
            <li>保护用户或公众安全</li>
          </ul>
          
          <h4>4. 信息安全</h4>
          <p>我们采用行业标准的安全措施保护您的信息，包括：</p>
          <ul>
            <li>数据加密传输</li>
            <li>访问权限控制</li>
            <li>定期安全审计</li>
          </ul>
          
          <h4>5. 用户权利</h4>
          <p>您有权：</p>
          <ul>
            <li>查看和修改个人信息</li>
            <li>删除账户和数据</li>
            <li>控制信息共享设置</li>
            <li>撤回授权同意</li>
          </ul>
          
          <h4>6. Cookie使用</h4>
          <p>我们使用Cookie和类似技术来改善用户体验和分析服务使用情况。</p>
          
          <h4>7. 政策更新</h4>
          <p>我们可能会不时更新本隐私政策，更新后会通过应用内通知等方式告知用户。</p>
          
          <h4>8. 联系我们</h4>
          <p>如对隐私政策有疑问，请联系：privacy@yeyu.com</p>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn secondary" @click="closeModal">关闭</button>
        <button v-if="showAgreeButton" class="btn primary" @click="agreeAndClose">同意</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  type: 'terms' | 'privacy'
  showAgreeButton?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'agree'): void
}

const props = withDefaults(defineProps<Props>(), {
  showAgreeButton: false
})

const emit = defineEmits<Emits>()

const title = computed(() => {
  return props.type === 'terms' ? '用户协议' : '隐私政策'
})

const closeModal = () => {
  emit('close')
}

const agreeAndClose = () => {
  emit('agree')
  emit('close')
}
</script>

<script lang="ts">
import { computed } from 'vue'

export default {
  name: 'PolicyModal'
}
</script>

<style scoped>
.policy-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.policy-modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.policy-content h4 {
  color: #333;
  font-size: 16px;
  font-weight: 600;
  margin: 20px 0 12px 0;
}

.policy-content h4:first-child {
  margin-top: 0;
}

.policy-content p {
  color: #666;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.policy-content ul {
  color: #666;
  line-height: 1.6;
  margin: 0 0 16px 0;
  padding-left: 20px;
}

.policy-content li {
  margin-bottom: 8px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f0f0;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn.secondary {
  background: #f5f5f5;
  color: #666;
}

.btn.secondary:hover {
  background: #e0e0e0;
}

.btn.primary {
  background: #07C160;
  color: white;
}

.btn.primary:hover {
  background: #06AD56;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .policy-modal-overlay {
    padding: 10px;
  }
  
  .policy-modal {
    max-height: 90vh;
  }
  
  .modal-header,
  .modal-content,
  .modal-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
  
  .policy-content h4 {
    font-size: 15px;
  }
  
  .policy-content p,
  .policy-content ul {
    font-size: 14px;
  }
}
</style>
