'use client'

import React, { useEffect, useRef, useState } from 'react'
import NotificationCenter from '@/components/notification-center'
import Sidebar from '@/components/sidebar'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

interface UserProfileResponse {
  ok: boolean
  message: string
  user: {
    id: number
    username: string
    role: string
    fullName: string
    email: string
    avatarUrl?: string
  }
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [nic, setNic] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '')
      setEmail(user.email || '')
      // Since nic is optional and might be null/undefined, let's fetch profile fresh on mount
      // to populate nic if not loaded in context, or just default to empty.
      // Let's call /auth/me to make sure we have all full details
      async function fetchProfile() {
        try {
          const res = await apiClient<{ ok: boolean; user: any }>('/auth/me')
          if (res.ok && res.user) {
            setFullName(res.user.fullName || '')
            setEmail(res.user.email || '')
            setNic(res.user.nic || '')
            updateUser(res.user)
          }
        } catch (err) {
          console.error('Failed to load profile details:', err)
        }
      }
      fetchProfile()
    }
  }, [user?.id])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setMessage({
        text: 'Only JPEG, PNG, GIF, and WebP images are allowed.',
        type: 'error'
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        text: 'File is too large. Maximum size is 5MB.',
        type: 'error'
      })
      return
    }

    const formData = new FormData()
    formData.append('avatar', file)

    setIsUploading(true)
    setMessage(null)

    try {
      const res = await apiClient<{
        ok: boolean
        avatarUrl: string
        user: any
      }>('/users/avatar', {
        method: 'POST',
        body: formData
      })

      if (res.ok && res.user) {
        updateUser(res.user)
        setMessage({
          text: 'Profile picture updated successfully!',
          type: 'success'
        })
      }
    } catch (err: any) {
      console.error('Failed to upload avatar:', err)
      setMessage({
        text: err?.message || 'Failed to upload profile picture.',
        type: 'error'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName) {
      setMessage({ text: 'Full Name is required.', type: 'error' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const res = await apiClient<UserProfileResponse>('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName,
          email,
          nic
        })
      })

      if (res.ok && res.user) {
        updateUser(res.user)
        setMessage({
          text: 'Profile details saved successfully!',
          type: 'success'
        })
      }
    } catch (err: any) {
      console.error('Failed to save profile:', err)
      setMessage({
        text: err?.message || 'Failed to save profile details.',
        type: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="profile-container dashboard">
      <Sidebar />

      <main className="profile-main content">
        {/* Header */}
        <header className="profile-header content-header">
          <h2 className="profile-title page-title">User Profile</h2>
          <div className="profile-header-actions header-actions">
            <NotificationCenter />
            <div
              className="profile-avatar-top avatar-container"
              onClick={handleAvatarClick}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={user?.avatarUrl || '/person-logo.png'}
                alt="Profile Avatar"
                className="top-avatar-img avatar"
              />
            </div>
          </div>
        </header>

        <section className="profile-content-area">
          <div className="profile-card glass-panel">
            {/* Top Section: Avatar & Basic Meta */}
            <div className="profile-card-header">
              <div className="avatar-upload-container">
                <div className="avatar-glow-ring" onClick={handleAvatarClick}>
                  <img
                    src={user?.avatarUrl || '/person-logo.png'}
                    alt="User Avatar"
                    className="avatar-img-large"
                  />
                  <div className="avatar-hover-overlay">
                    <span className="camera-icon">📷</span>
                    <span className="upload-text">Upload</span>
                  </div>
                  {isUploading && (
                    <div className="avatar-spinner-overlay">
                      <div className="spinner"></div>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="change-avatar-btn"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Change Photo'}
                </button>
              </div>

              <div className="profile-summary">
                <h3 className="profile-user-name">
                  {user?.fullName || 'Nova User'}
                </h3>
                <span className="profile-user-role">
                  {user?.role ? user.role.toUpperCase() : 'CUSTOMER'}
                </span>
                <p className="profile-user-username">
                  @{user?.username || 'username'}
                </p>
              </div>
            </div>

            <hr className="divider" />

            {/* Bottom Section: Edit Details Form */}
            <form onSubmit={handleSave} className="profile-form">
              {message && (
                <div className={`form-message ${message.type}`}>
                  {message.text}
                </div>
              )}

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="username-input">
                    Account Number / Username
                  </label>
                  <input
                    id="username-input"
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="form-input-disabled"
                  />
                  <small className="field-help">
                    This identifier is locked to your account.
                  </small>
                </div>

                <div className="form-field">
                  <label htmlFor="fullName-input">Full Name</label>
                  <input
                    id="fullName-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="email-input">Email Address</label>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="form-input"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="nic-input">
                    National Identity Card (NIC)
                  </label>
                  <input
                    id="nic-input"
                    type="text"
                    value={nic}
                    onChange={(e) => setNic(e.target.value)}
                    placeholder="e.g. 199912345678 or 991234567V"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="save-profile-btn"
                  disabled={isSaving || isUploading}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <style jsx>{`
        .profile-container {
          width: 100vw;
          min-height: 100vh;
          background: #0b0713;
          background: radial-gradient(circle at 50% 0%, #1a0b2e 0%, #07030f 80%);
          display: flex;
          gap: 1.5rem;
          overflow: hidden;
          font-family: 'Outfit', sans-serif;
          color: white;
        }

        .profile-main {
          flex: 1;
          padding: 1.5rem 1.25rem;
          overflow-y: auto;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .profile-title {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
          color: white;
          background: linear-gradient(135deg, #ffffff 0%, #d8b4fe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .profile-header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .profile-avatar-top {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .top-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: transparent;
        }

        .profile-content-area {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .profile-card {
          width: 800px;
          max-width: 100%;
          background: rgba(18, 11, 32, 0.65);
          backdrop-filter: blur(16px);
          border-radius: 22px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.35);
          padding: 2.5rem;
          border: 1px solid rgba(255,255,255,0.07);
          color: white;
        }

        .profile-card-header {
          display: flex;
          align-items: center;
          gap: 2.5rem;
          flex-wrap: wrap;
        }

        .avatar-upload-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .avatar-glow-ring {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          padding: 4px;
          background: linear-gradient(135deg, #450043, #9a5c97);
          box-shadow: 0 10px 25px rgba(154, 92, 151, 0.3);
          position: relative;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .avatar-glow-ring:hover {
          transform: scale(1.05);
        }

        .avatar-img-large {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          border: 3px solid rgba(157, 78, 221, 0.3);
          background: transparent;
        }

        .avatar-hover-overlay {
          position: absolute;
          top: 7px;
          left: 7px;
          right: 7px;
          bottom: 7px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.25s;
          color: white;
        }

        .avatar-glow-ring:hover .avatar-hover-overlay {
          opacity: 1;
        }

        .camera-icon {
          font-size: 20px;
          margin-bottom: 2px;
        }

        .upload-text {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .avatar-spinner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(69, 0, 67, 0.1);
          border-radius: 50%;
          border-top-color: #450043;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .change-avatar-btn {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          font-weight: 600;
          padding: 6px 16px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .change-avatar-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .profile-summary {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          color: white;
        }

        .profile-user-name {
          font-size: 24px;
          font-weight: 800;
          margin: 0;
        }

        .profile-user-role {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          background: rgba(157, 78, 221, 0.2);
          color: #d8b4fe;
          padding: 3px 10px;
          border-radius: 12px;
          width: fit-content;
          border: 1px solid rgba(157, 78, 221, 0.3);
        }

        .profile-user-username {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0.25rem 0 0 0;
        }

        .divider {
          border: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          margin: 2rem 0;
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-message {
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
        }

        .form-message.success {
          background: rgba(0, 240, 255, 0.1);
          color: #00f0ff;
          border: 1px solid rgba(0, 240, 255, 0.25);
        }

        .form-message.error {
          background: rgba(255, 0, 127, 0.15);
          color: #ff007f;
          border: 1px solid rgba(255, 0, 127, 0.3);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem 2rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-field label {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
        }

        .form-input {
          height: 48px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0 1rem;
          font-size: 15px;
          outline: none;
          color: white;
          background: rgba(255, 255, 255, 0.03);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input:focus {
          border-color: #9d4edd;
          box-shadow: 0 0 0 2px rgba(157, 78, 221, 0.2);
          background: rgba(255, 255, 255, 0.05);
        }

        .form-input-disabled {
          height: 48px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 0 1rem;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.01);
          cursor: not-allowed;
        }

        .field-help {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .form-actions {
          margin-top: 1rem;
          display: flex;
          justify-content: flex-end;
        }

        .save-profile-btn {
          height: 50px;
          padding: 0 2.5rem;
          background: linear-gradient(135deg, #9d4edd 0%, #b5179e 100%);
          color: white;
          border: none;
          border-radius: 25px;
          font-weight: 700;
          font-size: 15px;
          box-shadow: 0 5px 15px rgba(157, 78, 221, 0.3);
          cursor: pointer;
          transition: all 0.3s;
        }

        .save-profile-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(157, 78, 221, 0.45);
        }

        .save-profile-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .save-profile-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .profile-container {
            flex-direction: column;
            gap: 0;
          }

          .profile-main {
            padding: 1rem;
          }

          .profile-title {
            font-size: 22px;
          }

          .profile-card {
            padding: 1.5rem;
          }

          .profile-card-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 1.5rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }

          .form-actions {
            justify-content: center;
          }

          .save-profile-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}