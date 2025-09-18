/**
 * 群头像生成工具
 * 根据群成员头像自动生成群头像
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
    size: 200,
    backgroundColor: '#f0f0f0',
    borderColor: '#ffffff',
    borderWidth: 2
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
    
    // 按加入时间排序，取最早加入的9个成员
    const displayMembers = members
      .sort((a, b) => a.joinTime - b.joinTime)
      .slice(0, 9)

    if (displayMembers.length === 0) {
      return this.generateDefaultGroupAvatar(opts)
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

    // 计算网格布局
    const gridInfo = this.calculateGridLayout(displayMembers.length)
    const cellSize = opts.size / gridInfo.gridSize
    const borderWidth = opts.borderWidth

    // 绘制每个成员的头像
    for (let i = 0; i < displayMembers.length; i++) {
      const member = displayMembers[i]
      const position = this.getGridPosition(i, gridInfo.gridSize)
      
      const x = position.col * cellSize
      const y = position.row * cellSize
      
      try {
        if (member.avatar) {
          // 绘制真实头像
          await this.drawMemberAvatar(ctx, member.avatar, x, y, cellSize, borderWidth, opts.borderColor)
        } else {
          // 绘制文字头像
          this.drawTextAvatar(ctx, member.name, x, y, cellSize, borderWidth, opts.borderColor)
        }
      } catch (error) {
        // 头像加载失败，绘制文字头像
        this.drawTextAvatar(ctx, member.name, x, y, cellSize, borderWidth, opts.borderColor)
      }
    }

    return canvas.toDataURL('image/png')
  }

  /**
   * 计算网格布局
   */
  private static calculateGridLayout(memberCount: number): { gridSize: number } {
    if (memberCount <= 1) return { gridSize: 1 }
    if (memberCount <= 4) return { gridSize: 2 }
    return { gridSize: 3 }
  }

  /**
   * 获取网格位置
   */
  private static getGridPosition(index: number, gridSize: number): { row: number; col: number } {
    return {
      row: Math.floor(index / gridSize),
      col: index % gridSize
    }
  }

  /**
   * 绘制成员头像
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
          // 绘制边框
          if (borderWidth > 0) {
            ctx.fillStyle = borderColor
            ctx.fillRect(x, y, size, size)
          }
          
          // 绘制头像
          const avatarSize = size - borderWidth * 2
          const avatarX = x + borderWidth
          const avatarY = y + borderWidth
          
          ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize)
          resolve()
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('头像加载失败'))
      }
      
      img.src = avatarUrl
    })
  }

  /**
   * 绘制文字头像
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
    // 绘制边框
    if (borderWidth > 0) {
      ctx.fillStyle = borderColor
      ctx.fillRect(x, y, size, size)
    }
    
    // 绘制背景
    const avatarSize = size - borderWidth * 2
    const avatarX = x + borderWidth
    const avatarY = y + borderWidth
    
    ctx.fillStyle = this.getAvatarColor(name)
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize)
    
    // 绘制文字
    const text = this.getAvatarText(name)
    const fontSize = Math.max(8, avatarSize * 0.4)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
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
