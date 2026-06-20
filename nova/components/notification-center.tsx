'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Bell } from '@/components/Icons'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

interface NotificationItem {
  id: number
  userId: number
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export default function NotificationCenter() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [toast, setToast] = useState<{ title: string; message: string } | null>(
    null
  )
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return

    // 1. Fetch existing notifications
    fetchNotifications()

    // 2. Establish SSE Connection
    const token = localStorage.getItem('session_token')
    if (!token) return

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const eventSource = new EventSource(
      `${apiBase}/notifications/stream?token=${encodeURIComponent(token)}`
    )

    eventSource.onmessage = (event) => {
      try {
        const newNotification: NotificationItem = JSON.parse(event.data)

        // Append to list
        setNotifications((prev) => [newNotification, ...prev])

        // Display premium toast alert
        setToast({
          title: newNotification.title,
          message: newNotification.message
        })

        // Auto-hide toast after 5 seconds
        setTimeout(() => {
          setToast(null)
        }, 5000)
      } catch (err) {
        console.error('Failed to parse incoming notification:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.warn(
        'SSE notification stream closed or lost connection. Retrying...',
        err
      )
    }

    // 3. Handle click-outside close
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      eventSource.close()
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const res = await apiClient<{ ok: boolean; data: NotificationItem[] }>(
        '/notifications'
      )
      if (res.ok) {
        setNotifications(res.data)
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      const res = await apiClient<{ ok: boolean; data: NotificationItem }>(
        `/notifications/${id}/read`,
        {
          method: 'PATCH'
        }
      )
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read)
    await Promise.all(unread.map((n) => handleMarkAsRead(n.id)))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (!user) return null

  return (
    <div className="notification-center-container" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bell-trigger ${isOpen ? 'active' : ''}`}
        aria-label="notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="unread-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="notifications-dropdown">
          <header className="dropdown-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="mark-all-btn">
                Mark all read
              </button>
            )}
          </header>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-notifications">
                <p>No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const dateStr = new Date(n.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })

                return (
                  <div
                    key={n.id}
                    className={`notification-item ${n.read ? 'read' : 'unread'}`}
                    onClick={() => !n.read && handleMarkAsRead(n.id)}
                    style={{ cursor: n.read ? 'default' : 'pointer' }}
                  >
                    <div className="item-header">
                      <span className={`type-dot ${n.type.toLowerCase()}`} />
                      <span className="title">{n.title}</span>
                      <span className="date">{dateStr}</span>
                    </div>
                    <p className="message">{n.message}</p>
                    {!n.read && <span className="unread-indicator" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Toast Alert Banner */}
      {toast && (
        <div className="notification-toast">
          <div className="toast-header">
            <span className="sparkle-icon">🔔</span>
            <strong>{toast.title}</strong>
            <button onClick={() => setToast(null)} className="close-toast-btn">
              &times;
            </button>
          </div>
          <p className="toast-message">{toast.message}</p>
        </div>
      )}

      <style jsx>{`
        .notification-center-container {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .bell-trigger {
          background: transparent;
          border: none;
          color: #4b5563;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          cursor: pointer;
          position: relative;
          transition: background-color 0.2s;
        }

        .bell-trigger:hover, .bell-trigger.active {
          background: rgba(0, 0, 0, 0.04);
          color: #450043;
        }

        .unread-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          background-color: #ff6b6b;
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          height: 16px;
          min-width: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid #fff;
        }

        .notifications-dropdown {
          position: absolute;
          top: 50px;
          right: 0;
          width: 320px;
          max-height: 400px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0,0,0,0.06);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          z-index: 999;
          animation: dropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes dropIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .dropdown-header {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f3f5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .dropdown-header h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: #450043;
        }

        .mark-all-btn {
          background: transparent;
          border: none;
          color: #9a5c97;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }

        .mark-all-btn:hover {
          color: #450043;
          text-decoration: underline;
        }

        .notifications-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .empty-notifications {
          padding: 2.5rem 1rem;
          text-align: center;
          color: #868e96;
          font-size: 0.85rem;
        }

        .notification-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f8f9fa;
          position: relative;
          transition: background-color 0.2s;
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-item.unread {
          background-color: #fcf9fc;
        }

        .notification-item.unread:hover {
          background-color: #f7f0f7;
        }

        .notification-item.read:hover {
          background-color: #f8f9fa;
        }

        .item-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .type-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .type-dot.transfer { background-color: #4dadf7; }
        .type-dot.budget_exceeded { background-color: #fcc419; }
        .type-dot.anomaly { background-color: #ff6b6b; }
        .type-dot.system { background-color: #868e96; }

        .title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #212529;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .date {
          font-size: 0.7rem;
          color: #adb5bd;
          margin-left: auto;
        }

        .message {
          margin: 0;
          font-size: 0.78rem;
          line-height: 1.35;
          color: #495057;
        }

        .unread-indicator {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #9a5c97;
        }

        /* Toast Alert Banner */
        .notification-toast {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          width: 320px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
          border: 1px solid rgba(0,0,0,0.06);
          padding: 12px 16px;
          z-index: 2000;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          color: black;
        }

        @keyframes slideIn {
          from { transform: translateX(50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .toast-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          font-size: 0.85rem;
        }

        .toast-header strong {
          color: #450043;
        }

        .close-toast-btn {
          background: transparent;
          border: none;
          color: #adb5bd;
          font-size: 1.1rem;
          cursor: pointer;
          margin-left: auto;
          line-height: 1;
        }

        .close-toast-btn:hover {
          color: #495057;
        }

        .toast-message {
          margin: 0;
          font-size: 0.8rem;
          color: #4b5563;
          line-height: 1.4;
        }
      `}</style>
    </div>
  )
}
