<template>
  <div class="phone-contacts">
    <MobileTopBar title="手机联系人" :show-back="true" @back="goBack" />
    <div class="content">
      <!-- 移除提示文本 -->

      <div v-if="phoneContacts.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:device-phone-mobile" width="48"></iconify-icon>
        <div>暂无手机联系人</div>
        <div class="empty-tip">请允许访问通讯录权限</div>
      </div>

      <div v-else class="contacts-list">
        <div
          v-for="contact in phoneContacts"
          :key="contact.id"
          class="contact-item"
        >
          <div class="contact-avatar">
            <img :src="contact.avatar" :alt="contact.name" />
          </div>
          <div class="contact-info">
            <div class="contact-name">{{ contact.contactName }}</div>
          </div>
          <div class="contact-status">
            <button
              v-if="!contact.isFriend && !contact.isRequested"
              @click="sendFriendRequest(contact)"
              class="add-btn"
            >
              添加
            </button>
            <span v-else-if="contact.isFriend" class="status-text friend">已是好友</span>
            <span v-else-if="contact.isRequested" class="status-text requested">已发送</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MobileTopBar from '../../../shared/components/mobile/MobileTopBar.vue'
import { useAppStore } from '../../../shared/stores/appStore'
import { contactAPI } from '../services/api'

const router = useRouter()
const appStore = useAppStore()

// 定义联系人类型
interface PhoneContact {
  id: number
  name: string
  phone: string
  avatar: string
  isFriend: boolean
  isRequested: boolean
  contactName: string
}

const phoneContacts = ref<PhoneContact[]>([])
const isLoading = ref(false)

// 加载手机联系人
const loadPhoneContacts = async () => {
  try {
    isLoading.value = true
    console.log('📱 从手机通讯录加载使用叶语的联系人...')

    // 模拟从手机通讯录读取并匹配叶语用户的数据
    phoneContacts.value = [
      {
        id: 1,
        name: '张三',
        phone: '13800138001',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=张三',
        isFriend: false,
        isRequested: false,
        contactName: '张三' // 手机通讯录中的备注名
      },
      {
        id: 2,
        name: '李四',
        phone: '13800138002',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=李四',
        isFriend: true,
        isRequested: false,
        contactName: '李四哥' // 手机通讯录中的备注名
      },
      {
        id: 3,
        name: '王五',
        phone: '13800138003',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=王五',
        isFriend: false,
        isRequested: true,
        contactName: '小王' // 手机通讯录中的备注名
      },
      {
        id: 4,
        name: '赵六',
        phone: '13800138004',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=赵六',
        isFriend: true,
        isRequested: false,
        contactName: '赵总' // 手机通讯录中的备注名
      },
      {
        id: 5,
        name: '孙七',
        phone: '13800138005',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=孙七',
        isFriend: false,
        isRequested: false,
        contactName: '孙七' // 手机通讯录中的备注名
      }
    ]

    console.log('✅ 手机通讯录联系人加载成功:', phoneContacts.value.length, '个使用叶语的联系人')
  } catch (error) {
    console.error('❌ 加载手机通讯录联系人失败:', error)
    appStore.showToast('加载手机通讯录联系人失败', 'error')
  } finally {
    isLoading.value = false
  }
}

// 发送好友请求
const sendFriendRequest = async (contact: any) => {
  try {
    console.log('📤 发送好友请求给:', contact.name)
    
    const response = await contactsApi.sendFriendRequest({
      phone: contact.phone,
      message: '我是通过手机联系人找到你的'
    })

    if (response && response.success) {
      contact.isRequested = true
      appStore.showToast('好友请求已发送', 'success')
    } else {
      appStore.showToast('发送好友请求失败', 'error')
    }
  } catch (error) {
    console.error('❌ 发送好友请求失败:', error)
    appStore.showToast('发送好友请求失败', 'error')
  }
}

// 返回
const goBack = () => {
  console.log('🔙 手机联系人页面返回')
  router.go(-1)
}

onMounted(() => {
  loadPhoneContacts()
})
</script>

<style scoped>
.phone-contacts {
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  overflow-y: auto;
}

/* 提示文本样式已删除 */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: #999;
  gap: 16px;
  background: white;
  margin-top: 8px;
}

.empty-tip {
  font-size: 14px;
  color: #ccc;
}

.contacts-list {
  background: white;
  margin-top: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  height: 42px;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-avatar {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  overflow: hidden;
  margin-right: 12px;
}

.contact-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.contact-info {
  flex: 1;
}

.contact-name {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #1a1a1a;
  line-height: 1.3;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.yeyu-info {
  font-size: 14px;
  color: #666;
}

.contact-status {
  display: flex;
  align-items: center;
}

.status-text {
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 4px;
}

.status-text.friend {
  background: #f0f9ff;
  color: #0369a1;
}

.status-text.requested {
  background: #fef3c7;
  color: #d97706;
}

.add-btn {
  padding: 6px 16px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  background: #07C160;
  color: white;
}

.add-btn:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}
</style>
