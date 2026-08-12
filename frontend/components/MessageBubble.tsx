'use client'

import { Message } from '@/utils/api'
import { User } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
  isCurrentUser: boolean
  showAvatar?: boolean
}

export default function MessageBubble({ 
  message, 
  isCurrentUser, 
  showAvatar = true 
}: MessageBubbleProps) {
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isCurrentUser && showAvatar && (
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
          <User className="w-4 h-4 text-indigo-600" />
        </div>
      )}
      {!isCurrentUser && !showAvatar && (
        <div className="w-8 flex-shrink-0"></div>
      )}

      <div className={`${isCurrentUser ? 'message-sent' : 'message-received'} animate-slide-up`}>
        {!isCurrentUser && (
          <div className="text-xs font-semibold text-indigo-600 mb-1">
            {message.sender_username}
          </div>
        )}
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.message_text}
        </div>
        <div className={`text-[10px] mt-1.5 font-medium ${isCurrentUser ? 'text-indigo-200' : 'text-gray-400'}`}>
          {time}
        </div>
      </div>

      {isCurrentUser && (
        <div className="w-8 flex-shrink-0"></div>
      )}
    </div>
  )
}