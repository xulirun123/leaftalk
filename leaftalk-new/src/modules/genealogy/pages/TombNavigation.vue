<template>
  <div class="tomb-navigation-page">
    <!-- 顶部导航 -->
    <MobileTopBar 
      title="墓址导航" 
      :showBack="true"
      @back="goBack"
    />

    <!-- 主要内容 -->
    <div class="navigation-content">
      <!-- 墓址信息卡片 -->
      <div class="tomb-info-card">
        <div class="tomb-header">
          <div class="tomb-avatar">
            <img 
              :src="memberInfo?.avatar || '/default-avatar.png'"
              :alt="memberInfo?.name"
              class="member-photo"
            />
            <div class="memorial-icon">
              <iconify-icon icon="heroicons:heart" width="16"></iconify-icon>
            </div>
          </div>
          <div class="tomb-details">
            <h3>{{ memberInfo?.name }}</h3>
            <p class="life-span">
              {{ formatDate(memberInfo?.birthDate) }} - {{ formatDate(memberInfo?.deathDate) }}
            </p>
            <p class="tomb-location">{{ tombInfo?.location }}</p>
          </div>
        </div>

        <div class="tomb-meta">
          <div class="meta-item">
            <iconify-icon icon="heroicons:map-pin" width="16"></iconify-icon>
            <span>{{ tombInfo?.address }}</span>
          </div>
          <div class="meta-item">
            <iconify-icon icon="heroicons:building-office" width="16"></iconify-icon>
            <span>{{ tombInfo?.cemetery }}</span>
          </div>
          <div v-if="tombInfo?.section" class="meta-item">
            <iconify-icon icon="heroicons:squares-2x2" width="16"></iconify-icon>
            <span>{{ tombInfo?.section }}区 {{ tombInfo?.row }}排 {{ tombInfo?.number }}号</span>
          </div>
        </div>
      </div>

      <!-- 导航选项 -->
      <div class="navigation-options">
        <div class="option-card" @click="startMapNavigation">
          <div class="option-icon map">
            <iconify-icon icon="heroicons:map" width="32"></iconify-icon>
          </div>
          <div class="option-info">
            <h4>地图导航</h4>
            <p>使用地图应用导航到墓地</p>
            <div class="distance-info">
              <iconify-icon icon="heroicons:map-pin" width="12"></iconify-icon>
              <span>距离约 {{ tombInfo?.distance }}km</span>
            </div>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="20" class="arrow"></iconify-icon>
        </div>

        <div class="option-card" @click="startARNavigation" :class="{ disabled: !arSupported }">
          <div class="option-icon ar">
            <iconify-icon icon="heroicons:camera" width="32"></iconify-icon>
          </div>
          <div class="option-info">
            <h4>AR导航</h4>
            <p>{{ arSupported ? '使用增强现实导航' : '设备不支持AR功能' }}</p>
            <div v-if="arSupported" class="feature-tag">
              <span>新功能</span>
            </div>
          </div>
          <iconify-icon icon="heroicons:chevron-right" width="20" class="arrow"></iconify-icon>
        </div>
      </div>

      <!-- 墓地信息 -->
      <div class="cemetery-info-card">
        <div class="card-header">
          <h3>墓地信息</h3>
        </div>
        <div class="cemetery-details">
          <div class="detail-row">
            <label>墓地名称</label>
            <span>{{ tombInfo?.cemetery }}</span>
          </div>
          <div class="detail-row">
            <label>详细地址</label>
            <span>{{ tombInfo?.fullAddress }}</span>
          </div>
          <div class="detail-row">
            <label>联系电话</label>
            <span>{{ tombInfo?.phone }}</span>
          </div>
          <div class="detail-row">
            <label>开放时间</label>
            <span>{{ tombInfo?.openHours }}</span>
          </div>
          <div v-if="tombInfo?.notes" class="detail-row">
            <label>备注信息</label>
            <span>{{ tombInfo?.notes }}</span>
          </div>
        </div>
      </div>

      <!-- 祭扫记录 -->
      <div class="visit-records-card">
        <div class="card-header">
          <h3>最近祭扫记录</h3>
          <button @click="addVisitRecord" class="add-record-btn">
            <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
            记录祭扫
          </button>
        </div>
        <div class="visit-list">
          <div 
            v-for="record in visitRecords" 
            :key="record.id"
            class="visit-item"
          >
            <div class="visit-avatar">
              <img :src="record.visitor.avatar || '/default-avatar.png'" :alt="record.visitor.name" />
            </div>
            <div class="visit-info">
              <h4>{{ record.visitor.name }}</h4>
              <p>{{ formatDateTime(record.date) }}</p>
              <p v-if="record.note" class="visit-note">{{ record.note }}</p>
            </div>
            <div class="visit-photos">
              <img 
                v-for="(photo, index) in record.photos.slice(0, 3)" 
                :key="index"
                :src="photo"
                :alt="`祭扫照片${index + 1}`"
                @click="viewPhoto(photo)"
              />
              <div v-if="record.photos.length > 3" class="more-photos">
                +{{ record.photos.length - 3 }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button @click="shareLocation" class="action-btn">
          <iconify-icon icon="heroicons:share" width="16"></iconify-icon>
          分享位置
        </button>
        <button @click="reportIssue" class="action-btn">
          <iconify-icon icon="heroicons:exclamation-triangle" width="16"></iconify-icon>
          报告问题
        </button>
      </div>
    </div>

    <!-- 祭扫记录弹窗 -->
    <div v-if="showRecordModal" class="modal-overlay" @click="closeRecordModal">
      <div class="record-modal" @click.stop>
        <div class="modal-header">
          <h3>记录祭扫</h3>
          <button @click="closeRecordModal" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="submitRecord" class="record-form">
            <div class="form-group">
              <label>祭扫日期</label>
              <input 
                v-model="newRecord.date"
                type="datetime-local"
                required
              />
            </div>
            <div class="form-group">
              <label>备注</label>
              <textarea 
                v-model="newRecord.note"
                placeholder="记录祭扫感想或特殊情况..."
                rows="3"
              ></textarea>
            </div>
            <div class="form-group">
              <label>照片</label>
              <div class="photo-upload">
                <div 
                  v-for="(photo, index) in newRecord.photos" 
                  :key="index"
                  class="photo-item"
                >
                  <img :src="photo" :alt="`照片${index + 1}`" />
                  <button type="button" @click="removePhoto(index)" class="remove-photo">
                    <iconify-icon icon="heroicons:x-mark" width="12"></iconify-icon>
                  </button>
                </div>
                <button type="button" @click="uploadPhoto" class="upload-photo">
                  <iconify-icon icon="heroicons:camera" width="24"></iconify-icon>
                  <span>添加照片</span>
                </button>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeRecordModal" class="cancel-btn">
                取消
              </button>
              <button type="submit" class="submit-btn">
                保存记录
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../../stores/app'
import MobileTopBar from '../../../components/mobile/MobileTopBar.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 响应式数据
const genealogyId = ref(route.params.genealogyId)
const memberId = ref(route.params.memberId)
const showRecordModal = ref(false)

const memberInfo = ref({
  id: memberId.value,
  name: '张三',
  avatar: '',
  birthDate: new Date('1950-01-01'),
  deathDate: new Date('2020-01-01')
})

const tombInfo = ref({
  location: '北京市昌平区天寿陵园',
  address: '北京市昌平区天寿陵园',
  fullAddress: '北京市昌平区小汤山镇天寿陵园A区',
  cemetery: '天寿陵园',
  section: 'A',
  row: '15',
  number: '23',
  phone: '010-12345678',
  openHours: '8:00-17:00',
  distance: 25.6,
  notes: '清明节期间人流较多，建议提前预约'
})

const visitRecords = ref([
  {
    id: 1,
    visitor: { name: '张四', avatar: '' },
    date: new Date('2024-01-01'),
    note: '清明祭扫，缅怀先人',
    photos: ['/visit1.jpg', '/visit2.jpg']
  }
])

const newRecord = ref({
  date: '',
  note: '',
  photos: []
})

// 计算属性
const arSupported = computed(() => {
  // 检测设备是否支持AR
  return 'navigator' in window && 'mediaDevices' in navigator
})

// 生命周期
onMounted(() => {
  loadTombInfo()
  getCurrentLocation()
})

// 方法
const goBack = () => {
  router.back()
}

const loadTombInfo = async () => {
  try {
    // 加载墓址信息
    console.log('加载墓址信息')
  } catch (error) {
    console.error('加载墓址信息失败:', error)
    appStore.showToast('加载墓址信息失败', 'error')
  }
}

const getCurrentLocation = () => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('当前位置:', position.coords)
        // 计算距离
      },
      (error) => {
        console.error('获取位置失败:', error)
      }
    )
  }
}

const startMapNavigation = () => {
  // 打开地图应用导航
  const address = encodeURIComponent(tombInfo.value.fullAddress)
  const mapUrl = `https://maps.google.com/maps?q=${address}`
  window.open(mapUrl, '_blank')
}

const startARNavigation = () => {
  if (!arSupported.value) {
    appStore.showToast('设备不支持AR功能', 'error')
    return
  }
  
  // 启动AR导航
  appStore.showToast('AR导航功能开发中', 'info')
}

const addVisitRecord = () => {
  newRecord.value.date = new Date().toISOString().slice(0, 16)
  showRecordModal.value = true
}

const closeRecordModal = () => {
  showRecordModal.value = false
  resetForm()
}

const resetForm = () => {
  newRecord.value = {
    date: '',
    note: '',
    photos: []
  }
}

const uploadPhoto = () => {
  // 实现照片上传
  appStore.showToast('照片上传功能开发中', 'info')
}

const removePhoto = (index: number) => {
  newRecord.value.photos.splice(index, 1)
}

const submitRecord = async () => {
  try {
    appStore.showToast('保存中...', 'info')
    // 实现保存记录逻辑
    const record = {
      id: Date.now(),
      visitor: { name: '当前用户', avatar: '' },
      date: new Date(newRecord.value.date),
      note: newRecord.value.note,
      photos: newRecord.value.photos
    }
    visitRecords.value.unshift(record)
    appStore.showToast('记录保存成功', 'success')
    closeRecordModal()
  } catch (error) {
    appStore.showToast('保存失败', 'error')
  }
}

const viewPhoto = (photo: string) => {
  // 查看照片
  console.log('查看照片:', photo)
}

const shareLocation = () => {
  if (navigator.share) {
    navigator.share({
      title: `${memberInfo.value.name}的墓址`,
      text: `${memberInfo.value.name}的墓址位置`,
      url: window.location.href
    })
  } else {
    // 复制到剪贴板
    navigator.clipboard.writeText(tombInfo.value.fullAddress)
    appStore.showToast('地址已复制到剪贴板', 'success')
  }
}

const reportIssue = () => {
  appStore.showToast('问题报告功能开发中', 'info')
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const formatDateTime = (date: Date) => {
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.tomb-navigation-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.navigation-content {
  padding: 75px 16px 100px 16px;
}

/* 墓址信息卡片 */
.tomb-info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.tomb-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.tomb-avatar {
  position: relative;
}

.member-photo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  filter: grayscale(100%);
  opacity: 0.8;
}

.memorial-icon {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background: #999;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid white;
}

.tomb-details h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #333;
}

.life-span {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #666;
}

.tomb-location {
  margin: 0;
  font-size: 14px;
  color: #07c160;
  font-weight: 500;
}

.tomb-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

/* 导航选项 */
.navigation-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.option-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.option-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.option-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.option-icon.map {
  background: linear-gradient(135deg, #4A90E2, #357ABD);
}

.option-icon.ar {
  background: linear-gradient(135deg, #FF6B6B, #EE5A52);
}

.option-info {
  flex: 1;
}

.option-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.option-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.distance-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.feature-tag {
  display: inline-block;
}

.feature-tag span {
  background: #FF6B6B;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
}

.arrow {
  color: #ccc;
}

/* 墓地信息卡片 */
.cemetery-info-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.cemetery-details {
  padding: 16px 20px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row label {
  width: 80px;
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
}

.detail-row span {
  flex: 1;
  font-size: 14px;
  color: #333;
}

/* 祭扫记录 */
.add-record-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.visit-records-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.visit-list {
  padding: 16px 20px;
}

.visit-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.visit-item:last-child {
  margin-bottom: 0;
}

.visit-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.visit-info {
  flex: 1;
}

.visit-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.visit-info p {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #666;
}

.visit-note {
  color: #333 !important;
}

.visit-photos {
  display: flex;
  gap: 4px;
}

.visit-photos img {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
  cursor: pointer;
}

.more-photos {
  width: 32px;
  height: 32px;
  background: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #666;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
}

/* 记录弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.record-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.modal-content {
  padding: 20px;
  max-height: calc(80vh - 60px);
  overflow-y: auto;
}

.record-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #07c160;
}

.photo-upload {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.photo-item {
  position: relative;
  width: 60px;
  height: 60px;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.remove-photo {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  background: #ff3b30;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-photo {
  width: 60px;
  height: 60px;
  border: 2px dashed #ddd;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #999;
  transition: all 0.2s;
}

.upload-photo:hover {
  border-color: #07c160;
  color: #07c160;
}

.upload-photo span {
  font-size: 8px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.cancel-btn,
.submit-btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.submit-btn {
  background: #07c160;
  color: white;
  border: 1px solid #07c160;
}

.submit-btn:hover {
  background: #06a552;
}
</style>
