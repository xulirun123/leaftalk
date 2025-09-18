/**
 * 朋友圈数据管理器
 * 处理朋友圈发布、获取、互动等功能
 */

export interface MomentMedia {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  duration?: number // 视频时长
  size: number
}

export interface MomentLocation {
  name: string
  address: string
  latitude: number
  longitude: number
}

export interface MomentComment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  timestamp: number
  replyTo?: {
    userId: string
    userName: string
  }
}

export interface MomentLike {
  userId: string
  userName: string
  userAvatar: string
  timestamp: number
}

export interface Moment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  media: MomentMedia[]
  location?: MomentLocation
  timestamp: number
  likes: MomentLike[]
  comments: MomentComment[]
  privacy: 'public' | 'friends' | 'private' | 'custom'
  visibleTo?: string[] // 自定义可见用户列表
  hiddenFrom?: string[] // 不给谁看
  isEdited: boolean
  editTime?: number
}

export interface MomentDraft {
  content: string
  media: MomentMedia[]
  location?: MomentLocation
  privacy: 'public' | 'friends' | 'private' | 'custom'
  visibleTo?: string[]
  hiddenFrom?: string[]
  timestamp: number
}

export interface PublishOptions {
  content: string
  media?: File[]
  location?: MomentLocation
  privacy?: 'public' | 'friends' | 'private' | 'custom'
  visibleTo?: string[]
  hiddenFrom?: string[]
}

export class MomentsManager {
  private eventListeners: Map<string, Function[]> = new Map()
  private drafts: Map<string, MomentDraft> = new Map()

  // 发布朋友圈
  async publishMoment(options: PublishOptions): Promise<Moment> {
    try {
      // 验证内容
      if (!options.content.trim() && (!options.media || options.media.length === 0)) {
        throw new Error('请输入内容或选择图片/视频')
      }

      // 处理媒体文件
      const processedMedia: MomentMedia[] = []
      if (options.media && options.media.length > 0) {
        for (const file of options.media) {
          const mediaItem = await this.processMediaFile(file)
          processedMedia.push(mediaItem)
        }
      }

      // 创建朋友圈对象
      const moment: Moment = {
        id: this.generateMomentId(),
        userId: 'current-user',
        userName: '我',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current-user',
        content: options.content.trim(),
        media: processedMedia,
        location: options.location,
        timestamp: Date.now(),
        likes: [],
        comments: [],
        privacy: options.privacy || 'friends',
        visibleTo: options.visibleTo,
        hiddenFrom: options.hiddenFrom,
        isEdited: false
      }

      // 上传到服务器
      await this.uploadMoment(moment)

      // 触发事件
      this.emit('momentPublished', moment)

      return moment

    } catch (error) {
      console.error('发布朋友圈失败:', error)
      throw error
    }
  }

  // 获取朋友圈列表
  async getMoments(
    type: 'timeline' | 'user' | 'discover' = 'timeline',
    userId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<Moment[]> {
    try {
      switch (type) {
        case 'timeline':
          return await this.getTimelineMoments(page, limit)
        case 'user':
          return await this.getUserMoments(userId || 'current-user', page, limit)
        case 'discover':
          return await this.getDiscoverMoments(page, limit)
        default:
          return []
      }
    } catch (error) {
      console.error('获取朋友圈失败:', error)
      return []
    }
  }

  // 点赞/取消点赞
  async toggleLike(momentId: string): Promise<boolean> {
    try {
      const moment = await this.getMomentById(momentId)
      if (!moment) {
        throw new Error('朋友圈不存在')
      }

      const currentUserId = 'current-user'
      const existingLikeIndex = moment.likes.findIndex(like => like.userId === currentUserId)

      if (existingLikeIndex > -1) {
        // 取消点赞
        moment.likes.splice(existingLikeIndex, 1)
        await this.updateMomentLikes(momentId, moment.likes)
        this.emit('momentUnliked', { momentId, userId: currentUserId })
        return false
      } else {
        // 点赞
        const newLike: MomentLike = {
          userId: currentUserId,
          userName: '我',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current-user',
          timestamp: Date.now()
        }
        moment.likes.push(newLike)
        await this.updateMomentLikes(momentId, moment.likes)
        this.emit('momentLiked', { momentId, like: newLike })
        return true
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
      throw error
    }
  }

  // 添加评论
  async addComment(
    momentId: string,
    content: string,
    replyTo?: { userId: string; userName: string }
  ): Promise<MomentComment> {
    try {
      if (!content.trim()) {
        throw new Error('评论内容不能为空')
      }

      const comment: MomentComment = {
        id: this.generateCommentId(),
        userId: 'current-user',
        userName: '我',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current-user',
        content: content.trim(),
        timestamp: Date.now(),
        replyTo
      }

      await this.saveComment(momentId, comment)
      this.emit('commentAdded', { momentId, comment })

      return comment

    } catch (error) {
      console.error('添加评论失败:', error)
      throw error
    }
  }

  // 删除评论
  async deleteComment(momentId: string, commentId: string): Promise<boolean> {
    try {
      const moment = await this.getMomentById(momentId)
      if (!moment) {
        throw new Error('朋友圈不存在')
      }

      const comment = moment.comments.find(c => c.id === commentId)
      if (!comment) {
        throw new Error('评论不存在')
      }

      // 检查权限（只能删除自己的评论或自己朋友圈的评论）
      const currentUserId = 'current-user'
      if (comment.userId !== currentUserId && moment.userId !== currentUserId) {
        throw new Error('没有删除权限')
      }

      await this.removeComment(momentId, commentId)
      this.emit('commentDeleted', { momentId, commentId })

      return true

    } catch (error) {
      console.error('删除评论失败:', error)
      throw error
    }
  }

  // 删除朋友圈
  async deleteMoment(momentId: string): Promise<boolean> {
    try {
      const moment = await this.getMomentById(momentId)
      if (!moment) {
        throw new Error('朋友圈不存在')
      }

      // 检查权限（只能删除自己的朋友圈）
      const currentUserId = 'current-user'
      if (moment.userId !== currentUserId) {
        throw new Error('只能删除自己的朋友圈')
      }

      await this.removeMoment(momentId)
      this.emit('momentDeleted', { momentId })

      return true

    } catch (error) {
      console.error('删除朋友圈失败:', error)
      throw error
    }
  }

  // 保存草稿
  saveDraft(draft: MomentDraft): void {
    const draftId = `draft_${Date.now()}`
    this.drafts.set(draftId, draft)
    this.emit('draftSaved', { draftId, draft })
  }

  // 获取草稿列表
  getDrafts(): Array<{ id: string; draft: MomentDraft }> {
    return Array.from(this.drafts.entries()).map(([id, draft]) => ({ id, draft }))
  }

  // 删除草稿
  deleteDraft(draftId: string): boolean {
    const deleted = this.drafts.delete(draftId)
    if (deleted) {
      this.emit('draftDeleted', { draftId })
    }
    return deleted
  }

  // 处理媒体文件
  private async processMediaFile(file: File): Promise<MomentMedia> {
    const mediaId = this.generateMediaId()
    
    // 创建预览URL
    const url = URL.createObjectURL(file)
    
    const mediaItem: MomentMedia = {
      id: mediaId,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      url,
      size: file.size
    }

    // 处理图片
    if (file.type.startsWith('image/')) {
      const imageInfo = await this.getImageInfo(file)
      mediaItem.width = imageInfo.width
      mediaItem.height = imageInfo.height
      mediaItem.thumbnailUrl = await this.generateImageThumbnail(file)
    }

    // 处理视频
    if (file.type.startsWith('video/')) {
      const videoInfo = await this.getVideoInfo(file)
      mediaItem.width = videoInfo.width
      mediaItem.height = videoInfo.height
      mediaItem.duration = videoInfo.duration
      mediaItem.thumbnailUrl = await this.generateVideoThumbnail(file)
    }

    return mediaItem
  }

  // 获取图片信息
  private async getImageInfo(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // 获取视频信息
  private async getVideoInfo(file: File): Promise<{ width: number; height: number; duration: number }> {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration
        })
      }
      video.src = URL.createObjectURL(file)
    })
  }

  // 生成图片缩略图
  private async generateImageThumbnail(file: File): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        const maxSize = 200
        const scale = Math.min(maxSize / img.width, maxSize / img.height)
        
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // 生成视频缩略图
  private async generateVideoThumbnail(file: File): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration / 2)
      }
      video.onseeked = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      video.src = URL.createObjectURL(file)
    })
  }

  // 模拟数据获取方法
  private async getTimelineMoments(page: number, limit: number): Promise<Moment[]> {
    // 模拟朋友圈时间线数据
    return this.getMockMoments().slice((page - 1) * limit, page * limit)
  }

  private async getUserMoments(userId: string, page: number, limit: number): Promise<Moment[]> {
    // 模拟用户朋友圈数据
    const allMoments = this.getMockMoments()
    const userMoments = allMoments.filter(m => m.userId === userId)
    return userMoments.slice((page - 1) * limit, page * limit)
  }

  private async getDiscoverMoments(page: number, limit: number): Promise<Moment[]> {
    // 模拟发现页朋友圈数据
    return this.getMockMoments().slice((page - 1) * limit, page * limit)
  }

  private async getMomentById(momentId: string): Promise<Moment | null> {
    const moments = this.getMockMoments()
    return moments.find(m => m.id === momentId) || null
  }

  // 模拟服务器操作
  private async uploadMoment(moment: Moment): Promise<void> {
    // 模拟上传延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  private async updateMomentLikes(momentId: string, likes: MomentLike[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  private async saveComment(momentId: string, comment: MomentComment): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  private async removeComment(momentId: string, commentId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  private async removeMoment(momentId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // 生成ID方法
  private generateMomentId(): string {
    return `moment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCommentId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateMediaId(): string {
    return `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 模拟数据
  private getMockMoments(): Moment[] {
    return [
      {
        id: 'moment1',
        userId: 'user1',
        userName: '张三',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
        content: '今天天气真好，出来走走！',
        media: [
          {
            id: 'media1',
            type: 'image',
            url: 'https://picsum.photos/400/300?random=1',
            thumbnailUrl: 'https://picsum.photos/200/150?random=1',
            width: 400,
            height: 300,
            size: 102400
          }
        ],
        location: {
          name: '北京天安门广场',
          address: '北京市东城区天安门广场',
          latitude: 39.9042,
          longitude: 116.4074
        },
        timestamp: Date.now() - 3600000,
        likes: [
          {
            userId: 'user2',
            userName: '李四',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
            timestamp: Date.now() - 3000000
          }
        ],
        comments: [
          {
            id: 'comment1',
            userId: 'user2',
            userName: '李四',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
            content: '确实很不错！',
            timestamp: Date.now() - 2700000
          }
        ],
        privacy: 'friends',
        isEdited: false
      }
    ]
  }

  // 事件监听
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('朋友圈事件处理错误:', error)
        }
      })
    }
  }

  // 销毁实例
  destroy(): void {
    this.eventListeners.clear()
    this.drafts.clear()
  }
}

// 创建全局实例
export const momentsManager = new MomentsManager()

export default MomentsManager
