'use client'

import { Message } from '@/utils/api'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  currentUserId: number
}

export default function MessageList({ messages, currentUserId }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mb-4 shadow-lg">
          <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-400">No messages yet</p>
        <p className="text-sm text-gray-400">Be the first to say hello! 👋</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => (
        <MessageBubble 
          key={message.id || index}
          message={message}
          isCurrentUser={message.sender_id === currentUserId}
          showAvatar={index === 0 || messages[index - 1]?.sender_id !== message.sender_id}
        />
      ))}
    </div>
  )
}