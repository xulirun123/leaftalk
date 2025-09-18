<template>
  <div class="social-profile">
    <div class="content">
      <div class="function-modules">
        <div class="module-item">
          <span>来源：</span>
          <span class="item-value">{{ displaySource }}</span>
        </div>
        <div class="module-item" v-if="signature">
          <span>签名：</span>
          <span class="item-value desc">{{ signature }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { apiClient } from '../../../shared/services/apiClient'

const route = useRoute()
const friendId = computed(() => String(route.params.id || route.params.userId || route.params.friendId || route.query.id || ''))

const sourceRaw = ref('未知来源')
const signature = ref('')

function readContacts() {
  try { return JSON.parse(localStorage.getItem('yeyu_contacts') || '[]') } catch { return [] }
}
function readProfileCache() {
  try { return JSON.parse(localStorage.getItem('friend_profile_cache') || '{}') } catch { return {} }
}

// 统一来源枚举映射
function mapSource(val: string): string {
  const s = (val || '').toLowerCase()
  if (!s) return '未知来源'
  if (s.includes('手机') || s.includes('phone')) return '通过手机联系人添加'
  if (s.includes('名片') || s.includes('card')) return '通过分享名片添加'
  if (s.includes('搜索手机号') || s.includes('search phone')) return '通过搜索手机号添加'
  if (s.includes('搜索叶语号') || s.includes('yeyu') || s.includes('yeyu id')) return '通过搜索叶语号添加'
  if (s.includes('扫码') || s.includes('qr') || s.includes('scan')) return '通过扫码添加'
  if (s.includes('群聊') || s.includes('group')) return '通过群聊添加'
  return val
}

const displaySource = computed(() => mapSource(sourceRaw.value))

onMounted(async () => {
  const id = friendId.value
  // 来源
  const localKey = `friend_source_${id}`
  const localSource = localStorage.getItem(localKey)
  if (localSource) {
    sourceRaw.value = localSource
  } else {
    const contacts = readContacts()
    const found = contacts.find((c:any) => String(c.id) === id)
    sourceRaw.value = found?.source || '未知来源'
  }
  // 签名（缓存/联系人 → API 回填）
  const cache = readProfileCache()
  const cached = cache?.[id]
  signature.value = (cached?.signature || '').toString().trim() || ''
  if (!signature.value) {
    const contacts = readContacts()
    const found = contacts.find((c:any) => String(c.id) === id)
    signature.value = (found?.signature || '').toString().trim()
  }
  // 若仍为空，则从后端拉取一次
  if (!signature.value) {
    try {
      const r = await apiClient.get<any>(`/users/${id}`)
      if (r?.success && r.data) {
        const sig = (r.data.signature ?? '').toString().trim()
        if (typeof sig === 'string') {
          signature.value = sig
          // 同步回本地缓存
          const cc = readProfileCache()
          cc[id] = { ...(cc[id] || {}), signature: sig }
          localStorage.setItem('friend_profile_cache', JSON.stringify(cc))
        }
      }
    } catch (e) {
      console.warn('获取好友签名失败:', e)
    }
  }
})
</script>

<style scoped>
.social-profile { min-height: 100vh; background: #EDEDED; }
.content { padding-top: 5px; }
.function-modules { background: transparent; }
.module-item { display:flex; align-items:center; height:42px; padding:0 16px; background:#fff; margin-bottom:5px; }
.module-item:last-child { margin-bottom:0; }
.item-value { margin-left:auto; color:#333; font-size:14px; }
.item-value.desc { color:#666; font-size:13px; }
</style>

