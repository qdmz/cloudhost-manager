// Shared captcha cache used by both captcha.js and auth.js
const captchaCache = new Map()

const EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

function set(captchaKey, code) {
  captchaCache.set(captchaKey, { code, expiry: Date.now() + EXPIRY_MS })
}

function get(captchaKey) {
  const entry = captchaCache.get(captchaKey)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    captchaCache.delete(captchaKey)
    return null
  }
  return entry
}

function del(captchaKey) {
  captchaCache.delete(captchaKey)
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of captchaCache.entries()) {
    if (now > value.expiry) {
      captchaCache.delete(key)
    }
  }
}, 5 * 60 * 1000)

module.exports = { captchaCache, set, get, del }
