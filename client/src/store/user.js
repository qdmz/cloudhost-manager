import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfo, login as apiLogin, register as apiRegister, logout as apiLogout, updateUser } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  const isLoading = ref(false)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')
  const isVerified = computed(() => userInfo.value?.email_verified && userInfo.value?.identity_verified)

  async function login(username, password) {
    isLoading.value = true
    try {
      const res = await apiLogin({ username, password })
      if (res.code === 200) {
        token.value = res.data.token
        localStorage.setItem('token', res.data.token)
        await fetchUserInfo()
        return { success: true, message: res.message }
      }
      return { success: false, message: res.message }
    } catch (error) {
      return { success: false, message: error.message || '登录失败' }
    } finally {
      isLoading.value = false
    }
  }

  async function register(data) {
    isLoading.value = true
    try {
      const res = await apiRegister(data)
      if (res.code === 200) {
        return { success: true, message: res.message }
      }
      return { success: false, message: res.message }
    } catch (error) {
      return { success: false, message: error.message || '注册失败' }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUserInfo() {
    if (!token.value) return
    try {
      const res = await getUserInfo()
      if (res.code === 200) {
        userInfo.value = res.data
      }
    } catch (error) {
      console.error('获取用户信息失败', error)
      if (error.response?.status === 401) {
        logout()
      }
    }
  }

  async function updateProfile(data) {
    isLoading.value = true
    try {
      const res = await updateUser(data)
      if (res.code === 200) {
        userInfo.value = { ...userInfo.value, ...data }
        return { success: true, message: res.message }
      }
      return { success: false, message: res.message }
    } catch (error) {
      return { success: false, message: error.message || '更新失败' }
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    apiLogout()
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  if (token.value) {
    fetchUserInfo()
  }

  return {
    token,
    userInfo,
    isLoading,
    isLoggedIn,
    isAdmin,
    isVerified,
    login,
    register,
    fetchUserInfo,
    updateProfile,
    logout
  }
})
