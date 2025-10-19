/**
 * 群头像生成工具
 * 根据群成员头像自动生成群头像
 *
 * 规则：
 * - 2个人：2个18px头像，一排
 * - 3个人：3个18px头像，上面1个，下面2个
 * - 4-8个人：4个18px头像，2x2网格
 * - 9个或以上：9个12px头像，3x3网格
 */

export interface GroupMember {
  id: string
  name: string
  avatar?: string
  joinTime: number
}

export interface GroupAvatarOptions {
  size?: number
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
}

export class GroupAvatarGenerator {
  private static readonly DEFAULT_OPTIONS: Required<GroupAvatarOptions> = {
    size: 36,  // 群头像总大小36px
    backgroundColor: '#f0f0f0',
    borderColor: '#ffffff',
    borderWidth: 0
  }

  /**
   * 生成群头像
   * @param members 群成员列表
   * @param options 生成选项
   * @returns 群头像的DataURL
   */
  static async generateGroupAvatar(
    members: GroupMember[],
    options: GroupAvatarOptions = {}
  ): Promise<string> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }

    // 按加入时间排序
    const sortedMembers = members.sort((a, b) => a.joinTime - b.joinTime)

    // 根据成员数量决定显示多少个头像
    let displayMembers: GroupMember[] = []
    let layout: 'single' | 'two' | 'three' | 'four' | 'nine' = 'single'

    if (sortedMembers.length === 0) {
      return this.generateDefaultGroupAvatar(opts)
    } else if (sortedMembers.length === 1) {
      displayMembers = sortedMembers.slice(0, 1)
      layout = 'single'
    } else if (sortedMembers.length === 2) {
      displayMembers = sortedMembers.slice(0, 2)
      layout = 'two'
    } else if (sortedMembers.length === 3) {
      displayMembers = sortedMembers.slice(0, 3)
      layout = 'three'
    } else if (sortedMembers.length <= 8) {
      displayMembers = sortedMembers.slice(0, 4)
      layout = 'four'
    } else {
      displayMembers = sortedMembers.slice(0, 9)
      layout = 'nine'
    }

    // 创建canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法创建canvas上下文')
    }

    canvas.width = opts.size
    canvas.height = opts.size

    // 设置背景
    ctx.fillStyle = opts.backgroundColor
    ctx.fillRect(0, 0, opts.size, opts.size)

    // 根据布局绘制头像
    try {
      console.log(`📐 群头像布局: ${layout}, 成员数: ${displayMembers.length}, canvas大小: ${opts.size}px`)

      if (layout === 'single') {
        await this.drawSingleLayout(ctx, displayMembers, opts)
      } else if (layout === 'two') {
        await this.drawTwoLayout(ctx, displayMembers, opts)
      } else if (layout === 'three') {
        await this.drawThreeLayout(ctx, displayMembers, opts)
      } else if (layout === 'four') {
        await this.drawFourLayout(ctx, displayMembers, opts)
      } else if (layout === 'nine') {
        await this.drawNineLayout(ctx, displayMembers, opts)
      }

      console.log('✅ 群头像生成成功')
    } catch (error) {
      console.error('❌ 绘制群头像失败:', error)
    }

    return canvas.toDataURL('image/png')
  }

  /**
   * 绘制单个头像布局（只剩下自己时，18px头像居中）
   */
  private static async drawSingleLayout(
    ctx: CanvasRenderingContext2D,
    members: GroupMember[],
    opts: Required<GroupAvatarOptions>
  ): Promise<void> {
    const member = members[0]
    const avatarSize = 18
    const x = (opts.size - avatarSize) / 2
    const y = (opts.size - avatarSize) / 2

    if (member.avatar) {
      await this.drawMemberAvatar(ctx, member.avatar, x, y, avatarSize, 0, opts.borderColor)
    } else {
      this.drawTextAvatar(ctx, member.name, x, y, avatarSize, 0, opts.borderColor)
    }
  }

  /**
   * 绘制2个头像布局（1行2列，18px）
   */
  private static async drawTwoLayout(
    ctx: CanvasRenderingContext2D,
    members: GroupMember[],
    opts: Required<GroupAvatarOptions>
  ): Promise<void> {
    const avatarSize = 18
    const gap = 0
    const totalWidth = avatarSize * 2 + gap
    const startX = (opts.size - totalWidth) / 2
    const startY = (opts.size - avatarSize) / 2

    for (let i = 0; i < 2; i++) {
      const x = startX + i * (avatarSize + gap)
      const y = startY
      const member = members[i]

      if (member.avatar) {
        await this.drawMemberAvatar(ctx, member.avatar, x, y, avatarSize, 0, opts.borderColor)
      } else {
        this.drawTextAvatar(ctx, member.name, x, y, avatarSize, 0, opts.borderColor)
      }
    }
  }

  /**
   * 绘制3个头像布局（2行：上1下2，18px）
   */
  private static async drawThreeLayout(
    ctx: CanvasRenderingContext2D,
    members: GroupMember[],
    opts: Required<GroupAvatarOptions>
  ): Promise<void> {
    const avatarSize = 18
    const gap = 0

    // 上面1个头像（居中）
    const topX = (opts.size - avatarSize) / 2
    const topY = 0
    const topMember = members[0]

    if (topMember.avatar) {
      await this.drawMemberAvatar(ctx, topMember.avatar, topX, topY, avatarSize, 0, opts.borderColor)
    } else {
      this.drawTextAvatar(ctx, topMember.name, topX, topY, avatarSize, 0, opts.borderColor)
    }

    // 下面2个头像
    const bottomY = avatarSize + gap
    const totalWidth = avatarSize * 2 + gap
    const startX = (opts.size - totalWidth) / 2

    for (let i = 1; i < 3; i++) {
      const x = startX + (i - 1) * (avatarSize + gap)
      const y = bottomY
      const member = members[i]

      if (member.avatar) {
        await this.drawMemberAvatar(ctx, member.avatar, x, y, avatarSize, 0, opts.borderColor)
      } else {
        this.drawTextAvatar(ctx, member.name, x, y, avatarSize, 0, opts.borderColor)
      }
    }
  }

  /**
   * 绘制4个头像布局（2x2，18px）
   */
  private static async drawFourLayout(
    ctx: CanvasRenderingContext2D,
    members: GroupMember[],
    opts: Required<GroupAvatarOptions>
  ): Promise<void> {
    const avatarSize = 18
    const gap = 0
    const totalSize = avatarSize * 2 + gap
    const startX = (opts.size - totalSize) / 2
    const startY = (opts.size - totalSize) / 2

    for (let i = 0; i < 4; i++) {
      const row = Math.floor(i / 2)
      const col = i % 2
      const x = startX + col * (avatarSize + gap)
      const y = startY + row * (avatarSize + gap)
      const member = members[i]

      if (member.avatar) {
        await this.drawMemberAvatar(ctx, member.avatar, x, y, avatarSize, 0, opts.borderColor)
      } else {
        this.drawTextAvatar(ctx, member.name, x, y, avatarSize, 0, opts.borderColor)
      }
    }
  }

  /**
   * 绘制9个头像布局（3x3，12px）
   */
  private static async drawNineLayout(
    ctx: CanvasRenderingContext2D,
    members: GroupMember[],
    opts: Required<GroupAvatarOptions>
  ): Promise<void> {
    const avatarSize = 12
    const gap = 0
    const totalSize = avatarSize * 3 + gap * 2
    const startX = (opts.size - totalSize) / 2
    const startY = (opts.size - totalSize) / 2

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3)
      const col = i % 3
      const x = startX + col * (avatarSize + gap)
      const y = startY + row * (avatarSize + gap)
      const member = members[i]

      if (member.avatar) {
        await this.drawMemberAvatar(ctx, member.avatar, x, y, avatarSize, 0, opts.borderColor)
      } else {
        this.drawTextAvatar(ctx, member.name, x, y, avatarSize, 0, opts.borderColor)
      }
    }
  }

  /**
   * 绘制成员头像（方形）
   */
  private static drawMemberAvatar(
    ctx: CanvasRenderingContext2D,
    avatarUrl: string,
    x: number,
    y: number,
    size: number,
    borderWidth: number,
    borderColor: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        try {
          console.log(`🖼️ 绘制头像: x=${x}, y=${y}, size=${size}`)

          // 绘制边框（方形）
          if (borderWidth > 0) {
            ctx.fillStyle = borderColor
            ctx.fillRect(x, y, size, size)
          }

          // 绘制头像（方形）
          const avatarSize = size - borderWidth * 2
          const avatarX = x + borderWidth
          const avatarY = y + borderWidth

          ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize)

          resolve()
        } catch (error) {
          console.error(`❌ 绘制头像失败: ${error}`)
          reject(error)
        }
      }

      img.onerror = () => {
        console.error(`❌ 头像加载失败: ${avatarUrl}`)
        reject(new Error('头像加载失败'))
      }

      img.src = avatarUrl
    })
  }

  /**
   * 绘制文字头像（方形）
   */
  private static drawTextAvatar(
    ctx: CanvasRenderingContext2D,
    name: string,
    x: number,
    y: number,
    size: number,
    borderWidth: number,
    borderColor: string
  ): void {
    // 绘制边框（方形）
    if (borderWidth > 0) {
      ctx.fillStyle = borderColor
      ctx.fillRect(x, y, size, size)
    }

    // 绘制背景（方形）
    const avatarSize = size - borderWidth * 2
    const avatarX = x + borderWidth
    const avatarY = y + borderWidth

    ctx.fillStyle = this.getAvatarColor(name)
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize)

    // 绘制文字
    const text = this.getAvatarText(name)
    const fontSize = Math.max(6, avatarSize * 0.4)

    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const textX = avatarX + avatarSize / 2
    const textY = avatarY + avatarSize / 2

    ctx.fillText(text, textX, textY)
  }

  /**
   * 获取头像文字
   */
  private static getAvatarText(name: string): string {
    if (name.length === 0) return '?'
    if (name.length === 1) return name
    if (name.length === 2) return name
    return name.slice(-2)
  }

  /**
   * 根据名字生成头像颜色
   */
  private static getAvatarColor(name: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#F4D03F'
    ]
    
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  /**
   * 生成默认群头像
   */
  private static generateDefaultGroupAvatar(options: Required<GroupAvatarOptions>): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法创建canvas上下文')
    }

    canvas.width = options.size
    canvas.height = options.size

    // 绘制默认背景
    ctx.fillStyle = '#07C160'
    ctx.fillRect(0, 0, options.size, options.size)

    // 绘制群组图标
    ctx.fillStyle = '#ffffff'
    ctx.font = `${options.size * 0.4}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('群', options.size / 2, options.size / 2)

    return canvas.toDataURL('image/png')
  }

  /**
   * 为群组生成头像URL
   * @param members 群成员
   * @param size 头像尺寸
   * @returns 头像DataURL
   */
  static async generateGroupAvatarUrl(members: GroupMember[], size: number = 200): Promise<string> {
    return this.generateGroupAvatar(members, { size })
  }
}
