import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface IdentityInfo {
  id: string
  userId: string
  realName: string
  idCard: string
  fatherName?: string
  motherName?: string
  birthDate?: string
  address?: string
  issuingAuthority?: string
  validPeriod?: string
  frontImageUrl?: string
  backImageUrl?: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  verificationTime?: number
  rejectionReason?: string
}

export interface VerificationStep {
  step: number
  title: string
  description: string
  completed: boolean
  current: boolean
}

export const useIdentityStore = defineStore('identity', () => {
  const identityInfo = ref<IdentityInfo | null>(null)
  const verificationSteps = ref<VerificationStep[]>([
    {
      step: 1,
      title: '上传身份证',
      description: '请上传身份证正反面照片',
      completed: false,
      current: true
    },
    {
      step: 2,
      title: '信息确认',
      description: '确认身份证信息是否正确',
      completed: false,
      current: false
    },
    {
      step: 3,
      title: '审核中',
      description: '系统正在审核您的身份信息',
      completed: false,
      current: false
    },
    {
      step: 4,
      title: '认证完成',
      description: '身份认证已完成',
      completed: false,
      current: false
    }
  ])

  const currentStep = ref(1)
  const isVerified = computed(() => {
    return identityInfo.value?.verificationStatus === 'verified'
  })

  const isPending = computed(() => {
    return identityInfo.value?.verificationStatus === 'pending'
  })

  const isRejected = computed(() => {
    return identityInfo.value?.verificationStatus === 'rejected'
  })

  // 更新身份信息
  function updateIdentityInfo(info: Partial<IdentityInfo>) {
    if (identityInfo.value) {
      Object.assign(identityInfo.value, info)
    } else {
      identityInfo.value = {
        id: '',
        userId: '',
        realName: '',
        idCard: '',
        verificationStatus: 'pending',
        ...info
      } as IdentityInfo
    }
  }

  // 设置当前步骤
  function setCurrentStep(step: number) {
    currentStep.value = step
    
    verificationSteps.value.forEach((s, index) => {
      s.current = s.step === step
      s.completed = s.step < step
    })
  }

  // 提交身份认证
  function submitVerification(info: Partial<IdentityInfo>) {
    updateIdentityInfo({
      ...info,
      verificationStatus: 'pending',
      verificationTime: Date.now()
    })
    setCurrentStep(3)
  }

  // 更新认证状态
  function updateVerificationStatus(status: 'verified' | 'rejected', reason?: string) {
    if (identityInfo.value) {
      identityInfo.value.verificationStatus = status
      if (reason) {
        identityInfo.value.rejectionReason = reason
      }
      
      if (status === 'verified') {
        setCurrentStep(4)
      } else if (status === 'rejected') {
        setCurrentStep(1)
      }
    }
  }

  // 重置认证流程
  function resetVerification() {
    identityInfo.value = null
    setCurrentStep(1)
  }

  // 获取认证进度百分比
  const verificationProgress = computed(() => {
    const completedSteps = verificationSteps.value.filter(s => s.completed).length
    return Math.round((completedSteps / verificationSteps.value.length) * 100)
  })

  return {
    identityInfo,
    verificationSteps,
    currentStep,
    isVerified,
    isPending,
    isRejected,
    verificationProgress,
    updateIdentityInfo,
    setCurrentStep,
    submitVerification,
    updateVerificationStatus,
    resetVerification
  }
})
