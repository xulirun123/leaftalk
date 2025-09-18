<template>
  <div class="cemetery-form">
    <form @submit.prevent="handleSubmit">
      <!-- 基本信息 -->
      <div class="form-section">
        <h4>基本信息</h4>
        
        <div class="form-group">
          <label>墓地名称 *</label>
          <input 
            v-model="formData.name" 
            type="text" 
            placeholder="请输入墓地名称"
            required
          />
        </div>
        
        <div class="form-group">
          <label>逝者姓名 *</label>
          <input 
            v-model="formData.deceasedName" 
            type="text" 
            placeholder="请输入逝者姓名"
            required
          />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>出生日期</label>
            <input 
              v-model="formData.birthDate" 
              type="date"
            />
          </div>
          
          <div class="form-group">
            <label>逝世日期</label>
            <input 
              v-model="formData.deathDate" 
              type="date"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label>墓地状态</label>
          <select v-model="formData.status">
            <option value="active">正常</option>
            <option value="maintenance">维护中</option>
            <option value="relocated">已迁移</option>
          </select>
        </div>
      </div>

      <!-- 位置信息 -->
      <div class="form-section">
        <h4>位置信息</h4>
        
        <div class="form-group">
          <label>详细地址 *</label>
          <textarea 
            v-model="formData.location" 
            placeholder="请输入墓地详细地址"
            rows="3"
            required
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>地理坐标</label>
          <div class="coordinates-input">
            <div class="coordinate-group">
              <label>纬度</label>
              <input 
                v-model.number="formData.coordinates.lat" 
                type="number" 
                step="0.000001"
                placeholder="24.2899"
              />
            </div>
            <div class="coordinate-group">
              <label>经度</label>
              <input 
                v-model.number="formData.coordinates.lng" 
                type="number" 
                step="0.000001"
                placeholder="116.1219"
              />
            </div>
          </div>
          
          <button type="button" @click="getCurrentLocation" class="location-btn">
            <iconify-icon icon="heroicons:map-pin" width="16"></iconify-icon>
            <span>获取当前位置</span>
          </button>
        </div>
      </div>

      <!-- 照片上传 -->
      <div class="form-section">
        <h4>墓地照片</h4>
        
        <div class="photo-upload">
          <div class="photo-grid">
            <div 
              v-for="(photo, index) in formData.photos" 
              :key="index"
              class="photo-item"
            >
              <img :src="photo" :alt="`照片${index + 1}`" />
              <button type="button" @click="removePhoto(index)" class="remove-photo">
                <iconify-icon icon="heroicons:x-mark" width="16"></iconify-icon>
              </button>
            </div>
            
            <div v-if="formData.photos.length < 6" class="photo-upload-btn" @click="triggerPhotoUpload">
              <iconify-icon icon="heroicons:plus" width="24"></iconify-icon>
              <span>添加照片</span>
            </div>
          </div>
          
          <input 
            ref="photoInput"
            type="file" 
            accept="image/*" 
            multiple
            @change="handlePhotoUpload"
            style="display: none"
          />
          
          <div class="photo-tips">
            <p>• 最多可上传6张照片</p>
            <p>• 支持JPG、PNG格式，单张不超过5MB</p>
          </div>
        </div>
      </div>

      <!-- 描述信息 -->
      <div class="form-section">
        <h4>描述信息</h4>
        
        <div class="form-group">
          <label>墓地描述</label>
          <textarea 
            v-model="formData.description" 
            placeholder="请输入墓地环境、交通等描述信息"
            rows="4"
          ></textarea>
        </div>
      </div>

      <!-- 提醒设置 -->
      <div class="form-section">
        <h4>提醒设置</h4>
        
        <div class="reminder-options">
          <label class="reminder-item">
            <input 
              type="checkbox" 
              v-model="formData.reminders.qingming"
            />
            <span>清明节提醒</span>
          </label>
          
          <label class="reminder-item">
            <input 
              type="checkbox" 
              v-model="formData.reminders.birthday"
            />
            <span>生日提醒</span>
          </label>
          
          <label class="reminder-item">
            <input 
              type="checkbox" 
              v-model="formData.reminders.deathday"
            />
            <span>忌日提醒</span>
          </label>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="cancel-btn">
          取消
        </button>
        <button type="submit" :disabled="isSubmitting" class="submit-btn">
          <iconify-icon v-if="isSubmitting" icon="heroicons:arrow-path" width="16"></iconify-icon>
          <span>{{ isSubmitting ? '保存中...' : '保存' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAppStore } from '../../../shared/stores/appStore'

const appStore = useAppStore()

// Props
const props = defineProps({
  cemetery: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['save', 'cancel'])

// 状态
const isSubmitting = ref(false)
const photoInput = ref(null)

// 表单数据
const formData = reactive({
  name: '',
  deceasedName: '',
  birthDate: '',
  deathDate: '',
  location: '',
  coordinates: {
    lat: null,
    lng: null
  },
  photos: [],
  description: '',
  status: 'active',
  reminders: {
    qingming: true,
    birthday: false,
    deathday: true
  }
})

// 生命周期
onMounted(() => {
  if (props.cemetery) {
    Object.assign(formData, {
      ...props.cemetery,
      reminders: {
        qingming: props.cemetery.reminders?.find(r => r.type === 'qingming')?.enabled || false,
        birthday: props.cemetery.reminders?.find(r => r.type === 'birthday')?.enabled || false,
        deathday: props.cemetery.reminders?.find(r => r.type === 'deathday')?.enabled || false
      }
    })
  }
})

// 方法
const handleSubmit = async () => {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    const submitData = {
      ...formData,
      reminders: [
        { type: 'qingming', enabled: formData.reminders.qingming },
        { type: 'birthday', enabled: formData.reminders.birthday },
        { type: 'deathday', enabled: formData.reminders.deathday }
      ]
    }
    
    emit('save', submitData)
  } catch (error) {
    console.error('提交表单失败:', error)
    appStore.showToast('保存失败', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const validateForm = () => {
  if (!formData.name.trim()) {
    appStore.showToast('请输入墓地名称', 'error')
    return false
  }
  
  if (!formData.deceasedName.trim()) {
    appStore.showToast('请输入逝者姓名', 'error')
    return false
  }
  
  if (!formData.location.trim()) {
    appStore.showToast('请输入墓地地址', 'error')
    return false
  }
  
  return true
}

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    appStore.showToast('浏览器不支持定位功能', 'error')
    return
  }
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      formData.coordinates.lat = position.coords.latitude
      formData.coordinates.lng = position.coords.longitude
      appStore.showToast('位置获取成功', 'success')
    },
    (error) => {
      console.error('获取位置失败:', error)
      appStore.showToast('获取位置失败', 'error')
    }
  )
}

const triggerPhotoUpload = () => {
  photoInput.value?.click()
}

const handlePhotoUpload = async (event) => {
  const files = Array.from(event.target.files)
  
  for (const file of files) {
    if (formData.photos.length >= 6) {
      appStore.showToast('最多只能上传6张照片', 'error')
      break
    }
    
    if (file.size > 5 * 1024 * 1024) {
      appStore.showToast(`${file.name} 文件过大，请选择小于5MB的图片`, 'error')
      continue
    }
    
    try {
      const photoUrl = await uploadPhoto(file)
      formData.photos.push(photoUrl)
    } catch (error) {
      console.error('上传照片失败:', error)
      appStore.showToast('照片上传失败', 'error')
    }
  }
  
  // 清空input
  event.target.value = ''
}

const uploadPhoto = async (file) => {
  // 这里应该实现真实的文件上传逻辑
  // 暂时返回本地URL用于预览
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

const removePhoto = (index) => {
  formData.photos.splice(index, 1)
}
</script>

<style scoped>
.cemetery-form {
  padding: 20px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  background: white;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #07c160;
}

.coordinates-input {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.coordinate-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.coordinate-group label {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.location-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #07c160;
  border-radius: 6px;
  background: rgba(7, 193, 96, 0.05);
  color: #07c160;
  font-size: 12px;
  cursor: pointer;
}

.photo-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-upload-btn {
  aspect-ratio: 1;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.photo-upload-btn:hover {
  border-color: #07c160;
  color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.photo-upload-btn span {
  font-size: 12px;
}

.photo-tips {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

.photo-tips p {
  margin: 0;
}

.reminder-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.reminder-item input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.cancel-btn {
  flex: 1;
  height: 44px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

.submit-btn {
  flex: 2;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .coordinates-input {
    grid-template-columns: 1fr;
  }
  
  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
