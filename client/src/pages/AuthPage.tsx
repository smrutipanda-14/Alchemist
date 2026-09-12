import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/audio';
import { FlaskConical, Lock, Mail, User as UserIcon, KeyRound, Sparkles, AlertCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import api from '../api/client';

export const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT' | 'VERIFY_EMAIL'>('LOGIN');

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pfpFile, setPfpFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    sound.playBlip();

    try {
      const res = await api.post('/auth/login', {
        usernameOrEmail: username || email,
        password
      });
      sound.playFanfare();
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    sound.playBlip();

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      if (pfpFile) {
        formData.append('pfp', pfpFile);
      }

      const res = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      sound.playFanfare();
      login(res.data.token, res.data.user);
      setMode('VERIFY_EMAIL');
      setInfo('Account created! A verification code has been dispatched to your email (and logged to the server).');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    sound.playBlip();

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setInfo(res.data.message || 'OTP reset code sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    sound.playBlip();

    try {
      const res = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      sound.playFanfare();
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. Check OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email Verification Code
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    sound.playBlip();

    try {
      await api.post('/auth/verify-email', { code: verificationCode });
      sound.playFanfare();
      setInfo('✨ Email verified successfully! Your Grimoire is now fully unlocked.');
      setTimeout(() => {
        setMode('LOGIN');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#16213e]/90 backdrop-blur-xl border border-purple-900/50 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 p-0.5 shadow-xl mb-3">
            <div className="bg-[#16213e] p-3 rounded-[14px]">
              <FlaskConical className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
          </div>
          <h1 className="font-cinzel font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-300 to-teal-300">
            ALCHEMIST'S HAVEN
          </h1>
          <p className="text-xs text-purple-300/80 font-pixel tracking-wider mt-1">
            POTION RPG PRODUCTIVITY
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="mb-4 p-3 rounded-xl bg-teal-950/60 border border-teal-500/40 text-teal-200 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0 text-teal-400" />
            <span>{info}</span>
          </div>
        )}

        {/* Mode Switcher */}
        {mode !== 'VERIFY_EMAIL' && mode !== 'FORGOT' && (
          <div className="grid grid-cols-2 gap-2 bg-[#0f0f1b]/80 p-1 rounded-xl mb-6 border border-purple-900/40">
            <button
              onClick={() => { sound.playBlip(); setMode('LOGIN'); setError(null); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'LOGIN'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { sound.playBlip(); setMode('REGISTER'); setError(null); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'REGISTER'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              New Alchemist
            </button>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username or Email</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="MasterAlchemist"
                  className="w-full bg-[#0f0f1b] border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => { sound.playBlip(); setMode('FORGOT'); setError(null); }}
                  className="text-[11px] text-purple-400 hover:text-purple-300"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0f0f1b] border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg glow-purple transition-all"
            >
              {loading ? 'Entering Haven...' : 'Enter the Brewery'}
            </button>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Grimoire Name (Username)</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="AriaStarlight"
                  className="w-full bg-[#0f0f1b] border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aria@alchemist.app"
                  className="w-full bg-[#0f0f1b] border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0f0f1b] border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Profile Avatar (Optional)</label>
              <div className="relative flex items-center bg-[#0f0f1b] border border-slate-700/60 rounded-xl px-3 py-2">
                <ImageIcon className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPfpFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:bg-purple-600 file:text-white hover:file:bg-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-lg glow-gold transition-all mt-2"
            >
              {loading ? 'Inscribing Grimoire...' : 'Begin Apprenticeship'}
            </button>
          </form>
        )}

        {/* 3. FORGOT / RESET PASSWORD FORM (TOKEN VERSIONING DEMO) */}
        {mode === 'FORGOT' && (
          <div className="space-y-4">
            <button
              onClick={() => { sound.playBlip(); setMode('LOGIN'); setError(null); }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>

            <h2 className="text-sm font-bold text-amber-300">Seal of Rekindling (Password Reset)</h2>
            <p className="text-xs text-slate-400">
              Enter your email to receive a 6-digit OTP. Resetting password increments your JWT token version, revoking old sessions.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Email Address</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alchemist@guild.com"
                  className="flex-1 bg-[#0f0f1b] border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
                >
                  Send OTP
                </button>
              </div>
            </form>

            <form onSubmit={handleResetPassword} className="space-y-3 pt-3 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">6-Digit Reset Code (OTP)</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-[#0f0f1b] border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-pixel tracking-widest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Grimoire Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0f0f1b] border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md glow-gold"
              >
                {loading ? 'Rekindling...' : 'Reset Password & Invalidate Old Tokens'}
              </button>
            </form>
          </div>
        )}

        {/* 4. VERIFY EMAIL FORM */}
        {mode === 'VERIFY_EMAIL' && (
          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <h2 className="text-sm font-bold text-teal-300 text-center">Verify Your Grimoire Email</h2>
            <p className="text-xs text-slate-400 text-center">
              Please enter the 6-digit verification code sent to <strong>{email}</strong>
            </p>

            <div>
              <input
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                className="w-full bg-[#0f0f1b] border border-teal-500/50 rounded-xl px-4 py-3 text-center text-lg text-teal-300 font-pixel tracking-widest focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg glow-emerald"
            >
              {loading ? 'Verifying...' : 'Complete Verification'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
