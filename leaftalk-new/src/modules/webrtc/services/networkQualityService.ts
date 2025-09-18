/**
 * 网络质量监控服务
 * 监控网络状态、RTT、丢包率等指标，提供自适应码率控制
 */

export interface NetworkQualityMetrics {
  rtt: number // 往返时延 (ms)
  packetLoss: number // 丢包率 (0-1)
  bandwidth: number // 带宽 (bps)
  jitter: number // 抖动 (ms)
  timestamp: number
}

export interface QualityLevel {
  level: 'excellent' | 'good' | 'fair' | 'poor'
  score: number // 0-100
  description: string
}

export interface AdaptiveBitrateConfig {
  video: {
    min: number
    max: number
    current: number
    target: number
  }
  audio: {
    min: number
    max: number
    current: number
    target: number
  }
}

class NetworkQualityService {
  private peerConnection: RTCPeerConnection | null = null
  private isMonitoring = false
  private monitoringInterval: number | null = null
  private eventListeners: Map<string, Function[]> = new Map()
  
  // 质量指标历史
  private metricsHistory: NetworkQualityMetrics[] = []
  private maxHistorySize = 20
  
  // 当前质量状态
  private currentQuality: QualityLevel = {
    level: 'good',
    score: 75,
    description: '网络良好'
  }
  
  // 自适应码率配置
  private bitrateConfig: AdaptiveBitrateConfig = {
    video: {
      min: 100000,    // 100 kbps
      max: 2000000,   // 2 Mbps
      current: 800000, // 800 kbps
      target: 800000
    },
    audio: {
      min: 32000,     // 32 kbps
      max: 128000,    // 128 kbps
      current: 64000,  // 64 kbps
      target: 64000
    }
  }

  // 质量阈值配置
  private qualityThresholds = {
    excellent: { rtt: 100, packetLoss: 0.01, score: 90 },
    good: { rtt: 200, packetLoss: 0.03, score: 70 },
    fair: { rtt: 400, packetLoss: 0.05, score: 50 },
    poor: { rtt: 800, packetLoss: 0.1, score: 30 }
  }

  /**
   * 初始化网络质量监控
   */
  initialize(peerConnection: RTCPeerConnection): void {
    try {
      console.log('📊 初始化网络质量监控')
      
      this.peerConnection = peerConnection
      this.startMonitoring()
      
      console.log('✅ 网络质量监控初始化完成')
    } catch (error) {
      console.error('❌ 网络质量监控初始化失败:', error)
      throw error
    }
  }

  /**
   * 开始监控
   */
  private startMonitoring(): void {
    if (this.isMonitoring || !this.peerConnection) return
    
    this.isMonitoring = true
    
    // 每5秒检查一次网络质量
    this.monitoringInterval = window.setInterval(async () => {
      await this.collectMetrics()
    }, 5000)
    
    console.log('📊 网络质量监控已开始')
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return
    
    this.isMonitoring = false
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    
    console.log('📊 网络质量监控已停止')
  }

  /**
   * 收集网络指标
   */
  private async collectMetrics(): Promise<void> {
    if (!this.peerConnection) return
    
    try {
      const stats = await this.peerConnection.getStats()
      const metrics = this.parseStats(stats)
      
      if (metrics) {
        this.addMetrics(metrics)
        this.updateQualityLevel(metrics)
        this.adaptBitrate(metrics)
        
        // 触发质量更新事件
        this.emit('qualityUpdated', {
          metrics,
          quality: this.currentQuality,
          bitrate: this.bitrateConfig
        })
      }
    } catch (error) {
      console.error('❌ 收集网络指标失败:', error)
    }
  }

  /**
   * 解析 WebRTC 统计信息
   */
  private parseStats(stats: RTCStatsReport): NetworkQualityMetrics | null {
    let rtt = 0
    let packetLoss = 0
    let bandwidth = 0
    let jitter = 0
    
    let hasValidData = false
    
    stats.forEach((report) => {
      // 解析 RTT (往返时延)
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        if (typeof report.currentRoundTripTime === 'number') {
          rtt = report.currentRoundTripTime * 1000 // 转换为毫秒
          hasValidData = true
        }
      }
      
      // 解析丢包率和带宽
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        if (typeof report.packetsLost === 'number' && typeof report.packetsReceived === 'number') {
          const totalPackets = report.packetsLost + report.packetsReceived
          if (totalPackets > 0) {
            packetLoss = report.packetsLost / totalPackets
            hasValidData = true
          }
        }
        
        if (typeof report.bytesReceived === 'number' && typeof report.timestamp === 'number') {
          // 计算带宽需要与上一次的数据比较
          const lastMetrics = this.getLastMetrics()
          if (lastMetrics) {
            const timeDiff = (report.timestamp - lastMetrics.timestamp) / 1000 // 秒
            const bytesDiff = report.bytesReceived - (lastMetrics.bandwidth / 8 * timeDiff)
            if (timeDiff > 0) {
              bandwidth = (bytesDiff * 8) / timeDiff // bps
            }
          }
        }
        
        if (typeof report.jitter === 'number') {
          jitter = report.jitter * 1000 // 转换为毫秒
        }
      }
    })
    
    if (!hasValidData) return null
    
    return {
      rtt: Math.max(0, rtt),
      packetLoss: Math.max(0, Math.min(1, packetLoss)),
      bandwidth: Math.max(0, bandwidth),
      jitter: Math.max(0, jitter),
      timestamp: Date.now()
    }
  }

  /**
   * 添加指标到历史记录
   */
  private addMetrics(metrics: NetworkQualityMetrics): void {
    this.metricsHistory.push(metrics)
    
    // 保持历史记录大小
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift()
    }
  }

  /**
   * 获取最后一次指标
   */
  private getLastMetrics(): NetworkQualityMetrics | null {
    return this.metricsHistory.length > 0 
      ? this.metricsHistory[this.metricsHistory.length - 1] 
      : null
  }

  /**
   * 更新质量等级
   */
  private updateQualityLevel(metrics: NetworkQualityMetrics): void {
    let score = 100
    let level: QualityLevel['level'] = 'excellent'
    let description = '网络优秀'
    
    // 基于 RTT 计算分数
    if (metrics.rtt > this.qualityThresholds.poor.rtt) {
      score -= 40
    } else if (metrics.rtt > this.qualityThresholds.fair.rtt) {
      score -= 30
    } else if (metrics.rtt > this.qualityThresholds.good.rtt) {
      score -= 20
    } else if (metrics.rtt > this.qualityThresholds.excellent.rtt) {
      score -= 10
    }
    
    // 基于丢包率计算分数
    if (metrics.packetLoss > this.qualityThresholds.poor.packetLoss) {
      score -= 40
    } else if (metrics.packetLoss > this.qualityThresholds.fair.packetLoss) {
      score -= 30
    } else if (metrics.packetLoss > this.qualityThresholds.good.packetLoss) {
      score -= 20
    } else if (metrics.packetLoss > this.qualityThresholds.excellent.packetLoss) {
      score -= 10
    }
    
    // 确定质量等级
    if (score >= this.qualityThresholds.excellent.score) {
      level = 'excellent'
      description = '网络优秀'
    } else if (score >= this.qualityThresholds.good.score) {
      level = 'good'
      description = '网络良好'
    } else if (score >= this.qualityThresholds.fair.score) {
      level = 'fair'
      description = '网络一般'
    } else {
      level = 'poor'
      description = '网络较差'
    }
    
    const newQuality: QualityLevel = {
      level,
      score: Math.max(0, Math.min(100, score)),
      description
    }
    
    // 检查质量是否发生变化
    if (newQuality.level !== this.currentQuality.level) {
      console.log(`📊 网络质量变化: ${this.currentQuality.level} -> ${newQuality.level}`)
      this.emit('qualityChanged', {
        from: this.currentQuality,
        to: newQuality,
        metrics
      })
    }
    
    this.currentQuality = newQuality
  }

  /**
   * 自适应码率控制
   */
  private adaptBitrate(metrics: NetworkQualityMetrics): void {
    const quality = this.currentQuality.level
    
    // 根据网络质量调整目标码率
    switch (quality) {
      case 'excellent':
        this.bitrateConfig.video.target = Math.min(
          this.bitrateConfig.video.max,
          this.bitrateConfig.video.current * 1.2
        )
        this.bitrateConfig.audio.target = this.bitrateConfig.audio.max
        break
        
      case 'good':
        this.bitrateConfig.video.target = this.bitrateConfig.video.current
        this.bitrateConfig.audio.target = this.bitrateConfig.audio.current
        break
        
      case 'fair':
        this.bitrateConfig.video.target = Math.max(
          this.bitrateConfig.video.min,
          this.bitrateConfig.video.current * 0.8
        )
        this.bitrateConfig.audio.target = Math.max(
          this.bitrateConfig.audio.min,
          this.bitrateConfig.audio.current * 0.9
        )
        break
        
      case 'poor':
        this.bitrateConfig.video.target = this.bitrateConfig.video.min
        this.bitrateConfig.audio.target = this.bitrateConfig.audio.min
        break
    }
    
    // 应用码率变化
    this.applyBitrateChanges()
  }

  /**
   * 应用码率变化
   */
  private async applyBitrateChanges(): Promise<void> {
    if (!this.peerConnection) return
    
    try {
      const senders = this.peerConnection.getSenders()
      
      for (const sender of senders) {
        if (sender.track) {
          const params = sender.getParameters()
          
          if (params.encodings && params.encodings.length > 0) {
            const encoding = params.encodings[0]
            
            if (sender.track.kind === 'video') {
              if (encoding.maxBitrate !== this.bitrateConfig.video.target) {
                encoding.maxBitrate = this.bitrateConfig.video.target
                this.bitrateConfig.video.current = this.bitrateConfig.video.target
                
                await sender.setParameters(params)
                console.log(`📊 视频码率调整为: ${this.bitrateConfig.video.target / 1000} kbps`)
              }
            } else if (sender.track.kind === 'audio') {
              if (encoding.maxBitrate !== this.bitrateConfig.audio.target) {
                encoding.maxBitrate = this.bitrateConfig.audio.target
                this.bitrateConfig.audio.current = this.bitrateConfig.audio.target
                
                await sender.setParameters(params)
                console.log(`📊 音频码率调整为: ${this.bitrateConfig.audio.target / 1000} kbps`)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ 应用码率变化失败:', error)
    }
  }

  /**
   * 获取当前质量信息
   */
  getCurrentQuality(): QualityLevel {
    return { ...this.currentQuality }
  }

  /**
   * 获取当前指标
   */
  getCurrentMetrics(): NetworkQualityMetrics | null {
    return this.getLastMetrics()
  }

  /**
   * 获取码率配置
   */
  getBitrateConfig(): AdaptiveBitrateConfig {
    return JSON.parse(JSON.stringify(this.bitrateConfig))
  }

  /**
   * 获取指标历史
   */
  getMetricsHistory(): NetworkQualityMetrics[] {
    return [...this.metricsHistory]
  }

  /**
   * 事件监听器管理
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`❌ 网络质量事件监听器执行失败 (${event}):`, error)
        }
      })
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    console.log('🧹 清理网络质量监控服务')
    
    this.stopMonitoring()
    this.peerConnection = null
    this.metricsHistory = []
    this.eventListeners.clear()
    
    console.log('✅ 网络质量监控服务已清理')
  }
}

// 导出单例
export const networkQualityService = new NetworkQualityService()
export default networkQualityService
