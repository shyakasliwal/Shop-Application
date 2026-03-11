import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OTPInput from './OTPInput'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || 'https://shop-backend-g3s8.onrender.com') + '/api/auth'

function maskEmail(email) {
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return email
  if (localPart.length <= 2) {
    return `${localPart[0] || ''}****@${domain}`
  }
  return `${localPart.slice(0, 2)}****@${domain}`
}

function LoginPage() {
  const navigate = useNavigate()
  const [otpSent, setOtpSent] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`${API_BASE}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const contentType = res.headers.get('content-type')
      const data =
        contentType && contentType.includes('application/json')
          ? await res.json()
          : { error: res.ok ? 'Invalid response' : 'Server unavailable. Please try again.' }
      if (!res.ok) {
        if (res.status === 404 || res.status === 502 || res.status === 503) {
          throw new Error('Backend is starting up (Render free tier). Wait 30–60 seconds and try again.')
        }
        throw new Error(data.error || 'Failed to send OTP')
      }
      setMessage(data.message || 'OTP sent to your email. Check your inbox.')
      setOtpSent(true)
    } catch (err) {
      const msg = err.message || 'Could not send OTP. Check your email and try again.'
      setError(
        err.name === 'TypeError' && err.message === 'Failed to fetch'
          ? 'Backend unreachable. Wait a minute and try again (Render may be starting).'
          : msg
      )
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otpCode: otp }),
      })
      const contentType = res.headers.get('content-type')
      const data =
        contentType && contentType.includes('application/json')
          ? await res.json()
          : { error: res.ok ? 'Invalid response' : 'Server unavailable. Please try again.' }
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP')
      setMessage(data.message || 'Verified successfully!')
      setVerified(true)
      if (data.token) {
        localStorage.setItem('otp_jwt', data.token)
        const resolvedEmail = data?.user?.email || email.trim()
        localStorage.setItem('user_email', resolvedEmail)
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToSend = () => {
    setOtpSent(false)
    setOtp('')
    setMessage('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px] md:min-h-[700px]">
        {/* Left Column - Branding & Visual */}
        <div className="relative md:w-1/2 min-h-[280px] md:min-h-full flex flex-col p-6 md:p-10 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/images/abstract-bg.png)' }}
            aria-hidden="true"
          >
            <div className="absolute inset-4 md:inset-6 rounded-[2rem] bg-white/70 backdrop-blur-sm" />
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <span className="text-xl md:text-2xl font-bold text-slate-800">Productr</span>
            <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
            </svg>
          </div>

          <div className="relative z-10 flex-1 flex items-center justify-center mt-6 md:mt-12">
            <div className="w-full max-w-md rounded-[2rem] overflow-hidden shadow-xl bg-gradient-to-b from-orange-500 via-orange-500 to-orange-700 relative">
              <img
                src="/images/runner.png"
                alt="Runner in motion"
                className="w-full h-64 md:h-80 object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6">
                <p className="text-white text-center text-lg md:text-xl font-medium leading-relaxed drop-shadow-sm">
                  Uplist your product<br />to market
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Login Form */}
        <div className="md:w-1/2 flex flex-col justify-center p-8 md:p-12 lg:p-16">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
            Login to your Productr Account
          </h1>
          {otpSent && (
            <p className="text-sm text-slate-500 mb-6">
              We&apos;ve sent a 6-digit code to <span className="font-semibold">{maskEmail(email.trim())}</span>
            </p>
          )}
          {!otpSent && (
            <p className="text-sm text-slate-500 mb-6">
              Enter the email associated with your Productr account to receive a one-time login code.
            </p>
          )}

          <form
            className="space-y-6"
            onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
          >
            {!otpSent && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:ring-opacity-50 outline-none transition-colors text-slate-800 placeholder:text-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            )}

            {otpSent && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-600">
                  Enter 6-digit code
                </label>
                <OTPInput value={otp} onChange={(next) => setOtp(next.replace(/\D/g, '').slice(0, 6))} />
                <button
                  type="button"
                  onClick={handleBackToSend}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Use a different email
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                (!otpSent && !email.trim()) ||
                (otpSent && otp.replace(/\D/g, '').length !== 6)
              }
              className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors"
            >
              {loading ? 'Please wait...' : otpSent ? 'Verify OTP' : 'Send OTP'}
            </button>
          </form>

          {message && (
            <p className="mt-4 text-green-600 text-sm">{message}</p>
          )}
          {error && (
            <p className="mt-4 text-red-600 text-sm">{error}</p>
          )}

          {verified && token && (
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <p className="text-sm font-medium text-slate-700 mb-1">Logged in successfully</p>
              <p className="text-xs text-slate-500 break-all">{token}</p>
            </div>
          )}

          <div className="mt-10 text-center">
            <p className="text-slate-500 text-sm">Don&apos;t have a Productr Account</p>
            <a
              href="/signup"
              className="inline-block mt-1 text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
            >
              SignUp Here
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
