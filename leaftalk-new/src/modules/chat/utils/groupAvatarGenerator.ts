/**
 * 群组头像生成器
 * 用于生成群聊的组合头像
 */

export interface GroupMember {
  id: string
  avatar?: string
  nickname?: string
  username?: string
}

export class GroupAvatarGenerator {
  /**
   * 生成群组头像URL
   * @param members 群组成员列表
   * @param size 头像尺寸
   * @returns Promise<string> 生成的头像URL
   */
  static async generateGroupAvatarUrl(members: GroupMember[], size: number = 56): Promise<string> {
    if (!members || members.length === 0) {
      return this.getDefaultGroupAvatar(size)
    }

    // 取前4个成员生成组合头像
    const displayMembers = members.slice(0, 4)
    
    try {
      // 使用Canvas生成组合头像
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        return this.getDefaultGroupAvatar(size)
      }

      canvas.width = size
      canvas.height = size

      // 设置背景色
      ctx.fillStyle = '#f5f5f5'
      ctx.fillRect(0, 0, size, size)

      // 根据成员数量决定布局
      if (displayMembers.length === 1) {
        await this.drawSingleAvatar(ctx, displayMembers[0], size)
      } else if (displayMembers.length === 2) {
        await this.drawTwoAvatars(ctx, displayMembers, size)
      } else if (displayMembers.length === 3) {
        await this.drawThreeAvatars(ctx, displayMembers, size)
      } else {
        await this.drawFourAvatars(ctx, displayMembers, size)
      }

      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error('生成群组头像失败:', error)
      return this.getDefaultGroupAvatar(size)
    }
  }

  /**
   * 绘制单个头像
   */
  private static async drawSingleAvatar(ctx: CanvasRenderingContext2D, member: GroupMember, size: number) {
    const avatarUrl = this.getMemberAvatarUrl(member)
    const img = await this.loadImage(avatarUrl)
    
    ctx.save()
    this.clipCircle(ctx, size / 2, size / 2, size / 2 - 2)
    ctx.drawImage(img, 0, 0, size, size)
    ctx.restore()
  }

  /**
   * 绘制两个头像
   */
  private static async drawTwoAvatars(ctx: CanvasRenderingContext2D, members: GroupMember[], size: number) {
    const avatarSize = size / 2 - 1
    
    for (let i = 0; i < 2; i++) {
      const avatarUrl = this.getMemberAvatarUrl(members[i])
      const img = await this.loadImage(avatarUrl)
      
      const x = i * (avatarSize + 2)
      const y = (size - avatarSize) / 2
      
      ctx.save()
      this.clipCircle(ctx, x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2)
      ctx.drawImage(img, x, y, avatarSize, avatarSize)
      ctx.restore()
    }
  }

  /**
   * 绘制三个头像
   */
  private static async drawThreeAvatars(ctx: CanvasRenderingContext2D, members: GroupMember[], size: number) {
    const avatarSize = size / 2 - 1
    
    // 第一个头像在上方中央
    const firstUrl = this.getMemberAvatarUrl(members[0])
    const firstImg = await this.loadImage(firstUrl)
    const firstX = (size - avatarSize) / 2
    const firstY = 2
    
    ctx.save()
    this.clipCircle(ctx, firstX + avatarSize / 2, firstY + avatarSize / 2, avatarSize / 2)
    ctx.drawImage(firstImg, firstX, firstY, avatarSize, avatarSize)
    ctx.restore()

    // 下方两个头像
    for (let i = 1; i < 3; i++) {
      const avatarUrl = this.getMemberAvatarUrl(members[i])
      const img = await this.loadImage(avatarUrl)
      
      const x = (i - 1) * (avatarSize + 2)
      const y = size - avatarSize - 2
      
      ctx.save()
      this.clipCircle(ctx, x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2)
      ctx.drawImage(img, x, y, avatarSize, avatarSize)
      ctx.restore()
    }
  }

  /**
   * 绘制四个头像
   */
  private static async drawFourAvatars(ctx: CanvasRenderingContext2D, members: GroupMember[], size: number) {
    const avatarSize = size / 2 - 1
    
    for (let i = 0; i < 4; i++) {
      const avatarUrl = this.getMemberAvatarUrl(members[i])
      const img = await this.loadImage(avatarUrl)
      
      const row = Math.floor(i / 2)
      const col = i % 2
      const x = col * (avatarSize + 2)
      const y = row * (avatarSize + 2)
      
      ctx.save()
      this.clipCircle(ctx, x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2)
      ctx.drawImage(img, x, y, avatarSize, avatarSize)
      ctx.restore()
    }
  }

  /**
   * 裁剪圆形
   */
  private static clipCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.clip()
  }

  /**
   * 加载图片
   */
  private static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => {
        // 如果加载失败，使用默认头像
        const defaultImg = new Image()
        defaultImg.onload = () => resolve(defaultImg)
        defaultImg.src = this.getDefaultMemberAvatar()
      }
      img.src = url
    })
  }

  /**
   * 获取成员头像URL
   */
  private static getMemberAvatarUrl(member: GroupMember): string {
    if (member.avatar && member.avatar.trim()) {
      return member.avatar
    }
    
    // 使用默认头像API
    const userId = member.id
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  }

  /**
   * 获取默认群组头像
   */
  private static getDefaultGroupAvatar(size: number): string {
    return `https://api.dicebear.com/7.x/shapes/svg?seed=group&backgroundColor=07C160&size=${size}`
  }

  /**
   * 获取默认成员头像
   */
  private static getDefaultMemberAvatar(): string {
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4'
  }
}
