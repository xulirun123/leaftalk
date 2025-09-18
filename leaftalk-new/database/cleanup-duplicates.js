/**
 * 数据库结构文件清理脚本
 * 清理重复的数据库结构文件，保留最新和最重要的版本
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// 获取文件MD5哈希
function getFileHash(filePath) {
    try {
        const content = fs.readFileSync(filePath)
        return crypto.createHash('md5').update(content).digest('hex')
    } catch (error) {
        return null
    }
}

// 获取文件大小
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath)
        return stats.size
    } catch (error) {
        return 0
    }
}

// 扫描目录中的SQL文件
function scanSQLFiles(dir) {
    const files = []
    
    function scanDir(currentDir) {
        try {
            const items = fs.readdirSync(currentDir)
            
            for (const item of items) {
                const fullPath = path.join(currentDir, item)
                const stats = fs.statSync(fullPath)
                
                if (stats.isDirectory()) {
                    scanDir(fullPath)
                } else if (item.endsWith('.sql')) {
                    const relativePath = path.relative(dir, fullPath)
                    files.push({
                        name: item,
                        path: fullPath,
                        relativePath: relativePath,
                        size: stats.size,
                        mtime: stats.mtime,
                        hash: getFileHash(fullPath)
                    })
                }
            }
        } catch (error) {
            console.log(`⚠️ 无法扫描目录 ${currentDir}: ${error.message}`)
        }
    }
    
    scanDir(dir)
    return files
}

// 查找重复文件
function findDuplicates(files) {
    const hashGroups = {}
    const nameGroups = {}
    
    // 按哈希分组（完全相同的文件）
    for (const file of files) {
        if (file.hash) {
            if (!hashGroups[file.hash]) {
                hashGroups[file.hash] = []
            }
            hashGroups[file.hash].push(file)
        }
    }
    
    // 按文件名分组（可能相似的文件）
    for (const file of files) {
        const baseName = file.name.toLowerCase()
        if (!nameGroups[baseName]) {
            nameGroups[baseName] = []
        }
        nameGroups[baseName].push(file)
    }
    
    return { hashGroups, nameGroups }
}

// 主清理函数
function cleanupDuplicates() {
    const databaseDir = path.join(__dirname)
    console.log(`🔍 扫描数据库目录: ${databaseDir}`)
    
    // 扫描所有SQL文件
    const files = scanSQLFiles(databaseDir)
    console.log(`📁 找到 ${files.length} 个SQL文件`)
    
    // 查找重复文件
    const { hashGroups, nameGroups } = findDuplicates(files)
    
    // 报告完全相同的文件
    console.log('\n🔍 完全相同的文件（相同哈希）:')
    let duplicateCount = 0
    let filesToDelete = []
    
    for (const [hash, group] of Object.entries(hashGroups)) {
        if (group.length > 1) {
            duplicateCount += group.length - 1
            console.log(`\n📋 哈希 ${hash.substring(0, 8)}... (${group.length} 个文件):`)
            
            // 按优先级排序：core > schemas > 其他 > archived
            group.sort((a, b) => {
                const getPriority = (file) => {
                    if (file.relativePath.includes('core/')) return 1
                    if (file.relativePath.includes('schemas/')) return 2
                    if (file.relativePath.includes('archived/')) return 5
                    if (file.relativePath.includes('backups/')) return 6
                    return 3
                }
                
                const priorityA = getPriority(a)
                const priorityB = getPriority(b)
                
                if (priorityA !== priorityB) {
                    return priorityA - priorityB
                }
                
                // 相同优先级，保留最新的
                return b.mtime - a.mtime
            })
            
            // 保留第一个（优先级最高的），删除其他
            const keepFile = group[0]
            const deleteFiles = group.slice(1)
            
            console.log(`   ✅ 保留: ${keepFile.relativePath}`)
            for (const file of deleteFiles) {
                console.log(`   🗑️ 删除: ${file.relativePath}`)
                filesToDelete.push(file)
            }
        }
    }
    
    // 报告相似名称的文件
    console.log('\n🔍 相似名称的文件:')
    for (const [name, group] of Object.entries(nameGroups)) {
        if (group.length > 1) {
            // 排除已经在哈希重复中处理的文件
            const uniqueHashes = new Set(group.map(f => f.hash))
            if (uniqueHashes.size > 1) {
                console.log(`\n📋 文件名 "${name}" (${group.length} 个版本):`)
                for (const file of group) {
                    console.log(`   📄 ${file.relativePath} (${file.size} bytes, ${file.mtime.toISOString().split('T')[0]})`)
                }
            }
        }
    }
    
    // 执行删除
    if (filesToDelete.length > 0) {
        console.log(`\n🗑️ 准备删除 ${filesToDelete.length} 个重复文件...`)
        
        for (const file of filesToDelete) {
            try {
                fs.unlinkSync(file.path)
                console.log(`✅ 已删除: ${file.relativePath}`)
            } catch (error) {
                console.log(`❌ 删除失败: ${file.relativePath} - ${error.message}`)
            }
        }
    }
    
    // 清理空目录
    console.log('\n🧹 清理空目录...')
    cleanupEmptyDirs(databaseDir)
    
    // 生成清理报告
    console.log('\n📊 清理报告:')
    console.log(`   📁 扫描文件: ${files.length}`)
    console.log(`   🗑️ 删除重复: ${filesToDelete.length}`)
    console.log(`   💾 保留文件: ${files.length - filesToDelete.length}`)
    
    // 建议的目录结构
    console.log('\n📋 建议的目录结构:')
    console.log('   📁 core/           - 核心schema文件')
    console.log('   📁 migrations/     - 数据库迁移文件')
    console.log('   📁 features/       - 功能模块SQL')
    console.log('   📁 archived/       - 归档的旧文件')
    console.log('   📁 backups/        - 备份文件')
}

// 清理空目录
function cleanupEmptyDirs(dir) {
    try {
        const items = fs.readdirSync(dir)
        
        for (const item of items) {
            const fullPath = path.join(dir, item)
            const stats = fs.statSync(fullPath)
            
            if (stats.isDirectory()) {
                cleanupEmptyDirs(fullPath)
                
                // 检查目录是否为空
                try {
                    const subItems = fs.readdirSync(fullPath)
                    if (subItems.length === 0) {
                        fs.rmdirSync(fullPath)
                        console.log(`🗑️ 删除空目录: ${path.relative(__dirname, fullPath)}`)
                    }
                } catch (error) {
                    // 目录不为空或无法删除
                }
            }
        }
    } catch (error) {
        // 忽略错误
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    console.log('🧹 开始清理数据库结构文件重复...')
    cleanupDuplicates()
    console.log('✅ 清理完成！')
}

module.exports = { cleanupDuplicates }
