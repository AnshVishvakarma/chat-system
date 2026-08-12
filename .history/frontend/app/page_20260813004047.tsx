'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerUser } from '@/utils/api'
import { initializeSocket } from '@/utils/socket'
import { MessageSquare, Sparkles, ArrowRight, Building2, Users , Send } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !companyName.trim()) {
      setError('Please fill in all fields')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const userData = await registerUser(username.trim(), companyName.trim())
      initializeSocket(userData)
      localStorage.setItem('chatUser', JSON.stringify(userData))
      router.push('/chat')
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-300 rounded-full blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-300 rounded-full blur-3xl opacity-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="card w-full max-w-md relative animate-bounce-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl mb-5 shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl animate-pulse"></div>
            <MessageSquare className="w-10 h-10 text-indigo-600 relative z-10" />
          </div>
          <h1 className="text-4xl font-bold gradient-text">Company Chat</h1>
          <p className="text-gray-500 mt-2">Connect with your team in real-time</p>
        </div>
        
        {/* Features */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5" />
            Real-time
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-xs font-medium border border-purple-100">
            <Building2 className="w-3.5 h-3.5" />
            Company Wise
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-full text-xs font-medium border border-pink-100">
            <Users className="w-3.5 h-3.5" />
            Team Chat
          </span>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              👤 Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="input-primary"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              🏢 Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
              className="input-primary"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Users with same company chat together
            </p>
          </div>
          
          {error && (
            <div className="p-3.5 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-200 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="btn-primary w-full group flex items-center justify-center gap-2 text-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Joining...
              </>
            ) : (
              <>
                Join Chat
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 pt-5 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            💡 Same company = Same chat room • Different company = Different room
          </p>
        </div>
      </div>
    </div>
  )
}