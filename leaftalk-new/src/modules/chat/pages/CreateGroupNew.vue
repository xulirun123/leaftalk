<template>
  <div class="create-group-page">
    <div class="search-container">
      <div class="search-box">
        <iconify-icon icon="heroicons:magnifying-glass" width="16" class="search-icon" />
        <div v-if="selectedMembers.length" class="selected-avatars">
          <img v-for="m in selectedMembers.slice(0, 4)" :key="m.id" :src="m.avatar" class="selected-avatar" />
          <span v-if="selectedMembers.length > 4" class="more-count">+{{ selectedMembers.length - 4 }}</span>
        </div>
        <input v-model="searchQuery" type="text" class="search-input" placeholder="搜索" />
      </div>
    </div>

    <div class="contact-list" ref="contactListRef">
      <template v-for="group in groupedContacts" :key="group.letter">
        <div class="letter-header" :data-letter="group.letter">{{ group.letter }}</div>
        <div v-for="c in group.contacts" :key="c.id" class="contact-item" :class="{ selected: isSelected(c.id) }" @click="toggleMember(c)">
          <div class="select-indicator">
            <div v-if="isSelected(c.id)" class="select-circle selected"><iconify-icon icon="heroicons:check" width="12" style="color:#fff" /></div>
            <div v-else class="select-circle"></div>
          </div>
          <img :src="c.avatar" :alt="c.name" class="contact-avatar" />
          <div class="contact-info"><div class="contact-name">{{ c.name }}</div></div>
        </div>
      </template>
    </div>

    <div class="letter-index">
      <div v-if="hasStarred" class="index-item" @click="scrollToLetter('★')"><iconify-icon icon="heroicons:star-solid" width="12" style="color:#666" /></div>
      <div v-for="letter in alphabet" :key="letter" class="index-item" @click="scrollToLetter(letter)">{{ letter }}</div>
      <div class="index-item" @click="scrollToLetter('#')">#</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import { contactsApi } from '../../contacts/services/contactsApi'
import pinyin from 'pinyin'

import { useChatStore } from '../stores/chatStore'
const router = useRouter()
const eventBus = inject('eventBus') as any

const chatStore = useChatStore()
const searchQuery = ref('')
const selectedMembers = ref<any[]>([])
const contacts = ref<any[]>([])
const contactListRef = ref<HTMLElement | null>(null)

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const hasStarred = computed(() => contacts.value.some((c: any) => c.isStarred))

const getCurrentUserInfo = () => {
  try {
    const raw = localStorage.getItem('user_info')
    if (raw) {
      const u = JSON.parse(raw)
      return { id: u.id || 'current-user', name: u.name || u.nickname || '当前用户', username: u.username || 'current' }
    }
  } catch {}
  return { id: 'current-user', name: '当前用户', username: 'current' }
}

const loadContacts = async () => {
  try {
    const resp = await contactsApi.getContacts()
    if (resp?.success && Array.isArray(resp.data)) {
      const me = getCurrentUserInfo()
      contacts.value = resp.data
        .filter((x: any) => x.id !== me.id)
        .map((x: any) => ({ id: x.id, name: x.remark || x.nickname || x.name || x.username || '未知用户', avatar: x.avatar, username: x.username || x.yeyu_id, isStarred: !!x.is_starred }))
    } else {
      contacts.value = []
    }
  } catch { contacts.value = [] }
}

const getPinyinFirstLetter = (name: string): string => {
  if (!name) return '#'
  try {
    const arr = pinyin(name, { style: pinyin.STYLE_FIRST_LETTER })
    const ch = arr?.[0]?.[0]?.toUpperCase()
    if (ch && /^[A-Z]$/.test(ch)) return ch
  } catch {}
  return '#'
}

const groupedContacts = computed(() => {
  const list = searchQuery.value ? contacts.value.filter((c: any) => (c.name || '').toLowerCase().includes(searchQuery.value.toLowerCase())) : contacts.value
  const groups: Record<string, any[]> = {}
  if (hasStarred.value) groups['★'] = []
  alphabet.forEach(l => (groups[l] = []))
  groups['#'] = []
  list.forEach((c: any) => { if (c.isStarred) groups['★'].push(c); else { const L = getPinyinFirstLetter(c.name); if (groups[L]) groups[L].push(c); else groups['#'].push(c) } })
  const result: Array<{letter:string;contacts:any[]}> = []
  if (hasStarred.value && groups['★'].length) result.push({ letter: '★', contacts: groups['★'] })
  alphabet.forEach(l => { if (groups[l].length) result.push({ letter: l, contacts: groups[l] }) })
  if (groups['#'].length) result.push({ letter: '#', contacts: groups['#'] })
  return result
})

const canCreate = computed(() => selectedMembers.value.length >= 2)
const scrollToLetter = (letter: string) => { if (!contactListRef.value) return; const el = contactListRef.value.querySelector(`[data-letter="${letter}"]`); if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' }) }
const isSelected = (id: string) => selectedMembers.value.some(m => m.id === id)
const toggleMember = (c: any) => { const idx = selectedMembers.value.findIndex(m => m.id === c.id); if (idx > -1) selectedMembers.value.splice(idx, 1); else selectedMembers.value.push(c) }
// 顶栏“完成”按钮：动态显示人数（如 完成(2)），且 <2 人禁用
const emitTopBarButtons = () => {
  if (!eventBus) return
  const count = selectedMembers.value.length
  const text = count > 0 ? `完成(${count})` : '完成'
  eventBus.emit('topbar:setButtons', [{ action: 'createGroupConfirm', text, disabled: count < 2 }])
}
watch(selectedMembers, emitTopBarButtons, { deep: true, immediate: true })

onBeforeUnmount(() => { eventBus && eventBus.emit('topbar:clearButtons') })

const createGroup = () => {
  if (!canCreate.value) { alert('请选择至少2位联系人'); return }

  const me = getCurrentUserInfo()
  const invited = selectedMembers.value
  const groupId = 'group_' + Date.now()

  // 群名称：仅显示受邀成员的前3个昵称；格式：A、B/C（2人则A、B；1人则A）
  const invitedNames = invited.map(m => m.name).filter(Boolean)
  const first3 = invitedNames.slice(0,3)
  let title = ''
  if (first3.length >= 3) title = `${first3[0]}、${first3[1]}/${first3[2]}`
  else if (first3.length === 2) title = `${first3[0]}、${first3[1]}`
  else title = first3[0] || '群聊'

  // 参与者（含我）
  const participants = [String(me.id), ...invited.map(m => String(m.id))]

  // 群头像拼图需要的前9人头像（含我）
  const memberAvatars = [me?.avatar, ...invited.map(m => m.avatar)].filter(Boolean).slice(0, 9)

  // 持久化群信息（可选）
  const group = { id: groupId, name: title, members: [me, ...invited], avatar: memberAvatars[0] || '', createdAt: Date.now(), type:'group' }
  try {
    const arr = JSON.parse(localStorage.getItem('leaftalk_groups')||'[]')
    arr.push(group)
    localStorage.setItem('leaftalk_groups', JSON.stringify(arr))
  } catch {}

  // 添加到聊天列表（带 memberAvatars & memberCount）
  chatStore.addSession({
    id: groupId,
    name: title,
    title,
    avatar: memberAvatars[0] || '',
    type: 'group',
    participants,
    memberAvatars,
    memberCount: participants.length,
    lastMessage: '已创建群聊',
    lastMessageTime: Date.now(),
    createdAt: Date.now()
  })
  ;(chatStore as any).saveToCache?.()

  // 系统消息：你邀请XX、XX、XX加入了群聊（不含自己）
  try {
    const invitedNames = invited.map(m => m.name).filter(Boolean)
    const msg = `你邀请${invitedNames.join('、')}加入了群聊`
    sessionStorage.setItem(`pending_group_system_message_${groupId}`, JSON.stringify({ msg, ts: Date.now() }))
  } catch {}

  // 进入群聊页面
  router.push(`/group/${groupId}`)
}
const createGroupHandler = () => createGroup()

onMounted(() => {
  loadContacts()
  if (eventBus) {
    eventBus.on('createGroup:confirm', createGroupHandler)
  }
})

onBeforeUnmount(() => {
  eventBus && eventBus.off?.('createGroup:confirm', createGroupHandler)
})
</script>

<style scoped>
.create-group-page { background:#fff; min-height:100vh; display:flex; flex-direction:column; }
/* 搜索容器贴紧顶部导航栏，高42px；内部搜索框高30px */
.search-container { height:42px; display:flex; align-items:center; padding:0 10px; background:#fff; }
.search-box { position: relative; display:flex; align-items:center; gap:8px; height:30px; width:100%; box-sizing:border-box; background:#F2F3F5; border:1px solid #D9D9D9; border-radius:2px; padding:0 10px; }
.search-icon { color:#666; margin-right:8px; }
.search-input { flex:1; border:none; background:transparent; outline:none; height:100%; font-size:14px; line-height:30px; }
.selected-avatars { position:absolute; left:10px; top:50%; transform:translateY(-50%); display:flex; gap:4px; max-width:60%; overflow:hidden; pointer-events:none; z-index:1; }
.selected-avatar { width:24px; height:24px; border-radius:4px; object-fit:cover; }
.more-count { font-size:12px; color:#666; }
/* 列表占据剩余空间，紧贴搜索容器（无间距），可滚动 */
.contact-list { flex:1; overflow-y:auto; padding-right:24px; box-sizing:border-box; }
.letter-header { height:25px; line-height:25px; padding-left:16px; background:#f5f5f5; font-size:13px; color:#999; font-weight:500; margin:0; }
.contact-list > .letter-header:first-of-type { margin-top:0 !important; }
.contact-item { height:44px; display:flex; align-items:center; gap:8px; padding:0 16px; cursor:pointer; }
.contact-item:active { background:#f5f5f5; }
.select-indicator { width:18px; height:18px; display:flex; align-items:center; justify-content:center; }
.select-circle { width:18px; height:18px; border:1px solid #d9d9d9; border-radius:50%; display:flex; align-items:center; justify-content:center; }
.select-circle.selected { background:#07C160; border-color:#07C160; }
.contact-avatar { width:28px; height:28px; border-radius:4px; object-fit:cover; }
.contact-info { flex:1; min-width:0; }
.contact-name { font-size:14px; color:#333; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
/* 右侧字母索引固定在视口中部 */
.letter-index { position: fixed; right:4px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; align-items:center; gap:2px; z-index:100; }
.index-item { width:16px; height:16px; font-size:10px; color:#666; display:flex; align-items:center; justify-content:center; user-select:none; cursor:pointer; }
.index-item:active { color:#07C160; }
</style>

