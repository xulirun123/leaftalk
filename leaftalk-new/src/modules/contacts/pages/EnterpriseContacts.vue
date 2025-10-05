<template>
  <div class="enterprise-contacts-page">
    <div class="search-section">
      <div class="search-box">
        <iconify-icon icon="heroicons:magnifying-glass" width="18" class="search-icon"></iconify-icon>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索企业联系人"
          class="search-input"
          @input="filterContacts"
        />
      </div>
    </div>

    <div class="enterprise-list">
      <div v-if="myEnterprises.length > 0" class="section">
        <div class="section-title">我的企业</div>
        <div
          v-for="enterprise in myEnterprises"
          :key="enterprise.id"
          class="enterprise-item"
          @click="viewEnterpriseContacts(enterprise)"
        >
          <div class="enterprise-icon">
            <iconify-icon icon="heroicons:building-office-2" width="24"></iconify-icon>
          </div>
          <div class="enterprise-info">
            <div class="enterprise-name">{{ enterprise.name }}</div>
            <div class="enterprise-desc">{{ enterprise.memberCount }} 位成员</div>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="18" class="arrow"></iconify-icon>
        </div>
      </div>

      <div v-if="filteredContacts.length > 0" class="section">
        <div class="section-title">企业联系人 ({{ filteredContacts.length }})</div>
        <div
          v-for="contact in filteredContacts"
          :key="contact.id"
          class="contact-item"
          @click="viewContactProfile(contact)"
        >
          <div class="contact-avatar">
            <img :src="contact.avatar" :alt="contact.name" />
          </div>
          <div class="contact-info">
            <div class="contact-name">{{ contact.name }}</div>
            <div class="contact-desc">
              {{ contact.department }} · {{ contact.position }}
            </div>
          </div>
          <button
            v-if="!contact.isFriend"
            class="add-btn"
            @click.stop="addFriend(contact)"
          >
            添加
          </button>
          <div v-else class="friend-tag">已添加</div>
        </div>
      </div>

      <div v-if="myEnterprises.length === 0 && filteredContacts.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:building-office" width="64" class="empty-icon"></iconify-icon>
        <div class="empty-text">暂无企业联系人</div>
        <div class="empty-tip">加入企业后可查看企业通讯录</div>
        <button class="join-btn" @click="joinEnterprise">
          <iconify-icon icon="heroicons:plus" width="18"></iconify-icon>
          加入企业
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const appStore = useAppStore()

const searchQuery = ref('')

const myEnterprises = ref([
  {
    id: '1',
    name: '叶语科技有限公司',
    memberCount: 128
  },
  {
    id: '2',
    name: '叶语家族企业',
    memberCount: 45
  }
])

const enterpriseContacts = ref([
  {
    id: '1',
    name: '张三',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang',
    department: '技术部',
    position: '前端工程师',
    phone: '13800138001',
    yeyuId: 'zhangsan001',
    isFriend: false
  },
  {
    id: '2',
    name: '李四',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li',
    department: '产品部',
    position: '产品经理',
    phone: '13800138002',
    yeyuId: 'lisi002',
    isFriend: true
  },
  {
    id: '3',
    name: '王五',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wang',
    department: '技术部',
    position: '后端工程师',
    phone: '13800138003',
    yeyuId: 'wangwu003',
    isFriend: false
  },
  {
    id: '4',
    name: '赵六',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhao',
    department: '设计部',
    position: 'UI设计师',
    phone: '13800138004',
    yeyuId: 'zhaoliu004',
    isFriend: false
  }
])

const filteredContacts = computed(() => {
  if (!searchQuery.value.trim()) {
    return enterpriseContacts.value
  }

  const query = searchQuery.value.toLowerCase()
  return enterpriseContacts.value.filter(contact =>
    contact.name.toLowerCase().includes(query) ||
    contact.department.toLowerCase().includes(query) ||
    contact.position.toLowerCase().includes(query) ||
    contact.yeyuId.toLowerCase().includes(query)
  )
})

const filterContacts = () => {
  // Filter logic is in computed property
}

const viewEnterpriseContacts = (enterprise: any) => {
  console.log('查看企业联系人:', enterprise)
  appStore.showToast(`查看 ${enterprise.name} 的通讯录`, 'info')
}

const viewContactProfile = (contact: any) => {
  console.log('查看联系人资料:', contact)
  router.push(`/user-profile/${contact.id}`)
}

const addFriend = async (contact: any) => {
  try {
    console.log('添加好友:', contact)
    appStore.showToast(`已向 ${contact.name} 发送好友请求`, 'success')
    contact.isFriend = true
  } catch (error) {
    console.error('添加好友失败:', error)
    appStore.showToast('添加好友失败', 'error')
  }
}

const joinEnterprise = () => {
  appStore.showToast('加入企业功能开发中', 'info')
}

onMounted(() => {
  console.log('📱 企业联系人页面加载')
})
</script>

<style scoped>
.enterprise-contacts-page {
  min-height: 100vh;
  background: #EDEDED;
}

.search-section {
  background: #FFFFFF;
  padding: 12px 16px;
  margin-bottom: 8px;
}

.search-box {
  display: flex;
  align-items: center;
  background: #F5F5F5;
  border-radius: 8px;
  padding: 8px 12px;
}

.search-icon {
  color: #999;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 15px;
  color: #333;
}

.search-input::placeholder {
  color: #999;
}

.enterprise-list {
  flex: 1;
}

.section {
  background: #FFFFFF;
  margin-bottom: 8px;
}

.section-title {
  padding: 12px 16px;
  font-size: 13px;
  color: #999;
  background: #F5F5F5;
}

.enterprise-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #EDEDED;
  cursor: pointer;
  transition: background 0.2s;
}

.enterprise-item:last-child {
  border-bottom: none;
}

.enterprise-item:active {
  background: #F5F5F5;
}

.enterprise-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  margin-right: 12px;
  flex-shrink: 0;
}

.enterprise-info {
  flex: 1;
  min-width: 0;
}

.enterprise-name {
  font-size: 16px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.enterprise-desc {
  font-size: 13px;
  color: #999;
}

.arrow {
  color: #CCC;
  flex-shrink: 0;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #EDEDED;
  cursor: pointer;
  transition: background 0.2s;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-item:active {
  background: #F5F5F5;
}

.contact-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
}

.contact-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-size: 16px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.contact-desc {
  font-size: 13px;
  color: #999;
}

.add-btn {
  background: #07C160;
  color: #FFFFFF;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

.friend-tag {
  color: #999;
  font-size: 14px;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: #FFFFFF;
}

.empty-icon {
  color: #CCC;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}

.empty-tip {
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
}

.join-btn {
  background: #07C160;
  color: #FFFFFF;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>

