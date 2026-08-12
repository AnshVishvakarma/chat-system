
import io from 'socket.io-client'

let socket: any = null

interface UserData {
  user_id: number
  username: string
  company_name: string
  room_id: string
}

export const initializeSocket = (userData: UserData): any => {
  // ✅ CORRECT BACKEND URL
  const BACKEND_URL = 'https://chat-system-avx4.onrender.com'
  
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      forceNew: true,
    })
    console.log('🔌 Socket connecting to:', BACKEND_URL)
  }

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
