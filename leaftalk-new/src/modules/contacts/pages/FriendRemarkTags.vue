<template>
  <div class="friend-remark-tags">
    <!-- 使用全局导航栏，标题由路由 meta 提供：备注和标签 -->
    <div class="content">
      <div class="section">
        <div class="label">备注</div>
        <div class="input-wrap">
          <input v-model="remarkInput" type="text" class="input" placeholder="请输入备注名（最多20个字）" maxlength="20" />
          <button v-if="remarkInput" class="clear-btn" @click="remarkInput = ''">×</button>
        </div>
      </div>

      <!-- 标签 -->
      <div class="section">
        <div class="label">标签</div>
        <div v-if="tags.length" class="tags" @click="selectedTagIndex=-1">
          <span v-for="(t, i) in tags" :key="i" class="tag" @click.stop="toggleTagRemove(i)">
            {{ t }}
            <button v-if="selectedTagIndex===i" class="remove" @click.stop="removeTag(i)">×</button>
          </span>
        </div>
        <div class="add-row" @click="showTagInput = !showTagInput">{{ showTagInput ? '收起' : '添加标签项' }}</div>
        <div v-if="showTagInput" class="input-wrap">
          <input v-model="tagInput" type="text" class="input" placeholder="添加标签" maxlength="10" @keyup.enter="addTag" />
          <button v-if="tagInput" class="clear-btn" @click="addTag">＋</button>
        </div>
      </div>

      <!-- 电话 -->
      <div class="section">
        <div class="label">电话</div>
        <div class="add-row" @click="showPhoneInput = !showPhoneInput">{{ showPhoneInput ? '收起' : '添加电话号码' }}</div>
        <div v-if="showPhoneInput" class="input-wrap">
          <input v-model="phoneInput" type="tel" class="input" placeholder="添加电话号码" maxlength="20" @keyup.enter="addPhone" />
          <button v-if="phoneInput" class="clear-btn" @click="addPhone">＋</button>
        </div>
        <div v-if="phones.length" class="phone-list">
          <div v-for="(p, i) in phones" :key="i" class="phone-item">
            <span class="num">{{ p }}</span>
            <button class="remove" @click="removePhone(i)">删除</button>
          </div>
        </div>
      </div>

      <!-- 描述 -->
      <div class="section">
        <div class="label">描述</div>
        <div class="input-wrap">
          <textarea v-model="description" class="textarea" placeholder="请输入描述信息（最多200字）" maxlength="200" rows="4" />
        </div>
      </div>



    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { apiClient } from '../../../shared/services/apiClient'

const route = useRoute()
const router = useRouter()

const friendId = computed(() => route.params.id as string)
const remarkInput = ref('')
const tagInput = ref('')
const phoneInput = ref('')
const description = ref('')
const showTagInput = ref(false)
const showPhoneInput = ref(false)

const tags = ref<string[]>([])
const phones = ref<string[]>([])

const eventBus: any = inject('eventBus')

const selectedTagIndex = ref(-1)
const goBack = () => router.back()

onMounted(async () => {
  try {
    // 1) 先用本地缓存回填，保证即刻可见
    const saved = JSON.parse(localStorage.getItem(`friend_remark_${friendId.value}`) || 'null')
    if (saved) {
      remarkInput.value = saved.name || ''
      tags.value = Array.isArray(saved.tags) ? saved.tags : []
      phones.value = Array.isArray(saved.phones) ? saved.phones : []
      description.value = saved.description || ''
    }

    // 2) 后台拉取后端持久化，作为真实数据源（覆盖本地）
    try {
      const resp = await apiClient.get<any>(`/contacts/${friendId.value}/remark-pack`)
      if (resp?.success && resp?.data) {
        const pack = resp.data
        const payload = {
          name: pack.remark || '',
          tags: Array.isArray(pack.tags) ? pack.tags : [],
          phones: Array.isArray(pack.phones) ? pack.phones : [],
          description: pack.description || ''
        }
        remarkInput.value = payload.name
        tags.value = payload.tags
        phones.value = payload.phones
        description.value = payload.description
        try { localStorage.setItem(`friend_remark_${friendId.value}`, JSON.stringify(payload)) } catch {}
      }
    } catch {}

    // 3) 若仍无名称，尝试用好友昵称/名称作为默认
    if (!remarkInput.value) {
      let name = ''
      // friend_profile_cache
      try {
        const cache = JSON.parse(localStorage.getItem('friend_profile_cache') || '{}')
        const f = cache[friendId.value]
        name = f?.nickname || f?.name || ''
      } catch {}
      // yeyu_contacts
      if (!name) {
        try {
          const contacts = JSON.parse(localStorage.getItem('yeyu_contacts') || '[]')
          const c = contacts.find((x: any) => x.id === friendId.value)
          name = c?.nickname || c?.name || ''
        } catch {}
      }
      // 调用API补齐
      if (!name) {
        try {
          const resp = await apiClient.get<any>(`/users/${friendId.value}`)
          if (resp?.success && resp?.data) {
            const u = resp.data
            name = u.nickname || u.name || u.real_name || u.username || ''
          }
        } catch {}
      }
      if (name) remarkInput.value = name
    }
  } catch {}

  // 监听顶部栏“完成”
  try { eventBus?.on && eventBus.on('friendRemarkSave', saveRemark) } catch {}

  // 全局点击隐藏标签删除按钮
  const onDocClick = () => { selectedTagIndex.value = -1 }
  document.addEventListener('click', onDocClick)
  // 卸载时移除监听
  onUnmounted(() => document.removeEventListener('click', onDocClick))
})

const addTag = () => {
  const t = tagInput.value.trim()
  if (!t) return
  if (!tags.value.includes(t) && tags.value.length < 10) tags.value.push(t)
  tagInput.value = ''
  selectedTagIndex.value = -1
}
const toggleTagRemove = (i: number) => {
  selectedTagIndex.value = selectedTagIndex.value === i ? -1 : i
}
const removeTag = (i: number) => { tags.value.splice(i, 1); selectedTagIndex.value = -1 }

const addPhone = () => {
  const p = phoneInput.value.trim()
  if (!p) return
  if (!phones.value.includes(p) && phones.value.length < 10) phones.value.push(p)
  phoneInput.value = ''
}
const removePhone = (i: number) => { phones.value.splice(i, 1) }

const saveRemark = async () => {
  try {
    const payload = {
      name: remarkInput.value.trim(),
      tags: tags.value,
      phones: phones.value,
      description: description.value.trim()
    }

    // 先保存到后端
    try {
      await apiClient.put(`/contacts/${friendId.value}/remark-pack`, payload)
    } catch (e) {
      console.warn('⚠️ 后端保存备注失败，使用本地缓存回退:', e)
    }

    // 同步本地缓存
    localStorage.setItem(`friend_remark_${friendId.value}`, JSON.stringify(payload))

    // 更新本地通讯录备注
    try {
      const contacts = JSON.parse(localStorage.getItem('yeyu_contacts') || '[]')
      const idx = contacts.findIndex((c: any) => String(c.id) === String(friendId.value))
      if (idx >= 0) {
        contacts[idx].remark = payload.name
        localStorage.setItem('yeyu_contacts', JSON.stringify(contacts))
      }
    } catch {}

    // 更新 FriendProfile 缓存备注
    try {
      const cacheKey = 'friend_profile_cache'
      const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}')
      if (cached[friendId.value]) {
        cached[friendId.value].remark = payload.name
        localStorage.setItem(cacheKey, JSON.stringify(cached))
      }
    } catch {}

    // 通知其他页面刷新显示
    try { eventBus && eventBus.on && eventBus.emit('friendRemarkUpdated', { id: String(friendId.value), payload }) } catch {}

    router.push(`/friend-profile/${friendId.value}`)
  } catch (e) {
    console.warn('保存备注失败:', e)
  }
}
</script>

<style scoped>
.friend-remark-tags { min-height: 100vh; background: #e5e5e5; display: flex; flex-direction: column; }
.content { padding: 12px 16px; }
.section { background: #fff; border-radius: 12px; padding: 12px; margin-bottom: 5px; }
.label { font-size: 11px; color: #666; margin-bottom: 6px; font-weight: 400; }
.input-wrap { position: relative; margin-top: 6px; }
.input { width: 100%; height: 36px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 0 32px 0 10px; font-size: 11px; outline: none; }
.input:focus { border-color: #07C160; }
.clear-btn { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; border: none; background: transparent; color: #999; font-size: 16px; line-height: 1; padding: 0; cursor: pointer; }
.clear-btn:active { color: #666; }
.actions { display: flex; gap: 12px; margin-top: 16px; }
/* 标签、电话、描述样式 */
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #e8f5e8; color: #07C160; border-radius: 12px; font-size: 11px; }
.tag .remove { border: none; background: transparent; color: #999; cursor: pointer; font-size: 14px; line-height: 1; }
.add-row { margin-top: 8px; height: 36px; display: flex; align-items: center; justify-content: center; border: 1px dashed #cfd8dc; border-radius: 8px; color: #07C160; font-size: 12px; background: #f8fff9; }
.phone-list { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
.phone-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff; }
.phone-item .num { font-size: 13px; color: #333; }
.phone-item .remove { border: none; background: transparent; color: #ff5555; cursor: pointer; font-size: 12px; }
.textarea { width: 100%; min-height: 80px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 8px 10px; font-size: 12px; outline: none; resize: vertical; }
.textarea:focus { border-color: #07C160; background: #fff; }

.btn { flex: 1; height: 36px; border-radius: 10px; border: 1px solid #e0e0e0; background: #fff; font-size: 13px; }
.btn.confirm { color: #fff; background: #07C160; border-color: #07C160; }
</style>

