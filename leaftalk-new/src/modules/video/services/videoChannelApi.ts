// 视频号API服务
// 提供视频号相关的API接口

import { apiClient } from './apiClient'

export interface VideoChannel {
  id: string
  name: string
  description: string
  avatar: string
  coverImage: string
  followersCount: number
  videosCount: number
  isFollowing: boolean
  isVerified: boolean
  createdAt: string
}

export interface Video {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl: string
  duration: number
  viewsCount: number
  likesCount: number
  commentsCount: number
  isLiked: boolean
  createdAt: string
  author: {
    id: string
    name: string
    avatar: string
  }
}

export interface VideoStats {
  totalViews: number
  totalLikes: number
  totalComments: number
  totalVideos: number
  followersCount: number
}

class VideoChannelApiService {
  // 获取用户的视频号信息
  async getMyChannel(): Promise<VideoChannel> {
    try {
      const response = await apiClient.get('/video-channel/my')
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取视频号信息失败')
    } catch (error) {
      console.error('❌ 获取视频号信息失败:', error)
      // 返回模拟数据
      return {
        id: 'my_channel',
        name: '我的视频号',
        description: '分享生活的美好瞬间',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mychannel&backgroundColor=b6e3f4',
        coverImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cover&backgroundColor=ffd93d',
        followersCount: 128,
        videosCount: 15,
        isFollowing: false,
        isVerified: false,
        createdAt: new Date().toISOString()
      }
    }
  }

  // 获取其他用户的视频号信息
  async getChannelById(channelId: string): Promise<VideoChannel> {
    try {
      const response = await apiClient.get(`/video-channel/${channelId}`)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取视频号信息失败')
    } catch (error) {
      console.error('❌ 获取视频号信息失败:', error)
      // 返回模拟数据
      return {
        id: channelId,
        name: '用户视频号',
        description: '这是一个精彩的视频号',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${channelId}&backgroundColor=c0eb75`,
        coverImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=cover${channelId}&backgroundColor=ffb3ba`,
        followersCount: 256,
        videosCount: 32,
        isFollowing: false,
        isVerified: true,
        createdAt: new Date().toISOString()
      }
    }
  }

  // 获取视频列表
  async getVideos(channelId?: string, page = 1, limit = 20): Promise<Video[]> {
    try {
      const url = channelId ? `/video-channel/${channelId}/videos` : '/video-channel/my/videos'
      const response = await apiClient.get(url, { params: { page, limit } })
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取视频列表失败')
    } catch (error) {
      console.error('❌ 获取视频列表失败:', error)
      // 返回模拟数据
      return Array.from({ length: 6 }, (_, index) => ({
        id: `video_${index + 1}`,
        title: `精彩视频 ${index + 1}`,
        description: `这是第${index + 1}个精彩视频的描述`,
        thumbnail: `https://api.dicebear.com/7.x/avataaars/svg?seed=video${index}&backgroundColor=ffffba`,
        videoUrl: `/videos/sample${index + 1}.mp4`,
        duration: 60 + index * 30,
        viewsCount: 1000 + index * 500,
        likesCount: 50 + index * 10,
        commentsCount: 10 + index * 2,
        isLiked: index % 2 === 0,
        createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        author: {
          id: channelId || 'my_channel',
          name: '视频作者',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=author${index}&backgroundColor=c7ceea`
        }
      }))
    }
  }

  // 获取视频统计数据
  async getChannelStats(channelId?: string): Promise<VideoStats> {
    try {
      const url = channelId ? `/video-channel/${channelId}/stats` : '/video-channel/my/stats'
      const response = await apiClient.get(url)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取统计数据失败')
    } catch (error) {
      console.error('❌ 获取统计数据失败:', error)
      // 返回模拟数据
      return {
        totalViews: 15680,
        totalLikes: 1234,
        commentsCount: 567,
        totalVideos: 15,
        followersCount: 128
      }
    }
  }

  // 关注/取消关注视频号
  async toggleFollow(channelId: string): Promise<boolean> {
    try {
      const response = await apiClient.post(`/video-channel/${channelId}/follow`)
      if (response.success) {
        return response.data.isFollowing
      }
      throw new Error(response.message || '操作失败')
    } catch (error) {
      console.error('❌ 关注操作失败:', error)
      // 返回模拟结果
      return Math.random() > 0.5
    }
  }

  // 点赞/取消点赞视频
  async toggleLike(videoId: string): Promise<boolean> {
    try {
      const response = await apiClient.post(`/videos/${videoId}/like`)
      if (response.success) {
        return response.data.isLiked
      }
      throw new Error(response.message || '操作失败')
    } catch (error) {
      console.error('❌ 点赞操作失败:', error)
      // 返回模拟结果
      return Math.random() > 0.5
    }
  }

  // 上传视频
  async uploadVideo(videoFile: File, thumbnail: File, metadata: {
    title: string
    description: string
    tags?: string[]
  }): Promise<Video> {
    try {
      const formData = new FormData()
      formData.append('video', videoFile)
      formData.append('thumbnail', thumbnail)
      formData.append('metadata', JSON.stringify(metadata))

      const response = await apiClient.upload('/video-channel/upload', formData)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '视频上传失败')
    } catch (error) {
      console.error('❌ 视频上传失败:', error)
      throw error
    }
  }

  // 删除视频
  async deleteVideo(videoId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/videos/${videoId}`)
      return response.success
    } catch (error) {
      console.error('❌ 删除视频失败:', error)
      return false
    }
  }

  // 更新视频号信息
  async updateChannel(data: Partial<VideoChannel>): Promise<VideoChannel> {
    try {
      const response = await apiClient.put('/video-channel/my', data)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '更新失败')
    } catch (error) {
      console.error('❌ 更新视频号失败:', error)
      throw error
    }
  }
}

// 创建实例
export const videoChannelApi = new VideoChannelApiService()

// 默认导出
export default videoChannelApi
