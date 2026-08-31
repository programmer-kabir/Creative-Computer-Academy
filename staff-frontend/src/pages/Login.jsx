import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 overflow-hidden">

      {/* ── Left Panel: Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-16 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950" />
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 bg-indigo-600 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-[-60px] right-[-60px] w-72 h-72 bg-violet-600 rounded-full blur-3xl opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-10" />

        <div className="relative z-10 text-center">
          {/* Logo mark */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl shadow-indigo-900/50 mb-6 p-4">
            <img src="/cca_logo.png" alt="CCA Logo" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight mb-4">
            Creative Computer<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Academy</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xs mx-auto">
            Your all-in-one staff management portal. Tasks, attendance, and more — in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mt-10">
            {['Task Management', 'Attendance Tracking', 'Leave Requests', 'Reports'].map(f => (
              <span key={f} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-slate-300">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-slate-950 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 lg:from-slate-900 lg:via-slate-900 lg:to-slate-900" />

        <div className="w-full max-w-md relative z-10">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm">
              CCA
            </div>
            <span className="text-white font-bold text-lg">Creative Computer Academy</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight mb-2">Staff Portal</h2>
            <p className="text-slate-400 font-medium">Sign in to access your dashboard</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3.5 rounded-2xl mb-6 text-sm font-medium animate-in slide-in-from-top-2 duration-300">
              <FiAlertCircle className="mt-0.5 flex-shrink-0 text-rose-400" size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  id="staff-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  id="staff-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="staff-login-btn"
              disabled={loading || !email || !password}
              className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-indigo-900/30 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-8 font-medium">
            Forgot your password? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
