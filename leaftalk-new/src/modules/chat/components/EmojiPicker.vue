<template>
  <div class="emoji-picker">
    <!-- 表情分类标签 -->
    <div
      class="emoji-tabs"
      ref="emojiTabsRef"
      @mousedown="handleTabsMouseDown"
      @mousemove="handleTabsMouseMove"
      @mouseup="handleTabsMouseUp"
      @mouseleave="handleTabsMouseUp"
    >
      <button
        v-for="category in emojiCategories"
        :key="category.key"
        @click="activeCategory = category.key"
        :class="['emoji-tab', { active: activeCategory === category.key }]"
        :title="category.name"
      >
        <iconify-icon :icon="category.icon" width="20"></iconify-icon>
      </button>
    </div>
    
    <!-- 表情内容区域 -->
    <div class="emoji-content" ref="emojiContentRef">
      <!-- 最近使用 -->
      <div v-if="activeCategory === 'recent' && currentEmojis.length > 0" class="emoji-section">
        <div class="emoji-grid">
          <div
            v-for="emoji in currentEmojis"
            :key="emoji.code"
            class="emoji-item"
            @click="selectEmoji(emoji)"
            :title="emoji.name"
          >
            <!-- 自定义表情显示图片 -->
            <img v-if="emoji.isCustom" :src="emoji.char" :alt="emoji.name" class="custom-emoji-img" />
            <!-- 普通表情显示字符 -->
            <span v-else class="emoji-char">{{ emoji.char }}</span>
          </div>
        </div>
      </div>

      <!-- 表情分类内容 -->
      <div
        v-else-if="currentEmojis.length > 0 || activeCategory === 'custom'"
        class="emoji-section"
        :class="{ 'custom-emoji-section': activeCategory === 'custom' }"
      >
        <div class="emoji-grid">
          <!-- 自定义表情分类显示添加按钮 -->
          <div
            v-if="activeCategory === 'custom'"
            class="emoji-item add-custom-emoji-btn"
            @click="goToAddCustomEmoji"
            title="添加表情"
          >
            <iconify-icon icon="heroicons:plus" width="24" color="#07C160"></iconify-icon>
          </div>

          <!-- 表情列表 -->
          <div
            v-for="emoji in currentEmojis"
            :key="emoji.code"
            class="emoji-item"
            @click="selectEmoji(emoji)"
            :title="emoji.name"
          >
            <!-- 自定义表情显示图片 -->
            <img v-if="emoji.isCustom" :src="emoji.char" :alt="emoji.name" class="custom-emoji-img" />
            <!-- 普通表情显示字符 -->
            <span v-else class="emoji-char">{{ emoji.char }}</span>
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
      <!-- 上传按钮（仅在自定义表情分类显示） -->
      <button
        v-if="activeCategory === 'custom'"
        class="upload-btn"
        @click="handleUpload"
        title="添加表情"
      >
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

      <!-- 删除按钮 -->
      <button class="delete-btn" @click="deleteLastChar" title="删除">
        <iconify-icon icon="heroicons:backspace" width="18"></iconify-icon>
      </button>
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
import { useRouter } from 'vue-router'

const router = useRouter()

// Props
interface Props {
  modelValue?: boolean
  recentEmojis?: any[]
  customEmojis?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  recentEmojis: () => [],
  customEmojis: () => []
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select': [emoji: any]
  'update:recentEmojis': [emojis: any[]]
  'update:customEmojis': [emojis: any[]]
  'upload': [file: File]
  'delete': []
}>()

// 响应式数据
const activeCategory = ref('smileys')
const searchKeyword = ref('')
const emojiContentRef = ref<HTMLElement>()
const fileInput = ref<HTMLInputElement>()
const emojiTabsRef = ref<HTMLElement>()

// 鼠标拖动滚动相关
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)

// 表情分类
const emojiCategories = ref([
  { key: 'recent', name: '最近', icon: 'heroicons:clock' },
  { key: 'smileys', name: '笑脸', icon: 'heroicons:face-smile' },
  { key: 'people', name: '人物', icon: 'heroicons:user' },
  { key: 'custom', name: '自定义', icon: 'heroicons:photo' },
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
  custom: [], // 自定义表情，最多30个
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
  ],
  activities: [
    { code: 'soccer', char: '⚽', name: '足球' },
    { code: 'basketball', char: '🏀', name: '篮球' },
    { code: 'football', char: '🏈', name: '橄榄球' },
    { code: 'baseball', char: '⚾', name: '棒球' },
    { code: 'tennis', char: '🎾', name: '网球' },
    { code: 'volleyball', char: '🏐', name: '排球' },
    { code: 'rugby_football', char: '🏉', name: '英式橄榄球' },
    { code: '8ball', char: '🎱', name: '台球' },
    { code: 'ping_pong', char: '🏓', name: '乒乓球' },
    { code: 'badminton', char: '🏸', name: '羽毛球' },
    { code: 'goal_net', char: '🥅', name: '球门' },
    { code: 'ice_hockey', char: '🏒', name: '冰球' },
    { code: 'field_hockey', char: '🏑', name: '曲棍球' },
    { code: 'cricket', char: '🏏', name: '板球' },
    { code: 'golf', char: '⛳', name: '高尔夫' },
    { code: 'bow_and_arrow', char: '🏹', name: '弓箭' },
    { code: 'fishing_pole_and_fish', char: '🎣', name: '钓鱼' },
    { code: 'boxing_glove', char: '🥊', name: '拳击' },
    { code: 'martial_arts_uniform', char: '🥋', name: '武术' },
    { code: 'running_shirt_with_sash', char: '🎽', name: '跑步' },
    { code: 'ski', char: '🎿', name: '滑雪' },
    { code: 'skateboard', char: '🛹', name: '滑板' },
    { code: 'trophy', char: '🏆', name: '奖杯' },
    { code: 'medal', char: '🏅', name: '奖牌' },
    { code: 'first_place_medal', char: '🥇', name: '金牌' },
    { code: 'second_place_medal', char: '🥈', name: '银牌' },
    { code: 'third_place_medal', char: '🥉', name: '铜牌' },
    { code: 'dart', char: '🎯', name: '飞镖' },
    { code: 'game_die', char: '🎲', name: '骰子' },
    { code: 'slot_machine', char: '🎰', name: '老虎机' },
    { code: 'video_game', char: '🎮', name: '游戏' },
    { code: 'joystick', char: '🕹️', name: '游戏杆' },
    { code: 'performing_arts', char: '🎭', name: '表演艺术' },
    { code: 'art', char: '🎨', name: '艺术' },
    { code: 'musical_note', char: '🎵', name: '音符' },
    { code: 'musical_keyboard', char: '🎹', name: '键盘' },
    { code: 'guitar', char: '🎸', name: '吉他' },
    { code: 'trumpet', char: '🎺', name: '小号' },
    { code: 'violin', char: '🎻', name: '小提琴' },
    { code: 'drum', char: '🥁', name: '鼓' }
  ],
  travel: [
    { code: 'car', char: '🚗', name: '汽车' },
    { code: 'taxi', char: '🚕', name: '出租车' },
    { code: 'blue_car', char: '🚙', name: '蓝色汽车' },
    { code: 'bus', char: '🚌', name: '公交车' },
    { code: 'trolleybus', char: '🚎', name: '无轨电车' },
    { code: 'racing_car', char: '🏎️', name: '赛车' },
    { code: 'police_car', char: '🚓', name: '警车' },
    { code: 'ambulance', char: '🚑', name: '救护车' },
    { code: 'fire_engine', char: '🚒', name: '消防车' },
    { code: 'minibus', char: '🚐', name: '小巴' },
    { code: 'truck', char: '🚚', name: '卡车' },
    { code: 'articulated_lorry', char: '🚛', name: '铰接式卡车' },
    { code: 'tractor', char: '🚜', name: '拖拉机' },
    { code: 'motorcycle', char: '🏍️', name: '摩托车' },
    { code: 'motor_scooter', char: '🛵', name: '小型摩托车' },
    { code: 'bike', char: '🚲', name: '自行车' },
    { code: 'kick_scooter', char: '🛴', name: '滑板车' },
    { code: 'train', char: '🚆', name: '火车' },
    { code: 'metro', char: '🚇', name: '地铁' },
    { code: 'light_rail', char: '🚈', name: '轻轨' },
    { code: 'station', char: '🚉', name: '车站' },
    { code: 'tram', char: '🚊', name: '有轨电车' },
    { code: 'monorail', char: '🚝', name: '单轨' },
    { code: 'mountain_railway', char: '🚞', name: '山地铁路' },
    { code: 'bullettrain_side', char: '🚄', name: '高铁' },
    { code: 'bullettrain_front', char: '🚅', name: '子弹头列车' },
    { code: 'airplane', char: '✈️', name: '飞机' },
    { code: 'small_airplane', char: '🛩️', name: '小飞机' },
    { code: 'helicopter', char: '🚁', name: '直升机' },
    { code: 'rocket', char: '🚀', name: '火箭' },
    { code: 'satellite', char: '🛰️', name: '卫星' },
    { code: 'ship', char: '🚢', name: '轮船' },
    { code: 'boat', char: '⛵', name: '帆船' },
    { code: 'speedboat', char: '🚤', name: '快艇' },
    { code: 'anchor', char: '⚓', name: '锚' },
    { code: 'world_map', char: '🗺️', name: '世界地图' },
    { code: 'compass', char: '🧭', name: '指南针' },
    { code: 'mountain', char: '⛰️', name: '山' },
    { code: 'camping', char: '🏕️', name: '露营' },
    { code: 'beach_umbrella', char: '🏖️', name: '海滩' }
  ],
  objects: [
    { code: 'watch', char: '⌚', name: '手表' },
    { code: 'iphone', char: '📱', name: '手机' },
    { code: 'calling', char: '📲', name: '来电' },
    { code: 'computer', char: '💻', name: '电脑' },
    { code: 'keyboard', char: '⌨️', name: '键盘' },
    { code: 'desktop_computer', char: '🖥️', name: '台式电脑' },
    { code: 'printer', char: '🖨️', name: '打印机' },
    { code: 'computer_mouse', char: '🖱️', name: '鼠标' },
    { code: 'trackball', char: '🖲️', name: '轨迹球' },
    { code: 'joystick', char: '🕹️', name: '游戏杆' },
    { code: 'floppy_disk', char: '💾', name: '软盘' },
    { code: 'cd', char: '💿', name: 'CD' },
    { code: 'dvd', char: '📀', name: 'DVD' },
    { code: 'camera', char: '📷', name: '相机' },
    { code: 'camera_flash', char: '📸', name: '闪光灯相机' },
    { code: 'video_camera', char: '📹', name: '摄像机' },
    { code: 'movie_camera', char: '🎥', name: '电影摄影机' },
    { code: 'telephone_receiver', char: '📞', name: '电话' },
    { code: 'phone', char: '☎️', name: '座机' },
    { code: 'tv', char: '📺', name: '电视' },
    { code: 'radio', char: '📻', name: '收音机' },
    { code: 'microphone', char: '🎤', name: '麦克风' },
    { code: 'headphones', char: '🎧', name: '耳机' },
    { code: 'speaker', char: '🔊', name: '扬声器' },
    { code: 'bell', char: '🔔', name: '铃铛' },
    { code: 'alarm_clock', char: '⏰', name: '闹钟' },
    { code: 'stopwatch', char: '⏱️', name: '秒表' },
    { code: 'hourglass', char: '⌛', name: '沙漏' },
    { code: 'bulb', char: '💡', name: '灯泡' },
    { code: 'flashlight', char: '🔦', name: '手电筒' },
    { code: 'candle', char: '🕯️', name: '蜡烛' },
    { code: 'fire', char: '🔥', name: '火' },
    { code: 'battery', char: '🔋', name: '电池' },
    { code: 'electric_plug', char: '🔌', name: '插头' },
    { code: 'mag', char: '🔍', name: '放大镜' },
    { code: 'lock', char: '🔒', name: '锁' },
    { code: 'unlock', char: '🔓', name: '开锁' },
    { code: 'key', char: '🔑', name: '钥匙' },
    { code: 'hammer', char: '🔨', name: '锤子' },
    { code: 'wrench', char: '🔧', name: '扳手' }
  ],
  symbols: [
    { code: 'heart', char: '❤️', name: '红心' },
    { code: 'orange_heart', char: '🧡', name: '橙心' },
    { code: 'yellow_heart', char: '💛', name: '黄心' },
    { code: 'green_heart', char: '💚', name: '绿心' },
    { code: 'blue_heart', char: '💙', name: '蓝心' },
    { code: 'purple_heart', char: '💜', name: '紫心' },
    { code: 'black_heart', char: '🖤', name: '黑心' },
    { code: 'white_heart', char: '🤍', name: '白心' },
    { code: 'brown_heart', char: '🤎', name: '棕心' },
    { code: 'broken_heart', char: '💔', name: '心碎' },
    { code: 'heart_exclamation', char: '❣️', name: '心叹号' },
    { code: 'two_hearts', char: '💕', name: '两颗心' },
    { code: 'revolving_hearts', char: '💞', name: '旋转的心' },
    { code: 'heartbeat', char: '💓', name: '心跳' },
    { code: 'heartpulse', char: '💗', name: '心脉' },
    { code: 'sparkling_heart', char: '💖', name: '闪亮的心' },
    { code: 'cupid', char: '💘', name: '丘比特' },
    { code: 'gift_heart', char: '💝', name: '礼物心' },
    { code: 'star', char: '⭐', name: '星星' },
    { code: 'star2', char: '🌟', name: '闪亮星星' },
    { code: 'dizzy', char: '💫', name: '眩晕' },
    { code: 'sparkles', char: '✨', name: '闪光' },
    { code: 'fire', char: '🔥', name: '火焰' },
    { code: 'boom', char: '💥', name: '爆炸' },
    { code: 'zap', char: '⚡', name: '闪电' },
    { code: 'snowflake', char: '❄️', name: '雪花' },
    { code: 'cloud', char: '☁️', name: '云' },
    { code: 'sunny', char: '☀️', name: '太阳' },
    { code: 'rainbow', char: '🌈', name: '彩虹' },
    { code: 'checkmark', char: '✅', name: '勾选' },
    { code: 'x', char: '❌', name: '叉' },
    { code: 'exclamation', char: '❗', name: '感叹号' },
    { code: 'question', char: '❓', name: '问号' },
    { code: 'heavy_plus_sign', char: '➕', name: '加号' },
    { code: 'heavy_minus_sign', char: '➖', name: '减号' },
    { code: 'heavy_multiplication_x', char: '✖️', name: '乘号' },
    { code: 'heavy_division_sign', char: '➗', name: '除号' },
    { code: 'infinity', char: '♾️', name: '无穷' },
    { code: 'recycle', char: '♻️', name: '回收' },
    { code: 'peace_symbol', char: '☮️', name: '和平' }
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
    // 最近使用最多显示32个（4排 x 8列）
    return props.recentEmojis.slice(0, 32)
  }

  if (activeCategory.value === 'custom') {
    // 自定义表情最多30个
    return props.customEmojis.slice(0, 30)
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

  // 限制最近使用的数量为32个（4排 x 8列）
  if (newRecentEmojis.length > 32) {
    newRecentEmojis.splice(32)
  }

  emit('update:recentEmojis', newRecentEmojis)
}

// 删除输入框最后一个字符
const deleteLastChar = () => {
  emit('delete')
}

// 跳转到添加自定义表情页面
const goToAddCustomEmoji = () => {
  router.push('/add-custom-emoji')
}

// 鼠标拖动滚动处理
const handleTabsMouseDown = (e: MouseEvent) => {
  if (!emojiTabsRef.value) return

  isDragging.value = true
  startX.value = e.pageX - emojiTabsRef.value.offsetLeft
  scrollLeft.value = emojiTabsRef.value.scrollLeft

  // 阻止默认行为，避免选中文本
  e.preventDefault()
}

const handleTabsMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !emojiTabsRef.value) return

  e.preventDefault()

  const x = e.pageX - emojiTabsRef.value.offsetLeft
  const walk = (x - startX.value) * 2 // 滚动速度倍数
  emojiTabsRef.value.scrollLeft = scrollLeft.value - walk
}

const handleTabsMouseUp = () => {
  isDragging.value = false
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
  // 检查自定义表情数量限制
  if (props.customEmojis.length >= 30) {
    alert('自定义表情最多添加30个')
    return
  }
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    // 读取图片并添加到自定义表情
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      const newCustomEmoji = {
        code: `custom_${Date.now()}`,
        char: imageUrl, // 使用 base64 图片数据
        name: file.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
        isCustom: true
      }

      const newCustomEmojis = [...props.customEmojis, newCustomEmoji]
      emit('update:customEmojis', newCustomEmojis)
    }
    reader.readAsDataURL(file)

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
  cursor: grab;
  user-select: none;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.emoji-tabs::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.emoji-tabs:active {
  cursor: grabbing;
}

.emoji-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
  margin-right: 12px; /* 增大间距 */
  flex-shrink: 0;
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
  gap: 8px;
}

/* 默认表情：8列 */
.emoji-section:not(.custom-emoji-section) .emoji-grid {
  grid-template-columns: repeat(8, 1fr);
}

/* 自定义表情：4列 */
.emoji-section.custom-emoji-section .emoji-grid {
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

/* 默认表情项大小 */
.emoji-section:not(.custom-emoji-section) .emoji-item {
  width: 36px;
  height: 36px;
}

/* 自定义表情项大小（更大） */
.emoji-section.custom-emoji-section .emoji-item {
  aspect-ratio: 1;
  width: 100%;
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

/* 默认表情的自定义图片 */
.emoji-section:not(.custom-emoji-section) .custom-emoji-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 4px;
}

/* 自定义表情面板的图片（更大） */
.emoji-section.custom-emoji-section .custom-emoji-img {
  width: 80%;
  height: 80%;
  object-fit: contain;
  border-radius: 8px;
}

.add-custom-emoji-btn {
  border: 2px dashed #07C160;
  background: #f0f8f0;
}

.add-custom-emoji-btn:hover {
  background: #e0f0e0;
  border-color: #06a552;
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
  position: relative;
  z-index: 10; /* 确保在表情上方 */
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

.delete-btn {
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: #e0e0e0;
  color: #333;
  transform: scale(1.05);
}

.delete-btn:active {
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
