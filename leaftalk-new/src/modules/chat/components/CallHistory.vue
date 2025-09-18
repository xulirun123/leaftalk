<template>
  <div class="call-history">
    <!-- 头部 -->
    <div class="history-header">
      <h2>通话记录</h2>
      <div class="header-actions">
        <button class="filter-btn" @click="showFilter = !showFilter">
          <iconify-icon icon="heroicons:funnel" width="20"></iconify-icon>
        </button>
        <button class="clear-btn" @click="showClearDialog = true">
          <iconify-icon icon="heroicons:trash" width="20"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div v-if="showFilter" class="filter-section">
      <div class="filter-tabs">
        <button 
          v-for="filter in filters" 
          :key="filter.key"
          :class="['filter-tab', { active: activeFilter === filter.key }]"
          @click="activeFilter = filter.key"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- 通话记录列表 -->
    <div class="history-list">
      <div v-if="filteredHistory.length === 0" class="empty-state">
        <iconify-icon icon="heroicons:phone-slash" width="48" style="color: #ccc;"></iconify-icon>
        <p>暂无通话记录</p>
      </div>

      <div 
        v-for="call in filteredHistory" 
        :key="call.id"
        class="history-item"
        @click="showCallDetail(call)"
      >
        <!-- 通话信息 -->
        <div class="call-info">
          <div class="participant-avatar">
            <img 
              :src="call.isIncoming ? call.caller.avatar : call.receiver.avatar" 
              :alt="call.isIncoming ? call.caller.name : call.receiver.name"
            >
            <div :class="['call-type-badge', call.type]">
              <iconify-icon 
                :icon="getCallTypeIcon(call.type)" 
                width="12"
              ></iconify-icon>
            </div>
          </div>

          <div class="call-details">
            <div class="participant-name">
              {{ call.isIncoming ? call.caller.name : call.receiver.name }}
            </div>
            <div class="call-meta">
              <span :class="['call-status', call.status]">
                {{ getCallStatusText(call) }}
              </span>
              <span class="call-time">{{ formatCallTime(call.startTime || call.endTime || 0) }}</span>
            </div>
            <div v-if="call.duration > 0" class="call-duration">
              通话时长: {{ formatDuration(call.duration) }}
            </div>
          </div>
        </div>

        <!-- 通话操作 -->
        <div class="call-actions">
          <button 
            class="action-btn call-back-btn"
            @click.stop="callBack(call)"
            :title="call.type === 'video' ? '视频回拨' : '语音回拨'"
          >
            <iconify-icon 
              :icon="call.type === 'video' ? 'heroicons:video-camera' : 'heroicons:phone'" 
              width="18"
            ></iconify-icon>
          </button>

          <button 
            class="action-btn more-btn"
            @click.stop="showCallOptions(call)"
          >
            <iconify-icon icon="heroicons:ellipsis-horizontal" width="18"></iconify-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- 通话详情弹窗 -->
    <div v-if="selectedCall" class="call-detail-modal" @click="selectedCall = null">
      <div class="detail-content" @click.stop>
        <div class="detail-header">
          <h3>通话详情</h3>
          <button class="close-btn" @click="selectedCall = null">
            <iconify-icon icon="heroicons:x-mark" width="20"></iconify-icon>
          </button>
        </div>

        <div class="detail-body">
          <div class="detail-participant">
            <img 
              :src="selectedCall.isIncoming ? selectedCall.caller.avatar : selectedCall.receiver.avatar"
              :alt="selectedCall.isIncoming ? selectedCall.caller.name : selectedCall.receiver.name"
              class="detail-avatar"
            >
            <h4>{{ selectedCall.isIncoming ? selectedCall.caller.name : selectedCall.receiver.name }}</h4>
          </div>

          <div class="detail-info">
            <div class="info-row">
              <span class="label">通话类型:</span>
              <span class="value">
                <iconify-icon :icon="getCallTypeIcon(selectedCall.type)" width="16"></iconify-icon>
                {{ getCallTypeText(selectedCall.type) }}
              </span>
            </div>

            <div class="info-row">
              <span class="label">通话方向:</span>
              <span class="value">{{ selectedCall.isIncoming ? '来电' : '去电' }}</span>
            </div>

            <div class="info-row">
              <span class="label">通话状态:</span>
              <span :class="['value', 'status', selectedCall.status]">
                {{ getCallStatusText(selectedCall) }}
              </span>
            </div>

            <div v-if="selectedCall.startTime" class="info-row">
              <span class="label">开始时间:</span>
              <span class="value">{{ formatDetailTime(selectedCall.startTime) }}</span>
            </div>

            <div v-if="selectedCall.endTime" class="info-row">
              <span class="label">结束时间:</span>
              <span class="value">{{ formatDetailTime(selectedCall.endTime) }}</span>
            </div>

            <div v-if="selectedCall.duration > 0" class="info-row">
              <span class="label">通话时长:</span>
              <span class="value">{{ formatDuration(selectedCall.duration) }}</span>
            </div>

            <div class="info-row">
              <span class="label">通话质量:</span>
              <span :class="['value', 'quality', selectedCall.quality]">
                <iconify-icon :icon="getQualityIcon(selectedCall.quality)" width="16"></iconify-icon>
                {{ getQualityText(selectedCall.quality) }}
              </span>
            </div>
          </div>

          <div class="detail-actions">
            <button class="detail-action-btn" @click="callBack(selectedCall)">
              <iconify-icon :icon="getCallTypeIcon(selectedCall.type)" width="20"></iconify-icon>
              <span>{{ selectedCall.type === 'video' ? '视频回拨' : '语音回拨' }}</span>
            </button>

            <button class="detail-action-btn" @click="deleteCall(selectedCall)">
              <iconify-icon icon="heroicons:trash" width="20"></iconify-icon>
              <span>删除记录</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 通话选项菜单 -->
    <div v-if="showOptions" class="options-menu" @click="showOptions = false">
      <div class="options-content" @click.stop>
        <button class="option-item" @click="callBack(optionsCall!)">
          <iconify-icon :icon="getCallTypeIcon(optionsCall!.type)" width="20"></iconify-icon>
          <span>{{ optionsCall!.type === 'video' ? '视频回拨' : '语音回拨' }}</span>
        </button>

        <button class="option-item" @click="showCallDetail(optionsCall!)">
          <iconify-icon icon="heroicons:information-circle" width="20"></iconify-icon>
          <span>查看详情</span>
        </button>

        <button class="option-item danger" @click="deleteCall(optionsCall!)">
          <iconify-icon icon="heroicons:trash" width="20"></iconify-icon>
          <span>删除记录</span>
        </button>
      </div>
    </div>

    <!-- 清空确认对话框 -->
    <div v-if="showClearDialog" class="clear-dialog" @click="showClearDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>清空通话记录</h3>
        </div>
        <div class="dialog-body">
          <p>确定要清空所有通话记录吗？此操作不可撤销。</p>
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="showClearDialog = false">取消</button>
          <button class="confirm-btn" @click="clearHistory">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCallStore } from '../stores/call'
import type { CallSession } from '../stores/call'

const callStore = useCallStore()

// 响应式数据
const showFilter = ref(false)
const activeFilter = ref('all')
const selectedCall = ref<CallSession | null>(null)
const showOptions = ref(false)
const optionsCall = ref<CallSession | null>(null)
const showClearDialog = ref(false)

// 筛选选项
const filters = [
  { key: 'all', label: '全部' },
  { key: 'incoming', label: '来电' },
  { key: 'outgoing', label: '去电' },
  { key: 'missed', label: '未接' },
  { key: 'video', label: '视频' },
  { key: 'audio', label: '语音' }
]

// 计算属性
const filteredHistory = computed(() => {
  let history = callStore.callHistory

  switch (activeFilter.value) {
    case 'incoming':
      return history.filter(call => call.isIncoming)
    case 'outgoing':
      return history.filter(call => !call.isIncoming)
    case 'missed':
      return history.filter(call => call.status === 'ended' && call.duration === 0)
    case 'video':
      return history.filter(call => call.type === 'video')
    case 'audio':
      return history.filter(call => call.type === 'audio')
    default:
      return history
  }
})

// 方法
const showCallDetail = (call: CallSession) => {
  selectedCall.value = call
  showOptions.value = false
}

const showCallOptions = (call: CallSession) => {
  optionsCall.value = call
  showOptions.value = true
}

const callBack = async (call: CallSession) => {
  try {
    const targetUserId = call.isIncoming ? call.caller.id : call.receiver.id
    await callStore.startCall(targetUserId, call.type as 'audio' | 'video')
    
    // 关闭弹窗
    selectedCall.value = null
    showOptions.value = false
  } catch (error) {
    console.error('回拨失败:', error)
  }
}

const deleteCall = (call: CallSession) => {
  const index = callStore.callHistory.findIndex(c => c.id === call.id)
  if (index > -1) {
    callStore.callHistory.splice(index, 1)
  }
  
  // 关闭弹窗
  selectedCall.value = null
  showOptions.value = false
}

const clearHistory = () => {
  callStore.callHistory.splice(0)
  showClearDialog.value = false
}

const getCallTypeIcon = (type: string) => {
  switch (type) {
    case 'video': return 'heroicons:video-camera'
    case 'screen': return 'heroicons:computer-desktop'
    default: return 'heroicons:phone'
  }
}

const getCallTypeText = (type: string) => {
  switch (type) {
    case 'video': return '视频通话'
    case 'screen': return '屏幕共享'
    default: return '语音通话'
  }
}

const getCallStatusText = (call: CallSession) => {
  if (call.status === 'ended') {
    if (call.duration > 0) {
      return call.isIncoming ? '来电' : '去电'
    } else {
      return call.isIncoming ? '未接来电' : '未接通'
    }
  }
  
  switch (call.status) {
    case 'failed': return '通话失败'
    case 'calling': return '呼叫中'
    case 'ringing': return '振铃中'
    case 'connected': return '通话中'
    default: return '未知状态'
  }
}

const getQualityIcon = (quality: string) => {
  switch (quality) {
    case 'excellent': return 'heroicons:signal'
    case 'good': return 'heroicons:signal'
    case 'fair': return 'heroicons:signal-slash'
    case 'poor': return 'heroicons:exclamation-triangle'
    default: return 'heroicons:signal'
  }
}

const getQualityText = (quality: string) => {
  switch (quality) {
    case 'excellent': return '优秀'
    case 'good': return '良好'
    case 'fair': return '一般'
    case 'poor': return '较差'
    default: return '未知'
  }
}

const formatCallTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

const formatDetailTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>
