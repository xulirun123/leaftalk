/**
 * 文件上传服务
 * 处理图片、视频、文档等文件的上传、存储和管理
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const sharp = require('sharp');

class FileUploadService {
  constructor(db, uploadDir = './uploads') {
    this.db = db;
    this.uploadDir = uploadDir;
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
    this.allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    this.initializeDirectories();
  }

  // 初始化上传目录
  async initializeDirectories() {
    try {
      const dirs = [
        this.uploadDir,
        path.join(this.uploadDir, 'avatars'),
        path.join(this.uploadDir, 'moments'),
        path.join(this.uploadDir, 'chat'),
        path.join(this.uploadDir, 'documents'),
        path.join(this.uploadDir, 'temp'),
        path.join(this.uploadDir, 'thumbnails')
      ];

      for (const dir of dirs) {
        try {
          await fs.access(dir);
        } catch {
          await fs.mkdir(dir, { recursive: true });
          console.log(`📁 创建上传目录: ${dir}`);
        }
      }
    } catch (error) {
      console.error('❌ 初始化上传目录失败:', error);
    }
  }

  // 配置multer存储
  getMulterConfig(usageType = 'other') {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        let uploadPath = this.uploadDir;
        
        switch (usageType) {
          case 'avatar':
            uploadPath = path.join(this.uploadDir, 'avatars');
            break;
          case 'moment':
            uploadPath = path.join(this.uploadDir, 'moments');
            break;
          case 'chat':
            uploadPath = path.join(this.uploadDir, 'chat');
            break;
          case 'document':
            uploadPath = path.join(this.uploadDir, 'documents');
            break;
          default:
            uploadPath = path.join(this.uploadDir, 'temp');
        }
        
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname);
        const filename = `${timestamp}_${randomString}${ext}`;
        cb(null, filename);
      }
    });

    const fileFilter = (req, file, cb) => {
      const allowedTypes = [
        ...this.allowedImageTypes,
        ...this.allowedVideoTypes,
        ...this.allowedDocTypes
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: 9 // 最多9个文件
      }
    });
  }

  // 上传单个文件
  async uploadSingleFile(file, userId, usageType = 'other', metadata = {}) {
    try {
      // 计算文件哈希
      const fileBuffer = await fs.readFile(file.path);
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // 检查是否已存在相同文件
      const [existingFile] = await this.db.execute(`
        SELECT id, file_path FROM file_uploads 
        WHERE file_hash = ? AND user_id = ?
      `, [fileHash, userId]);

      if (existingFile.length > 0) {
        // 删除重复上传的文件
        await fs.unlink(file.path);
        return {
          success: true,
          fileId: existingFile[0].id,
          filePath: existingFile[0].file_path,
          message: '文件已存在，使用现有文件'
        };
      }

      // 生成缩略图（如果是图片）
      let thumbnailPath = null;
      if (this.allowedImageTypes.includes(file.mimetype)) {
        thumbnailPath = await this.generateThumbnail(file.path, file.filename);
      }

      // 获取相对路径
      const relativePath = path.relative(process.cwd(), file.path);

      // 保存文件记录
      const [result] = await this.db.execute(`
        INSERT INTO file_uploads (user_id, file_name, file_path, file_size, file_type, 
                                 mime_type, file_hash, usage_type, is_public)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        file.originalname,
        relativePath,
        file.size,
        path.extname(file.originalname),
        file.mimetype,
        fileHash,
        usageType,
        usageType === 'avatar' || usageType === 'moment'
      ]);

      return {
        success: true,
        fileId: result.insertId,
        filePath: relativePath,
        thumbnailPath,
        fileSize: file.size,
        mimeType: file.mimetype,
        originalName: file.originalname
      };

    } catch (error) {
      console.error('❌ 上传文件失败:', error);
      // 清理临时文件
      try {
        await fs.unlink(file.path);
      } catch {}
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 批量上传文件
  async uploadMultipleFiles(files, userId, usageType = 'other') {
    try {
      const results = [];
      
      for (const file of files) {
        const result = await this.uploadSingleFile(file, userId, usageType);
        results.push({
          originalName: file.originalname,
          ...result
        });
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      return {
        success: successCount > 0,
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failCount
        }
      };

    } catch (error) {
      console.error('❌ 批量上传文件失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 生成缩略图
  async generateThumbnail(filePath, filename) {
    try {
      const thumbnailDir = path.join(this.uploadDir, 'thumbnails');
      const thumbnailName = `thumb_${filename}`;
      const thumbnailPath = path.join(thumbnailDir, thumbnailName);

      await sharp(filePath)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      return path.relative(process.cwd(), thumbnailPath);

    } catch (error) {
      console.error('❌ 生成缩略图失败:', error);
      return null;
    }
  }

  // 删除文件
  async deleteFile(fileId, userId) {
    try {
      // 获取文件信息
      const [files] = await this.db.execute(`
        SELECT file_path FROM file_uploads 
        WHERE id = ? AND user_id = ?
      `, [fileId, userId]);

      if (files.length === 0) {
        return {
          success: false,
          error: '文件不存在或无权限删除'
        };
      }

      const filePath = files[0].file_path;

      // 删除数据库记录
      await this.db.execute(`
        DELETE FROM file_uploads WHERE id = ? AND user_id = ?
      `, [fileId, userId]);

      // 删除物理文件
      try {
        await fs.unlink(filePath);
        
        // 删除缩略图（如果存在）
        const thumbnailPath = path.join(
          this.uploadDir, 
          'thumbnails', 
          `thumb_${path.basename(filePath)}`
        );
        try {
          await fs.unlink(thumbnailPath);
        } catch {}
        
      } catch (error) {
        console.warn('⚠️ 删除物理文件失败:', error.message);
      }

      return {
        success: true,
        message: '文件删除成功'
      };

    } catch (error) {
      console.error('❌ 删除文件失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取文件信息
  async getFileInfo(fileId, userId = null) {
    try {
      let query = `
        SELECT fu.*, u.nickname, u.real_name
        FROM file_uploads fu
        JOIN users u ON fu.user_id = u.id
        WHERE fu.id = ?
      `;
      let params = [fileId];

      // 如果指定了用户ID，检查权限
      if (userId) {
        query += ' AND (fu.user_id = ? OR fu.is_public = TRUE)';
        params.push(userId);
      } else {
        query += ' AND fu.is_public = TRUE';
      }

      const [files] = await this.db.execute(query, params);

      if (files.length === 0) {
        return {
          success: false,
          error: '文件不存在或无权限访问'
        };
      }

      return {
        success: true,
        file: files[0]
      };

    } catch (error) {
      console.error('❌ 获取文件信息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取用户文件列表
  async getUserFiles(userId, usageType = null, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'user_id = ?';
      let params = [userId];

      if (usageType) {
        whereClause += ' AND usage_type = ?';
        params.push(usageType);
      }

      params.push(limit, offset);

      const [files] = await this.db.execute(`
        SELECT id, file_name, file_path, file_size, file_type, mime_type, 
               usage_type, download_count, created_at
        FROM file_uploads
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, params);

      const [total] = await this.db.execute(`
        SELECT COUNT(*) as count
        FROM file_uploads
        WHERE ${whereClause.replace(/LIMIT.*/, '')}
      `, params.slice(0, -2));

      return {
        success: true,
        data: {
          files,
          total: total[0].count,
          page,
          limit
        }
      };

    } catch (error) {
      console.error('❌ 获取用户文件列表失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 更新文件使用状态
  async updateFileUsage(filePath, usageType, referenceId = null) {
    try {
      await this.db.execute(`
        UPDATE file_uploads 
        SET usage_type = ?, download_count = download_count + 1
        WHERE file_path = ?
      `, [usageType, filePath]);

      return { success: true };

    } catch (error) {
      console.error('❌ 更新文件使用状态失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 清理未使用的临时文件
  async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 24小时
    try {
      const cutoff = new Date(Date.now() - maxAge);
      
      const [tempFiles] = await this.db.execute(`
        SELECT id, file_path FROM file_uploads 
        WHERE usage_type = 'temp' AND created_at < ?
      `, [cutoff]);

      let deletedCount = 0;
      for (const file of tempFiles) {
        const result = await this.deleteFile(file.id, null);
        if (result.success) {
          deletedCount++;
        }
      }

      console.log(`✅ 清理了 ${deletedCount} 个临时文件`);
      return deletedCount;

    } catch (error) {
      console.error('❌ 清理临时文件失败:', error);
      return 0;
    }
  }

  // 获取文件统计信息
  async getFileStats(userId = null) {
    try {
      let whereClause = '';
      let params = [];

      if (userId) {
        whereClause = 'WHERE user_id = ?';
        params.push(userId);
      }

      const [stats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_files,
          SUM(file_size) as total_size,
          COUNT(CASE WHEN usage_type = 'avatar' THEN 1 END) as avatar_count,
          COUNT(CASE WHEN usage_type = 'moment' THEN 1 END) as moment_count,
          COUNT(CASE WHEN usage_type = 'chat' THEN 1 END) as chat_count,
          COUNT(CASE WHEN usage_type = 'document' THEN 1 END) as document_count
        FROM file_uploads
        ${whereClause}
      `, params);

      return {
        success: true,
        stats: stats[0]
      };

    } catch (error) {
      console.error('❌ 获取文件统计失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = FileUploadService;
