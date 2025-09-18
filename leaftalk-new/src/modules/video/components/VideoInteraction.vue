<template>
  <div class="video-interaction">
    <!-- 右侧互动按钮栏 -->
    <div class="interaction-sidebar">
      <!-- 点赞按钮 -->
      <div class="interaction-item">
        <button 
          class="interaction-btn like-btn" 
          :class="{ active: isLiked }"
          @click="toggleLike"
        >
          <iconify-icon 
            :icon="isLiked ? 'heroicons:heart-solid' : 'heroicons:heart'" 
            width="28"
            :style="{ color: isLiked ? '#ff4757' : 'white' }"
          ></iconify-icon>
        </button>
        <span class="interaction-count">{{ formatNumber(likeCount) }}</span>
      </div>

      <!-- 评论按钮 -->
      <div class="interaction-item">
        <button class="interaction-btn comment-btn" @click="showComments">
          <iconify-icon icon="heroicons:chat-bubble-left" width="28" style="color: white;"></iconify-icon>
        </button>
        <span class="interaction-count">{{ formatNumber(commentCount) }}</span>
      </div>

      <!-- 分享按钮 -->
      <div class="interaction-item">
        <button class="interaction-btn share-btn" @click="shareVideo">
          <iconify-icon icon="heroicons:share" width="28" style="color: white;"></iconify-icon>
        </button>
        <span class="interaction-count">{{ formatNumber(shareCount) }}</span>
      </div>

      <!-- 收藏按钮 -->
      <div class="interaction-item">
        <button 
          class="interaction-btn favorite-btn" 
          :class="{ active: isFavorited }"
          @click="toggleFavorite"
        >
          <iconify-icon 
            :icon="isFavorited ? 'heroicons:bookmark-solid' : 'heroicons:bookmark'" 
            width="28"
            :style="{ color: isFavorited ? '#ffa502' : 'white' }"
          ></iconify-icon>
        </button>
      </div>

      <!-- 更多操作 -->
      <div class="interaction-item">
        <button class="interaction-btn more-btn" @click="showMoreActions">
          <iconify-icon icon="heroicons:ellipsis-horizontal" width="28" style="color: white;"></iconify-icon>
        </button>
      </div>

      <!-- 作者头像 -->
      <div class="interaction-item author-avatar">
        <img :src="authorAvatar" :alt="authorName" class="avatar" @click="viewAuthorProfile" />
        <button 
          v-if="!isFollowing && !isOwnVideo" 
          class="follow-btn" 
          @click="followAuthor"
        >
          <iconify-icon icon="heroicons:plus" width="16" style="color: white;"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- 评论弹窗 -->
    <div v-if="showCommentsDialog" class="comments-overlay" @click="hideComments">
      <div class="comments-dialog" @click.stop>
        <div class="comments-header">
          <h3>评论 {{ formatNumber(commentCount) }}</h3>
          <button class="close-btn" @click="hideComments">
            <iconify-icon icon="heroicons:x-mark" width="24" style="color: #333;"></iconify-icon>
          </button>
        </div>

        <div class="comments-list" ref="commentsList">
          <div v-if="comments.length === 0" class="empty-comments">
            <iconify-icon icon="heroicons:chat-bubble-left" width="48" style="color: #ccc;"></iconify-icon>
            <p>还没有评论，快来抢沙发吧！</p>
          </div>
          
          <div v-else>
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <img :src="comment.userAvatar" :alt="comment.userName" class="comment-avatar" />
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-user">{{ comment.userName }}</span>
                  <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
                <div class="comment-actions">
                  <button 
                    class="comment-like-btn" 
                    :class="{ active: comment.isLiked }"
                    @click="toggleCommentLike(comment)"
                  >
                    <iconify-icon 
                      :icon="comment.isLiked ? 'heroicons:heart-solid' : 'heroicons:heart'" 
                      width="14"
                      :style="{ color: comment.isLiked ? '#ff4757' : '#999' }"
                    ></iconify-icon>
                    <span v-if="comment.likeCount > 0">{{ comment.likeCount }}</span>
                  </button>
                  <button class="comment-reply-btn" @click="replyToComment(comment)">
                    回复
                  </button>
                </div>
                
                <!-- 回复列表 -->
                <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
                  <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                    <img :src="reply.userAvatar" :alt="reply.userName" class="reply-avatar" />
                    <div class="reply-content">
                      <span class="reply-user">{{ reply.userName }}</span>
                      <span v-if="reply.replyToUser" class="reply-to">回复 @{{ reply.replyToUser }}</span>
                      <span class="reply-text">{{ reply.content }}</span>
                      <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 评论输入框 -->
        <div class="comment-input-section">
          <div class="comment-input-container">
            <img :src="currentUserAvatar" alt="我" class="input-avatar" />
            <input
              v-model="newComment"
              type="text"
              placeholder="说点什么..."
              class="comment-input"
              @keyup.enter="submitComment"
              maxlength="500"
            />
            <button 
              class="send-comment-btn" 
              :disabled="!newComment.trim()"
              @click="submitComment"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分享弹窗 -->
    <div v-if="showShareDialog" class="share-overlay" @click="hideShare">
      <div class="share-dialog" @click.stop>
        <div class="share-header">
          <h3>分享到</h3>
          <button class="close-btn" @click="hideShare">
            <iconify-icon icon="heroicons:x-mark" width="24" style="color: #333;"></iconify-icon>
          </button>
        </div>
        
        <div class="share-options">
          <button class="share-option" @click="shareToWeChat">
            <div class="share-icon wechat">
              <iconify-icon icon="simple-icons:wechat" width="32" style="color: #07c160;"></iconify-icon>
            </div>
            <span>微信</span>
          </button>
          
          <button class="share-option" @click="shareToMoments">
            <div class="share-icon moments">
              <iconify-icon icon="heroicons:photo" width="32" style="color: #07c160;"></iconify-icon>
            </div>
            <span>朋友圈</span>
          </button>
          
          <button class="share-option" @click="shareToQQ">
            <div class="share-icon qq">
              <iconify-icon icon="simple-icons:tencentqq" width="32" style="color: #1296db;"></iconify-icon>
            </div>
            <span>QQ</span>
          </button>
          
          <button class="share-option" @click="shareToWeibo">
            <div class="share-icon weibo">
              <iconify-icon icon="simple-icons:sinaweibo" width="32" style="color: #e6162d;"></iconify-icon>
            </div>
            <span>微博</span>
          </button>
          
          <button class="share-option" @click="copyLink">
            <div class="share-icon link">
              <iconify-icon icon="heroicons:link" width="32" style="color: #666;"></iconify-icon>
            </div>
            <span>复制链接</span>
          </button>
          
          <button class="share-option" @click="downloadVideo">
            <div class="share-icon download">
              <iconify-icon icon="heroicons:arrow-down-tray" width="32" style="color: #666;"></iconify-icon>
            </div>
            <span>保存视频</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 更多操作弹窗 -->
    <div v-if="showMoreDialog" class="more-overlay" @click="hideMore">
      <div class="more-dialog" @click.stop>
        <div class="more-option" @click="reportVideo">
          <iconify-icon icon="heroicons:flag" width="20" style="color: #ff4757;"></iconify-icon>
          <span>举报</span>
        </div>
        <div class="more-option" @click="blockAuthor" v-if="!isOwnVideo">
          <iconify-icon icon="heroicons:no-symbol" width="20" style="color: #ff4757;"></iconify-icon>
          <span>屏蔽作者</span>
        </div>
        <div class="more-option" @click="notInterested" v-if="!isOwnVideo">
          <iconify-icon icon="heroicons:eye-slash" width="20" style="color: #999;"></iconify-icon>
          <span>不感兴趣</span>
        </div>
      </div>
    </div>

    <!-- 点赞动画 -->
    <div v-if="showLikeAnimation" class="like-animation">
      <iconify-icon icon="heroicons:heart-solid" width="60" style="color: #ff4757;"></iconify-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Props
const props = defineProps<{
  videoId: string
  authorId: string
  authorName: string
  authorAvatar: string
  initialLikeCount: number
  initialCommentCount: number
  initialShareCount: number
  initialIsLiked: boolean
  initialIsFavorited: boolean
  initialIsFollowing: boolean
  isOwnVideo: boolean
}>()

// Emits
const emit = defineEmits<{
  like: [videoId: string, isLiked: boolean]
  favorite: [videoId: string, isFavorited: boolean]
  follow: [authorId: string]
  comment: [videoId: string, content: string]
  share: [videoId: string, platform: string]
}>()

// 响应式数据
const isLiked = ref(props.initialIsLiked)
const isFavorited = ref(props.initialIsFavorited)
const isFollowing = ref(props.initialIsFollowing)
const likeCount = ref(props.initialLikeCount)
const commentCount = ref(props.initialCommentCount)
const shareCount = ref(props.initialShareCount)

const showCommentsDialog = ref(false)
const showShareDialog = ref(false)
const showMoreDialog = ref(false)
const showLikeAnimation = ref(false)

const newComment = ref('')
const currentUserAvatar = ref('/images/default-avatar.png')

// 评论数据
const comments = ref([
  {
    id: '1',
    userName: '张三',
    userAvatar: '/images/default-avatar.png',
    content: '太棒了！非常喜欢这个视频',
    likeCount: 12,
    isLiked: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    replies: [
      {
        id: '1-1',
        userName: '李四',
        userAvatar: '/images/default-avatar.png',
        content: '同感！',
        replyToUser: '张三',
        createdAt: new Date(Date.now() - 1800000).toISOString()
      }
    ]
  },
  {
    id: '2',
    userName: '王五',
    userAvatar: '/images/default-avatar.png',
    content: '学到了很多，感谢分享',
    likeCount: 8,
    isLiked: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    replies: []
  }
])

// 方法
const toggleLike = () => {
  isLiked.value = !isLiked.value
  likeCount.value += isLiked.value ? 1 : -1
  
  // 显示点赞动画
  if (isLiked.value) {
    showLikeAnimation.value = true
    setTimeout(() => {
      showLikeAnimation.value = false
    }, 1000)
  }
  
  emit('like', props.videoId, isLiked.value)
}

const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value
  emit('favorite', props.videoId, isFavorited.value)
}

const followAuthor = () => {
  isFollowing.value = true
  emit('follow', props.authorId)
}

const showComments = () => {
  showCommentsDialog.value = true
}

const hideComments = () => {
  showCommentsDialog.value = false
}

const shareVideo = () => {
  showShareDialog.value = true
}

const hideShare = () => {
  showShareDialog.value = false
}

const showMoreActions = () => {
  showMoreDialog.value = true
}

const hideMore = () => {
  showMoreDialog.value = false
}

const submitComment = () => {
  if (!newComment.value.trim()) return
  
  const comment = {
    id: Date.now().toString(),
    userName: '我',
    userAvatar: currentUserAvatar.value,
    content: newComment.value.trim(),
    likeCount: 0,
    isLiked: false,
    createdAt: new Date().toISOString(),
    replies: []
  }
  
  comments.value.unshift(comment)
  commentCount.value++
  
  emit('comment', props.videoId, newComment.value.trim())
  newComment.value = ''
}

const toggleCommentLike = (comment: any) => {
  comment.isLiked = !comment.isLiked
  comment.likeCount += comment.isLiked ? 1 : -1
}

const replyToComment = (comment: any) => {
  console.log('回复评论:', comment)
}

const viewAuthorProfile = () => {
  router.push(`/user/${props.authorId}`)
}

// 分享方法
const shareToWeChat = () => {
  shareCount.value++
  emit('share', props.videoId, 'wechat')
  hideShare()
}

const shareToMoments = () => {
  shareCount.value++
  emit('share', props.videoId, 'moments')
  hideShare()
}

const shareToQQ = () => {
  shareCount.value++
  emit('share', props.videoId, 'qq')
  hideShare()
}

const shareToWeibo = () => {
  shareCount.value++
  emit('share', props.videoId, 'weibo')
  hideShare()
}

const copyLink = () => {
  const link = `${window.location.origin}/video/${props.videoId}`
  navigator.clipboard.writeText(link).then(() => {
    console.log('链接已复制')
  })
  shareCount.value++
  emit('share', props.videoId, 'link')
  hideShare()
}

const downloadVideo = () => {
  console.log('下载视频')
  hideShare()
}

// 更多操作方法
const reportVideo = () => {
  console.log('举报视频')
  hideMore()
}

const blockAuthor = () => {
  console.log('屏蔽作者')
  hideMore()
}

const notInterested = () => {
  console.log('不感兴趣')
  hideMore()
}

// 工具函数
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor(diff / (1000 * 60))

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}
</script>

<style scoped>
.video-interaction {
  position: relative;
  height: 100%;
}

/* 右侧互动栏 */
.interaction-sidebar {
  position: absolute;
  right: 16px;
  bottom: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  z-index: 10;
}

.interaction-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.interaction-btn {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.interaction-btn:hover {
  background: rgba(0, 0, 0, 0.5);
  transform: scale(1.1);
}

.interaction-btn.active {
  background: rgba(255, 71, 87, 0.2);
  border: 2px solid #ff4757;
}

.interaction-count {
  color: white;
  font-size: 12px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  min-width: 20px;
  text-align: center;
}

/* 作者头像 */
.author-avatar {
  position: relative;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  border: 2px solid white;
  cursor: pointer;
  object-fit: cover;
}

.follow-btn {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  border-radius: 10px;
  border: none;
  background: #ff4757;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 点赞动画 */
.like-animation {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  animation: likeAnimation 1s ease-out;
  z-index: 20;
}

@keyframes likeAnimation {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1) translateY(-50px);
  }
}

/* 弹窗样式 */
.comments-overlay,
.share-overlay,
.more-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.comments-dialog {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

.share-dialog,
.more-dialog {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  padding: 20px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* 评论弹窗 */
.comments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.comments-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
}

.comments-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  max-height: 400px;
}

.empty-comments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  text-align: center;
}

.comment-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-user {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  margin: 0 0 8px;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.comment-like-btn,
.comment-reply-btn {
  border: none;
  background: transparent;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
}

.comment-like-btn.active {
  color: #ff4757;
}

/* 回复列表 */
.replies-list {
  margin-top: 12px;
  padding-left: 16px;
  border-left: 2px solid #f0f0f0;
}

.reply-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.reply-avatar {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
}

.reply-content {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
}

.reply-user {
  color: #07c160;
  font-weight: 500;
}

.reply-to {
  color: #999;
}

.reply-text {
  color: #333;
}

.reply-time {
  color: #999;
  margin-left: 8px;
}

/* 评论输入 */
.comment-input-section {
  border-top: 1px solid #f0f0f0;
  padding: 12px 20px;
}

.comment-input-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-avatar {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-input {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  outline: none;
  background: #f8f8f8;
}

.comment-input:focus {
  border-color: #07c160;
  background: white;
}

.send-comment-btn {
  background: #07c160;
  color: white;
  border: none;
  border-radius: 16px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-comment-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.send-comment-btn:not(:disabled):hover {
  background: #06a552;
}

/* 分享弹窗 */
.share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.share-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.share-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 16px 8px;
  border-radius: 12px;
  transition: background-color 0.2s;
}

.share-option:hover {
  background: #f8f8f8;
}

.share-icon {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
}

.share-option span {
  font-size: 12px;
  color: #333;
}

/* 更多操作弹窗 */
.more-dialog {
  padding: 0;
}

.more-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: none;
  background: transparent;
  width: 100%;
  cursor: pointer;
  font-size: 16px;
  color: #333;
  transition: background-color 0.2s;
}

.more-option:hover {
  background: #f8f8f8;
}

.more-option:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .interaction-sidebar {
    right: 12px;
    bottom: 80px;
    gap: 16px;
  }

  .interaction-btn {
    width: 44px;
    height: 44px;
    border-radius: 22px;
  }

  .avatar {
    width: 44px;
    height: 44px;
    border-radius: 22px;
  }

  .share-options {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}
</style>
