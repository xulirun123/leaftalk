/**
 * 朋友圈服务
 * 处理朋友圈动态发布、点赞、评论等功能
 */

class MomentsService {
  constructor(db, fileService, notificationService) {
    this.db = db;
    this.fileService = fileService;
    this.notificationService = notificationService;
  }

  // ================================
  // 朋友圈动态管理
  // ================================

  // 发布朋友圈动态
  async publishMoment(userId, data) {
    try {
      const {
        content = '',
        images = [],
        videos = [],
        location = '',
        locationLat = null,
        locationLng = null,
        visibility = 'friends',
        allowComment = true,
        allowLike = true
      } = data;

      // 验证内容
      if (!content.trim() && images.length === 0 && videos.length === 0) {
        return {
          success: false,
          error: '动态内容不能为空'
        };
      }

      // 插入朋友圈动态
      const [result] = await this.db.execute(`
        INSERT INTO moments (user_id, content, images, videos, location, location_lat, location_lng, 
                           visibility, allow_comment, allow_like)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        content.trim(),
        JSON.stringify(images),
        JSON.stringify(videos),
        location,
        locationLat,
        locationLng,
        visibility,
        allowComment,
        allowLike
      ]);

      const momentId = result.insertId;

      // 如果有图片或视频，更新文件使用状态
      if (this.fileService) {
        const allFiles = [...images, ...videos];
        for (const filePath of allFiles) {
          await this.fileService.updateFileUsage(filePath, 'moment', momentId);
        }
      }

      return {
        success: true,
        momentId,
        message: '动态发布成功'
      };

    } catch (error) {
      console.error('❌ 发布朋友圈动态失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取朋友圈动态列表
  async getMoments(userId, page = 1, limit = 20, targetUserId = null) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = '1=1'; // 简化条件，因为实际表中没有is_deleted字段
      let params = [];

      if (targetUserId) {
        // 查看特定用户的朋友圈
        whereClause += ' AND m.user_id = ?';
        params.push(targetUserId);

        // 检查是否是好友或本人
        if (targetUserId !== userId) {
          const [friendship] = await this.db.execute(`
            SELECT id FROM friendships
            WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
            AND status = 'accepted'
          `, [userId, targetUserId, targetUserId, userId]);

          if (friendship.length === 0) {
            whereClause += ' AND m.visibility = "public"';
          }
        }
      } else {
        // 获取好友的朋友圈动态 - 暂时简化为显示所有公开和朋友可见的动态
        whereClause += ` AND (m.visibility IN ('public', 'friends'))`;
      }

      params.push(parseInt(limit), parseInt(offset));

      const [moments] = await this.db.execute(`
        SELECT m.*
        FROM moments m
        WHERE ${whereClause}
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params]);

      // 解析JSON字段
      const processedMoments = moments.map(moment => ({
        ...moment,
        images: moment.images ? JSON.parse(moment.images) : [],
        videos: moment.videos ? JSON.parse(moment.videos) : [],
        likes: [], // 暂时设为空数组
        comments: [], // 暂时设为空数组
        user_liked: false, // 暂时设为false，后续可以实现
        author_name: '用户' // 暂时设为默认值
      }));

      return {
        success: true,
        data: {
          moments: processedMoments,
          page,
          limit,
          hasMore: moments.length === limit
        }
      };

    } catch (error) {
      console.error('❌ 获取朋友圈动态失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取个人朋友圈动态
  async getPersonalMoments(userId, page = 1, limit = 20) {
    try {
      console.log('🔍 getPersonalMoments 参数:', { userId, page, limit });

      const offset = (page - 1) * limit;

      const [moments] = await this.db.execute(`
        SELECT * FROM moments
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [parseInt(userId), parseInt(limit), parseInt(offset)]);

      // 解析JSON字段
      const processedMoments = moments.map(moment => ({
        ...moment,
        images: moment.images ? JSON.parse(moment.images) : [],
        videos: moment.videos ? JSON.parse(moment.videos) : [],
        likes: [], // 暂时设为空数组
        comments: [], // 暂时设为空数组
        user_liked: false,
        author_name: '用户' // 暂时设为默认值
      }));

      return {
        success: true,
        data: {
          moments: processedMoments,
          page,
          limit,
          hasMore: moments.length === limit
        }
      };

    } catch (error) {
      console.error('❌ 获取个人朋友圈动态失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取指定用户的朋友圈动态
  async getUserMoments(targetUserId, currentUserId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      // 检查是否为好友关系
      const [friendship] = await this.db.execute(`
        SELECT * FROM friendships
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        AND status = 'accepted'
      `, [currentUserId, targetUserId, targetUserId, currentUserId]);

      let privacyClause = '';
      if (friendship.length === 0) {
        // 非好友只能看到公开动态
        privacyClause = 'AND visibility = "public"';
      }

      const [moments] = await this.db.execute(`
        SELECT * FROM moments
        WHERE user_id = ? ${privacyClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [parseInt(targetUserId), parseInt(limit), parseInt(offset)]);

      // 解析JSON字段
      const processedMoments = moments.map(moment => ({
        ...moment,
        images: moment.images ? JSON.parse(moment.images) : [],
        videos: moment.videos ? JSON.parse(moment.videos) : [],
        likes: [], // 暂时设为空数组
        comments: [], // 暂时设为空数组
        user_liked: false,
        author_name: '用户' // 暂时设为默认值
      }));

      return {
        success: true,
        data: {
          moments: processedMoments,
          page,
          limit,
          hasMore: moments.length === limit
        }
      };

    } catch (error) {
      console.error('❌ 获取用户朋友圈动态失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 删除朋友圈动态
  async deleteMoment(momentId, userId) {
    try {
      const [result] = await this.db.execute(`
        UPDATE moments 
        SET is_deleted = TRUE 
        WHERE id = ? AND user_id = ?
      `, [momentId, userId]);

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: '动态不存在或无权限删除'
        };
      }

      return {
        success: true,
        message: '动态已删除'
      };

    } catch (error) {
      console.error('❌ 删除朋友圈动态失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ================================
  // 点赞功能
  // ================================

  // 点赞/取消点赞
  async toggleLike(momentId, userId) {
    try {
      // 检查是否已点赞
      const [existing] = await this.db.execute(`
        SELECT id FROM moment_likes 
        WHERE moment_id = ? AND user_id = ?
      `, [momentId, userId]);

      if (existing.length > 0) {
        // 取消点赞
        await this.db.execute(`
          DELETE FROM moment_likes 
          WHERE moment_id = ? AND user_id = ?
        `, [momentId, userId]);

        // 更新点赞数
        await this.db.execute(`
          UPDATE moments 
          SET like_count = like_count - 1 
          WHERE id = ? AND like_count > 0
        `, [momentId]);

        return {
          success: true,
          action: 'unliked',
          message: '已取消点赞'
        };
      } else {
        // 添加点赞
        await this.db.execute(`
          INSERT INTO moment_likes (moment_id, user_id) 
          VALUES (?, ?)
        `, [momentId, userId]);

        // 更新点赞数
        await this.db.execute(`
          UPDATE moments 
          SET like_count = like_count + 1 
          WHERE id = ?
        `, [momentId]);

        // 获取动态作者信息，发送通知
        const [moment] = await this.db.execute(`
          SELECT user_id FROM moments WHERE id = ?
        `, [momentId]);

        if (moment.length > 0 && moment[0].user_id !== userId) {
          const [user] = await this.db.execute(`
            SELECT nickname, real_name FROM users WHERE id = ?
          `, [userId]);

          const userName = user[0]?.nickname || user[0]?.real_name || '用户';

          if (this.notificationService) {
            await this.notificationService.sendNotification(moment[0].user_id, {
              type: 'moment_like',
              title: '朋友圈点赞',
              content: `${userName} 赞了您的朋友圈`,
              data: {
                momentId,
                likeUserId: userId,
                likeUserName: userName
              }
            });
          }
        }

        return {
          success: true,
          action: 'liked',
          message: '点赞成功'
        };
      }

    } catch (error) {
      console.error('❌ 点赞操作失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取点赞列表
  async getLikes(momentId, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;

      const [likes] = await this.db.execute(`
        SELECT ml.user_id, ml.created_at, u.nickname, u.real_name, u.avatar
        FROM moment_likes ml
        JOIN users u ON ml.user_id = u.id
        WHERE ml.moment_id = ?
        ORDER BY ml.created_at DESC
        LIMIT ? OFFSET ?
      `, [momentId, limit, offset]);

      return {
        success: true,
        data: likes.map(like => ({
          ...like,
          name: like.nickname || like.real_name
        }))
      };

    } catch (error) {
      console.error('❌ 获取点赞列表失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ================================
  // 评论功能
  // ================================

  // 发表评论
  async addComment(momentId, userId, content, parentId = null, replyToUserId = null) {
    try {
      if (!content.trim()) {
        return {
          success: false,
          error: '评论内容不能为空'
        };
      }

      // 检查动态是否允许评论
      const [moment] = await this.db.execute(`
        SELECT user_id, allow_comment FROM moments 
        WHERE id = ? AND is_deleted = FALSE
      `, [momentId]);

      if (moment.length === 0) {
        return {
          success: false,
          error: '动态不存在'
        };
      }

      if (!moment[0].allow_comment) {
        return {
          success: false,
          error: '该动态不允许评论'
        };
      }

      // 添加评论
      const [result] = await this.db.execute(`
        INSERT INTO moment_comments (moment_id, user_id, parent_id, reply_to_user_id, content)
        VALUES (?, ?, ?, ?, ?)
      `, [momentId, userId, parentId, replyToUserId, content.trim()]);

      // 更新评论数
      await this.db.execute(`
        UPDATE moments 
        SET comment_count = comment_count + 1 
        WHERE id = ?
      `, [momentId]);

      // 发送通知给动态作者
      if (moment[0].user_id !== userId) {
        const [user] = await this.db.execute(`
          SELECT nickname, real_name FROM users WHERE id = ?
        `, [userId]);

        const userName = user[0]?.nickname || user[0]?.real_name || '用户';

        if (this.notificationService) {
          await this.notificationService.sendNotification(moment[0].user_id, {
            type: 'moment_comment',
            title: '朋友圈评论',
            content: `${userName} 评论了您的朋友圈`,
            data: {
              momentId,
              commentId: result.insertId,
              commentUserId: userId,
              commentUserName: userName,
              commentContent: content.trim()
            }
          });
        }
      }

      // 如果是回复评论，通知被回复的用户
      if (replyToUserId && replyToUserId !== userId && replyToUserId !== moment[0].user_id) {
        const [user] = await this.db.execute(`
          SELECT nickname, real_name FROM users WHERE id = ?
        `, [userId]);

        const userName = user[0]?.nickname || user[0]?.real_name || '用户';

        if (this.notificationService) {
          await this.notificationService.sendNotification(replyToUserId, {
            type: 'moment_comment',
            title: '朋友圈回复',
            content: `${userName} 回复了您的评论`,
            data: {
              momentId,
              commentId: result.insertId,
              commentUserId: userId,
              commentUserName: userName,
              commentContent: content.trim()
            }
          });
        }
      }

      return {
        success: true,
        commentId: result.insertId,
        message: '评论成功'
      };

    } catch (error) {
      console.error('❌ 发表评论失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取评论列表
  async getComments(momentId, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;

      const [comments] = await this.db.execute(`
        SELECT mc.*, u.nickname, u.real_name, u.avatar,
               ru.nickname as reply_to_nickname, ru.real_name as reply_to_real_name
        FROM moment_comments mc
        JOIN users u ON mc.user_id = u.id
        LEFT JOIN users ru ON mc.reply_to_user_id = ru.id
        WHERE mc.moment_id = ? AND mc.is_deleted = FALSE
        ORDER BY mc.created_at ASC
        LIMIT ? OFFSET ?
      `, [momentId, limit, offset]);

      return {
        success: true,
        data: comments.map(comment => ({
          ...comment,
          author_name: comment.nickname || comment.real_name,
          reply_to_name: comment.reply_to_nickname || comment.reply_to_real_name
        }))
      };

    } catch (error) {
      console.error('❌ 获取评论列表失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 删除评论
  async deleteComment(commentId, userId) {
    try {
      // 获取评论信息
      const [comment] = await this.db.execute(`
        SELECT mc.*, m.user_id as moment_author_id
        FROM moment_comments mc
        JOIN moments m ON mc.moment_id = m.id
        WHERE mc.id = ? AND mc.is_deleted = FALSE
      `, [commentId]);

      if (comment.length === 0) {
        return {
          success: false,
          error: '评论不存在'
        };
      }

      // 检查权限（评论作者或动态作者可以删除）
      if (comment[0].user_id !== userId && comment[0].moment_author_id !== userId) {
        return {
          success: false,
          error: '无权限删除该评论'
        };
      }

      // 删除评论
      await this.db.execute(`
        UPDATE moment_comments 
        SET is_deleted = TRUE 
        WHERE id = ?
      `, [commentId]);

      // 更新评论数
      await this.db.execute(`
        UPDATE moments 
        SET comment_count = comment_count - 1 
        WHERE id = ? AND comment_count > 0
      `, [comment[0].moment_id]);

      return {
        success: true,
        message: '评论已删除'
      };

    } catch (error) {
      console.error('❌ 删除评论失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = MomentsService;
