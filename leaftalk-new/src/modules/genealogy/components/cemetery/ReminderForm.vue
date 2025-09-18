<template>
  <div class="reminder-form">
    <form @submit.prevent="handleSubmit">
      <!-- 基本信息 -->
      <div class="form-section">
        <h4>基本信息</h4>
        
        <div class="form-group">
          <label>提醒类型 *</label>
          <select v-model="formData.type" required>
            <option value="">请选择提醒类型</option>
            <option value="qingming">清明节</option>
            <option value="zhongyuan">中元节</option>
            <option value="birthday">生日纪念</option>
            <option value="deathday">忌日纪念</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>提醒标题 *</label>
          <input 
            v-model="formData.title" 
            type="text" 
            placeholder="请输入提醒标题"
            required
          />
        </div>
        
        <div class="form-group">
          <label>关联墓地 *</label>
          <select v-model="formData.cemeteryId" required>
            <option value="">请选择墓地</option>
            <option 
              v-for="cemetery in cemeteries" 
              :key="cemetery.id"
              :value="cemetery.id"
            >
              {{ cemetery.name }} - {{ cemetery.deceasedName }}
            </option>
          </select>
        </div>
      </div>

      <!-- 时间设置 -->
      <div class="form-section">
        <h4>时间设置</h4>
        
        <div class="form-row">
          <div class="form-group">
            <label>提醒日期 *</label>
            <input 
              v-model="formData.date" 
              type="date"
              required
            />
          </div>
          
          <div class="form-group">
            <label>提醒时间 *</label>
            <input 
              v-model="formData.time" 
              type="time"
              required
            />
          </div>
        </div>
        
        <div class="form-group">
          <label>重复类型</label>
          <select v-model="formData.repeatType">
            <option value="none">不重复</option>
            <option value="yearly">每年</option>
            <option value="monthly">每月</option>
            <option value="weekly">每周</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>提前提醒</label>
          <select v-model="formData.advanceNotice">
            <option :value="0">当天提醒</option>
            <option :value="1">提前1天</option>
            <option :value="3">提前3天</option>
            <option :value="7">提前1周</option>
            <option :value="30">提前1个月</option>
          </select>
        </div>
      </div>

      <!-- 描述信息 -->
      <div class="form-section">
        <h4>描述信息</h4>
        
        <div class="form-group">
          <label>提醒描述</label>
          <textarea 
            v-model="formData.description" 
            placeholder="请输入提醒的详细描述"
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- 提醒设置 -->
      <div class="form-section">
        <h4>提醒设置</h4>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="formData.enabled"
            />
            <span>启用此提醒</span>
          </label>
        </div>
        
        <div class="notification-methods">
          <h5>通知方式</h5>
          <div class="method-options">
            <label class="method-option">
              <input 
                type="checkbox" 
                v-model="formData.notificationMethods"
                value="app"
              />
              <span>应用内通知</span>
            </label>
            
            <label class="method-option">
              <input 
                type="checkbox" 
                v-model="formData.notificationMethods"
                value="sms"
              />
              <span>短信通知</span>
            </label>
            
            <label class="method-option">
              <input 
                type="checkbox" 
                v-model="formData.notificationMethods"
                value="email"
              />
              <span>邮件通知</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 快速设置模板 -->
      <div v-if="!reminder" class="form-section">
        <h4>快速设置</h4>
        <div class="quick-templates">
          <button 
            v-for="template in quickTemplates" 
            :key="template.id"
            type="button"
            @click="applyTemplate(template)"
            class="template-btn"
          >
            <iconify-icon :icon="template.icon" width="16"></iconify-icon>
            <span>{{ template.name }}</span>
          </button>
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
import { ref, reactive, onMounted, watch } from 'vue'
import { useAppStore } from '../../../shared/stores/appStore'

const appStore = useAppStore()

// Props
const props = defineProps({
  reminder: {
    type: Object,
    default: null
  },
  cemeteries: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['save', 'cancel'])

// 状态
const isSubmitting = ref(false)

// 表单数据
const formData = reactive({
  type: '',
  title: '',
  cemeteryId: '',
  date: '',
  time: '09:00',
  repeatType: 'yearly',
  advanceNotice: 3,
  description: '',
  enabled: true,
  notificationMethods: ['app']
})

// 快速模板
const quickTemplates = ref([
  {
    id: 1,
    name: '清明节',
    icon: 'heroicons:gift',
    data: {
      type: 'qingming',
      title: '清明节扫墓提醒',
      date: getNextQingming(),
      time: '09:00',
      repeatType: 'yearly',
      advanceNotice: 3,
      description: '清明节祭祖扫墓，准备鲜花和香烛'
    }
  },
  {
    id: 2,
    name: '中元节',
    icon: 'heroicons:moon',
    data: {
      type: 'zhongyuan',
      title: '中元节祭拜提醒',
      date: getNextZhongyuan(),
      time: '19:00',
      repeatType: 'yearly',
      advanceNotice: 3,
      description: '中元节祭祖，缅怀先人'
    }
  },
  {
    id: 3,
    name: '生日纪念',
    icon: 'heroicons:cake',
    data: {
      type: 'birthday',
      title: '生日纪念提醒',
      date: '',
      time: '10:00',
      repeatType: 'yearly',
      advanceNotice: 1,
      description: '逝者生日纪念'
    }
  },
  {
    id: 4,
    name: '忌日纪念',
    icon: 'heroicons:heart',
    data: {
      type: 'deathday',
      title: '忌日纪念提醒',
      date: '',
      time: '14:00',
      repeatType: 'yearly',
      advanceNotice: 7,
      description: '逝者忌日纪念'
    }
  }
])

// 生命周期
onMounted(() => {
  if (props.reminder) {
    Object.assign(formData, {
      ...props.reminder,
      notificationMethods: props.reminder.notificationMethods || ['app']
    })
  }
})

// 监听提醒类型变化，自动设置标题
watch(() => formData.type, (newType) => {
  if (!props.reminder) { // 只在新建时自动设置
    const typeNames = {
      qingming: '清明节扫墓提醒',
      zhongyuan: '中元节祭拜提醒',
      birthday: '生日纪念提醒',
      deathday: '忌日纪念提醒',
      custom: '自定义提醒'
    }
    
    if (typeNames[newType]) {
      formData.title = typeNames[newType]
    }
  }
})

// 方法
const handleSubmit = async () => {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    const submitData = {
      ...formData,
      status: formData.enabled ? 'active' : 'disabled'
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
  if (!formData.type) {
    appStore.showToast('请选择提醒类型', 'error')
    return false
  }
  
  if (!formData.title.trim()) {
    appStore.showToast('请输入提醒标题', 'error')
    return false
  }
  
  if (!formData.cemeteryId) {
    appStore.showToast('请选择关联墓地', 'error')
    return false
  }
  
  if (!formData.date) {
    appStore.showToast('请选择提醒日期', 'error')
    return false
  }
  
  if (!formData.time) {
    appStore.showToast('请选择提醒时间', 'error')
    return false
  }
  
  return true
}

const applyTemplate = (template) => {
  Object.assign(formData, template.data)
}

function getNextQingming() {
  // 清明节通常在4月4日或5日
  const year = new Date().getFullYear()
  const qingming = new Date(year, 3, 5) // 4月5日
  if (qingming < new Date()) {
    qingming.setFullYear(year + 1)
  }
  return qingming.toISOString().split('T')[0]
}

function getNextZhongyuan() {
  // 中元节是农历七月十五，这里简化为8月15日
  const year = new Date().getFullYear()
  const zhongyuan = new Date(year, 7, 15) // 8月15日
  if (zhongyuan < new Date()) {
    zhongyuan.setFullYear(year + 1)
  }
  return zhongyuan.toISOString().split('T')[0]
}
</script>

<style scoped>
.reminder-form {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
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

.form-section h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #666;
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.notification-methods {
  margin-top: 16px;
}

.method-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.method-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.method-option input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.quick-templates {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.template-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.template-btn:hover {
  border-color: #07c160;
  color: #07c160;
  background: rgba(7, 193, 96, 0.05);
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
  
  .quick-templates {
    grid-template-columns: 1fr;
  }
}
</style>
