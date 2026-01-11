import axios from 'axios'

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000,
  withCredentials: true
})

apiClient.interceptors.request.use(
  (config) => {
    const userId = localStorage.getItem('userId')
    if (userId) {
      config.params = { ...config.params, userId }
    }
    const swSettings = localStorage.getItem('swSettings')
    if (swSettings) {
      try {
        const settings = JSON.parse(swSettings)
        const providerMapping = {
          'glm-4.7': 'glm-primary',
          'deepseek-r1': 'deepseek',
          'qwen': 'qwen'
        }
        if (config.method === 'post' && config.data) {
          config.data.provider = config.data.provider || providerMapping[settings.primaryModel] || 'glm-primary'
          config.data.openRouterKey = config.data.openRouterKey || settings.openRouterKey || ''
        }
      } catch (e) {
        console.error('Error parsing swSettings:', e)
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error.response?.data || { error: error.message })
  }
)

export default apiClient