'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, Sparkles, TrendingUp, MessageSquare, Shield } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isSignup, setIsSignup] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login'
      const body = isSignup
        ? { username, password, inviteToken }
        : { username, password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/chat')
      } else {
        setError(data.error || 'Authentication failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: TrendingUp, label: 'Real-time Market Data' },
    { icon: MessageSquare, label: 'AI-Powered Insights' },
    { icon: Shield, label: 'Secure & Private' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-tv-bg via-white to-tv-bg-secondary flex">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-tv-text p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-tv-text text-lg font-black">LFG</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Your Personal
            <br />
            <span className="text-tv-blue">Market Intelligence</span>
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            Track markets, get AI insights, and stay ahead with real-time data and news.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-4 text-white/80 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <feature.icon className="w-5 h-5" />
              </div>
              <span className="font-medium">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/40 text-sm">
            Built for traders, by traders.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-tv-text rounded-2xl mb-4">
              <span className="text-white text-2xl font-black">LFG</span>
            </div>
            <h1 className="text-2xl font-bold text-tv-text">Welcome back</h1>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-elevation-3 border border-tv-border p-8 animate-scale-in">
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-tv-text">
                {isSignup ? 'Create Account' : 'Welcome back'}
              </h2>
              <p className="text-tv-text-soft mt-1">
                {isSignup ? 'Join the community' : 'Sign in to your account'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-semibold text-tv-text mb-2">
                    Invite Token
                  </label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tv-text-muted" />
                    <input
                      type="text"
                      value={inviteToken}
                      onChange={(e) => setInviteToken(e.target.value)}
                      className="input w-full pl-11"
                      placeholder="Enter your invite token"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-tv-text mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input w-full"
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-tv-text mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input w-full pr-11"
                    placeholder="Enter password"
                    required
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-tv-text-muted hover:text-tv-text transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-tv-down-soft rounded-xl p-4 animate-scale-in">
                  <p className="text-sm text-tv-down font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full h-12 text-base font-semibold group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isSignup ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-tv-border">
              <button
                onClick={() => {
                  setIsSignup(!isSignup)
                  setError('')
                }}
                className="w-full text-center text-sm text-tv-text-soft hover:text-tv-blue transition-colors font-medium"
              >
                {isSignup ? (
                  <>Already have an account? <span className="text-tv-blue">Sign in</span></>
                ) : (
                  <>Have an invite? <span className="text-tv-blue">Create account</span></>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Features */}
          <div className="lg:hidden mt-8 flex justify-center gap-6 text-tv-text-muted">
            {features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <feature.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{feature.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
