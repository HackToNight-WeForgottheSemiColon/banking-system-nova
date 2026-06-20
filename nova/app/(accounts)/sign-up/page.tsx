'use client'

import Link from 'next/link'
import React, { useState } from 'react'
import AuthButton from '@/components/authButton'
import { useAuth } from '@/lib/auth-context'

export default function SignUpPage() {
  const { register } = useAuth()
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (
      !accountNumber.trim() ||
      !accountName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('All fields are required.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await register({
        username: accountNumber.trim(),
        fullName: accountName.trim(),
        email: email.trim(),
        password
      })
      setSuccess('Account created successfully! Redirecting to login...')
    } catch (err: any) {
      setError(err?.message || 'Failed to register account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full py-8 md:py-12">
      {/* Background Glowing Orbs */}
      <div 
        className="absolute -right-12 -top-12 size-64 rounded-full blur-[100px] pointer-events-none opacity-40 animate-pulse"
        style={{
          background: 'radial-gradient(circle, var(--primary) 0%, rgba(157, 78, 221, 0) 70%)',
          animationDuration: '9s'
        }}
      />
      <div 
        className="absolute -left-16 -bottom-16 size-80 rounded-full blur-[120px] pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(circle, var(--primary-hover) 0%, rgba(181, 23, 158, 0) 70%)',
          animation: 'floatOrbSignUp 15s ease-in-out infinite'
        }}
      />

      <section 
        className="mx-auto min-h-[700px] w-full max-w-[960px] rounded-[40px] px-6 py-10 lg:min-h-[800px] lg:px-16" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(20, 12, 38, 0.85) 0%, rgba(12, 8, 24, 0.9) 100%)', 
          backdropFilter: 'blur(30px)', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="relative mx-auto w-full max-w-[700px]"
        >
          {/* Top Logo */}
          <div className="mb-8 flex flex-col items-center justify-center text-center">
            <img
              src="/loginlogo.png"
              alt="Nova Bank"
              className="w-full max-w-[160px] drop-shadow-[0_10px_20px_rgba(157,78,221,0.2)]"
            />
            <h1 className="mt-6 text-[2.25rem] font-black tracking-tight text-white uppercase" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              Create Account
            </h1>
            <p className="mt-2 text-sm font-medium text-white/50 tracking-wider">
              Join Nova Bank and experience premium digital finance
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div 
              className="mb-6 rounded-2xl p-4 text-sm font-semibold border text-center transition-all duration-300 animate-fadeIn" 
              style={{ 
                background: 'rgba(239, 68, 68, 0.08)', 
                borderColor: 'rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.1)'
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div 
              className="mb-6 rounded-2xl p-4 text-sm font-semibold border text-center transition-all duration-300 animate-fadeIn" 
              style={{ 
                background: 'rgba(0, 240, 255, 0.08)', 
                borderColor: 'rgba(0, 240, 255, 0.2)',
                color: '#a5f3fc',
                boxShadow: '0 4px 15px rgba(0, 240, 255, 0.1)'
              }}
            >
              {success}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Account Number */}
            <div className="grid items-center gap-2 md:grid-cols-[200px_1fr]">
              <label
                className="text-base font-bold tracking-wider text-white/70 uppercase md:text-right md:pr-6"
                htmlFor="signup-account-number"
              >
                Account Number
              </label>
              <input
                id="signup-account-number"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter account number"
                className="h-[56px] rounded-full px-6 text-base font-medium outline-none transition-all duration-300 border border-white/85 text-white"
                style={{ 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  background: 'rgba(255,255,255,0.04)',
                }}
              />
            </div>

            {/* Account Name */}
            <div className="grid items-center gap-2 md:grid-cols-[200px_1fr]">
              <label 
                className="text-base font-bold tracking-wider text-white/70 uppercase md:text-right md:pr-6" 
                htmlFor="signup-account-name"
              >
                Account Name
              </label>
              <input
                id="signup-account-name"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter full name"
                className="h-[56px] rounded-full px-6 text-base font-medium outline-none transition-all duration-300 border border-white/85 text-white"
                style={{ 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  background: 'rgba(255,255,255,0.04)', 
                }}
              />
            </div>

            {/* Email */}
            <div className="grid items-center gap-2 md:grid-cols-[200px_1fr]">
              <label 
                className="text-base font-bold tracking-wider text-white/70 uppercase md:text-right md:pr-6" 
                htmlFor="signup-email"
              >
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="h-[56px] rounded-full px-6 text-base font-medium outline-none transition-all duration-300 border border-white/85 text-white"
                style={{ 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  background: 'rgba(255,255,255,0.04)',
                }}
              />
            </div>

            {/* Password */}
            <div className="grid items-center gap-2 md:grid-cols-[200px_1fr]">
              <label 
                className="text-base font-bold tracking-wider text-white/70 uppercase md:text-right md:pr-6" 
                htmlFor="signup-password"
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose security password"
                className="h-[56px] rounded-full px-6 text-base font-medium outline-none transition-all duration-300 border border-white/85 text-white"
                style={{ 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  background: 'rgba(255,255,255,0.04)',
                }}
              />
            </div>

            {/* Confirm Password */}
            <div className="grid items-center gap-2 md:grid-cols-[200px_1fr]">
              <label
                className="text-base font-bold tracking-wider text-white/70 uppercase md:text-right md:pr-6"
                htmlFor="signup-confirm-password"
              >
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="h-[56px] rounded-full px-6 text-base font-medium outline-none transition-all duration-300 border border-white/85 text-white"
                style={{ 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  background: 'rgba(255,255,255,0.04)',
                }}
              />
            </div>
          </div>

          {/* Interactive Styling for Inputs */}
          <style dangerouslySetInnerHTML={{ __html: `
            input[id^="signup-"]:focus {
              border-color: var(--primary) !important;
              background: rgba(25, 16, 44, 0.8) !important;
              box-shadow: 0 0 20px -5px rgba(157, 78, 221, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
            }
          ` }} />

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col items-center gap-5">
            <AuthButton type="submit" disabled={loading} className="w-full max-w-[280px]">
              {loading ? 'SAVING...' : 'SIGN UP'}
            </AuthButton>
            
            <div className="flex items-center gap-2 text-sm font-semibold text-white/45">
              <span>Already have an account?</span>
              <Link
                href="/login"
                className="font-bold tracking-wide transition-all duration-200 hover:text-white"
                style={{ color: '#d8b4fe' }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </form>
      </section>

      {/* Embedded Animations and Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatOrbSignUp {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
      ` }} />
    </div>
  )
}

