<template>
  <div class="memorial-tombstone-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="back-btn" @click="$router.go(-1)">
        <iconify-icon icon="heroicons:arrow-left" width="20"></iconify-icon>
      </button>
      <h1 class="page-title">电子墓碑</h1>
      <button @click="showTemplateSelector = true" class="template-btn">
        <iconify-icon icon="heroicons:squares-2x2" width="20"></iconify-icon>
      </button>
    </div>

    <!-- 墓碑预览 -->
    <div class="tombstone-preview">
      <div class="tombstone-container" :class="selectedTemplate.style">
        <div class="tombstone-background">
          <img :src="selectedTemplate.background" alt="墓碑背景" />
        </div>
        
        <div class="tombstone-content">
          <!-- 头像 -->
          <div class="memorial-avatar">
            <img :src="memberInfo.avatar || '/default-avatar.png'" alt="遗像" />
            <div class="avatar-frame"></div>
          </div>
          
          <!-- 基本信息 -->
          <div class="memorial-info">
            <h2 class="memorial-name">{{ memberInfo.name }}</h2>
            <div class="memorial-dates">
              <span class="birth-date">{{ formatDate(memberInfo.birthDate) }}</span>
              <span class="date-separator">-</span>
              <span class="death-date">{{ formatDate(memberInfo.deathDate) }}</span>
            </div>
            <div class="memorial-title">{{ memberInfo.title || '慈父/慈母' }}</div>
          </div>
          
          <!-- 墓志铭 -->
          <div class="epitaph-section">
            <div class="epitaph-text">{{ epitaph }}</div>
          </div>
          
          <!-- 装饰元素 -->
          <div class="decorative-elements">
            <div v-for="element in selectedTemplate.decorations" :key="element.id" 
                 class="decoration" :style="element.style">
              <iconify-icon :icon="element.icon" :width="element.size"></iconify-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑工具栏 -->
    <div class="edit-toolbar">
      <button @click="editBasicInfo" class="tool-btn">
        <iconify-icon icon="heroicons:user" width="20"></iconify-icon>
        <span>基本信息</span>
      </button>
      <button @click="editEpitaph" class="tool-btn">
        <iconify-icon icon="heroicons:document-text" width="20"></iconify-icon>
        <span>墓志铭</span>
      </button>
      <button @click="editDecorations" class="tool-btn">
        <iconify-icon icon="heroicons:sparkles" width="20"></iconify-icon>
        <span>装饰</span>
      </button>
      <button @click="saveTombstone" class="tool-btn primary">
        <iconify-icon icon="heroicons:check" width="20"></iconify-icon>
        <span>保存</span>
      </button>
    </div>

    <!-- 模板选择器 -->
    <div v-if="showTemplateSelector" class="modal-overlay" @click="showTemplateSelector = false">
      <div class="template-selector" @click.stop>
        <div class="modal-header">
          <h3>选择墓碑模板</h3>
          <button @click="showTemplateSelector = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="template-grid">
          <div 
            v-for="template in tombstoneTemplates" 
            :key="template.id"
            class="template-item"
            :class="{ active: selectedTemplate.id === template.id }"
            @click="selectTemplate(template)"
          >
            <div class="template-preview">
              <img :src="template.preview" :alt="template.name" />
            </div>
            <div class="template-info">
              <div class="template-name">{{ template.name }}</div>
              <div class="template-style">{{ template.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 基本信息编辑弹窗 -->
    <div v-if="showBasicInfoModal" class="modal-overlay" @click="showBasicInfoModal = false">
      <div class="edit-modal" @click.stop>
        <div class="modal-header">
          <h3>编辑基本信息</h3>
          <button @click="showBasicInfoModal = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="form-group">
            <label>姓名</label>
            <input type="text" v-model="editForm.name" class="form-input" />
          </div>
          
          <div class="form-group">
            <label>出生日期</label>
            <input type="date" v-model="editForm.birthDate" class="form-input" />
          </div>
          
          <div class="form-group">
            <label>逝世日期</label>
            <input type="date" v-model="editForm.deathDate" class="form-input" />
          </div>
          
          <div class="form-group">
            <label>称谓</label>
            <select v-model="editForm.title" class="form-select">
              <option value="慈父">慈父</option>
              <option value="慈母">慈母</option>
              <option value="先祖">先祖</option>
              <option value="先妣">先妣</option>
              <option value="显考">显考</option>
              <option value="显妣">显妣</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>遗像</label>
            <div class="avatar-upload">
              <img :src="editForm.avatar || '/default-avatar.png'" class="avatar-preview" />
              <button @click="uploadAvatar" class="upload-btn">
                <iconify-icon icon="heroicons:camera" width="16"></iconify-icon>
                更换照片
              </button>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showBasicInfoModal = false" class="cancel-btn">取消</button>
          <button @click="saveBasicInfo" class="save-btn">保存</button>
        </div>
      </div>
    </div>

    <!-- 墓志铭编辑弹窗 -->
    <div v-if="showEpitaphModal" class="modal-overlay" @click="showEpitaphModal = false">
      <div class="edit-modal" @click.stop>
        <div class="modal-header">
          <h3>编辑墓志铭</h3>
          <button @click="showEpitaphModal = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="form-group">
            <label>墓志铭内容</label>
            <textarea 
              v-model="editEpitaphText" 
              class="epitaph-textarea"
              placeholder="请输入墓志铭内容..."
              rows="6"
            ></textarea>
          </div>
          
          <div class="epitaph-templates">
            <div class="template-title">常用模板</div>
            <div class="template-list">
              <div 
                v-for="template in epitaphTemplates" 
                :key="template.id"
                class="epitaph-template"
                @click="useEpitaphTemplate(template)"
              >
                <div class="template-text">{{ template.text }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showEpitaphModal = false" class="cancel-btn">取消</button>
          <button @click="saveEpitaph" class="save-btn">保存</button>
        </div>
      </div>
    </div>

    <!-- 装饰编辑弹窗 -->
    <div v-if="showDecorationsModal" class="modal-overlay" @click="showDecorationsModal = false">
      <div class="edit-modal" @click.stop>
        <div class="modal-header">
          <h3>编辑装饰元素</h3>
          <button @click="showDecorationsModal = false" class="close-btn">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <div class="decoration-categories">
            <div 
              v-for="category in decorationCategories" 
              :key="category.id"
              class="category-tab"
              :class="{ active: selectedDecorationCategory === category.id }"
              @click="selectedDecorationCategory = category.id"
            >
              {{ category.name }}
            </div>
          </div>
          
          <div class="decoration-grid">
            <div 
              v-for="decoration in currentDecorations" 
              :key="decoration.id"
              class="decoration-item"
              @click="addDecoration(decoration)"
            >
              <iconify-icon :icon="decoration.icon" width="24"></iconify-icon>
              <span>{{ decoration.name }}</span>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showDecorationsModal = false" class="cancel-btn">取消</button>
          <button @click="saveDecorations" class="save-btn">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../../stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 族谱ID和成员ID
const genealogyId = ref(route.params.genealogyId as string)
const memberId = ref(route.params.memberId as string)

// 成员信息
const memberInfo = ref({
  name: '',
  avatar: '',
  birthDate: '',
  deathDate: '',
  title: '慈父'
})

// 墓志铭
const epitaph = ref('您的音容笑貌，永远留在我们心中。愿您在天堂安息，我们会永远怀念您。')

// 弹窗状态
const showTemplateSelector = ref(false)
const showBasicInfoModal = ref(false)
const showEpitaphModal = ref(false)
const showDecorationsModal = ref(false)

// 编辑表单
const editForm = reactive({
  name: '',
  birthDate: '',
  deathDate: '',
  title: '慈父',
  avatar: ''
})

const editEpitaphText = ref('')
const selectedDecorationCategory = ref('flowers')

// 墓碑模板
const tombstoneTemplates = ref([
  {
    id: 'classic',
    name: '经典石碑',
    description: '传统中式墓碑',
    style: 'classic',
    background: '/tombstone-classic.jpg',
    preview: '/tombstone-classic-preview.jpg',
    decorations: [
      { id: 'lotus1', icon: 'mdi:flower-lotus', size: 24, style: { top: '10px', left: '10px' } },
      { id: 'lotus2', icon: 'mdi:flower-lotus', size: 24, style: { top: '10px', right: '10px' } }
    ]
  },
  {
    id: 'modern',
    name: '现代简约',
    description: '简约现代风格',
    style: 'modern',
    background: '/tombstone-modern.jpg',
    preview: '/tombstone-modern-preview.jpg',
    decorations: [
      { id: 'star1', icon: 'heroicons:star', size: 20, style: { top: '20px', left: '50%', transform: 'translateX(-50%)' } }
    ]
  },
  {
    id: 'elegant',
    name: '典雅花纹',
    description: '典雅装饰风格',
    style: 'elegant',
    background: '/tombstone-elegant.jpg',
    preview: '/tombstone-elegant-preview.jpg',
    decorations: [
      { id: 'rose1', icon: 'mdi:flower-rose', size: 28, style: { bottom: '20px', left: '20px' } },
      { id: 'rose2', icon: 'mdi:flower-rose', size: 28, style: { bottom: '20px', right: '20px' } }
    ]
  }
])

const selectedTemplate = ref(tombstoneTemplates.value[0])

// 墓志铭模板
const epitaphTemplates = ref([
  { id: 1, text: '您的音容笑貌，永远留在我们心中。愿您在天堂安息，我们会永远怀念您。' },
  { id: 2, text: '慈祥的笑容，温暖的怀抱，您给了我们最珍贵的爱。愿您安息，我们永远爱您。' },
  { id: 3, text: '您用一生的爱呵护着我们，如今您虽然离去，但您的爱将永远伴随我们前行。' },
  { id: 4, text: '感谢您给予我们生命，教会我们做人的道理。您的恩情我们永生难忘。' },
  { id: 5, text: '您是我们心中永远的明灯，指引着我们前进的方向。愿您在天堂幸福安康。' }
])

// 装饰分类
const decorationCategories = ref([
  { id: 'flowers', name: '花卉' },
  { id: 'symbols', name: '符号' },
  { id: 'religious', name: '宗教' },
  { id: 'nature', name: '自然' }
])

// 装饰元素
const decorationItems = ref({
  flowers: [
    { id: 'lotus', name: '莲花', icon: 'mdi:flower-lotus' },
    { id: 'rose', name: '玫瑰', icon: 'mdi:flower-rose' },
    { id: 'chrysanthemum', name: '菊花', icon: 'mdi:flower' },
    { id: 'lily', name: '百合', icon: 'mdi:flower-tulip' }
  ],
  symbols: [
    { id: 'star', name: '星星', icon: 'heroicons:star' },
    { id: 'heart', name: '爱心', icon: 'heroicons:heart' },
    { id: 'infinity', name: '无限', icon: 'mdi:infinity' },
    { id: 'peace', name: '和平', icon: 'mdi:peace' }
  ],
  religious: [
    { id: 'cross', name: '十字架', icon: 'mdi:cross' },
    { id: 'buddha', name: '佛像', icon: 'mdi:buddha' },
    { id: 'yin-yang', name: '太极', icon: 'mdi:yin-yang' },
    { id: 'om', name: '唵', icon: 'mdi:om' }
  ],
  nature: [
    { id: 'tree', name: '树木', icon: 'heroicons:tree' },
    { id: 'mountain', name: '山峰', icon: 'heroicons:mountain' },
    { id: 'sun', name: '太阳', icon: 'heroicons:sun' },
    { id: 'moon', name: '月亮', icon: 'heroicons:moon' }
  ]
})

// 计算属性
const currentDecorations = computed(() => {
  return decorationItems.value[selectedDecorationCategory.value] || []
})

// 生命周期
onMounted(() => {
  loadMemberInfo()
})

// 方法
const loadMemberInfo = async () => {
  try {
    const response = await fetch(`/api/genealogy/${genealogyId.value}/members/${memberId.value}`, {
      headers: {
        'Authorization': `Bearer ${appStore.token}`
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        memberInfo.value = result.data
        // 初始化编辑表单
        Object.assign(editForm, result.data)
      }
    }
  } catch (error) {
    console.error('加载成员信息失败:', error)
  }
}

const selectTemplate = (template) => {
  selectedTemplate.value = template
  showTemplateSelector.value = false
}

const editBasicInfo = () => {
  Object.assign(editForm, memberInfo.value)
  showBasicInfoModal.value = true
}

const editEpitaph = () => {
  editEpitaphText.value = epitaph.value
  showEpitaphModal.value = true
}

const editDecorations = () => {
  showDecorationsModal.value = true
}

const saveBasicInfo = () => {
  Object.assign(memberInfo.value, editForm)
  showBasicInfoModal.value = false
}

const saveEpitaph = () => {
  epitaph.value = editEpitaphText.value
  showEpitaphModal.value = false
}

const saveDecorations = () => {
  showDecorationsModal.value = false
}

const useEpitaphTemplate = (template) => {
  editEpitaphText.value = template.text
}

const addDecoration = (decoration) => {
  // 添加装饰元素到墓碑
  console.log('添加装饰:', decoration)
}

const uploadAvatar = () => {
  // 创建文件上传输入
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // 处理图片上传
      const reader = new FileReader()
      reader.onload = (e) => {
        editForm.avatar = e.target.result
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

const saveTombstone = async () => {
  try {
    appStore.showLoading('保存中...')
    
    const tombstoneData = {
      memberId: memberId.value,
      template: selectedTemplate.value,
      memberInfo: memberInfo.value,
      epitaph: epitaph.value,
      decorations: selectedTemplate.value.decorations
    }
    
    const response = await fetch(`/api/genealogy/${genealogyId.value}/tombstones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appStore.token}`
      },
      body: JSON.stringify(tombstoneData)
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        appStore.showToast('墓碑保存成功', 'success')
        router.go(-1)
      } else {
        appStore.showToast(result.message || '保存失败', 'error')
      }
    } else {
      appStore.showToast('保存请求失败', 'error')
    }
  } catch (error) {
    console.error('保存墓碑失败:', error)
    appStore.showToast('保存失败', 'error')
  } finally {
    appStore.hideLoading()
  }
}

// 辅助方法
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.memorial-tombstone-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .template-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  cursor: pointer;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 墓碑预览 */
.tombstone-preview {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.tombstone-container {
  width: 300px;
  height: 450px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tombstone-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.tombstone-background img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tombstone-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

/* 墓碑样式 */
.tombstone-container.classic {
  background: #333;
}

.tombstone-container.modern {
  background: #222;
}

.tombstone-container.elegant {
  background: #2c2c2c;
}

/* 遗像 */
.memorial-avatar {
  position: relative;
  width: 120px;
  height: 120px;
  margin-top: 30px;
  margin-bottom: 20px;
}

.memorial-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.avatar-frame {
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 50%;
}

/* 基本信息 */
.memorial-info {
  text-align: center;
  margin-bottom: 20px;
}

.memorial-name {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.memorial-dates {
  font-size: 14px;
  margin-bottom: 8px;
}

.date-separator {
  margin: 0 5px;
}

.memorial-title {
  font-size: 16px;
  font-weight: 500;
}

/* 墓志铭 */
.epitaph-section {
  text-align: center;
  margin-top: 20px;
  padding: 0 10px;
}

.epitaph-text {
  font-size: 14px;
  line-height: 1.6;
  font-style: italic;
}

/* 装饰元素 */
.decorative-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.decoration {
  position: absolute;
  color: rgba(255, 255, 255, 0.7);
}

/* 编辑工具栏 */
.edit-toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  padding: 12px 16px;
  border-top: 1px solid #eee;
  z-index: 100;
}

.tool-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: #f5f5f5;
  color: #333;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 0 4px;
  cursor: pointer;
}

.tool-btn.primary {
  background: #07c160;
  color: white;
}

/* 模板选择器 */
.modal-overlay {
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

.template-selector {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
}

.close-btn:hover {
  background: #f5f5f5;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 20px;
  overflow-y: auto;
}

.template-item {
  border: 2px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.template-item.active {
  border-color: #07c160;
}

.template-preview {
  height: 150px;
  overflow: hidden;
}

.template-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.template-info {
  padding: 12px;
}

.template-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.template-style {
  font-size: 12px;
  color: #666;
}

/* 编辑弹窗 */
.edit-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.form-input,
.form-select,
.epitaph-textarea {
  width: 100%;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
}

.epitaph-textarea {
  height: auto;
  padding: 12px;
  resize: vertical;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.upload-btn {
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  cursor: pointer;
}

.epitaph-templates {
  margin-top: 20px;
}

.template-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.epitaph-template {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.epitaph-template:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.decoration-categories {
  display: flex;
  border-bottom: 1px solid #eee;
  margin-bottom: 16px;
}

.category-tab {
  padding: 8px 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.category-tab.active {
  color: #07c160;
  border-bottom-color: #07c160;
}

.decoration-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.decoration-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.decoration-item:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.decoration-item span {
  font-size: 12px;
  color: #333;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.cancel-btn {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

.save-btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: white;
  font-size: 14px;
  cursor: pointer;
}
</style>
