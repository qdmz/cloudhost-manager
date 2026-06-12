/**
 * 数据备份恢复服务
 */

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const mysql = require('mysql2/promise')
const archiver = require('archiver')
const decompress = require('decompress')

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups')
    this.maxBackups = 10 // 保留的最大备份数量
    this.ensureBackupDir()
  }

  // 确保备份目录存在
  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  // 获取数据库配置
  getDBConfig() {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'cloudhost'
    }
  }

  // 生成备份文件名
  generateBackupName() {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
    return `cloudhost_backup_${timestamp}`
  }

  // 创建数据库备份
  async createDatabaseBackup(backupName) {
    const dbConfig = this.getDBConfig()
    const sqlFile = path.join(this.backupDir, `${backupName}.sql`)
    
    // 构建 mysqldump 命令
    let command = `mysqldump`
    
    if (dbConfig.host !== 'localhost') {
      command += ` -h ${dbConfig.host}`
    }
    
    command += ` -P ${dbConfig.port}`
    command += ` -u ${dbConfig.user}`
    
    if (dbConfig.password) {
      command += ` -p'${dbConfig.password}'`
    }
    
    command += ` --single-transaction --quick --lock-tables=false`
    command += ` ${dbConfig.database}`
    command += ` > "${sqlFile}"`
    
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 300000 }, async (error, stdout, stderr) => {
        if (error) {
          console.error('Database backup error:', error)
          console.error('stderr:', stderr)
          
          // 尝试使用 mysql 命令作为备选方案
          try {
            const conn = await mysql.createConnection({
              host: dbConfig.host,
              port: dbConfig.port,
              user: dbConfig.user,
              password: dbConfig.password,
              multipleStatements: true
            })
            
            const [rows] = await conn.query(`SELECT * FROM ${dbConfig.database}`)
            const createTableSQLs = []
            
            // 获取建表语句
            const [tables] = await conn.query(`SHOW TABLES`)
            for (const table of tables) {
              const tableName = Object.values(table)[0]
              const [createResult] = await conn.query(`SHOW CREATE TABLE ${tableName}`)
              createTableSQLs.push(createResult[0]['Create Table'] + ';')
            }
            
            let sqlContent = createTableSQLs.join('\n\n')
            sqlContent += '\n\n-- Data\n\n'
            
            // 使用 JSON 格式导出数据
            const data = JSON.stringify(rows, null, 2)
            sqlContent += `-- JSON format backup\n`
            sqlContent += `INSERT INTO backup_data VALUES ('${Buffer.from(data).toString('base64')}');`
            
            fs.writeFileSync(sqlFile, sqlContent)
            await conn.end()
            
            resolve(sqlFile)
          } catch (fallbackError) {
            reject(new Error(`数据库备份失败: ${error.message}`))
          }
          return
        }
        
        resolve(sqlFile)
      })
    })
  }

  // 创建文件备份
  async createFilesBackup(backupName) {
    const uploadDir = path.join(__dirname, '../../uploads')
    const filesBackupPath = path.join(this.backupDir, `${backupName}_files.zip`)
    
    if (!fs.existsSync(uploadDir)) {
      return null // 没有文件需要备份
    }

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(filesBackupPath)
      const archive = archiver('zip', { zlib: { level: 9 } })

      output.on('close', () => {
        resolve(filesBackupPath)
      })

      archive.on('error', (err) => {
        reject(err)
      })

      archive.pipe(output)
      archive.directory(uploadDir, 'uploads')
      archive.finalize()
    })
  }

  // 创建完整备份
  async createFullBackup() {
    const backupName = this.generateBackupName()
    const backupInfo = {
      name: backupName,
      created_at: new Date().toISOString(),
      type: 'full',
      database: null,
      files: null,
      size: 0
    }

    try {
      // 备份数据库
      console.log('Starting database backup...')
      const dbBackup = await this.createDatabaseBackup(backupName)
      const dbStats = fs.statSync(dbBackup)
      backupInfo.database = {
        path: dbBackup,
        size: dbStats.size
      }
      console.log('Database backup completed:', dbBackup)

      // 备份文件
      console.log('Starting files backup...')
      try {
        const filesBackup = await this.createFilesBackup(backupName)
        if (filesBackup) {
          const filesStats = fs.statSync(filesBackup)
          backupInfo.files = {
            path: filesBackup,
            size: filesStats.size
          }
          console.log('Files backup completed:', filesBackup)
        }
      } catch (filesError) {
        console.warn('Files backup skipped:', filesError.message)
      }

      // 创建备份清单
      backupInfo.size = (backupInfo.database?.size || 0) + (backupInfo.files?.size || 0)
      const infoPath = path.join(this.backupDir, `${backupName}_info.json`)
      fs.writeFileSync(infoPath, JSON.stringify(backupInfo, null, 2))

      // 清理旧备份
      await this.cleanOldBackups()

      console.log('Full backup completed:', backupName)
      return backupInfo

    } catch (error) {
      console.error('Backup failed:', error)
      throw error
    }
  }

  // 清理旧备份
  async cleanOldBackups() {
    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.startsWith('cloudhost_backup_') && f.endsWith('_info.json'))
      .map(f => ({
        name: f,
        path: path.join(this.backupDir, f),
        time: fs.statSync(path.join(this.backupDir, f)).mtime
      }))
      .sort((a, b) => b.time - a.time)

    // 删除超过限制的备份
    if (files.length > this.maxBackups) {
      const toDelete = files.slice(this.maxBackups)
      for (const file of toDelete) {
        try {
          // 读取备份信息
          const info = JSON.parse(fs.readFileSync(file.path, 'utf8'))
          
          // 删除相关文件
          if (info.database?.path && fs.existsSync(info.database.path)) {
            fs.unlinkSync(info.database.path)
          }
          if (info.files?.path && fs.existsSync(info.files.path)) {
            fs.unlinkSync(info.files.path)
          }
          fs.unlinkSync(file.path)
          
          console.log('Deleted old backup:', file.name)
        } catch (err) {
          console.error('Failed to delete backup:', file.name, err)
        }
      }
    }
  }

  // 获取所有备份列表
  async getBackupList() {
    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.startsWith('cloudhost_backup_') && f.endsWith('_info.json'))
      .map(f => {
        const infoPath = path.join(this.backupDir, f)
        const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'))
        return {
          name: info.name,
          created_at: info.created_at,
          type: info.type,
          size: info.size,
          database_size: info.database?.size || 0,
          files_size: info.files?.size || 0,
          info_path: infoPath
        }
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return files
  }

  // 恢复数据库
  async restoreDatabase(backupName) {
    const dbConfig = this.getDBConfig()
    const sqlFile = path.join(this.backupDir, `${backupName}.sql`)

    if (!fs.existsSync(sqlFile)) {
      throw new Error('备份文件不存在')
    }

    // 读取 SQL 文件
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')

    // 检查是否是 JSON 格式备份
    if (sqlContent.includes('INSERT INTO backup_data')) {
      // JSON 格式，需要特殊处理
      throw new Error('JSON 格式备份暂不支持在线恢复，请手动导入')
    }

    // 使用 mysql 命令恢复
    let command = `mysql`
    
    if (dbConfig.host !== 'localhost') {
      command += ` -h ${dbConfig.host}`
    }
    
    command += ` -P ${dbConfig.port}`
    command += ` -u ${dbConfig.user}`
    
    if (dbConfig.password) {
      command += ` -p'${dbConfig.password}'`
    }
    
    command += ` ${dbConfig.database}`
    command += ` < "${sqlFile}"`

    return new Promise((resolve, reject) => {
      exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
        if (error) {
          console.error('Database restore error:', error)
          console.error('stderr:', stderr)
          reject(new Error(`数据库恢复失败: ${error.message}`))
          return
        }
        resolve({ success: true })
      })
    })
  }

  // 恢复文件
  async restoreFiles(backupName) {
    const filesBackup = path.join(this.backupDir, `${backupName}_files.zip`)
    const uploadDir = path.join(__dirname, '../../uploads')

    if (!fs.existsSync(filesBackup)) {
      console.log('No files backup to restore')
      return { success: true, message: '无文件备份' }
    }

    // 备份当前文件
    if (fs.existsSync(uploadDir)) {
      const backupDir = path.join(this.backupDir, `${backupName}_old_files`)
      fs.renameSync(uploadDir, backupDir)
    }

    // 解压备份文件
    try {
      await decompress(filesBackup, path.dirname(uploadDir))
      return { success: true }
    } catch (error) {
      throw new Error(`文件恢复失败: ${error.message}`)
    }
  }

  // 执行完整恢复
  async restoreFullBackup(backupName, options = {}) {
    const { restoreDatabase: restoreDb = true, restoreFiles: restoreFilesBool = false } = options

    try {
      // 读取备份信息
      const infoPath = path.join(this.backupDir, `${backupName}_info.json`)
      if (!fs.existsSync(infoPath)) {
        throw new Error('备份信息文件不存在')
      }

      const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'))

      // 恢复数据库
      if (restoreDb && info.database) {
        console.log('Starting database restore...')
        await this.restoreDatabase(backupName)
        console.log('Database restore completed')
      }

      // 恢复文件
      if (restoreFilesBool && info.files) {
        console.log('Starting files restore...')
        await this.restoreFiles(backupName)
        console.log('Files restore completed')
      }

      return { success: true, message: '恢复完成' }

    } catch (error) {
      console.error('Restore failed:', error)
      throw error
    }
  }

  // 删除备份
  async deleteBackup(backupName) {
    const infoPath = path.join(this.backupDir, `${backupName}_info.json`)
    
    if (!fs.existsSync(infoPath)) {
      throw new Error('备份不存在')
    }

    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'))

    // 删除相关文件
    if (info.database?.path && fs.existsSync(info.database.path)) {
      fs.unlinkSync(info.database.path)
    }
    if (info.files?.path && fs.existsSync(info.files.path)) {
      fs.unlinkSync(info.files.path)
    }
    fs.unlinkSync(infoPath)

    return { success: true, message: '备份已删除' }
  }

  // 下载备份文件
  async downloadBackup(backupName, type = 'database') {
    let filePath
    
    if (type === 'database') {
      filePath = path.join(this.backupDir, `${backupName}.sql`)
    } else {
      filePath = path.join(this.backupDir, `${backupName}_files.zip`)
    }

    if (!fs.existsSync(filePath)) {
      throw new Error('备份文件不存在')
    }

    return {
      path: filePath,
      name: path.basename(filePath),
      size: fs.statSync(filePath).size
    }
  }

  // 获取备份目录大小
  async getBackupDirSize() {
    let totalSize = 0
    
    const files = fs.readdirSync(this.backupDir)
    for (const file of files) {
      const filePath = path.join(this.backupDir, file)
      const stats = fs.statSync(filePath)
      totalSize += stats.size
    }
    
    return totalSize
  }
}

module.exports = new BackupService()
