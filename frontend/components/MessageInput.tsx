'use client'

import { useState, useRef } from 'react'
import { getSocket } from '@/utils/socket'
import { Send, Loader2 } from 'lucide-react'

interface MessageInputProps {
  user: {
    user_id: number
    username: string
    company_name: string
  }
}

export default function MessageInput({ user }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    const text = message.trim()
    if (!text || isSending) return

    setIsSending(true)
    const socket = getSocket()
    
    socket.emit('send_message', {
      company_name: user.company_name,
      sender_id: user.user_id,
      username: user.username,
      text: text,
    })
    
    setMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setIsSending(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-gray-200 
                     focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 
                     outline-none transition-all duration-200 resize-none
                     bg-white/80 backdrop-blur-sm
                     min-h-[52px] max-h-[120px]"
          rows={1}
          disabled={isSending}
        />
      </div>
      
      <button
        onClick={handleSend}
        disabled={!message.trim() || isSending}
        className="btn-primary flex-shrink-0 h-[52px] w-[52px] flex items-center justify-center rounded-2xl p-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  )
}