<template>
  <div class="emoji-page">
    <!-- 顶部导航栏 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <iconify-icon icon="heroicons:arrow-left" width="24" style="color: #333;"></iconify-icon>
      </button>
      <div class="header-title">个性表情</div>
      <button class="manage-btn" @click="toggleManageMode">
        {{ isManageMode ? '完成' : '管理' }}
      </button>
    </div>

    <!-- 标签栏 -->
    <div class="tabs">
      <div 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-item"
        :class="{ active: activeTab === tab.id }"
        @click="switchTab(tab.id)"
      >
        {{ tab.name }}
      </div>
    </div>

    <!-- 表情内容 -->
    <div class="emoji-content">
      <!-- 我的表情 -->
      <div v-if="activeTab === 'my'" class="emoji-section">
        <div v-if="myEmojis.length === 0" class="empty-state">
          <iconify-icon icon="heroicons:face-smile" width="64" style="color: #ccc;"></iconify-icon>
          <p>暂无个性表情</p>
          <p class="empty-tip">点击下方添加按钮添加个性表情包</p>
        </div>
        
        <div v-else class="emoji-grid">
          <div 
            v-for="emoji in myEmojis" 
            :key="emoji.id"
            class="emoji-item"
            @click="selectEmoji(emoji)"
          >
            <img :src="emoji.url" :alt="emoji.name" class="emoji-image" />
            <div v-if="isManageMode" class="emoji-delete" @click.stop="deleteEmoji(emoji)">
              <iconify-icon icon="heroicons:x-mark" width="16" style="color: white;"></iconify-icon>
            </div>
          </div>
          <div class="emoji-item add-emoji" @click="addEmoji">
            <iconify-icon icon="heroicons:plus" width="32" style="color: #999;"></iconify-icon>
          </div>
        </div>
      </div>

      <!-- 推荐表情 -->
      <div v-if="activeTab === 'recommend'" class="emoji-section">
        <div class="emoji-categories">
          <div 
            v-for="category in emojiCategories" 
            :key="category.id"
            class="category-section"
          >
            <div class="category-title">{{ category.name }}</div>
            <div class="emoji-grid">
              <div 
                v-for="emoji in category.emojis" 
                :key="emoji.id"
                class="emoji-item"
                @click="downloadEmoji(emoji)"
              >
                <img :src="emoji.url" :alt="emoji.name" class="emoji-image" />
                <div class="emoji-download">
                  <iconify-icon icon="heroicons:arrow-down-tray" width="16" style="color: white;"></iconify-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 热门表情 -->
      <div v-if="activeTab === 'hot'" class="emoji-section">
        <div class="emoji-grid">
          <div
            v-for="emoji in hotEmojis"
            :key="emoji.id"
            class="emoji-item hot-emoji-item"
            @click="downloadEmoji(emoji)"
          >
            <img :src="emoji.url" :alt="emoji.name" class="emoji-image" />
            <div class="emoji-info">
              <div class="emoji-name">{{ emoji.name }}</div>
              <div class="emoji-category">{{ emoji.category }}</div>
              <div class="emoji-downloads">{{ formatDownloads(emoji.downloads) }}次下载</div>
            </div>
            <div class="emoji-download">
              <iconify-icon icon="heroicons:arrow-down-tray" width="16" style="color: white;"></iconify-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 表情商店 -->
      <div v-if="activeTab === 'store'" class="emoji-section">
        <!-- 搜索栏 -->
        <div class="search-bar">
          <iconify-icon icon="heroicons:magnifying-glass" width="20" style="color: #999;"></iconify-icon>
          <input v-model="searchKeyword" placeholder="搜索表情包..." class="search-input" />
        </div>

        <!-- 分类筛选 -->
        <div class="store-categories">
          <div
            v-for="category in storeCategories"
            :key="category.id"
            class="store-category"
            :class="{ active: activeStoreCategory === category.id }"
            @click="activeStoreCategory = category.id"
          >
            {{ category.name }}
          </div>
        </div>

        <!-- 表情包列表 -->
        <div class="sticker-packs">
          <div
            v-for="pack in filteredStickerPacks"
            :key="pack.id"
            class="sticker-pack"
            @click="viewStickerPack(pack)"
          >
            <div class="pack-preview">
              <img :src="pack.preview" :alt="pack.name" class="pack-image" />
              <div class="pack-badge" v-if="pack.isNew">NEW</div>
              <div class="pack-badge hot" v-if="pack.isHot">HOT</div>
            </div>
            <div class="pack-info">
              <div class="pack-name">{{ pack.name }}</div>
              <div class="pack-author">by {{ pack.author }}</div>
              <div class="pack-stats">
                <span class="pack-downloads">{{ formatDownloads(pack.downloads) }}下载</span>
                <span class="pack-price" :class="{ free: pack.price === 0 }">
                  {{ pack.price === 0 ? '免费' : `¥${pack.price}` }}
                </span>
              </div>
            </div>
            <div class="pack-action">
              <button
                class="pack-download-btn"
                :class="{ downloaded: pack.isDownloaded }"
                @click.stop="downloadStickerPack(pack)"
              >
                {{ pack.isDownloaded ? '已下载' : (pack.price === 0 ? '下载' : '购买') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加表情弹窗 -->
    <div v-if="showAddDialog" class="dialog-overlay" @click="hideAddDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-title">添加表情</div>
        <div class="add-options">
          <div class="add-option" @click="uploadEmoji">
            <iconify-icon icon="heroicons:photo" width="32" style="color: #07C160;"></iconify-icon>
            <span>从相册选择</span>
          </div>
          <div class="add-option" @click="takePhoto">
            <iconify-icon icon="heroicons:camera" width="32" style="color: #07C160;"></iconify-icon>
            <span>拍照</span>
          </div>
        </div>
        <button class="dialog-cancel" @click="hideAddDialog">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../../shared/stores/appStore'

const router = useRouter()
const appStore = useAppStore()

const activeTab = ref('my')
const isManageMode = ref(false)
const showAddDialog = ref(false)

const tabs = [
  { id: 'my', name: '我的表情' },
  { id: 'recommend', name: '推荐表情包' },
  { id: 'hot', name: '热门表情包' },
  { id: 'store', name: '表情商店' }
]

// 我的表情
const myEmojis = ref([
  {
    id: '1',
    name: '开心',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=happy',
    type: 'custom'
  },
  {
    id: '2',
    name: '哭泣',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=sad',
    type: 'custom'
  },
  {
    id: '3',
    name: '愤怒',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=angry',
    type: 'custom'
  }
])

// 表情分类
const emojiCategories = ref([
  {
    id: 'basic',
    name: '😀 基础表情',
    emojis: [
      { id: 'b1', name: '微笑', emoji: '😊', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=smile' },
      { id: 'b2', name: '大笑', emoji: '😂', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=laugh' },
      { id: 'b3', name: '眨眼', emoji: '😉', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=wink' },
      { id: 'b4', name: '惊讶', emoji: '😮', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=surprise' },
      { id: 'b5', name: '开心', emoji: '😄', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=happy' },
      { id: 'b6', name: '害羞', emoji: '😳', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=shy' },
      { id: 'b7', name: '生气', emoji: '😠', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=angry' },
      { id: 'b8', name: '哭泣', emoji: '😢', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=cry' },
      { id: 'b9', name: '思考', emoji: '🤔', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=think' },
      { id: 'b10', name: '无语', emoji: '😑', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=speechless' },
      { id: 'b11', name: '亲吻', emoji: '😘', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=kiss' },
      { id: 'b12', name: '调皮', emoji: '😜', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=naughty' }
    ]
  },
  {
    id: 'animals',
    name: '🐶 动物表情',
    emojis: [
      { id: 'a1', name: '小猫', emoji: '🐱', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=cat' },
      { id: 'a2', name: '小狗', emoji: '🐶', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=dog' },
      { id: 'a3', name: '熊猫', emoji: '🐼', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=panda' },
      { id: 'a4', name: '兔子', emoji: '🐰', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=rabbit' },
      { id: 'a5', name: '老虎', emoji: '🐯', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=tiger' },
      { id: 'a6', name: '狮子', emoji: '🦁', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=lion' },
      { id: 'a7', name: '猴子', emoji: '🐵', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=monkey' },
      { id: 'a8', name: '小鸡', emoji: '🐥', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=chick' },
      { id: 'a9', name: '企鹅', emoji: '🐧', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=penguin' },
      { id: 'a10', name: '青蛙', emoji: '🐸', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=frog' }
    ]
  },
  {
    id: 'food',
    name: '🍎 美食表情',
    emojis: [
      { id: 'f1', name: '苹果', emoji: '🍎', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=apple' },
      { id: 'f2', name: '香蕉', emoji: '🍌', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=banana' },
      { id: 'f3', name: '蛋糕', emoji: '🎂', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=cake' },
      { id: 'f4', name: '汉堡', emoji: '🍔', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=burger' },
      { id: 'f5', name: '披萨', emoji: '🍕', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=pizza' },
      { id: 'f6', name: '冰淇淋', emoji: '🍦', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=icecream' },
      { id: 'f7', name: '咖啡', emoji: '☕', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=coffee' },
      { id: 'f8', name: '奶茶', emoji: '🧋', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=tea' }
    ]
  },
  {
    id: 'activities',
    name: '⚽ 活动表情',
    emojis: [
      { id: 'ac1', name: '足球', emoji: '⚽', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=football' },
      { id: 'ac2', name: '篮球', emoji: '🏀', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=basketball' },
      { id: 'ac3', name: '音乐', emoji: '🎵', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=music' },
      { id: 'ac4', name: '游戏', emoji: '🎮', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=game' },
      { id: 'ac5', name: '电影', emoji: '🎬', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=movie' },
      { id: 'ac6', name: '旅行', emoji: '✈️', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=travel' },
      { id: 'ac7', name: '购物', emoji: '🛍️', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=shopping' },
      { id: 'ac8', name: '学习', emoji: '📚', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=study' }
    ]
  },
  {
    id: 'nature',
    name: '🌸 自然表情',
    emojis: [
      { id: 'n1', name: '樱花', emoji: '🌸', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=sakura' },
      { id: 'n2', name: '太阳', emoji: '☀️', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=sun' },
      { id: 'n3', name: '月亮', emoji: '🌙', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=moon' },
      { id: 'n4', name: '星星', emoji: '⭐', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=star' },
      { id: 'n5', name: '彩虹', emoji: '🌈', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=rainbow' },
      { id: 'n6', name: '雪花', emoji: '❄️', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=snow' },
      { id: 'n7', name: '闪电', emoji: '⚡', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=lightning' },
      { id: 'n8', name: '火焰', emoji: '🔥', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=fire' }
    ]
  },
  {
    id: 'love',
    name: '❤️ 爱心表情',
    emojis: [
      { id: 'l1', name: '红心', emoji: '❤️', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=heart' },
      { id: 'l2', name: '粉心', emoji: '💕', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=pinkheart' },
      { id: 'l3', name: '蓝心', emoji: '💙', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=blueheart' },
      { id: 'l4', name: '绿心', emoji: '💚', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=greenheart' },
      { id: 'l5', name: '黄心', emoji: '💛', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=yellowheart' },
      { id: 'l6', name: '紫心', emoji: '💜', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=purpleheart' },
      { id: 'l7', name: '心动', emoji: '💓', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=heartbeat' },
      { id: 'l8', name: '心碎', emoji: '💔', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=broken' }
    ]
  }
])

// 热门表情
const hotEmojis = ref([
  {
    id: 'h1',
    name: '社死现场',
    emoji: '🫠',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=trending1',
    downloads: 125800,
    category: '网络热梗'
  },
  {
    id: 'h2',
    name: 'emo了',
    emoji: '😭',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=trending2',
    downloads: 98760,
    category: '情绪表达'
  },
  {
    id: 'h3',
    name: '绝绝子',
    emoji: '🤩',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=trending3',
    downloads: 87650,
    category: '网络热梗'
  },
  {
    id: 'h4',
    name: '躺平',
    emoji: '😴',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=trending4',
    downloads: 76540,
    category: '生活状态'
  },
  {
    id: 'h5',
    name: '打工人',
    emoji: '💪',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=trending5',
    downloads: 65430,
    category: '职场生活'
  },
  {
    id: 'h6',
    name: '摸鱼',
    emoji: '🐟',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=trending6',
    downloads: 54320,
    category: '职场生活'
  },
  {
    id: 'h7',
    name: '内卷',
    emoji: '📈',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=trending7',
    downloads: 43210,
    category: '社会现象'
  },
  {
    id: 'h8',
    name: '破防了',
    emoji: '💥',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=trending8',
    downloads: 32100,
    category: '情绪表达'
  },
  {
    id: 'h9',
    name: '芭比Q了',
    emoji: '🔥',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=trending9',
    downloads: 21000,
    category: '网络热梗'
  },
  {
    id: 'h10',
    name: 'YYDS',
    emoji: '👑',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=trending10',
    downloads: 19800,
    category: '网络热梗'
  },
  {
    id: 'h11',
    name: 'CPU烧了',
    emoji: '🤯',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=trending11',
    downloads: 18700,
    category: '情绪表达'
  },
  {
    id: 'h12',
    name: '爷青回',
    emoji: '🥺',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=trending12',
    downloads: 17600,
    category: '怀旧情怀'
  }
])

// 表情商店相关数据
const searchKeyword = ref('')
const activeStoreCategory = ref('all')

const storeCategories = ref([
  { id: 'all', name: '全部' },
  { id: 'cute', name: '可爱萌宠' },
  { id: 'funny', name: '搞笑幽默' },
  { id: 'love', name: '恋爱情侣' },
  { id: 'work', name: '职场办公' },
  { id: 'festival', name: '节日庆典' },
  { id: 'anime', name: '动漫二次元' },
  { id: 'celebrity', name: '明星网红' }
])

const stickerPacks = ref([
  {
    id: 'sp1',
    name: '可爱小猫咪',
    author: '萌宠工作室',
    preview: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=cutecat',
    downloads: 1250000,
    price: 0,
    category: 'cute',
    isNew: false,
    isHot: true,
    isDownloaded: false,
    description: '超级可爱的小猫咪表情包，让你的聊天更加萌萌哒！'
  },
  {
    id: 'sp2',
    name: '社畜日常',
    author: '打工人联盟',
    preview: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=worklife',
    downloads: 980000,
    price: 6,
    category: 'work',
    isNew: true,
    isHot: false,
    isDownloaded: false,
    description: '打工人的真实写照，每一个表情都是你我的日常！'
  },
  {
    id: 'sp3',
    name: '恋爱小情侣',
    author: '甜蜜工坊',
    preview: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=couple',
    downloads: 750000,
    price: 8,
    category: 'love',
    isNew: false,
    isHot: true,
    isDownloaded: true,
    description: '甜甜的恋爱表情包，记录你们的美好时光～'
  },
  {
    id: 'sp4',
    name: '搞笑段子手',
    author: '幽默大师',
    preview: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=funny',
    downloads: 650000,
    price: 0,
    category: 'funny',
    isNew: false,
    isHot: false,
    isDownloaded: false,
    description: '让你成为群聊焦点的搞笑表情包！'
  },
  {
    id: 'sp5',
    name: '春节大礼包',
    author: '节日工作室',
    preview: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=festival',
    downloads: 500000,
    price: 12,
    category: 'festival',
    isNew: true,
    isHot: true,
    isDownloaded: false,
    description: '新年专属表情包，祝福满满，年味十足！'
  },
  {
    id: 'sp6',
    name: '二次元少女',
    author: 'ACG工作室',
    preview: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=anime',
    downloads: 420000,
    price: 10,
    category: 'anime',
    isNew: false,
    isHot: false,
    isDownloaded: false,
    description: '精美的二次元风格表情包，宅男宅女必备！'
  },
  {
    id: 'sp7',
    name: '网红表情包',
    author: '流量工厂',
    preview: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=celebrity',
    downloads: 380000,
    price: 15,
    category: 'celebrity',
    isNew: true,
    isHot: false,
    isDownloaded: false,
    description: '当红网红同款表情包，跟上潮流趋势！'
  },
  {
    id: 'sp8',
    name: '呆萌小狗狗',
    author: '萌宠工作室',
    preview: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=dog',
    downloads: 320000,
    price: 0,
    category: 'cute',
    isNew: false,
    isHot: false,
    isDownloaded: true,
    description: '超萌小狗狗表情包，治愈你的心灵！'
  }
])

// 计算属性
const filteredStickerPacks = computed(() => {
  let packs = stickerPacks.value

  // 按分类筛选
  if (activeStoreCategory.value !== 'all') {
    packs = packs.filter(pack => pack.category === activeStoreCategory.value)
  }

  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    packs = packs.filter(pack =>
      pack.name.toLowerCase().includes(keyword) ||
      pack.author.toLowerCase().includes(keyword) ||
      pack.description.toLowerCase().includes(keyword)
    )
  }

  return packs
})

// 方法
const goBack = () => {
  router.back()
}

const toggleManageMode = () => {
  isManageMode.value = !isManageMode.value
}

const switchTab = (tabId: string) => {
  activeTab.value = tabId
  isManageMode.value = false
}

const selectEmoji = (emoji: any) => {
  if (!isManageMode.value) {
    console.log('选择表情:', emoji)
    appStore.showToast(`选择了${emoji.name}`, 'success')
  }
}

const deleteEmoji = (emoji: any) => {
  const index = myEmojis.value.findIndex(item => item.id === emoji.id)
  if (index !== -1) {
    myEmojis.value.splice(index, 1)
    appStore.showToast('已删除表情', 'success')
  }
}

const addEmoji = () => {
  showAddDialog.value = true
}

const hideAddDialog = () => {
  showAddDialog.value = false
}

const downloadEmoji = (emoji: any) => {
  // 模拟下载表情到我的表情
  const newEmoji = {
    id: `my_${Date.now()}`,
    name: emoji.name,
    url: emoji.url,
    type: 'downloaded'
  }
  myEmojis.value.push(newEmoji)
  appStore.showToast(`已添加${emoji.name}到我的表情`, 'success')
}

const uploadEmoji = () => {
  hideAddDialog()
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      // 检查文件大小
      if (file.size > 2 * 1024 * 1024) {
        appStore.showToast('图片大小不能超过2MB', 'error')
        return
      }

      // 读取文件
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          const newEmoji = {
            id: `upload_${Date.now()}`,
            name: file.name.split('.')[0],
            url: result,
            type: 'upload'
          }
          myEmojis.value.push(newEmoji)
          appStore.showToast('表情添加成功', 'success')
        }
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

const takePhoto = () => {
  hideAddDialog()
  appStore.showToast('拍照功能开发中', 'info')
}

// 格式化下载数量
const formatDownloads = (downloads: number) => {
  if (downloads >= 1000000) {
    return (downloads / 1000000).toFixed(1) + 'M'
  } else if (downloads >= 1000) {
    return (downloads / 1000).toFixed(1) + 'K'
  }
  return downloads.toString()
}

// 查看表情包详情
const viewStickerPack = (pack: any) => {
  console.log('查看表情包:', pack)
  appStore.showToast(`查看表情包：${pack.name}`, 'info')
}

// 下载表情包
const downloadStickerPack = (pack: any) => {
  if (pack.isDownloaded) {
    appStore.showToast('表情包已下载', 'info')
    return
  }

  if (pack.price > 0) {
    appStore.showToast(`购买表情包：${pack.name} ¥${pack.price}`, 'info')
    // 这里应该跳转到支付页面
  } else {
    appStore.showToast(`正在下载：${pack.name}...`, 'info')

    // 模拟下载过程
    setTimeout(() => {
      pack.isDownloaded = true
      pack.downloads += 1
      appStore.showToast(`${pack.name} 下载成功！`, 'success')
    }, 2000)
  }
}

onMounted(() => {
  console.log('表情页面已加载')
})
</script>

<style scoped>
.emoji-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid #f0f0f0;
  height: 48px;
}

.back-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.manage-btn {
  border: none;
  background: transparent;
  color: #07C160;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 12px;
}

.tabs {
  background: white;
  display: flex;
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  z-index: 99;
  border-bottom: 1px solid #f0f0f0;
}

.tab-item {
  flex: 1;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-item.active {
  color: #07C160;
  border-bottom-color: #07C160;
}

.emoji-content {
  padding-top: 108px;
  min-height: calc(100vh - 108px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.empty-state p {
  margin: 16px 0 8px 0;
  font-size: 16px;
}

.empty-tip {
  font-size: 14px;
  color: #ccc;
}

.emoji-section {
  padding: 16px;
}

.category-section {
  margin-bottom: 24px;
}

.category-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.emoji-item {
  position: relative;
  aspect-ratio: 1;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 2px solid transparent;
}

.emoji-item:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(7,193,96,0.2);
  border-color: #07c160;
}

.emoji-item:active {
  transform: scale(0.95);
}

.add-emoji {
  border: 2px dashed #ddd;
  background: #f8f8f8;
}

.emoji-image {
  width: 80%;
  height: 80%;
  object-fit: contain;
}

.emoji-delete {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: #ff4757;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.emoji-download {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.emoji-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  font-size: 12px;
}

.emoji-name {
  font-weight: 500;
}

.emoji-downloads {
  opacity: 0.8;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin: 0 20px;
  max-width: 320px;
  width: 100%;
}

.dialog-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  text-align: center;
  margin-bottom: 24px;
}

.add-options {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
}

.add-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 16px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.add-option:hover {
  background: #f8f8f8;
}

.add-option span {
  margin-top: 8px;
  font-size: 14px;
  color: #333;
}

.dialog-cancel {
  width: 100%;
  padding: 12px;
  border: none;
  background: #f0f0f0;
  color: #666;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

/* 表情商店样式 */
.search-bar {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 20px;
  padding: 8px 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  margin-left: 8px;
  font-size: 14px;
  color: #333;
}

.search-input::placeholder {
  color: #999;
}

.store-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.store-category {
  flex-shrink: 0;
  padding: 6px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.store-category.active {
  background: #07C160;
  color: white;
  border-color: #07C160;
}

.sticker-packs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sticker-pack {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.sticker-pack:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.pack-preview {
  position: relative;
  width: 60px;
  height: 60px;
  margin-right: 12px;
}

.pack-image {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.pack-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff4757;
  color: white;
  font-size: 8px;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: bold;
}

.pack-badge.hot {
  background: #ff9500;
}

.pack-info {
  flex: 1;
}

.pack-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.pack-author {
  font-size: 12px;
  color: #999;
  margin-bottom: 6px;
}

.pack-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pack-downloads {
  font-size: 11px;
  color: #666;
}

.pack-price {
  font-size: 12px;
  font-weight: bold;
  color: #ff4757;
}

.pack-price.free {
  color: #07C160;
}

.pack-action {
  margin-left: 12px;
}

.pack-download-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #07C160;
  color: white;
}

.pack-download-btn.downloaded {
  background: #f0f0f0;
  color: #999;
  cursor: default;
}

.pack-download-btn:hover:not(.downloaded) {
  background: #06a552;
}

/* 热门表情项样式增强 */
.hot-emoji-item .emoji-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
  padding: 8px;
  border-radius: 0 0 8px 8px;
}

.emoji-category {
  font-size: 10px;
  color: #ccc;
  margin-bottom: 2px;
}
</style>
