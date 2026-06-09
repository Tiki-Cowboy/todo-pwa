import { useState } from 'react'
import { motion } from 'framer-motion'

export default function AuthScreen({ onSignIn, onSignUp }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  function friendlyError(code) {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password.'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSignIn(email, password)
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSignUp(email, password)
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-white border rounded-xl px-4 py-2.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition"
  const inputBorder = { borderColor: 'rgba(12, 26, 51, 0.12)' }

  return (
    <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Wordmark */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/icons/siteimage.png"
            alt="Tiki Cowboy"
            className="w-32 h-32 object-contain mb-4"
          />
          <span className="font-sans font-semibold text-navy-deep uppercase tracking-[3px] text-[18px]">
            TIKI TO-DOS
          </span>
          <p className="text-text-tertiary text-sm mt-2">Your personal task wrangler.</p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-2xl p-8 shadow-xl"
          style={{ border: '1px solid rgba(12, 26, 51, 0.06)' }}
        >
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass}
                style={inputBorder}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
                style={inputBorder}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-center"
                style={{ color: '#C0392B' }}
              >
                {error}
              </motion.p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 font-semibold py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
                style={{ background: '#C4A24E' }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="flex-1 font-semibold py-2.5 rounded-xl border transition disabled:opacity-50 disabled:cursor-not-allowed text-text-secondary hover:text-text-primary"
                style={{ borderColor: 'rgba(12, 26, 51, 0.12)', background: '#F4F2ED' }}
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
