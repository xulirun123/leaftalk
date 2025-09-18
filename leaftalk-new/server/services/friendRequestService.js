/**
 * 好友请求管理服务
 * 处理好友添加、请求管理、通知等功能
 */

class FriendRequestService {
  constructor(db, notificationService, socketService) {
    this.db = db;
    this.notificationService = notificationService;
    this.socketService = socketService;
  }

  // ================================
  // 好友请求管理
  // ================================

  // 发送好友请求
  async sendFriendRequest(fromUserId, toUserId, message = '', source = 'search') {
    try {
      // 检查是否已经是好友
      const [existingFriendship] = await this.db.execute(`
        SELECT id FROM friendships 
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        AND status = 'accepted'
      `, [fromUserId, toUserId, toUserId, fromUserId]);

      if (existingFriendship.length > 0) {
        return {
          success: false,
          error: '你们已经是好友了'
        };
      }

      // 检查是否已发送过请求
      const [existingRequest] = await this.db.execute(`
        SELECT id, status FROM friend_requests 
        WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'
      `, [fromUserId, toUserId]);

      if (existingRequest.length > 0) {
        return {
          success: false,
          error: '已发送过好友请求，请等待对方回应'
        };
      }

      // 检查对方是否已向自己发送请求
      const [reverseRequest] = await this.db.execute(`
        SELECT id FROM friend_requests 
        WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'
      `, [toUserId, fromUserId]);

      if (reverseRequest.length > 0) {
        // 直接接受对方的请求
        return await this.acceptFriendRequest(reverseRequest[0].id, fromUserId);
      }

      // 检查是否被拉黑
      const [blacklistCheck] = await this.db.execute(`
        SELECT id FROM user_blacklist 
        WHERE user_id = ? AND blocked_user_id = ?
      `, [toUserId, fromUserId]);

      if (blacklistCheck.length > 0) {
        return {
          success: false,
          error: '无法发送好友请求'
        };
      }

      // 创建好友请求
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后过期
      
      const [result] = await this.db.execute(`
        INSERT INTO friend_requests (from_user_id, to_user_id, message, source, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `, [fromUserId, toUserId, message, source, expiresAt]);

      // 获取发送者信息
      const [fromUser] = await this.db.execute(`
        SELECT nickname, real_name, avatar FROM users WHERE id = ?
      `, [fromUserId]);

      const senderName = fromUser[0]?.nickname || fromUser[0]?.real_name || '用户';

      // 发送通知
      if (this.notificationService) {
        await this.notificationService.sendNotification(toUserId, {
          type: 'friend_request',
          title: '新的好友请求',
          content: `${senderName} 请求添加您为好友`,
          data: {
            requestId: result.insertId,
            fromUserId,
            fromUserName: senderName,
            fromUserAvatar: fromUser[0]?.avatar,
            message
          }
        });
      }

      // 实时通知
      if (this.socketService) {
        this.socketService.sendToUser(toUserId, 'friend_request', {
          requestId: result.insertId,
          fromUserId,
          fromUserName: senderName,
          fromUserAvatar: fromUser[0]?.avatar,
          message,
          createdAt: new Date().toISOString()
        });
      }

      return {
        success: true,
        requestId: result.insertId,
        message: '好友请求已发送'
      };

    } catch (error) {
      console.error('❌ 发送好友请求失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 接受好友请求
  async acceptFriendRequest(requestId, userId) {
    try {
      // 获取请求信息
      const [requests] = await this.db.execute(`
        SELECT fr.*, u.nickname, u.real_name, u.avatar
        FROM friend_requests fr
        JOIN users u ON fr.from_user_id = u.id
        WHERE fr.id = ? AND fr.to_user_id = ? AND fr.status = 'pending'
      `, [requestId, userId]);

      if (requests.length === 0) {
        return {
          success: false,
          error: '好友请求不存在或已处理'
        };
      }

      const request = requests[0];

      // 开始事务（使用 query 避免 prepared protocol 限制）
      await this.db.query('START TRANSACTION');

      try {
        // 更新请求状态
        await this.db.execute(`
          UPDATE friend_requests
          SET status = 'accepted', processed_at = NOW()
          WHERE id = ?
        `, [requestId]);

        // 创建双向好友关系
        await this.db.execute(`
          INSERT INTO friendships (user_id, friend_id, status, created_at)
          VALUES (?, ?, 'accepted', NOW()), (?, ?, 'accepted', NOW())
        `, [request.from_user_id, userId, userId, request.from_user_id]);

        // 提交事务
        await this.db.query('COMMIT');

        // 发送通知给请求发送者
        const senderName = request.nickname || request.real_name || '用户';
        
        if (this.notificationService) {
          await this.notificationService.sendNotification(request.from_user_id, {
            type: 'friend_accepted',
            title: '好友请求已通过',
            content: `${senderName} 已接受您的好友请求`,
            data: {
              friendId: userId
            }
          });
        }

        // 实时通知
        if (this.socketService) {
          this.socketService.sendToUser(request.from_user_id, 'friend_accepted', {
            friendId: userId,
            friendName: senderName,
            message: '好友请求已通过'
          });
        }

        return {
          success: true,
          message: '已添加为好友'
        };

      } catch (error) {
        await this.db.execute('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('❌ 接受好友请求失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 拒绝好友请求
  async rejectFriendRequest(requestId, userId) {
    try {
      const [result] = await this.db.execute(`
        UPDATE friend_requests 
        SET status = 'rejected', processed_at = NOW() 
        WHERE id = ? AND to_user_id = ? AND status = 'pending'
      `, [requestId, userId]);

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: '好友请求不存在或已处理'
        };
      }

      return {
        success: true,
        message: '已拒绝好友请求'
      };

    } catch (error) {
      console.error('❌ 拒绝好友请求失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取收到的好友请求列表
  async getReceivedRequests(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const [requests] = await this.db.execute(`
        SELECT fr.id, fr.from_user_id, fr.message, fr.source, fr.created_at,
               u.nickname, u.real_name, u.avatar, u.yeyu_id
        FROM friend_requests fr
        JOIN users u ON fr.from_user_id = u.id
        WHERE fr.to_user_id = ? AND fr.status = 'pending'
        ORDER BY fr.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);

      const [total] = await this.db.execute(`
        SELECT COUNT(*) as count
        FROM friend_requests
        WHERE to_user_id = ? AND status = 'pending'
      `, [userId]);

      return {
        success: true,
        data: {
          requests,
          total: total[0].count,
          page,
          limit
        }
      };

    } catch (error) {
      console.error('❌ 获取好友请求失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取发送的好友请求列表
  async getSentRequests(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const [requests] = await this.db.execute(`
        SELECT fr.id, fr.to_user_id, fr.message, fr.status, fr.created_at, fr.processed_at,
               u.nickname, u.real_name, u.avatar, u.yeyu_id
        FROM friend_requests fr
        JOIN users u ON fr.to_user_id = u.id
        WHERE fr.from_user_id = ?
        ORDER BY fr.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);

      const [total] = await this.db.execute(`
        SELECT COUNT(*) as count
        FROM friend_requests
        WHERE from_user_id = ?
      `, [userId]);

      return {
        success: true,
        data: {
          requests,
          total: total[0].count,
          page,
          limit
        }
      };

    } catch (error) {
      console.error('❌ 获取发送的好友请求失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 清理过期的好友请求
  async cleanupExpiredRequests() {
    try {
      const [result] = await this.db.execute(`
        UPDATE friend_requests 
        SET status = 'expired' 
        WHERE status = 'pending' AND expires_at < NOW()
      `);

      console.log(`✅ 清理了 ${result.affectedRows} 个过期的好友请求`);
      return result.affectedRows;

    } catch (error) {
      console.error('❌ 清理过期好友请求失败:', error);
      return 0;
    }
  }

  // ================================
  // 黑名单管理
  // ================================

  // 拉黑用户
  async blockUser(userId, blockedUserId, reason = '') {
    try {
      // 检查是否已拉黑
      const [existing] = await this.db.execute(`
        SELECT id FROM user_blacklist 
        WHERE user_id = ? AND blocked_user_id = ?
      `, [userId, blockedUserId]);

      if (existing.length > 0) {
        return {
          success: false,
          error: '该用户已在黑名单中'
        };
      }

      // 开始事务
      await this.db.query('START TRANSACTION');

      try {
        // 添加到黑名单
        await this.db.execute(`
          INSERT INTO user_blacklist (user_id, blocked_user_id, reason)
          VALUES (?, ?, ?)
        `, [userId, blockedUserId, reason]);

        // 删除好友关系（如果存在）
        await this.db.execute(`
          DELETE FROM friendships 
          WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        `, [userId, blockedUserId, blockedUserId, userId]);

        // 删除待处理的好友请求
        await this.db.execute(`
          UPDATE friend_requests 
          SET status = 'rejected' 
          WHERE ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))
          AND status = 'pending'
        `, [userId, blockedUserId, blockedUserId, userId]);

        await this.db.query('COMMIT');

        return {
          success: true,
          message: '已拉黑该用户'
        };

      } catch (error) {
        await this.db.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('❌ 拉黑用户失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 取消拉黑
  async unblockUser(userId, blockedUserId) {
    try {
      const [result] = await this.db.execute(`
        DELETE FROM user_blacklist 
        WHERE user_id = ? AND blocked_user_id = ?
      `, [userId, blockedUserId]);

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: '该用户不在黑名单中'
        };
      }

      return {
        success: true,
        message: '已取消拉黑'
      };

    } catch (error) {
      console.error('❌ 取消拉黑失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取黑名单列表
  async getBlacklist(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const [blacklist] = await this.db.execute(`
        SELECT ub.blocked_user_id, ub.reason, ub.created_at,
               u.nickname, u.real_name, u.avatar, u.yeyu_id
        FROM user_blacklist ub
        JOIN users u ON ub.blocked_user_id = u.id
        WHERE ub.user_id = ?
        ORDER BY ub.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);

      const [total] = await this.db.execute(`
        SELECT COUNT(*) as count
        FROM user_blacklist
        WHERE user_id = ?
      `, [userId]);

      return {
        success: true,
        data: {
          blacklist,
          total: total[0].count,
          page,
          limit
        }
      };

    } catch (error) {
      console.error('❌ 获取黑名单失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 检查是否被拉黑
  async isBlocked(userId, targetUserId) {
    try {
      const [result] = await this.db.execute(`
        SELECT id FROM user_blacklist 
        WHERE user_id = ? AND blocked_user_id = ?
      `, [targetUserId, userId]);

      return result.length > 0;

    } catch (error) {
      console.error('❌ 检查拉黑状态失败:', error);
      return false;
    }
  }
}

module.exports = FriendRequestService;
