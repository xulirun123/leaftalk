<template>
  <div class="member-detail-panel">
    <div class="panel-overlay" @click="$emit('close')"></div>
    
    <div class="panel-content">
      <!-- 头部 -->
      <div class="panel-header">
        <div class="member-basic">
          <div class="member-avatar">
            <img :src="member.avatar" :alt="member.name" />
            <div v-if="member.isPatriarch" class="patriarch-crown">
              <iconify-icon icon="heroicons:crown" width="20"></iconify-icon>
            </div>
          </div>
          
          <div class="member-info">
            <h3 class="member-name">{{ member.name }}</h3>
            <div class="member-title">{{ member.title }}</div>
            <div class="member-status">
              <span :class="['status-badge', member.isAlive ? 'alive' : 'deceased']">
                {{ member.isAlive ? '在世' : '已故' }}
              </span>
              <span class="generation-badge">{{ getGenerationLabel(member.generation) }}</span>
            </div>
          </div>
        </div>
        
        <button @click="$emit('close')" class="close-btn">
          <iconify-icon icon="heroicons:x-mark" width="24"></iconify-icon>
        </button>
      </div>
      
      <!-- 详细信息 -->
      <div class="panel-body">
        <div class="info-sections">
          <!-- 基本信息 -->
          <div class="info-section">
            <h4>基本信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>性别</label>
                <span>{{ member.gender === 'male' ? '男' : '女' }}</span>
              </div>
              
              <div class="info-item">
                <label>出生日期</label>
                <span>{{ formatDate(member.birthDate) }}</span>
              </div>
              
              <div v-if="!member.isAlive" class="info-item">
                <label>逝世日期</label>
                <span>{{ formatDate(member.deathDate) }}</span>
              </div>
              
              <div v-if="member.location" class="info-item">
                <label>居住地</label>
                <span>{{ member.location }}</span>
              </div>
              
              <div v-if="member.occupation" class="info-item">
                <label>职业</label>
                <span>{{ member.occupation }}</span>
              </div>
            </div>
          </div>
          
          <!-- 家庭关系 -->
          <div class="info-section">
            <h4>家庭关系</h4>
            <div class="relationships">
              <!-- 父母 -->
              <div v-if="parents.length > 0" class="relationship-group">
                <label>父母</label>
                <div class="relationship-members">
                  <div 
                    v-for="parent in parents" 
                    :key="parent.id"
                    class="relationship-member"
                    @click="viewMember(parent)"
                  >
                    <img :src="parent.avatar" :alt="parent.name" />
                    <span>{{ parent.name }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 配偶 -->
              <div v-if="spouses.length > 0" class="relationship-group">
                <label>配偶</label>
                <div class="relationship-members">
                  <div 
                    v-for="spouse in spouses" 
                    :key="spouse.id"
                    class="relationship-member"
                    @click="viewMember(spouse)"
                  >
                    <img :src="spouse.avatar" :alt="spouse.name" />
                    <span>{{ spouse.name }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 子女 -->
              <div v-if="children.length > 0" class="relationship-group">
                <label>子女</label>
                <div class="relationship-members">
                  <div 
                    v-for="child in children" 
                    :key="child.id"
                    class="relationship-member"
                    @click="viewMember(child)"
                  >
                    <img :src="child.avatar" :alt="child.name" />
                    <span>{{ child.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 统计信息 -->
          <div class="info-section">
            <h4>统计信息</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">{{ spouses.length }}</div>
                <div class="stat-label">配偶</div>
              </div>
              
              <div class="stat-item">
                <div class="stat-value">{{ children.length }}</div>
                <div class="stat-label">子女</div>
              </div>
              
              <div class="stat-item">
                <div class="stat-value">{{ getDescendantsCount() }}</div>
                <div class="stat-label">后代</div>
              </div>
              
              <div v-if="member.isAlive" class="stat-item">
                <div class="stat-value">{{ getAge() }}</div>
                <div class="stat-label">年龄</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="panel-footer">
        <button @click="$emit('edit', member)" class="edit-btn">
          <iconify-icon icon="heroicons:pencil" width="16"></iconify-icon>
          <span>编辑信息</span>
        </button>
        
        <button @click="viewInTree" class="view-tree-btn">
          <iconify-icon icon="heroicons:eye" width="16"></iconify-icon>
          <span>族谱中查看</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
const props = defineProps({
  member: {
    type: Object,
    required: true
  },
  genealogyId: {
    type: String,
    required: true
  },
  allMembers: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['close', 'edit', 'view-member'])

// 计算属性
const parents = computed(() => {
  const parentIds = [props.member.fatherId, props.member.motherId].filter(Boolean)
  return props.allMembers.filter(member => parentIds.includes(member.id))
})

const spouses = computed(() => {
  if (!props.member.spouseIds) return []
  return props.allMembers.filter(member => props.member.spouseIds.includes(member.id))
})

const children = computed(() => {
  if (!props.member.childrenIds) return []
  return props.allMembers.filter(member => props.member.childrenIds.includes(member.id))
})

// 方法
const getGenerationLabel = (generation) => {
  const labels = ['一世', '二世', '三世', '四世', '五世', '六世', '七世', '八世']
  return labels[generation - 1] || `${generation}世`
}

const formatDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getAge = () => {
  if (!props.member.birthDate) return '未知'
  const birth = new Date(props.member.birthDate)
  const now = new Date()
  const age = now.getFullYear() - birth.getFullYear()
  return age + '岁'
}

const getDescendantsCount = () => {
  // 简化计算，实际应该递归计算所有后代
  return children.value.length
}

const viewMember = (member) => {
  emit('view-member', member)
}

const viewInTree = () => {
  // 在族谱中定位到该成员
  emit('close')
}
</script>

<style scoped>
.member-detail-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.panel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.panel-content {
  position: relative;
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.member-basic {
  display: flex;
  align-items: center;
  gap: 16px;
}

.member-avatar {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.patriarch-crown {
  position: absolute;
  top: -4px;
  right: -4px;
  color: #FFD700;
  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.3));
}

.member-info {
  flex: 1;
}

.member-name {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.member-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.member-status {
  display: flex;
  gap: 8px;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.alive {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.status-badge.deceased {
  background: rgba(158, 158, 158, 0.1);
  color: #9E9E9E;
}

.generation-badge {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(7, 193, 96, 0.1);
  color: #07c160;
}

.close-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.info-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.info-item span {
  font-size: 14px;
  color: #333;
}

.relationships {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.relationship-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.relationship-group label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.relationship-members {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.relationship-member {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.relationship-member:hover {
  border-color: #07c160;
  background: rgba(7, 193, 96, 0.05);
}

.relationship-member img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.relationship-member span {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #07c160;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.panel-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.edit-btn, .view-tree-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn {
  background: #07c160;
  color: white;
}

.edit-btn:hover {
  background: #06a552;
}

.view-tree-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.view-tree-btn:hover {
  background: #e0e0e0;
}
</style>
