const { Config } = require('../models')

let configCache = {}
let lastFetchTime = 0
const CACHE_TTL = 60000 // 1分钟缓存

// 从数据库获取所有配置
const getConfigs = async (forceReload = false) => {
  const now = Date.now()
  if (Object.keys(configCache).length > 0 && !forceReload && (now - lastFetchTime) < CACHE_TTL) {
    return configCache
  }
  
  const configs = await Config.findAll()
  const configMap = {}
  configs.forEach(c => {
    try {
      configMap[c.key] = c.type === 'json' ? JSON.parse(c.value) : c.value
    } catch {
      configMap[c.key] = c.value
    }
  })
  configCache = configMap
  lastFetchTime = now
  return configMap
}

// 获取单个配置
const getConfig = async (key, defaultValue = null) => {
  const configs = await getConfigs()
  return configs[key] !== undefined ? configs[key] : defaultValue
}

// 清除缓存
const clearCache = () => {
  configCache = {}
  lastFetchTime = 0
}

module.exports = { getConfigs, getConfig, clearCache }
