import { ref, computed } from 'vue'

export function usePlatform() {
  const userAgent = ref(navigator.userAgent)

  const isMobile = computed(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent.value)
  })

  const platform = computed(() => {
    if (/Android/i.test(userAgent.value)) return 'android'
    if (/iPhone|iPad|iPod/i.test(userAgent.value)) return 'ios'
    return 'web'
  })

  return {
    platform,
    isMobile,
    userAgent
  }
}