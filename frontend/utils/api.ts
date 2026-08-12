
import axios from 'axios'

// ✅ USE THIS EXACT URL
const BACKEND_URL = 'https://chat-system-avx4.onrender.com'
const API_BASE = `${BACKEND_URL}/api`

export interface User {
  user_id: number
  username: string
  company_name: string
  room_id: string
}

export const registerUser = async (username: string, company_name: string): Promise<User> => {
  try {
    console.log('📤 Registering to:', API_BASE)
    const response = await axios.post(`${API_BASE}/register`, {
      username,
      company_name,
    })
    return response.data
  } catch (error: any) {
    console.error('❌ Registration error:', error.response?.data || error.message)
    throw new Error('Registration failed')
  }
}

export const getMessages = async (company_name: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_BASE}/messages/${company_name}`)
    return response.data
  } catch {
    return []
  }
}

export const getOnlineUsers = async (company_name: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_BASE}/online/${company_name}`)
    return response.data
  } catch {
    return []
  }
}
