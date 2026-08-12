'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSocket, disconnectSocket } from '@/utils/socket'
import { getMessages, getOnlineUsers, User, Message } from '@/utils/api'
import { Building2, Users, Wifi, WifiOff, LogOut, Loader2, Send } from 'lucide-react'
import MessageList from '@/components/MessageList'
import MessageInput from '@/components/MessageInput'

export default function Chat() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const userData = localStorage.getItem('chatUser')
    if (!userData) {
      router.push('/')
      return
    }
    setUser(JSON.parse(userData))
  }, [router])

  useEffect(() => {
    if (!user) return

    const socket = getSocket()
    setIsConnected(socket.connected)

    const loadData = async () => {
      try {
        const [msgs, users] = await Promise.all([
          getMessages(user.company_name),
          getOnlineUsers(user.company_name)
        ])
        setMessages(msgs)
        setOnlineUsers(users)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))
    socket.on('receive_message', (message: Message) => {
      setMessages(prev => [...prev, message])
    })
    socket.on('user_joined', (data: User) => {
      setOnlineUsers(prev => [...prev, data])
    })
    socket.on('user_left', (data: { user_id: number }) => {
      setOnlineUsers(prev => prev.filter(u => u.user_id !== data.user_id))
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('receive_message')
      socket.off('user_joined')
      socket.off('user_left')
      disconnectSocket()
    }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/30 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">{user.company_name}</h1>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`flex items-center gap-1 ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
                    {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Users className="w-3 h-3" />
                    {onlineUsers.length} online
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
              <span className="text-sm font-medium text-gray-700">👤 {user.username}</span>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('chatUser')
                router.push('/')
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200 border border-transparent hover:border-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <div className="card h-[calc(100vh-200px)] flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            <MessageList messages={messages} currentUserId={user.user_id} />
            <div ref={messagesEndRef} />
          </div>

          {/* Online Users Bar */}
          <div className="border-t border-gray-200/50 px-4 py-3 bg-white/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="font-medium">{onlineUsers.length}</span>
                <span className="text-gray-400">online</span>
              </span>
              <span className="text-gray-300">|</span>
              <div className="flex gap-1.5 flex-wrap">
                {onlineUsers.slice(0, 8).map((u) => (
                  <span 
                    key={u.user_id} 
                    className="bg-indigo-50 px-2.5 py-0.5 rounded-full text-xs text-indigo-700 font-medium border border-indigo-100"
                  >
                    {u.username}
                  </span>
                ))}
                {onlineUsers.length > 8 && (
                  <span className="text-xs text-gray-400 font-medium">
                    +{onlineUsers.length - 8} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200/50 p-4 bg-white/30 backdrop-blur-sm">
            <MessageInput user={user} />
          </div>
        </div>
      </div>
    </div>
  )
}