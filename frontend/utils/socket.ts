import io from 'socket.io-client'
import type { Socket } from 'socket.io-client'

let socket: Socket | null = null

interface UserData {
  user_id: number
  username: string
  company_name: string
  room_id: string
}

export const initializeSocket = (userData: UserData): Socket => {
  if (!socket) {
    socket = io('http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }
  
  socket.emit('join_room', {
    user_id: userData.user_id,
    username: userData.username,
    company_name: userData.company_name,
  })
  
  return socket
}

export const getSocket = (): Socket => {
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