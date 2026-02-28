import { useState, useRef, useEffect } from 'react'
import { chatWithAI, isAIConfigured } from '../services/groqAi'
import { Send, MessageCircle, Sparkles, Bot, User, Trash2, Lightbulb, Zap, Wifi, WifiOff } from 'lucide-react'

const suggestedQuestions = [
  "Tell me about Morocco",
  "Most sustainable destinations?",
  "Cultural heritage sites to visit",
  "Best budget-friendly trips",
  "How can I travel more sustainably?",
  "Hidden gems in Europe",
  "Compare train vs flight carbon impact",
  "When is the best time to visit Japan?",
]

const INITIAL_MESSAGE = {
  role: 'ai',
  content: `Hello! I'm your WanderWise AI travel companion 🌍

I can help you with:
• **Destination recommendations** — Ask about any country or city
• **Sustainability tips** — How to travel greener
• **Cultural heritage** — Discover world treasures
• **Budget planning** — Best value sustainable trips
• **Weather & timing** — When to visit

What destination or topic interests you?`,
  timestamp: new Date(),
}

export default function Assistant() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const aiConfigured = isAIConfigured()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (text) => {
    const messageText = text || input.trim()
    if (!messageText || isTyping) return

    // Add user message
    const userMsg = { role: 'user', content: messageText, timestamp: new Date() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsTyping(true)

    try {
      // Build conversation history for AI (skip initial greeting for cleaner context)
      const history = updatedMessages
        .filter((m) => m !== INITIAL_MESSAGE)
        .map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))

      const aiResponse = await chatWithAI(history)
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: aiResponse, timestamp: new Date() },
      ])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Sorry, I encountered an error. Please try again!', timestamp: new Date() },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE])
  }

  const formatContent = (content) => {
    // Simple markdown-like formatting
    return content.split('\n').map((line, i) => {
      // Bold
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Bullet points
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={i} className="flex gap-2 ml-2">
            <span>•</span>
            <span dangerouslySetInnerHTML={{ __html: line.slice(2) }} />
          </div>
        )
      }
      // Numbered items
      const numMatch = line.match(/^(\d+)\.\s(.+)/)
      if (numMatch) {
        return (
          <div key={i} className="flex gap-2 ml-2">
            <span className="font-bold text-emerald-600">{numMatch[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: numMatch[2] }} />
          </div>
        )
      }
      if (line.trim() === '') return <br key={i} />
      return <p key={i} dangerouslySetInnerHTML={{ __html: line }} />
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-4">
          <MessageCircle size={16} />
          AI Travel Assistant
        </div>
        <h1 className="text-4xl font-bold mb-4">
          Chat with <span className="gradient-text">WanderWise AI</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Your personal AI travel companion. Ask about destinations, sustainability,
          cultural heritage, or get personalized trip recommendations.
        </p>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold">WanderWise AI</h3>
              <div className="flex items-center gap-2 text-xs text-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                Online
                <span className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-medium flex items-center gap-1">
                  {aiConfigured ? <><Zap size={9} /> Groq AI</> : <><Sparkles size={9} /> Local Mode</>}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            title="Clear chat"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="h-[450px] overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 animate-fade-in-up ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'ai'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                    : 'bg-slate-700 text-white'
                }`}
              >
                {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'chat-bubble-user'
                    : 'chat-bubble-ai'
                }`}
              >
                {msg.role === 'ai' ? formatContent(msg.content) : msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className="chat-bubble-ai px-4 py-3 flex items-center gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        <div className="px-6 py-3 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className="text-amber-500" />
            <span className="text-xs text-slate-400">Suggested questions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about destinations, sustainability, heritage..."
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              disabled={isTyping}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
