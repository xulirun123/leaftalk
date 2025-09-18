/**
 * 通知API服务
 * 统一处理所有类型的通知
 */

const express = require('express');
const router = express.Router();

class NotificationAPI {
  constructor(db, notificationService) {
    this.db = db;
    this.notificationService = notificationService;
  }

  // 获取用户的所有通知
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, type = null, unreadOnly = false } = req.query;

      console.log(`📱 获取用户通知: userId=${userId}, type=${type}, unreadOnly=${unreadOnly}`);

      const result = await this.notificationService.getUserNotifications(
        userId, 
        parseInt(page), 
        parseInt(limit), 
        type, 
        unreadOnly === 'true'
      );

      if (result.success) {
        // 合并不同来源的通知
        const allNotifications = await this.mergeAllNotifications(userId, result.data.notifications);
        
        res.json({
          success: true,
          data: {
            notifications: allNotifications,
            unreadCount: result.data.unreadCount,
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: result.data.hasMore
          }
        });
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('❌ 获取通知失败:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // 合并所有类型的通知
  async mergeAllNotifications(userId, systemNotifications = []) {
    try {
      const allNotifications = [...systemNotifications];

      // 1. 获取好友请求通知
      const friendRequests = await this.getFriendRequestNotifications(userId);
      allNotifications.push(...friendRequests);

      // 2. 获取朋友圈通知
      const momentsNotifications = await this.getMomentsNotifications(userId);
      allNotifications.push(...momentsNotifications);

      // 3. 获取聊天消息通知
      const chatNotifications = await this.getChatNotifications(userId);
      allNotifications.push(...chatNotifications);

      // 4. 获取族谱通知
      const genealogyNotifications = await this.getGenealogyNotifications(userId);
      allNotifications.push(...genealogyNotifications);

      // 按时间排序
      allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return allNotifications;
    } catch (error) {
      console.error('❌ 合并通知失败:', error);
      return systemNotifications;
    }
  }

  // 获取好友请求通知
  async getFriendRequestNotifications(userId) {
    try {
      const [requests] = await this.db.execute(`
        SELECT 
          fr.id,
          fr.from_user_id,
          fr.message,
          fr.status,
          fr.created_at,
          u.nickname as from_user_name,
          u.avatar as from_user_avatar
        FROM friend_requests fr
        JOIN users u ON fr.from_user_id = u.id
        WHERE fr.to_user_id = ? AND fr.status = 'pending'
        ORDER BY fr.created_at DESC
        LIMIT 10
      `, [userId]);

      return requests.map(req => ({
        id: `friend_request_${req.id}`,
        type: 'friend_request',
        title: '新的好友请求',
        content: `${req.from_user_name} 请求添加您为好友`,
        isRead: false,
        priority: 'normal',
        createdAt: req.created_at,
        data: {
          requestId: req.id,
          fromUserId: req.from_user_id,
          fromUserName: req.from_user_name,
          fromUserAvatar: req.from_user_avatar,
          message: req.message
        }
      }));
    } catch (error) {
      console.error('❌ 获取好友请求通知失败:', error);
      return [];
    }
  }

  // 获取朋友圈通知
  async getMomentsNotifications(userId) {
    try {
      const notifications = [];

      // 获取点赞通知
      const [likes] = await this.db.execute(`
        SELECT 
          ml.id,
          ml.moment_id,
          ml.created_at,
          u.nickname as liker_name,
          u.avatar as liker_avatar,
          m.content as moment_content
        FROM moment_likes ml
        JOIN users u ON ml.user_id = u.id
        JOIN moments m ON ml.moment_id = m.id
        WHERE m.user_id = ? AND ml.user_id != ?
        ORDER BY ml.created_at DESC
        LIMIT 10
      `, [userId, userId]);

      likes.forEach(like => {
        notifications.push({
          id: `moment_like_${like.id}`,
          type: 'moment_like',
          title: '朋友圈点赞',
          content: `${like.liker_name} 赞了您的朋友圈`,
          isRead: false,
          priority: 'normal',
          createdAt: like.created_at,
          data: {
            momentId: like.moment_id,
            likerName: like.liker_name,
            likerAvatar: like.liker_avatar,
            momentContent: like.moment_content
          }
        });
      });

      // 获取评论通知
      const [comments] = await this.db.execute(`
        SELECT 
          mc.id,
          mc.moment_id,
          mc.content as comment_content,
          mc.created_at,
          u.nickname as commenter_name,
          u.avatar as commenter_avatar,
          m.content as moment_content
        FROM moment_comments mc
        JOIN users u ON mc.user_id = u.id
        JOIN moments m ON mc.moment_id = m.id
        WHERE m.user_id = ? AND mc.user_id != ?
        ORDER BY mc.created_at DESC
        LIMIT 10
      `, [userId, userId]);

      comments.forEach(comment => {
        notifications.push({
          id: `moment_comment_${comment.id}`,
          type: 'moment_comment',
          title: '朋友圈评论',
          content: `${comment.commenter_name} 评论了您的朋友圈`,
          isRead: false,
          priority: 'normal',
          createdAt: comment.created_at,
          data: {
            momentId: comment.moment_id,
            commentId: comment.id,
            commenterName: comment.commenter_name,
            commenterAvatar: comment.commenter_avatar,
            commentContent: comment.comment_content,
            momentContent: comment.moment_content
          }
        });
      });

      return notifications;
    } catch (error) {
      console.error('❌ 获取朋友圈通知失败:', error);
      return [];
    }
  }

  // 获取聊天消息通知
  async getChatNotifications(userId) {
    try {
      // 这里可以获取未读的聊天消息作为通知
      // 暂时返回空数组，因为聊天消息通常在聊天列表中显示
      return [];
    } catch (error) {
      console.error('❌ 获取聊天通知失败:', error);
      return [];
    }
  }

  // 获取族谱通知
  async getGenealogyNotifications(userId) {
    try {
      const [notifications] = await this.db.execute(`
        SELECT 
          gn.id,
          gn.type,
          gn.title,
          gn.content,
          gn.created_at,
          gn.genealogy_id,
          g.name as genealogy_name
        FROM genealogy_notifications gn
        JOIN genealogies g ON gn.genealogy_id = g.id
        JOIN genealogy_members gm ON g.id = gm.genealogy_id
        WHERE gm.user_id = ? AND gn.is_read = FALSE
        ORDER BY gn.created_at DESC
        LIMIT 10
      `, [userId]);

      return notifications.map(notif => ({
        id: `genealogy_${notif.id}`,
        type: 'genealogy_notification',
        title: notif.title,
        content: notif.content,
        isRead: false,
        priority: 'normal',
        createdAt: notif.created_at,
        data: {
          genealogyId: notif.genealogy_id,
          genealogyName: notif.genealogy_name
        }
      }));
    } catch (error) {
      console.error('❌ 获取族谱通知失败:', error);
      return [];
    }
  }

  // 标记通知为已读
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      console.log(`📱 标记通知已读: notificationId=${notificationId}, userId=${userId}`);

      // 根据通知ID类型处理不同的已读逻辑
      if (notificationId.startsWith('friend_request_')) {
        // 好友请求通知不需要特殊处理
      } else if (notificationId.startsWith('moment_')) {
        // 朋友圈通知不需要特殊处理
      } else if (notificationId.startsWith('genealogy_')) {
        const realId = notificationId.replace('genealogy_', '');
        await this.db.execute(`
          UPDATE genealogy_notifications 
          SET is_read = TRUE 
          WHERE id = ?
        `, [realId]);
      } else {
        // 系统通知
        await this.db.execute(`
          UPDATE system_notifications 
          SET is_read = TRUE 
          WHERE id = ? AND user_id = ?
        `, [notificationId, userId]);
      }

      res.json({
        success: true,
        message: '已标记为已读'
      });
    } catch (error) {
      console.error('❌ 标记已读失败:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // 标记所有通知为已读
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      console.log(`📱 标记所有通知已读: userId=${userId}`);

      // 标记系统通知为已读
      await this.db.execute(`
        UPDATE system_notifications 
        SET is_read = TRUE 
        WHERE user_id = ?
      `, [userId]);

      // 标记族谱通知为已读
      await this.db.execute(`
        UPDATE genealogy_notifications gn
        JOIN genealogies g ON gn.genealogy_id = g.id
        JOIN genealogy_members gm ON g.id = gm.genealogy_id
        SET gn.is_read = TRUE
        WHERE gm.user_id = ?
      `, [userId]);

      res.json({
        success: true,
        message: '所有通知已标记为已读'
      });
    } catch (error) {
      console.error('❌ 标记所有已读失败:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // 删除已读通知
  async deleteReadNotifications(req, res) {
    try {
      const userId = req.user.id;

      console.log(`📱 删除已读通知: userId=${userId}`);

      await this.db.execute(`
        DELETE FROM system_notifications 
        WHERE user_id = ? AND is_read = TRUE
      `, [userId]);

      res.json({
        success: true,
        message: '已读通知已删除'
      });
    } catch (error) {
      console.error('❌ 删除已读通知失败:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // 清空所有通知
  async clearAllNotifications(req, res) {
    try {
      const userId = req.user.id;

      console.log(`📱 清空所有通知: userId=${userId}`);

      await this.db.execute(`
        DELETE FROM system_notifications 
        WHERE user_id = ?
      `, [userId]);

      res.json({
        success: true,
        message: '所有通知已清空'
      });
    } catch (error) {
      console.error('❌ 清空通知失败:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = NotificationAPI;
