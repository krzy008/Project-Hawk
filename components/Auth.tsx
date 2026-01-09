
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Logo } from './Logo';
import { Loader, AlertCircle, CheckCircle2, User, Mail, Lock, Eye, EyeOff, ChevronLeft, Send, X } from 'lucide-react';

interface AuthProps {
  onBack?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [identifier, setIdentifier] = useState(''); // Email or Username for Login
  const [email, setEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const validateUsername = (name: string) => {
    const regex = /^[a-zA-Z0-9_]{2,16}$/;
    return regex.test(name);
  };

  const sanitizeInput = (val: string) => val.replace(/[<>]/g, '').trim();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (activeTab === 'signup') {
        const cleanUsername = sanitizeInput(username);
        const cleanEmail = sanitizeInput(email);

        if (cleanUsername.length < 2 || cleanUsername.length > 16) {
          throw new Error("Username: 2-16 characters.");
        }
        if (!validateUsername(cleanUsername)) {
          throw new Error("Invalid characters in username.");
        }
        if (password.length < 8) {
          throw new Error("Password: min 8 characters.");
        }

        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (existingUser) {
          throw new Error("Username already taken.");
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              username: cleanUsername,
              avatar_url: null,
              is_private: false,
              last_username_change: new Date().toISOString()
            }
          }
        });

        if (signUpError) throw signUpError;
        setSuccess('Verify your email to continue.');
      } else if (activeTab === 'signin') {
        let targetEmail = sanitizeInput(identifier);

        if (!targetEmail.includes('@')) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', targetEmail)
            .maybeSingle();

          if (profileError || !profile) {
            throw new Error("User not found.");
          }
          targetEmail = profile.email;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        });

        if (signInError) throw new Error("Invalid credentials.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const cleanResetEmail = sanitizeInput(resetEmail);
      const { error } = await supabase.auth.resetPasswordForEmail(cleanResetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccess('Check your email for reset link.');
    } catch (err: any) {
      setError(err.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBypass = () => {
    localStorage.setItem('hawk_debug_bypass', 'true');
    window.location.reload();
  };

  return (
    <div className="bg-hawk-surface border border-hawk-ui rounded-[32px] shadow-[0_0_100px_rgba(0,0,0,0.8)] p-6 relative overflow-hidden font-sans w-full max-w-[360px] mx-auto animate-slide-up">
      <div className="absolute top-0 left-0 w-full h-1 bg-hawk-gold/20"></div>

      <div className="w-full relative z-10">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute -top-2 -right-2 p-2 text-hawk-textMuted hover:text-white transition-all z-[100]"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 mb-4 drop-shadow-[0_0_15px_rgba(255,163,26,0.3)]">
            <Logo />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-[0.2em] italic">
            Hawk
          </h1>
        </div>

        {activeTab !== 'reset' ? (
          <div className="flex bg-hawk-ui/60 backdrop-blur-md p-1 rounded-xl border border-hawk-ui mb-6">
            <button 
              onClick={() => { setActiveTab('signin'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-[9px] font-black uppercase tracking-[0.1em] rounded-lg transition-all duration-300 ${activeTab === 'signin' ? 'bg-hawk-gold text-black' : 'text-hawk-textMuted hover:text-white'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setActiveTab('signup'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-[9px] font-black uppercase tracking-[0.1em] rounded-lg transition-all duration-300 ${activeTab === 'signup' ? 'bg-hawk-gold text-black' : 'text-hawk-textMuted hover:text-white'}`}
            >
              Sign Up
            </button>
          </div>
        ) : (
          <button 
            onClick={() => { setActiveTab('signin'); setError(null); setSuccess(null); }}
            className="flex items-center gap-2 mb-6 text-[9px] font-black text-hawk-gold uppercase tracking-widest"
          >
            <ChevronLeft className="w-3 h-3" /> Back
          </button>
        )}

        <div className="space-y-4">
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-red-200 text-[9px] font-bold uppercase tracking-widest">{error}</span>
                </div>
            )}

            {success && (
                <div className="p-3 bg-hawk-gold/10 border border-hawk-gold/20 rounded-xl flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-hawk-gold shrink-0 mt-0.5" />
                    <span className="text-hawk-gold text-[9px] font-bold uppercase tracking-widest">{success}</span>
                </div>
            )}

            {activeTab === 'reset' ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-hawk-textMuted uppercase tracking-widest pl-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-hawk-textMuted" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-black/40 border border-hawk-ui rounded-xl p-3 pl-10 text-white placeholder-hawk-textMuted focus:border-hawk-gold transition-all text-[11px] font-bold"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-hawk-gold text-black font-black uppercase tracking-[0.2em] py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px]"
                >
                  {loading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send Reset Link
                </button>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                {activeTab === 'signup' ? (
                  <>
                    <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-hawk-textMuted uppercase tracking-widest pl-1">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-hawk-textMuted" />
                          <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-black/40 border border-hawk-ui rounded-xl p-3 pl-10 text-white placeholder-hawk-textMuted focus:border-hawk-gold transition-all text-[11px] font-bold"
                              placeholder="you@example.com"
                          />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[8px] font-black text-hawk-textMuted uppercase tracking-widest">Username</label>
                          <span className={`text-[7px] font-black ${username.length > 16 || (username.length > 0 && username.length < 2) ? 'text-red-500' : 'text-hawk-gold'}`}>
                            {username.length}/16
                          </span>
                        </div>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-hawk-textMuted" />
                          <input
                              type="text"
                              required
                              value={username}
                              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                              className="w-full bg-black/40 border border-hawk-ui rounded-xl p-3 pl-10 text-white placeholder-hawk-textMuted focus:border-hawk-gold transition-all text-[11px] font-bold"
                              placeholder="username_x"
                          />
                        </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-hawk-textMuted uppercase tracking-widest pl-1">Identifier</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-hawk-textMuted" />
                        <input
                            type="text"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full bg-black/40 border border-hawk-ui rounded-xl p-3 pl-10 text-white placeholder-hawk-textMuted focus:border-hawk-gold transition-all text-[11px] font-bold"
                            placeholder="Email or Username"
                        />
                      </div>
                  </div>
                )}
                
                <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-hawk-textMuted uppercase tracking-widest pl-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-hawk-textMuted" />
                      <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-black/40 border border-hawk-ui rounded-xl p-3 pl-10 pr-10 text-white placeholder-hawk-textMuted focus:border-hawk-gold transition-all text-[11px] font-bold"
                          placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-hawk-textMuted hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                </div>

                {activeTab === 'signin' && (
                  <div className="flex justify-end pr-1">
                    <button 
                      type="button"
                      onClick={() => { setActiveTab('reset'); setError(null); setSuccess(null); }}
                      className="text-[8px] font-black text-hawk-gold uppercase tracking-[0.1em] hover:text-white transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black font-black uppercase tracking-[0.2em] py-3.5 rounded-xl hover:bg-hawk-gold transition-all flex items-center justify-center gap-2 text-[10px] disabled:opacity-50"
                >
                    {loading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : (activeTab === 'signup' ? 'Sign Up' : 'Sign In')}
                </button>
              </form>
            )}

            {activeTab !== 'reset' && (
              <>
                <div className="flex items-center gap-3 my-4">
                    <div className="h-[1px] bg-hawk-ui/50 flex-1"></div>
                    <span className="text-[7px] text-hawk-textMuted uppercase tracking-[0.2em] font-black">or</span>
                    <div className="h-[1px] bg-hawk-ui/50 flex-1"></div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full bg-hawk-ui/20 text-hawk-textSecondary hover:text-white font-bold text-[9px] uppercase tracking-[0.1em] py-3 rounded-xl hover:bg-hawk-ui/40 transition-all flex items-center justify-center gap-2 border border-hawk-ui"
                >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                    </svg>
                    Google
                </button>
              </>
            )}
        </div>
      </div>

      <button 
        onClick={handleBypass}
        className="mt-6 opacity-5 hover:opacity-40 transition-opacity text-[7px] font-black uppercase tracking-[0.1em] text-hawk-gold text-center w-full"
      >
        Developer Bypass
      </button>
    </div>
  );
};
