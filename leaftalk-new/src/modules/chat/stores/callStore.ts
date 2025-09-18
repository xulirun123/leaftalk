import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CallParticipant {
  id: string
  name: string
  avatar: string
  isMuted: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'failed'
  stream?: MediaStream
}

export interface CallSession {
  id: string
  type: 'audio' | 'video' | 'screen'
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed'
  participants: CallParticipant[]
  startTime?: number
  endTime?: number
  duration: number
  isIncoming: boolean
  caller: CallParticipant
  receiver: CallParticipant
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  networkStats: {
    bitrate: number
    packetLoss: number
    latency: number
  }
}

export interface CallSettings {
  audioEnabled: boolean
  videoEnabled: boolean
  microphoneId: string
  cameraId: string
  speakerId: string
  videoQuality: 'low' | 'medium' | 'high'
  audioQuality: 'low' | 'medium' | 'high'
  echoCancellation: boolean
  noiseSuppression: boolean
  autoGainControl: boolean
}

export const useCallStore = defineStore('call', () => {
  // 状态
  const currentCall = ref<CallSession | null>(null)
  const callHistory = ref<CallSession[]>([])
  const devices = ref<{
    microphones: MediaDeviceInfo[]
    cameras: MediaDeviceInfo[]
    speakers: MediaDeviceInfo[]
  }>({
    microphones: [],
    cameras: [],
    speakers: []
  })
  
  const settings = ref<CallSettings>({
    audioEnabled: true,
    videoEnabled: true,
    microphoneId: '',
    cameraId: '',
    speakerId: '',
    videoQuality: 'medium',
    audioQuality: 'high',
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  })

  const localStream = ref<MediaStream | null>(null)
  const remoteStream = ref<MediaStream | null>(null)
  const peerConnection = ref<RTCPeerConnection | null>(null)
  const isInitialized = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isInCall = computed(() => 
    currentCall.value && ['calling', 'ringing', 'connected'].includes(currentCall.value.status)
  )

  const callDuration = computed(() => {
    if (!currentCall.value?.startTime) return 0
    const now = currentCall.value.endTime || Date.now()
    return Math.floor((now - currentCall.value.startTime) / 1000)
  })

  const isAudioCall = computed(() => currentCall.value?.type === 'audio')
  const isVideoCall = computed(() => currentCall.value?.type === 'video')
  const isScreenShare = computed(() => currentCall.value?.type === 'screen')

  // WebRTC配置
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // 可以添加TURN服务器
      // {
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'username',
      //   credential: 'password'
      // }
    ],
    iceCandidatePoolSize: 10
  }

  // 初始化
  const initialize = async () => {
    try {
      if (isInitialized.value) return

      // 获取设备列表
      await getDevices()
      
      // 设置默认设备
      if (devices.value.microphones.length > 0 && !settings.value.microphoneId) {
        settings.value.microphoneId = devices.value.microphones[0].deviceId
      }
      if (devices.value.cameras.length > 0 && !settings.value.cameraId) {
        settings.value.cameraId = devices.value.cameras[0].deviceId
      }
      if (devices.value.speakers.length > 0 && !settings.value.speakerId) {
        settings.value.speakerId = devices.value.speakers[0].deviceId
      }

      isInitialized.value = true
      console.log('✅ 通话系统初始化完成')

    } catch (err) {
      console.error('❌ 通话系统初始化失败:', err)
      error.value = err instanceof Error ? err.message : '初始化失败'
    }
  }

  // 获取设备列表
  const getDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices()
      
      devices.value.microphones = deviceList.filter(device => device.kind === 'audioinput')
      devices.value.cameras = deviceList.filter(device => device.kind === 'videoinput')
      devices.value.speakers = deviceList.filter(device => device.kind === 'audiooutput')

      console.log('🎤 检测到设备:', {
        microphones: devices.value.microphones.length,
        cameras: devices.value.cameras.length,
        speakers: devices.value.speakers.length
      })

    } catch (err) {
      console.error('获取设备列表失败:', err)
      throw err
    }
  }

  // 获取媒体流
  const getMediaStream = async (constraints: MediaStreamConstraints) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStream.value = stream
      return stream

    } catch (err) {
      console.error('获取媒体流失败:', err)
      throw new Error('无法访问摄像头或麦克风，请检查权限设置')
    }
  }

  // 创建PeerConnection
  const createPeerConnection = () => {
    try {
      const pc = new RTCPeerConnection(rtcConfig)
      
      // 监听ICE候选
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // 发送ICE候选到远端
          sendSignalingMessage({
            type: 'ice-candidate',
            candidate: event.candidate
          })
        }
      }

      // 监听远端流
      pc.ontrack = (event) => {
        console.log('📺 接收到远端流')
        remoteStream.value = event.streams[0]
      }

      // 监听连接状态
      pc.onconnectionstatechange = () => {
        console.log('🔗 连接状态:', pc.connectionState)
        updateConnectionStatus(pc.connectionState)
      }

      // 监听ICE连接状态
      pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE连接状态:', pc.iceConnectionState)
      }

      peerConnection.value = pc
      return pc

    } catch (err) {
      console.error('创建PeerConnection失败:', err)
      throw err
    }
  }

  // 发起通话
  const startCall = async (targetUserId: string, type: 'audio' | 'video' = 'audio') => {
    try {
      if (isInCall.value) {
        throw new Error('当前已在通话中')
      }

      // 创建通话会话
      const callSession: CallSession = {
        id: `call_${Date.now()}`,
        type,
        status: 'calling',
        participants: [],
        isIncoming: false,
        caller: {
          id: 'current_user',
          name: '我',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
          isMuted: false,
          isVideoEnabled: type === 'video',
          isScreenSharing: false,
          connectionStatus: 'connecting'
        },
        receiver: {
          id: targetUserId,
          name: '对方',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=target',
          isMuted: false,
          isVideoEnabled: type === 'video',
          isScreenSharing: false,
          connectionStatus: 'connecting'
        },
        duration: 0,
        quality: 'good',
        networkStats: {
          bitrate: 0,
          packetLoss: 0,
          latency: 0
        }
      }

      currentCall.value = callSession

      // 获取媒体流
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: settings.value.microphoneId ? { exact: settings.value.microphoneId } : undefined,
          echoCancellation: settings.value.echoCancellation,
          noiseSuppression: settings.value.noiseSuppression,
          autoGainControl: settings.value.autoGainControl
        },
        video: type === 'video' ? {
          deviceId: settings.value.cameraId ? { exact: settings.value.cameraId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      }

      await getMediaStream(constraints)

      // 创建PeerConnection
      const pc = createPeerConnection()

      // 添加本地流
      if (localStream.value) {
        localStream.value.getTracks().forEach(track => {
          pc.addTrack(track, localStream.value!)
        })
      }

      // 创建Offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // 发送通话邀请
      await sendCallInvitation(targetUserId, {
        type: 'call-offer',
        callId: callSession.id,
        callType: type,
        offer: offer
      })

      console.log('📞 发起通话:', type, '目标用户:', targetUserId)

    } catch (err) {
      console.error('发起通话失败:', err)
      error.value = err instanceof Error ? err.message : '发起通话失败'
      await endCall()
      throw err
    }
  }

  // 接听通话
  const answerCall = async (callData: any) => {
    try {
      if (isInCall.value) {
        throw new Error('当前已在通话中')
      }

      // 更新通话状态
      if (currentCall.value) {
        currentCall.value.status = 'connected'
        currentCall.value.startTime = Date.now()
      }

      // 获取媒体流
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: settings.value.microphoneId ? { exact: settings.value.microphoneId } : undefined,
          echoCancellation: settings.value.echoCancellation,
          noiseSuppression: settings.value.noiseSuppression,
          autoGainControl: settings.value.autoGainControl
        },
        video: callData.callType === 'video' ? {
          deviceId: settings.value.cameraId ? { exact: settings.value.cameraId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      }

      await getMediaStream(constraints)

      // 创建PeerConnection
      const pc = createPeerConnection()

      // 添加本地流
      if (localStream.value) {
        localStream.value.getTracks().forEach(track => {
          pc.addTrack(track, localStream.value!)
        })
      }

      // 设置远端描述
      await pc.setRemoteDescription(callData.offer)

      // 创建Answer
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // 发送应答
      await sendSignalingMessage({
        type: 'call-answer',
        callId: callData.callId,
        answer: answer
      })

      console.log('✅ 接听通话成功')

    } catch (err) {
      console.error('接听通话失败:', err)
      error.value = err instanceof Error ? err.message : '接听通话失败'
      await endCall()
      throw err
    }
  }

  // 拒绝通话
  const rejectCall = async (callId: string) => {
    try {
      await sendSignalingMessage({
        type: 'call-reject',
        callId: callId
      })

      if (currentCall.value) {
        currentCall.value.status = 'ended'
        currentCall.value.endTime = Date.now()
        addToHistory(currentCall.value)
        currentCall.value = null
      }

      await cleanup()
      console.log('❌ 拒绝通话')

    } catch (err) {
      console.error('拒绝通话失败:', err)
    }
  }

  // 结束通话
  const endCall = async () => {
    try {
      if (currentCall.value) {
        currentCall.value.status = 'ended'
        currentCall.value.endTime = Date.now()
        
        // 发送结束通话信号
        await sendSignalingMessage({
          type: 'call-end',
          callId: currentCall.value.id
        })

        addToHistory(currentCall.value)
        currentCall.value = null
      }

      await cleanup()
      console.log('📞 通话已结束')

    } catch (err) {
      console.error('结束通话失败:', err)
    }
  }

  // 切换静音
  const toggleMute = () => {
    if (localStream.value) {
      const audioTrack = localStream.value.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        if (currentCall.value) {
          currentCall.value.caller.isMuted = !audioTrack.enabled
        }
        console.log('🎤 静音状态:', !audioTrack.enabled)
      }
    }
  }

  // 切换视频
  const toggleVideo = () => {
    if (localStream.value) {
      const videoTrack = localStream.value.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        if (currentCall.value) {
          currentCall.value.caller.isVideoEnabled = videoTrack.enabled
        }
        console.log('📹 视频状态:', videoTrack.enabled)
      }
    }
  }

  // 切换扬声器
  const toggleSpeaker = async () => {
    // 在移动端可以切换扬声器
    try {
      // 这里需要根据具体平台实现
      console.log('🔊 切换扬声器')
    } catch (err) {
      console.error('切换扬声器失败:', err)
    }
  }

  // 屏幕共享
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })

      if (peerConnection.value && localStream.value) {
        // 替换视频轨道
        const videoTrack = screenStream.getVideoTracks()[0]
        const sender = peerConnection.value.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        )

        if (sender) {
          await sender.replaceTrack(videoTrack)
        }

        if (currentCall.value) {
          currentCall.value.caller.isScreenSharing = true
          currentCall.value.type = 'screen'
        }

        // 监听屏幕共享结束
        videoTrack.onended = () => {
          stopScreenShare()
        }

        console.log('🖥️ 开始屏幕共享')
      }

    } catch (err) {
      console.error('屏幕共享失败:', err)
      error.value = '屏幕共享失败'
    }
  }

  // 停止屏幕共享
  const stopScreenShare = async () => {
    try {
      if (peerConnection.value && localStream.value) {
        // 恢复摄像头
        const videoTrack = localStream.value.getVideoTracks()[0]
        const sender = peerConnection.value.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        )

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack)
        }

        if (currentCall.value) {
          currentCall.value.caller.isScreenSharing = false
          currentCall.value.type = 'video'
        }

        console.log('🖥️ 停止屏幕共享')
      }

    } catch (err) {
      console.error('停止屏幕共享失败:', err)
    }
  }

  // 清理资源
  const cleanup = async () => {
    try {
      // 关闭媒体流
      if (localStream.value) {
        localStream.value.getTracks().forEach(track => track.stop())
        localStream.value = null
      }

      if (remoteStream.value) {
        remoteStream.value.getTracks().forEach(track => track.stop())
        remoteStream.value = null
      }

      // 关闭PeerConnection
      if (peerConnection.value) {
        peerConnection.value.close()
        peerConnection.value = null
      }

      error.value = null

    } catch (err) {
      console.error('清理资源失败:', err)
    }
  }

  // 辅助函数
  const updateConnectionStatus = (status: RTCPeerConnectionState) => {
    if (currentCall.value) {
      const connectionStatus = status === 'connected' ? 'connected' : 
                             status === 'failed' ? 'failed' : 'connecting'
      currentCall.value.caller.connectionStatus = connectionStatus
      currentCall.value.receiver.connectionStatus = connectionStatus
    }
  }

  const addToHistory = (call: CallSession) => {
    callHistory.value.unshift(call)
    // 保留最近100条记录
    if (callHistory.value.length > 100) {
      callHistory.value = callHistory.value.slice(0, 100)
    }
  }

  const sendCallInvitation = async (targetUserId: string, data: any) => {
    // 这里应该通过WebSocket或其他方式发送信令
    console.log('📤 发送通话邀请:', data)
    // 模拟发送
    return Promise.resolve()
  }

  const sendSignalingMessage = async (data: any) => {
    // 这里应该通过WebSocket发送信令消息
    console.log('📤 发送信令消息:', data)
    // 模拟发送
    return Promise.resolve()
  }

  return {
    // 状态
    currentCall,
    callHistory,
    devices,
    settings,
    localStream,
    remoteStream,
    isInitialized,
    error,

    // 计算属性
    isInCall,
    callDuration,
    isAudioCall,
    isVideoCall,
    isScreenShare,

    // 方法
    initialize,
    getDevices,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    startScreenShare,
    stopScreenShare,
    cleanup
  }
})
