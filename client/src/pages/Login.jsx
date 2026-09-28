import React, { useState } from 'react';
import { Video, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { apiLogin, apiRegister, setAuthToken, setStoredUser } from '../services/api';

const Login = ({ onAuthSuccess, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiLogin(email, password);
      setAuthToken(data.token);
      setStoredUser(data.user);
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('alex@meetspace.dev');
    setPassword('password123');
    setLoading(true);
    setError('');

    try {
      const data = await apiLogin('alex@meetspace.dev', 'password123');
      setAuthToken(data.token);
      setStoredUser(data.user);
      onAuthSuccess(data.user);
    } catch (err) {
      // If demo user not yet registered, register automatically
      try {
        const regData = await apiRegister('Alex Rivers', 'alex@meetspace.dev', 'password123');
        setAuthToken(regData.token);
        setStoredUser(regData.user);
        onAuthSuccess(regData.user);
      } catch (regErr) {
        setError(regErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 mb-4">
            <Video className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome to <span className="text-indigo-400">MeetSpace</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Secure, low-latency WebRTC video conferencing & teamwork
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Access Button */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-indigo-300 hover:text-indigo-200 text-xs font-medium rounded-xl flex items-center justify-center space-x-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>One-Click Demo Login</span>
          </button>
        </div>

        {/* Switch to Register */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Don't have an account yet?{' '}
          <button
            onClick={onNavigateToRegister}
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
          >
            Create account
          </button>
        </p>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted with WebRTC DTLS & JWT Protection</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
