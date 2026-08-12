
import io from 'socket.io-client'

let socket: any = null

interface UserData {
  user_id: number
  username: string
  company_name: string
  room_id: string
}

export const initializeSocket = (userData: UserData): any => {
  // ✅ USE THIS EXACT URL - Your backend URL
  const BACKEND_URL = 'https://chat-system-avx4.onrender.com'
  
  console.log('🔌 Initializing socket with URL:', BACKEND_URL)
  
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],  // Polling fallback
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
  }

  socket.on('connect', () => {
    console.log('✅ Socket connected!')
  })

  socket.on('connect_error', (error: any) => {
    console.error('❌ Socket connection error:', error)
  })

  socket.emit('join_room', {
    user_id: userData.user_id,
    username: userData.username,
    company_name: userData.company_name,
  })

  return socket
}

export const getSocket = (): any => {
  if (!socket) {
    throw new Error('Socket not initialized')
  }
  return socket
}

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
