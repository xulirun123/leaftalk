/**
 * 通知服务
 * 处理系统通知、推送通知等功能
 */

class NotificationService {
  constructor(db, socketService) {
    this.db = db;
    this.socketService = socketService;
  }

  // ================================
  // 通知发送
  // ================================

  // 发送通知
  async sendNotification(userId, notification) {
    try {
      const {
        type,
        title,
        content,
        data = {},
        actionUrl = null,
        expiresAt = null
      } = notification;

      // 插入通知记录
      const [result] = await this.db.execute(`
        INSERT INTO system_notifications (user_id, type, title, content, data, action_url, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userId, type, title, content, JSON.stringify(data), actionUrl, expiresAt]);

      const notificationId = result.insertId;

      // 实时推送通知
      if (this.socketService) {
        this.socketService.sendToUser(userId, 'notification', {
          id: notificationId,
          type,
          title,
          content,
          data,
          actionUrl,
          createdAt: new Date().toISOString(),
          isRead: false
        });
      }

      return {
        success: true,
        notificationId
      };

    } catch (error) {
      console.error('❌ 发送通知失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 批量发送通知
  async sendBulkNotifications(userIds, notification) {
    try {
      const results = [];
      
      for (const userId of userIds) {
        const result = await this.sendNotification(userId, notification);
        results.push({ userId, ...result });
      }

      return {
        success: true,
        results
      };

    } catch (error) {
      console.error('❌ 批量发送通知失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ================================
  // 通知管理
  // ================================

  // 获取用户通知列表
  async getUserNotifications(userId, page = 1, limit = 20, type = null, unreadOnly = false) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'user_id = ? AND (expires_at IS NULL OR expires_at > NOW())';
      let params = [userId];

      if (type) {
        whereClause += ' AND type = ?';
        params.push(type);
      }

      if (unreadOnly) {
        whereClause += ' AND is_read = FALSE';
      }

      params.push(limit, offset);

      const [notifications] = await this.db.execute(`
        SELECT id, type, title, content, data, action_url, is_read, created_at
        FROM system_notifications
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, params);

      // 解析JSON数据
      const processedNotifications = notifications.map(notification => ({
        ...notification,
        data: notification.data ? JSON.parse(notification.data) : {}
      }));

      // 获取未读数量
      const [unreadCount] = await this.db.execute(`
        SELECT COUNT(*) as count
        FROM system_notifications
        WHERE user_id = ? AND is_read = FALSE AND (expires_at IS NULL OR expires_at > NOW())
      `, [userId]);

      return {
        success: true,
        data: {
          notifications: processedNotifications,
          unreadCount: unreadCount[0].count,
          page,
          limit,
          hasMore: notifications.length === limit
        }
      };

    } catch (error) {
      console.error('❌ 获取通知列表失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 标记通知为已读
  async markAsRead(notificationIds, userId) {
    try {
      if (!Array.isArray(notificationIds)) {
        notificationIds = [notificationIds];
      }

      const placeholders = notificationIds.map(() => '?').join(',');
      const [result] = await this.db.execute(`
        UPDATE system_notifications 
        SET is_read = TRUE 
        WHERE id IN (${placeholders}) AND user_id = ?
      `, [...notificationIds, userId]);

      return {
        success: true,
        updatedCount: result.affectedRows
      };

    } catch (error) {
      console.error('❌ 标记通知已读失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 标记所有通知为已读
  async markAllAsRead(userId, type = null) {
    try {
      let query = 'UPDATE system_notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE';
      let params = [userId];

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      const [result] = await this.db.execute(query, params);

      return {
        success: true,
        updatedCount: result.affectedRows
      };

    } catch (error) {
      console.error('❌ 标记所有通知已读失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 删除通知
  async deleteNotifications(notificationIds, userId) {
    try {
      if (!Array.isArray(notificationIds)) {
        notificationIds = [notificationIds];
      }

      const placeholders = notificationIds.map(() => '?').join(',');
      const [result] = await this.db.execute(`
        DELETE FROM system_notifications 
        WHERE id IN (${placeholders}) AND user_id = ?
      `, [...notificationIds, userId]);

      return {
        success: true,
        deletedCount: result.affectedRows
      };

    } catch (error) {
      console.error('❌ 删除通知失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取未读通知数量
  async getUnreadCount(userId, type = null) {
    try {
      let query = `
        SELECT COUNT(*) as count
        FROM system_notifications
        WHERE user_id = ? AND is_read = FALSE AND (expires_at IS NULL OR expires_at > NOW())
      `;
      let params = [userId];

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      const [result] = await this.db.execute(query, params);

      return {
        success: true,
        count: result[0].count
      };

    } catch (error) {
      console.error('❌ 获取未读通知数量失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ================================
  // 通知模板
  // ================================

  // 好友请求通知
  async sendFriendRequestNotification(toUserId, fromUser, message = '') {
    return await this.sendNotification(toUserId, {
      type: 'friend_request',
      title: '新的好友请求',
      content: `${fromUser.name} 请求添加您为好友`,
      data: {
        fromUserId: fromUser.id,
        fromUserName: fromUser.name,
        fromUserAvatar: fromUser.avatar,
        message
      },
      actionUrl: '/friends/requests'
    });
  }

  // 好友请求通过通知
  async sendFriendAcceptedNotification(toUserId, acceptUser) {
    return await this.sendNotification(toUserId, {
      type: 'friend_accepted',
      title: '好友请求已通过',
      content: `${acceptUser.name} 已接受您的好友请求`,
      data: {
        friendId: acceptUser.id,
        friendName: acceptUser.name,
        friendAvatar: acceptUser.avatar
      },
      actionUrl: '/friends'
    });
  }

  // 群聊邀请通知
  async sendGroupInviteNotification(toUserId, groupInfo, inviter) {
    return await this.sendNotification(toUserId, {
      type: 'group_invite',
      title: '群聊邀请',
      content: `${inviter.name} 邀请您加入群聊 "${groupInfo.name}"`,
      data: {
        groupId: groupInfo.id,
        groupName: groupInfo.name,
        inviterId: inviter.id,
        inviterName: inviter.name
      },
      actionUrl: `/groups/${groupInfo.id}`
    });
  }

  // 朋友圈点赞通知
  async sendMomentLikeNotification(toUserId, likeUser, momentId) {
    return await this.sendNotification(toUserId, {
      type: 'moment_like',
      title: '朋友圈点赞',
      content: `${likeUser.name} 赞了您的朋友圈`,
      data: {
        momentId,
        likeUserId: likeUser.id,
        likeUserName: likeUser.name,
        likeUserAvatar: likeUser.avatar
      },
      actionUrl: `/moments/${momentId}`
    });
  }

  // 朋友圈评论通知
  async sendMomentCommentNotification(toUserId, commentUser, momentId, commentContent) {
    return await this.sendNotification(toUserId, {
      type: 'moment_comment',
      title: '朋友圈评论',
      content: `${commentUser.name} 评论了您的朋友圈`,
      data: {
        momentId,
        commentUserId: commentUser.id,
        commentUserName: commentUser.name,
        commentUserAvatar: commentUser.avatar,
        commentContent
      },
      actionUrl: `/moments/${momentId}`
    });
  }

  // 系统消息通知
  async sendSystemMessage(userIds, title, content, data = {}) {
    if (!Array.isArray(userIds)) {
      userIds = [userIds];
    }

    return await this.sendBulkNotifications(userIds, {
      type: 'system_message',
      title,
      content,
      data
    });
  }

  // ================================
  // 通知清理
  // ================================

  // 清理过期通知
  async cleanupExpiredNotifications() {
    try {
      const [result] = await this.db.execute(`
        DELETE FROM system_notifications 
        WHERE expires_at IS NOT NULL AND expires_at < NOW()
      `);

      console.log(`✅ 清理了 ${result.affectedRows} 个过期通知`);
      return result.affectedRows;

    } catch (error) {
      console.error('❌ 清理过期通知失败:', error);
      return 0;
    }
  }

  // 清理旧通知（保留最近30天）
  async cleanupOldNotifications(daysToKeep = 30) {
    try {
      const [result] = await this.db.execute(`
        DELETE FROM system_notifications 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [daysToKeep]);

      console.log(`✅ 清理了 ${result.affectedRows} 个旧通知`);
      return result.affectedRows;

    } catch (error) {
      console.error('❌ 清理旧通知失败:', error);
      return 0;
    }
  }
}

module.exports = NotificationService;
