import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiShield } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background effects */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-blue-700 rounded-full blur-3xl opacity-10 pointer-events-none" />
      <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] bg-indigo-700 rounded-full blur-3xl opacity-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-800 rounded-full blur-3xl opacity-20 pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-md">

        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 rounded-t-3xl" />

        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 border-t-0 rounded-b-3xl p-10 shadow-2xl shadow-black/50">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-xl p-3 mb-4">
              <img src="/cca_logo.png" alt="Creative Computer Academy Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-1">Admin Console</h1>
            <p className="text-slate-400 text-sm font-medium">
              Creative Computer Academy — Restricted Access
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3.5 rounded-2xl mb-6 text-sm font-medium animate-in slide-in-from-top-2 duration-200">
              <FiAlertCircle className="mt-0.5 flex-shrink-0" size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-600 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-600 rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="admin-login-btn"
              disabled={loading || !email || !password}
              className="w-full mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-blue-900/20 transition-all duration-300 flex items-center justify-center gap-2 text-sm tracking-wide"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <FiShield size={15} />
                  Access Console
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-center gap-2 text-slate-600 text-xs font-medium">
            <FiShield size={12} />
            Authorized personnel only
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
