<template>
  <div class="emoji-picker">
    <!-- 表情分类标签 -->
    <div class="emoji-tabs">
      <button 
        v-for="category in emojiCategories" 
        :key="category.key"
        @click="activeCategory = category.key"
        :class="['emoji-tab', { active: activeCategory === category.key }]"
      >
        <iconify-icon :icon="category.icon" width="16"></iconify-icon>
        <span>{{ category.name }}</span>
      </button>
    </div>
    
    <!-- 表情内容区域 -->
    <div class="emoji-content" ref="emojiContentRef">
      <!-- 最近使用 -->
      <div v-if="activeCategory === 'recent' && recentEmojis.length > 0" class="emoji-section">
        <div class="section-title">最近使用</div>
        <div class="emoji-grid">
          <div 
            v-for="emoji in recentEmojis" 
            :key="emoji.code"
            class="emoji-item"
            @click="selectEmoji(emoji)"
            :title="emoji.name"
          >
            <span class="emoji-char">{{ emoji.char }}</span>
          </div>
        </div>
      </div>
      
      <!-- 表情分类内容 -->
      <div v-else-if="currentEmojis.length > 0" class="emoji-section">
        <div class="section-title">{{ getCurrentCategoryName() }}</div>
        <div class="emoji-grid">
          <div 
            v-for="emoji in currentEmojis" 
            :key="emoji.code"
            class="emoji-item"
            @click="selectEmoji(emoji)"
            :title="emoji.name"
          >
            <span class="emoji-char">{{ emoji.char }}</span>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <iconify-icon icon="heroicons:face-smile" width="48" color="#ccc"></iconify-icon>
        <span>暂无表情</span>
      </div>
    </div>
    
    <!-- 搜索框和上传按钮 -->
    <div class="emoji-search">
      <!-- 上传按钮 -->
      <button class="upload-btn" @click="handleUpload" title="上传表情">
        <iconify-icon icon="heroicons:plus" width="16"></iconify-icon>
      </button>

      <!-- 搜索输入框 -->
      <div class="search-input-container">
        <iconify-icon icon="heroicons:magnifying-glass" width="16" color="#999"></iconify-icon>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索表情"
          class="search-input"
          @input="handleSearch"
        />
        <button v-if="searchKeyword" @click="clearSearch" class="clear-btn">
          <iconify-icon icon="heroicons:x-mark" width="14"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// Props
interface Props {
  modelValue?: boolean
  recentEmojis?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  recentEmojis: () => []
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select': [emoji: any]
  'update:recentEmojis': [emojis: any[]]
  'upload': [file: File]
}>()

// 响应式数据
const activeCategory = ref('smileys')
const searchKeyword = ref('')
const emojiContentRef = ref<HTMLElement>()
const fileInput = ref<HTMLInputElement>()

// 表情分类
const emojiCategories = ref([
  { key: 'recent', name: '最近', icon: 'heroicons:clock' },
  { key: 'smileys', name: '笑脸', icon: 'heroicons:face-smile' },
  { key: 'people', name: '人物', icon: 'heroicons:user' },
  { key: 'animals', name: '动物', icon: 'heroicons:heart' },
  { key: 'food', name: '食物', icon: 'heroicons:cake' },
  { key: 'activities', name: '活动', icon: 'heroicons:trophy' },
  { key: 'travel', name: '旅行', icon: 'heroicons:map-pin' },
  { key: 'objects', name: '物品', icon: 'heroicons:light-bulb' },
  { key: 'symbols', name: '符号', icon: 'heroicons:star' }
])

// 表情数据
const emojiData = ref({
  smileys: [
    { code: 'grinning', char: '😀', name: '开心' },
    { code: 'grin', char: '😁', name: '露齿笑' },
    { code: 'joy', char: '😂', name: '笑哭' },
    { code: 'rofl', char: '🤣', name: '笑翻' },
    { code: 'smiley', char: '😃', name: '微笑' },
    { code: 'smile', char: '😄', name: '大笑' },
    { code: 'sweat_smile', char: '😅', name: '汗笑' },
    { code: 'laughing', char: '😆', name: '哈哈' },
    { code: 'wink', char: '😉', name: '眨眼' },
    { code: 'blush', char: '😊', name: '害羞' },
    { code: 'yum', char: '😋', name: '美味' },
    { code: 'sunglasses', char: '😎', name: '酷' },
    { code: 'heart_eyes', char: '😍', name: '爱心眼' },
    { code: 'kissing_heart', char: '😘', name: '飞吻' },
    { code: 'kissing', char: '😗', name: '亲吻' },
    { code: 'relaxed', char: '☺️', name: '放松' },
    { code: 'slight_smile', char: '🙂', name: '轻微笑' },
    { code: 'hugging', char: '🤗', name: '拥抱' },
    { code: 'thinking', char: '🤔', name: '思考' },
    { code: 'neutral_face', char: '😐', name: '面无表情' },
    { code: 'expressionless', char: '😑', name: '无语' },
    { code: 'smirk', char: '😏', name: '得意' },
    { code: 'unamused', char: '😒', name: '不开心' },
    { code: 'sweat', char: '😓', name: '冷汗' },
    { code: 'pensive', char: '😔', name: '沉思' },
    { code: 'confused', char: '😕', name: '困惑' },
    { code: 'confounded', char: '😖', name: '痛苦' },
    { code: 'sob', char: '😭', name: '大哭' },
    { code: 'rage', char: '😡', name: '愤怒' },
    { code: 'angry', char: '😠', name: '生气' }
  ],
  people: [
    { code: 'wave', char: '👋', name: '挥手' },
    { code: 'raised_back_of_hand', char: '🤚', name: '手背' },
    { code: 'raised_hand_with_fingers_splayed', char: '🖐️', name: '张开手' },
    { code: 'hand', char: '✋', name: '停止' },
    { code: 'ok_hand', char: '👌', name: 'OK' },
    { code: 'v', char: '✌️', name: '胜利' },
    { code: 'crossed_fingers', char: '🤞', name: '交叉手指' },
    { code: 'love_you_gesture', char: '🤟', name: '爱你' },
    { code: 'metal', char: '🤘', name: '摇滚' },
    { code: 'call_me_hand', char: '🤙', name: '打电话' },
    { code: 'point_left', char: '👈', name: '左指' },
    { code: 'point_right', char: '👉', name: '右指' },
    { code: 'point_up_2', char: '👆', name: '上指' },
    { code: 'point_down', char: '👇', name: '下指' },
    { code: 'point_up', char: '☝️', name: '食指向上' },
    { code: '+1', char: '👍', name: '赞' },
    { code: '-1', char: '👎', name: '踩' },
    { code: 'fist_raised', char: '✊', name: '举拳' },
    { code: 'fist', char: '👊', name: '拳头' },
    { code: 'clap', char: '👏', name: '鼓掌' },
    { code: 'raised_hands', char: '🙌', name: '举手' },
    { code: 'open_hands', char: '👐', name: '张开双手' },
    { code: 'handshake', char: '🤝', name: '握手' },
    { code: 'pray', char: '🙏', name: '祈祷' }
  ],
  animals: [
    { code: 'dog', char: '🐶', name: '狗' },
    { code: 'cat', char: '🐱', name: '猫' },
    { code: 'mouse', char: '🐭', name: '老鼠' },
    { code: 'hamster', char: '🐹', name: '仓鼠' },
    { code: 'rabbit', char: '🐰', name: '兔子' },
    { code: 'fox_face', char: '🦊', name: '狐狸' },
    { code: 'bear', char: '🐻', name: '熊' },
    { code: 'panda_face', char: '🐼', name: '熊猫' },
    { code: 'koala', char: '🐨', name: '考拉' },
    { code: 'tiger', char: '🐯', name: '老虎' },
    { code: 'lion', char: '🦁', name: '狮子' },
    { code: 'cow', char: '🐮', name: '牛' },
    { code: 'pig', char: '🐷', name: '猪' },
    { code: 'pig_nose', char: '🐽', name: '猪鼻' },
    { code: 'frog', char: '🐸', name: '青蛙' },
    { code: 'monkey_face', char: '🐵', name: '猴子' },
    { code: 'see_no_evil', char: '🙈', name: '非礼勿视' },
    { code: 'hear_no_evil', char: '🙉', name: '非礼勿听' },
    { code: 'speak_no_evil', char: '🙊', name: '非礼勿言' }
  ],
  food: [
    { code: 'apple', char: '🍎', name: '苹果' },
    { code: 'banana', char: '🍌', name: '香蕉' },
    { code: 'grapes', char: '🍇', name: '葡萄' },
    { code: 'strawberry', char: '🍓', name: '草莓' },
    { code: 'watermelon', char: '🍉', name: '西瓜' },
    { code: 'orange', char: '🍊', name: '橙子' },
    { code: 'lemon', char: '🍋', name: '柠檬' },
    { code: 'cherries', char: '🍒', name: '樱桃' },
    { code: 'peach', char: '🍑', name: '桃子' },
    { code: 'pineapple', char: '🍍', name: '菠萝' },
    { code: 'tomato', char: '🍅', name: '番茄' },
    { code: 'eggplant', char: '🍆', name: '茄子' },
    { code: 'corn', char: '🌽', name: '玉米' },
    { code: 'hot_pepper', char: '🌶️', name: '辣椒' },
    { code: 'cucumber', char: '🥒', name: '黄瓜' },
    { code: 'carrot', char: '🥕', name: '胡萝卜' },
    { code: 'bread', char: '🍞', name: '面包' },
    { code: 'croissant', char: '🥐', name: '牛角包' },
    { code: 'cheese', char: '🧀', name: '奶酪' },
    { code: 'meat_on_bone', char: '🍖', name: '肉骨头' },
    { code: 'poultry_leg', char: '🍗', name: '鸡腿' },
    { code: 'hamburger', char: '🍔', name: '汉堡' },
    { code: 'fries', char: '🍟', name: '薯条' },
    { code: 'pizza', char: '🍕', name: '披萨' },
    { code: 'hotdog', char: '🌭', name: '热狗' },
    { code: 'taco', char: '🌮', name: '玉米饼' },
    { code: 'burrito', char: '🌯', name: '卷饼' },
    { code: 'ramen', char: '🍜', name: '拉面' },
    { code: 'spaghetti', char: '🍝', name: '意面' },
    { code: 'rice', char: '🍚', name: '米饭' },
    { code: 'curry', char: '🍛', name: '咖喱' },
    { code: 'sushi', char: '🍣', name: '寿司' },
    { code: 'bento', char: '🍱', name: '便当' },
    { code: 'cake', char: '🍰', name: '蛋糕' },
    { code: 'birthday', char: '🎂', name: '生日蛋糕' },
    { code: 'ice_cream', char: '🍦', name: '冰淇淋' },
    { code: 'doughnut', char: '🍩', name: '甜甜圈' },
    { code: 'cookie', char: '🍪', name: '饼干' },
    { code: 'chocolate_bar', char: '🍫', name: '巧克力' },
    { code: 'candy', char: '🍬', name: '糖果' },
    { code: 'lollipop', char: '🍭', name: '棒棒糖' },
    { code: 'honey_pot', char: '🍯', name: '蜂蜜' }
  ]
})

// 计算属性
const currentEmojis = computed(() => {
  if (searchKeyword.value) {
    // 搜索模式
    const keyword = searchKeyword.value.toLowerCase()
    const allEmojis = Object.values(emojiData.value).flat()
    return allEmojis.filter(emoji => 
      emoji.name.toLowerCase().includes(keyword) ||
      emoji.char.includes(keyword)
    )
  }
  
  if (activeCategory.value === 'recent') {
    return props.recentEmojis
  }
  
  return emojiData.value[activeCategory.value] || []
})

// 方法
const getCurrentCategoryName = () => {
  if (searchKeyword.value) {
    return `搜索结果 (${currentEmojis.value.length})`
  }
  
  const category = emojiCategories.value.find(c => c.key === activeCategory.value)
  return category?.name || ''
}

const selectEmoji = (emoji: any) => {
  emit('select', emoji)
  
  // 更新最近使用
  const newRecentEmojis = [...props.recentEmojis]
  const existingIndex = newRecentEmojis.findIndex(e => e.code === emoji.code)
  
  if (existingIndex > -1) {
    newRecentEmojis.splice(existingIndex, 1)
  }
  
  newRecentEmojis.unshift(emoji)
  
  // 限制最近使用的数量
  if (newRecentEmojis.length > 24) {
    newRecentEmojis.splice(24)
  }
  
  emit('update:recentEmojis', newRecentEmojis)
}

const handleSearch = () => {
  if (searchKeyword.value) {
    activeCategory.value = 'search'
  }
}

const clearSearch = () => {
  searchKeyword.value = ''
  activeCategory.value = 'smileys'
}

// 上传处理函数
const handleUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    emit('upload', file)
    // 清空文件输入框，允许重复选择同一文件
    target.value = ''
  }
}

// 监听分类变化，滚动到顶部
watch(activeCategory, () => {
  if (emojiContentRef.value) {
    emojiContentRef.value.scrollTop = 0
  }
})

onMounted(() => {
  // 如果有最近使用的表情，默认显示最近使用
  if (props.recentEmojis.length > 0) {
    activeCategory.value = 'recent'
  }
})
</script>

<style scoped>
.emoji-picker {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  height: 320px;
}

.emoji-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  padding: 8px 12px;
  overflow-x: auto;
  flex-shrink: 0;
  background: #f8f8f8;
}

.emoji-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: none;
  background: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  font-size: 11px;
  color: #666;
  margin-right: 4px;
}

.emoji-tab.active {
  background: #07C160;
  color: white;
}

.emoji-tab:hover:not(.active) {
  background: #e8f5e8;
}

.emoji-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.emoji-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 4px;
  border-bottom: 1px solid #f0f0f0;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}

.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.emoji-item:hover {
  background: #f0f8f0;
  transform: scale(1.1);
}

.emoji-item:active {
  transform: scale(0.95);
}

.emoji-char {
  font-size: 20px;
  line-height: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: #999;
  gap: 8px;
}

.emoji-search {
  border-top: 1px solid #e0e0e0;
  padding: 12px;
  flex-shrink: 0;
  background: #f8f8f8;
  display: flex;
  gap: 8px;
  align-items: center;
}

.upload-btn {
  background: #07c160;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.upload-btn:hover {
  background: #06a552;
  transform: scale(1.05);
}

.upload-btn:active {
  transform: scale(0.95);
}

.search-input-container {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 6px 12px;
  gap: 8px;
  flex: 1;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #333;
}

.search-input::placeholder {
  color: #999;
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 2px;
  border-radius: 50%;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #f0f0f0;
  color: #666;
}
</style>
