/**
 * WebRTC 配置
 */

const webrtcConfig = {
  // ICE 服务器配置
  iceServers: [
    // Google 公共 STUN 服务器
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    
    // 备用 STUN 服务器
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' },
    
    // 如果需要 TURN 服务器（用于 NAT 穿透），可以添加：
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'your-username',
    //   credential: 'your-password'
    // }
  ],

  // PeerConnection 配置
  peerConnectionConfig: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  },

  // 媒体约束配置
  mediaConstraints: {
    // 音频约束
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 1
    },
    
    // 视频约束
    video: {
      width: { min: 320, ideal: 640, max: 1280 },
      height: { min: 240, ideal: 480, max: 720 },
      frameRate: { min: 15, ideal: 30, max: 30 },
      facingMode: 'user' // 前置摄像头
    }
  },

  // 编码参数配置
  codecPreferences: {
    video: [
      'video/VP8',
      'video/VP9',
      'video/H264'
    ],
    audio: [
      'audio/opus',
      'audio/PCMU',
      'audio/PCMA'
    ]
  },

  // 通话超时配置（毫秒）
  timeouts: {
    calling: 60000,      // 呼叫超时 60秒
    connecting: 30000,   // 连接超时 30秒
    reconnect: 10000     // 重连超时 10秒
  },

  // 网络质量监控配置
  qualityMonitoring: {
    enabled: true,
    interval: 5000,      // 5秒检查一次
    thresholds: {
      excellent: { rtt: 100, packetLoss: 0.01 },
      good: { rtt: 200, packetLoss: 0.03 },
      fair: { rtt: 400, packetLoss: 0.05 },
      poor: { rtt: 800, packetLoss: 0.1 }
    }
  },

  // 自适应码率配置
  adaptiveBitrate: {
    enabled: true,
    video: {
      min: 100000,     // 100 kbps
      max: 2000000,    // 2 Mbps
      start: 800000    // 800 kbps
    },
    audio: {
      min: 32000,      // 32 kbps
      max: 128000,     // 128 kbps
      start: 64000     // 64 kbps
    }
  }
}

module.exports = webrtcConfig
