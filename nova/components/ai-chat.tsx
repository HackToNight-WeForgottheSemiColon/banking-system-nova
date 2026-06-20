'use client'

import React, { useEffect, useRef, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

interface Message {
  sender: 'user' | 'nova'
  text: string
  timestamp: Date
}

export default function AiChat() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputVal, setInputVal] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Welcome message when opened first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          sender: 'nova',
          text: `Hello ${user?.fullName || 'there'}! I am Nova, your AI personal financial advisor. Ask me anything about your accounts, recent spending, or category budgets.`,
          timestamp: new Date()
        }
      ])
    }
  }, [isOpen, messages.length, user])

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-nova-chat', handleOpen)
    return () => window.removeEventListener('open-nova-chat', handleOpen)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputVal.trim() || loading) return

    const userText = inputVal.trim()
    setInputVal('')
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: userText, timestamp: new Date() }
    ])
    setLoading(true)

    try {
      const res = await apiClient<{ ok: boolean; response: string }>(
        '/ai/chat',
        {
          method: 'POST',
          body: JSON.stringify({ message: userText })
        }
      )

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { sender: 'nova', text: res.response, timestamp: new Date() }
        ])
      }
    } catch (err) {
      console.error('Failed to get AI response:', err)
      setMessages((prev) => [
        ...prev,
        {
          sender: 'nova',
          text: "I'm having trouble connecting to the backend right now. Make sure the API server is running and try again.",
          timestamp: new Date()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Render suggestion chips
  const handleChipClick = (suggestion: string) => {
    setInputVal(suggestion)
  }

  if (!user) return null // Hide chat if not logged in

  return (
    <div className="floating-chat-container">
      {/* Trigger Button */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="chat-bubble-btn">
          <span className="sparkle-icon">✨</span>
          <span className="btn-text">Nova AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <header className="chat-header">
            <div className="advisor-info">
              <span className="sparkle-icon">✨</span>
              <div>
                <h4>Nova Assistant</h4>
                <p>AI Financial Advisor</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="close-btn"
              aria-label="close"
            >
              &times;
            </button>
          </header>

          <div className="messages-area">
            {messages.map((m, idx) => (
              <div key={idx} className={`message-wrapper ${m.sender}`}>
                <div className="message-bubble">{m.text}</div>
                <span className="message-time">
                  {m.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}

            {loading && (
              <div className="message-wrapper nova">
                <div className="message-bubble typing-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <footer className="chat-footer">
            {messages.length === 1 && !loading && (
              <div className="suggestions-chips">
                <button
                  onClick={() => handleChipClick('What are my bank balances?')}
                  className="chip"
                >
                  Check Balances
                </button>
                <button
                  onClick={() => handleChipClick('Show my category spending')}
                  className="chip"
                >
                  Spending Summary
                </button>
                <button
                  onClick={() => handleChipClick('Did I exceed any budgets?')}
                  className="chip"
                >
                  Budget Check
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className="input-form">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask Nova a question..."
                className="chat-input"
                disabled={loading}
              />
              <button
                type="submit"
                className="send-btn"
                disabled={loading || !inputVal.trim()}
              >
                SEND
              </button>
            </form>
          </footer>
        </div>
      )}

      <style jsx>{`
        .floating-chat-container {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 1000;
          font-family: var(--font-bai, 'Bai Jamjuree'), system-ui, -apple-system, sans-serif;
        }

        .chat-bubble-btn {
          width: 140px;
          height: 52px;
          border-radius: 26px;
          background: linear-gradient(135deg, #450043, #9a5c97);
          color: white;
          border: none;
          box-shadow: 0 10px 25px rgba(69, 0, 67, 0.35);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 700;
          font-size: 0.95rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .chat-bubble-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(69, 0, 67, 0.45);
        }

        .sparkle-icon {
          font-size: 1.1rem;
        }

        .chat-window {
          width: 380px;
          height: 500px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.4);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .chat-header {
          background: linear-gradient(135deg, #450043, #9a5c97);
          color: white;
          padding: 1rem 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .advisor-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .advisor-info h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
        }

        .advisor-info p {
          margin: 0;
          font-size: 0.75rem;
          opacity: 0.85;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          opacity: 0.8;
        }

        .close-btn:hover {
          opacity: 1;
        }

        .messages-area {
          flex: 1;
          padding: 1.25rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message-wrapper {
          display: flex;
          flex-direction: column;
          max-width: 80%;
        }

        .message-wrapper.nova {
          align-self: flex-start;
          align-items: flex-start;
        }

        .message-wrapper.user {
          align-self: flex-end;
          align-items: flex-end;
        }

        .message-bubble {
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 0.88rem;
          line-height: 1.4;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .nova .message-bubble {
          background: white;
          color: #212529;
          border-bottom-left-radius: 2px;
          border: 1px solid rgba(0,0,0,0.05);
        }

        .user .message-bubble {
          background: #450043;
          color: white;
          border-bottom-right-radius: 2px;
        }

        .message-time {
          font-size: 0.7rem;
          color: #868e96;
          margin-top: 4px;
        }

        .typing-bubble {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
        }

        .typing-bubble .dot {
          width: 6px;
          height: 6px;
          background-color: #868e96;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .typing-bubble .dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-bubble .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }

        .chat-footer {
          padding: 1rem;
          background: white;
          border-top: 1px solid #f1f3f5;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .suggestions-chips {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .suggestions-chips::-webkit-scrollbar {
          display: none;
        }

        .chip {
          background: #f1f3f5;
          border: 1px solid #e9ecef;
          color: #495057;
          font-size: 0.75rem;
          padding: 6px 12px;
          border-radius: 14px;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
        }

        .chip:hover {
          background: #e9ecef;
          color: #450043;
        }

        .input-form {
          display: flex;
          gap: 8px;
        }

        .chat-input {
          flex: 1;
          height: 40px;
          border: 1px solid #ced4da;
          border-radius: 20px;
          padding: 0 14px;
          font-size: 0.88rem;
          color: #000000;
          outline: none;
        }

        .chat-input:focus {
          border-color: #9a5c97;
        }

        .send-btn {
          height: 40px;
          border: none;
          background: #450043;
          color: white;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 0 16px;
          border-radius: 20px;
          cursor: pointer;
        }

        .send-btn:hover {
          background: #60005d;
        }

        .send-btn:disabled {
          background: #e9ecef;
          color: #adb5bd;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .chat-window {
            width: calc(100vw - 2rem);
            height: 420px;
          }
          .floating-chat-container {
            bottom: 1rem;
            right: 1rem;
          }
        }
      `}</style>
    </div>
  )
}
