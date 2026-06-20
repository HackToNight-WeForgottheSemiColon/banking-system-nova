'use client'

import Link from 'next/link'
import React, { useState } from 'react'
import AuthButton from '@/components/authButton'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [userFocused, setUserFocused] = useState(false)
  const [pwdFocused, setPwdFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Username and password are required.')
      return
    }

    setLoading(true)
    try {
      await login(username.trim(), password)
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials or connection error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full py-8 md:py-12">
      {/* Dynamic Background Glowing Orbs */}
      <div 
        className="absolute -left-12 -top-12 size-64 rounded-full blur-[100px] pointer-events-none opacity-40 animate-pulse"
        style={{
          background: 'radial-gradient(circle, var(--primary) 0%, rgba(157, 78, 221, 0) 70%)',
          animationDuration: '8s'
        }}
      />
      <div 
        className="absolute -right-16 -bottom-16 size-80 rounded-full blur-[120px] pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(circle, var(--primary-hover) 0%, rgba(181, 23, 158, 0) 70%)',
          animation: 'floatOrb 12s ease-in-out infinite'
        }}
      />

      <section 
        className="mx-auto flex min-h-[500px] w-full max-w-[1060px] overflow-hidden rounded-[40px] shadow-[0_24px_80px_rgba(0,0,0,0.6)] transition-all duration-500 lg:min-h-[660px]" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(20, 12, 38, 0.85) 0%, rgba(12, 8, 24, 0.9) 100%)', 
          backdropFilter: 'blur(30px)', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Left Artwork Panel - Hidden on Mobile */}
        <aside
          aria-label="Nova Bank shell artwork"
          className="relative hidden w-[46.2%] shrink-0 overflow-hidden md:block"
          style={{
            borderRight: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Subtle overlay shading for depth */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0e071c] via-transparent to-transparent opacity-80" />
          <div className="absolute inset-0 z-10 bg-radial-gradient from-transparent to-[#100922] opacity-40" />

          <img
            src="/loginshellbg.png"
            alt=""
            className="size-full object-cover transition-transform duration-10000 ease-out hover:scale-110"
            aria-hidden="true"
          />

          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center">
            {/* Logo container with float animation */}
            <div className="mb-4 flex items-center justify-center" style={{ animation: 'floatLogo 6s ease-in-out infinite' }}>
              <img
                src="/loginlogo.png"
                alt="Nova Bank"
                className="w-full max-w-[240px] drop-shadow-[0_10px_20px_rgba(157,78,221,0.3)]"
              />
            </div>
            <p className="max-w-[280px] text-sm font-semibold tracking-widest text-[#d8b4fe]/60 uppercase">
              Secure Digital Banking Solutions
            </p>
          </div>
        </aside>

        {/* Right Form Panel */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 md:px-16">
          <form
            onSubmit={handleSubmit}
            className="mx-auto w-full max-w-[420px]"
          >
            {/* Header Area */}
            <div className="mb-10 text-center">
              <div className="md:hidden mb-4 flex justify-center">
                <img
                  src="/loginlogo.png"
                  alt="Nova Bank"
                  className="h-8 object-contain"
                />
              </div>
              <h1 className="text-[2.25rem] font-black tracking-tight text-white uppercase" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                Welcome Back
              </h1>
              <p className="mt-2 text-sm font-medium text-white/50 tracking-wider">
                Access your premium financial portal
              </p>
            </div>

            {/* Error Message */}
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

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Username Input */}
              <div className="relative">
                <label className="sr-only" htmlFor="login-account">
                  Username
                </label>
                <div 
                  className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-all duration-300"
                  style={{
                    opacity: userFocused || username ? 1 : 0.6,
                    transform: `translateY(-50%) ${userFocused ? 'scale(1.1)' : 'scale(1)'}`
                  }}
                >
                  <img
                    src="/person.png"
                    alt=""
                    aria-hidden="true"
                    className="size-5"
                    style={{ filter: userFocused ? 'none' : 'brightness(0) invert(0.8)' }}
                  />
                </div>
                <input
                  id="login-account"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setUserFocused(true)}
                  onBlur={() => setUserFocused(false)}
                  className="w-full text-base font-medium transition-all duration-300"
                  style={{
                    height: '60px',
                    borderRadius: '30px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: userFocused ? 'rgba(25, 16, 44, 0.8)' : 'rgba(255, 255, 255, 0.04)',
                    padding: '0 2rem 0 4.5rem',
                    color: '#f3f0f7',
                    outline: 'none',
                    borderColor: userFocused ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: userFocused 
                      ? '0 0 20px -5px rgba(157, 78, 221, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                      : 'none',
                  }}
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <label className="sr-only" htmlFor="login-password">
                  Password
                </label>
                <div 
                  className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-all duration-300"
                  style={{
                    opacity: pwdFocused || password ? 1 : 0.6,
                    transform: `translateY(-50%) ${pwdFocused ? 'scale(1.1)' : 'scale(1)'}`
                  }}
                >
                  <img
                    src="/password.png"
                    alt=""
                    aria-hidden="true"
                    className="size-5"
                    style={{ filter: pwdFocused ? 'none' : 'brightness(0) invert(0.8)' }}
                  />
                </div>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPwdFocused(true)}
                  onBlur={() => setPwdFocused(false)}
                  className="w-full text-base font-medium transition-all duration-300"
                  style={{
                    height: '60px',
                    borderRadius: '30px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: pwdFocused ? 'rgba(25, 16, 44, 0.8)' : 'rgba(255, 255, 255, 0.04)',
                    padding: '0 2rem 0 4.5rem',
                    color: '#f3f0f7',
                    outline: 'none',
                    borderColor: pwdFocused ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: pwdFocused 
                      ? '0 0 20px -5px rgba(157, 78, 221, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                      : 'none',
                  }}
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="mt-4 text-right">
              <Link
                href="/reset-password"
                className="text-xs font-bold text-white/50 transition-colors duration-200 hover:text-white"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-center">
              <AuthButton type="submit" disabled={loading} className="w-full">
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
              </AuthButton>
            </div>

            {/* Divider */}
            <div className="my-8 flex items-center justify-center gap-4 text-xs font-extrabold uppercase tracking-widest text-white/20">
              <span className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }} />
              <span>OR</span>
              <span className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }} />
            </div>

            {/* Sign Up Area */}
            <div className="text-center">
              <p className="text-sm font-semibold text-white/40">
                New to Nova Bank?
              </p>
              <Link 
                href="/sign-up" 
                className="mt-2 inline-block text-lg font-black tracking-wide transition-all duration-300 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #ffffff 0%, #d8b4fe 100%)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                }}
              >
                CREATE AN ACCOUNT
              </Link>
            </div>
          </form>
        </div>
      </section>

      {/* Embedded Animations and Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 20px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` }} />
    </div>
  )
}
