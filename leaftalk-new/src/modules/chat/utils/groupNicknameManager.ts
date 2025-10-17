/**
 * 群昵称管理工具
 * 用于管理用户在不同群聊中的昵称
 */

/**
 * 获取当前用户ID
 * @returns 当前用户ID
 */
function getCurrentUserId(): string | null {
  try {
    // 尝试从多个可能的存储位置获取用户ID
    const userInfo = localStorage.getItem('yeyu_user_info') ||
                     localStorage.getItem('user') ||
                     localStorage.getItem('user_info')

    if (userInfo) {
      const user = JSON.parse(userInfo)
      return String(user.id || user.userId || '')
    }

    return null
  } catch (error) {
    console.warn('获取当前用户ID失败:', error)
    return null
  }
}

/**
 * 群成员缓存
 * 键格式: `${groupId}_members`
 * 值: 群成员数组
 */
const groupMembersCache = new Map<string, any[]>()

/**
 * 从缓存或API获取群成员列表
 * @param groupId 群聊ID（包含group_前缀）
 * @returns 群成员列表
 */
export async function getGroupMembers(groupId: string): Promise<any[]> {
  // 先从缓存获取
  const cacheKey = `${groupId}_members`
  if (groupMembersCache.has(cacheKey)) {
    return groupMembersCache.get(cacheKey) || []
  }

  // 从API获取
  try {
    const token = localStorage.getItem('yeyu_auth_token') ||
                  localStorage.getItem('token') ||
                  localStorage.getItem('auth_token')

    if (!token) {
      console.warn('未找到认证token')
      return []
    }

    // 直接使用groupId，不去掉前缀
    const response = await fetch(`http://localhost:8893/api/groups/${groupId}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const result = await response.json()
    if (result.success && result.data) {
      console.log('✅ 获取群成员数据并缓存:', groupId, '成员数量:', result.data.length)
      console.log('📋 群成员数据示例:', result.data.slice(0, 3).map((m: any) => ({
        id: m.id,
        nickname: m.nickname,
        group_nickname: m.group_nickname
      })))

      // 缓存结果（5分钟）
      groupMembersCache.set(cacheKey, result.data)
      setTimeout(() => {
        groupMembersCache.delete(cacheKey)
      }, 5 * 60 * 1000)

      return result.data
    }
  } catch (error) {
    console.warn('从API获取群成员失败:', error)
  }

  return []
}

/**
 * 获取用户在指定群聊中的昵称
 * @param userId 用户ID
 * @param groupId 群聊ID
 * @param defaultNickname 默认昵称（如果没有设置群昵称）
 * @returns 群昵称或默认昵称
 */
export function getGroupNickname(userId: string | number, groupId: string, defaultNickname: string = ''): string {
  try {
    console.log('🔍 getGroupNickname 调用:', { userId, groupId, defaultNickname })

    // 优先从localStorage读取（快速访问）
    const currentUserId = getCurrentUserId()
    if (currentUserId && String(userId) === String(currentUserId)) {
      const savedNickname = localStorage.getItem(`group_nickname_${groupId}`)
      if (savedNickname && savedNickname.trim()) {
        console.log('✅ 从localStorage获取到当前用户群昵称:', savedNickname.trim())
        return savedNickname.trim()
      }
    }

    // 尝试从缓存的群成员数据中获取
    const cacheKey = `${groupId}_members`
    console.log('🔍 检查缓存:', cacheKey, '是否存在:', groupMembersCache.has(cacheKey))

    if (groupMembersCache.has(cacheKey)) {
      const members = groupMembersCache.get(cacheKey) || []
      console.log('📋 缓存中的群成员数量:', members.length)

      const member = members.find((m: any) => String(m.id) === String(userId))
      console.log('🔍 查找用户:', userId, '找到:', member ? '是' : '否')

      if (member) {
        console.log('📋 成员数据:', {
          id: member.id,
          nickname: member.nickname,
          group_nickname: member.group_nickname
        })

        if (member.group_nickname) {
          console.log('✅ 返回群昵称:', member.group_nickname)
          return member.group_nickname
        }
      }
    }

    console.log('⚠️ 未找到群昵称，返回默认值:', defaultNickname)
    return defaultNickname
  } catch (error) {
    console.warn('获取群昵称失败:', error)
    return defaultNickname
  }
}

/**
 * 异步获取用户在指定群聊中的昵称（从API）
 * @param userId 用户ID
 * @param groupId 群聊ID
 * @param defaultNickname 默认昵称
 * @returns Promise<群昵称或默认昵称>
 */
export async function getGroupNicknameAsync(userId: string | number, groupId: string, defaultNickname: string = ''): Promise<string> {
  try {
    const members = await getGroupMembers(groupId)
    const member = members.find((m: any) => String(m.id) === String(userId))

    if (member && member.group_nickname) {
      return member.group_nickname
    }

    return defaultNickname
  } catch (error) {
    console.warn('异步获取群昵称失败:', error)
    return defaultNickname
  }
}

/**
 * 保存用户在指定群聊中的昵称
 * @param groupId 群聊ID
 * @param nickname 昵称
 */
export function saveGroupNickname(groupId: string, nickname: string): void {
  try {
    if (nickname && nickname.trim()) {
      localStorage.setItem(`group_nickname_${groupId}`, nickname.trim())
    } else {
      localStorage.removeItem(`group_nickname_${groupId}`)
    }
  } catch (error) {
    console.error('保存群昵称失败:', error)
  }
}

/**
 * 删除用户在指定群聊中的昵称
 * @param groupId 群聊ID
 */
export function removeGroupNickname(groupId: string): void {
  try {
    localStorage.removeItem(`group_nickname_${groupId}`)
  } catch (error) {
    console.error('删除群昵称失败:', error)
  }
}

/**
 * 获取用户在群聊中显示的名称（优先级：备注 > 群昵称 > 用户昵称）
 * @param userId 用户ID
 * @param groupId 群聊ID（如果是群聊）
 * @param userNickname 用户昵称
 * @param isGroupChat 是否是群聊
 * @returns 显示名称
 */
export function getDisplayName(
  userId: string | number,
  groupId: string | null,
  userNickname: string,
  isGroupChat: boolean = false
): string {
  try {
    const currentUserId = getCurrentUserId()

    // 如果是当前用户
    if (currentUserId && String(userId) === String(currentUserId)) {
      // 在群聊中，优先使用"我在本群的昵称"
      if (isGroupChat && groupId) {
        const groupNickname = getGroupNickname(userId, groupId, '')
        if (groupNickname) {
          return groupNickname
        }
      }
      // 否则返回用户昵称
      return userNickname || '我'
    }

    // 如果是其他用户
    // 优先级：好友备注 > 群昵称 > 用户昵称

    // 1. 尝试获取好友备注
    try {
      const saved = JSON.parse(localStorage.getItem(`friend_remark_${userId}`) || 'null')
      if (saved?.name && String(saved.name).trim()) {
        return String(saved.name).trim()
      }
    } catch (e) {
      console.warn('读取好友备注失败:', e)
    }

    // 2. 如果是群聊，尝试获取群昵称
    if (isGroupChat && groupId) {
      const groupNickname = getGroupNickname(userId, groupId, '')
      if (groupNickname) {
        return groupNickname
      }
    }

    // 3. 返回用户昵称
    return userNickname || `用户${userId}`
  } catch (error) {
    console.warn('获取显示名称失败:', error)
    return userNickname || `用户${userId}`
  }
}

