
import axios from 'axios'

const API_BASE = 'https://chat-system-avx4.onrender.com/api'

export interface User {
  user_id: number
  username: string
  company_name: string
  room_id: string
}

export interface Message {
  id: number
  sender_id: number
  sender_username: string
  message_text: string
  timestamp: string
}

export const registerUser = async (username: string, company_name: string): Promise<User> => {
  const response = await axios.post(`${API_BASE}/register`, {
    username,
    company_name,
  })
  return response.data
}

export const getMessages = async (company_name: string): Promise<Message[]> => {
  try {
    const response = await axios.get(`${API_BASE}/messages/${company_name}`)
    return response.data
  } catch {
    return []
  }
}

export const getOnlineUsers = async (company_name: string): Promise<User[]> => {
  try {
    const response = await axios.get(`${API_BASE}/online/${company_name}`)
    return response.data
  } catch {
    return []
  }
}
