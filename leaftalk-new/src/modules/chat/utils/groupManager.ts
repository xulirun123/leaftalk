/**
 * 群聊管理工具类
 * 处理群聊创建、成员管理、权限控制等功能
 */

export interface GroupMember {
  id: string
  name: string
  avatar: string
  role: 'owner' | 'admin' | 'member'
  joinTime: number
  lastActiveTime: number
  isOnline: boolean
  isMuted: boolean
  nickname?: string // 群昵称
}

export interface GroupInfo {
  id: string
  name: string
  avatar: string
  description: string
  announcement: string
  memberCount: number
  maxMembers: number
  createTime: number
  creatorId: string
  isPublic: boolean
  requireApproval: boolean
  allowMemberInvite: boolean
  muteAll: boolean
  settings: GroupSettings
}

export interface GroupSettings {
  allowMemberModifyGroupInfo: boolean
  allowMemberInvite: boolean
  allowMemberViewHistory: boolean
  muteAll: boolean
  autoApproveJoin: boolean
  showMemberNickname: boolean
  enableGroupNotification: boolean
}

export interface GroupInvitation {
  id: string
  groupId: string
  inviterId: string
  inviterName: string
  inviteeId: string
  inviteeName: string
  message: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  createTime: number
  expireTime: number
}

export interface GroupJoinRequest {
  id: string
  groupId: string
  userId: string
  userName: string
  userAvatar: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  createTime: number
}

export class GroupManager {
  private eventListeners: Map<string, Function[]> = new Map()

  // 创建群聊
  async createGroup(
    name: string,
    members: string[],
    options: {
      description?: string
      avatar?: string
      isPublic?: boolean
      requireApproval?: boolean
    } = {}
  ): Promise<GroupInfo> {
    try {
      const groupId = this.generateGroupId()
      const currentUserId = 'current-user' // 从用户状态获取
      
      const group: GroupInfo = {
        id: groupId,
        name,
        avatar: options.avatar || this.generateGroupAvatar(members),
        description: options.description || '',
        announcement: '',
        memberCount: members.length + 1, // 包含创建者
        maxMembers: 500,
        createTime: Date.now(),
        creatorId: currentUserId,
        isPublic: options.isPublic || false,
        requireApproval: options.requireApproval || false,
        allowMemberInvite: true,
        muteAll: false,
        settings: {
          allowMemberModifyGroupInfo: false,
          allowMemberInvite: true,
          allowMemberViewHistory: true,
          muteAll: false,
          autoApproveJoin: !options.requireApproval,
          showMemberNickname: true,
          enableGroupNotification: true
        }
      }

      // 添加群成员
      const groupMembers: GroupMember[] = [
        // 创建者
        {
          id: currentUserId,
          name: '我',
          avatar: '',
          role: 'owner',
          joinTime: Date.now(),
          lastActiveTime: Date.now(),
          isOnline: true,
          isMuted: false
        },
        // 其他成员
        ...members.map(memberId => ({
          id: memberId,
          name: `用户${memberId}`,
          avatar: this.getDefaultAvatar(memberId),
          role: 'member' as const,
          joinTime: Date.now(),
          lastActiveTime: Date.now(),
          isOnline: Math.random() > 0.3,
          isMuted: false
        }))
      ]

      // 保存群信息和成员列表
      await this.saveGroupInfo(group)
      await this.saveGroupMembers(groupId, groupMembers)

      this.emit('groupCreated', { group, members: groupMembers })
      return group

    } catch (error) {
      console.error('创建群聊失败:', error)
      throw error
    }
  }

  // 获取群信息
  async getGroupInfo(groupId: string): Promise<GroupInfo | null> {
    try {
      // 模拟从服务器获取群信息
      const groups = this.getMockGroups()
      return groups.find(g => g.id === groupId) || null
    } catch (error) {
      console.error('获取群信息失败:', error)
      return null
    }
  }

  // 获取群成员列表
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      // 模拟从服务器获取成员列表
      return this.getMockGroupMembers(groupId)
    } catch (error) {
      console.error('获取群成员失败:', error)
      return []
    }
  }

  // 邀请成员加入群聊
  async inviteMembers(
    groupId: string,
    memberIds: string[],
    message: string = ''
  ): Promise<boolean> {
    try {
      const group = await this.getGroupInfo(groupId)
      if (!group) {
        throw new Error('群聊不存在')
      }

      // 检查权限
      const currentUserRole = await this.getCurrentUserRole(groupId)
      if (!this.canInviteMembers(currentUserRole, group.settings)) {
        throw new Error('没有邀请权限')
      }

      // 创建邀请记录
      const invitations: GroupInvitation[] = memberIds.map(memberId => ({
        id: this.generateInvitationId(),
        groupId,
        inviterId: 'current-user',
        inviterName: '我',
        inviteeId: memberId,
        inviteeName: `用户${memberId}`,
        message,
        status: 'pending',
        createTime: Date.now(),
        expireTime: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天后过期
      }))

      // 发送邀请
      await this.sendInvitations(invitations)

      this.emit('membersInvited', { groupId, invitations })
      return true

    } catch (error) {
      console.error('邀请成员失败:', error)
      throw error
    }
  }

  // 移除群成员
  async removeMember(groupId: string, memberId: string): Promise<boolean> {
    try {
      const currentUserRole = await this.getCurrentUserRole(groupId)
      const targetMemberRole = await this.getMemberRole(groupId, memberId)

      // 检查权限
      if (!this.canRemoveMember(currentUserRole, targetMemberRole)) {
        throw new Error('没有移除权限')
      }

      // 执行移除操作
      await this.performRemoveMember(groupId, memberId)

      this.emit('memberRemoved', { groupId, memberId })
      return true

    } catch (error) {
      console.error('移除成员失败:', error)
      throw error
    }
  }

  // 设置成员角色
  async setMemberRole(
    groupId: string,
    memberId: string,
    role: 'admin' | 'member'
  ): Promise<boolean> {
    try {
      const currentUserRole = await this.getCurrentUserRole(groupId)
      
      // 只有群主可以设置管理员
      if (currentUserRole !== 'owner') {
        throw new Error('只有群主可以设置管理员')
      }

      await this.updateMemberRole(groupId, memberId, role)

      this.emit('memberRoleChanged', { groupId, memberId, role })
      return true

    } catch (error) {
      console.error('设置成员角色失败:', error)
      throw error
    }
  }

  // 禁言/解禁成员
  async muteMember(
    groupId: string,
    memberId: string,
    muted: boolean,
    duration?: number
  ): Promise<boolean> {
    try {
      const currentUserRole = await this.getCurrentUserRole(groupId)
      const targetMemberRole = await this.getMemberRole(groupId, memberId)

      // 检查权限
      if (!this.canMuteMember(currentUserRole, targetMemberRole)) {
        throw new Error('没有禁言权限')
      }

      await this.updateMemberMuteStatus(groupId, memberId, muted, duration)

      this.emit('memberMuted', { groupId, memberId, muted, duration })
      return true

    } catch (error) {
      console.error('禁言操作失败:', error)
      throw error
    }
  }

  // 更新群信息
  async updateGroupInfo(
    groupId: string,
    updates: Partial<Pick<GroupInfo, 'name' | 'description' | 'announcement' | 'avatar'>>
  ): Promise<boolean> {
    try {
      const currentUserRole = await this.getCurrentUserRole(groupId)
      const group = await this.getGroupInfo(groupId)

      if (!group) {
        throw new Error('群聊不存在')
      }

      // 检查权限
      if (!this.canModifyGroupInfo(currentUserRole, group.settings)) {
        throw new Error('没有修改群信息的权限')
      }

      await this.performUpdateGroupInfo(groupId, updates)

      this.emit('groupInfoUpdated', { groupId, updates })
      return true

    } catch (error) {
      console.error('更新群信息失败:', error)
      throw error
    }
  }

  // 退出群聊
  async leaveGroup(groupId: string): Promise<boolean> {
    try {
      const currentUserRole = await this.getCurrentUserRole(groupId)
      
      // 群主不能直接退出，需要先转让群主
      if (currentUserRole === 'owner') {
        throw new Error('群主需要先转让群主身份才能退出')
      }

      await this.performLeaveGroup(groupId)

      this.emit('leftGroup', { groupId })
      return true

    } catch (error) {
      console.error('退出群聊失败:', error)
      throw error
    }
  }

  // 解散群聊
  async dismissGroup(groupId: string): Promise<boolean> {
    try {
      const currentUserRole = await this.getCurrentUserRole(groupId)
      
      // 只有群主可以解散群聊
      if (currentUserRole !== 'owner') {
        throw new Error('只有群主可以解散群聊')
      }

      await this.performDismissGroup(groupId)

      this.emit('groupDismissed', { groupId })
      return true

    } catch (error) {
      console.error('解散群聊失败:', error)
      throw error
    }
  }

  // 权限检查方法
  private canInviteMembers(role: string, settings: GroupSettings): boolean {
    return role === 'owner' || role === 'admin' || settings.allowMemberInvite
  }

  private canRemoveMember(currentRole: string, targetRole: string): boolean {
    if (currentRole === 'owner') return true
    if (currentRole === 'admin' && targetRole === 'member') return true
    return false
  }

  private canMuteMember(currentRole: string, targetRole: string): boolean {
    if (currentRole === 'owner') return true
    if (currentRole === 'admin' && targetRole === 'member') return true
    return false
  }

  private canModifyGroupInfo(role: string, settings: GroupSettings): boolean {
    return role === 'owner' || role === 'admin' || settings.allowMemberModifyGroupInfo
  }

  // 辅助方法
  private generateGroupId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateInvitationId(): string {
    return `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateGroupAvatar(memberIds: string[]): string {
    // 生成群头像（组合前9个成员的头像）
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=group_${memberIds.join('_')}`
  }

  private getDefaultAvatar(userId: string): string {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
  }

  // 模拟数据方法
  private getMockGroups(): GroupInfo[] {
    return [
      {
        id: 'group1',
        name: '工作群',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=group1',
        description: '工作交流群',
        announcement: '请大家积极参与讨论',
        memberCount: 15,
        maxMembers: 500,
        createTime: Date.now() - 86400000,
        creatorId: 'user1',
        isPublic: false,
        requireApproval: true,
        allowMemberInvite: true,
        muteAll: false,
        settings: {
          allowMemberModifyGroupInfo: false,
          allowMemberInvite: true,
          allowMemberViewHistory: true,
          muteAll: false,
          autoApproveJoin: false,
          showMemberNickname: true,
          enableGroupNotification: true
        }
      }
    ]
  }

  private getMockGroupMembers(groupId: string): GroupMember[] {
    return [
      {
        id: 'user1',
        name: '张三',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
        role: 'owner',
        joinTime: Date.now() - 86400000,
        lastActiveTime: Date.now() - 3600000,
        isOnline: true,
        isMuted: false
      },
      {
        id: 'user2',
        name: '李四',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
        role: 'admin',
        joinTime: Date.now() - 86400000,
        lastActiveTime: Date.now() - 1800000,
        isOnline: false,
        isMuted: false
      }
    ]
  }

  // 模拟异步操作
  private async saveGroupInfo(group: GroupInfo): Promise<void> {
    // 模拟保存到服务器
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async saveGroupMembers(groupId: string, members: GroupMember[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async getCurrentUserRole(groupId: string): Promise<string> {
    // 模拟获取当前用户在群中的角色
    return 'owner'
  }

  private async getMemberRole(groupId: string, memberId: string): Promise<string> {
    return 'member'
  }

  private async sendInvitations(invitations: GroupInvitation[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async performRemoveMember(groupId: string, memberId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async updateMemberRole(groupId: string, memberId: string, role: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async updateMemberMuteStatus(
    groupId: string,
    memberId: string,
    muted: boolean,
    duration?: number
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async performUpdateGroupInfo(
    groupId: string,
    updates: Partial<GroupInfo>
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async performLeaveGroup(groupId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async performDismissGroup(groupId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))
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
          console.error('群聊事件处理错误:', error)
        }
      })
    }
  }

  // 销毁实例
  destroy(): void {
    this.eventListeners.clear()
  }
}

// 创建全局实例
export const groupManager = new GroupManager()

export default GroupManager
