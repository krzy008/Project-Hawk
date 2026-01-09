
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Logo } from './Logo';
import { Loader, AlertCircle, CheckCircle2, User, Mail, Lock, Eye, EyeOff, ChevronLeft, Send } from 'lucide-react';

export const Auth: React.FC = () => {
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
    // Strict: 2-16 chars, only alphanumeric and underscore
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
          throw new Error("Username must be between 2 and 16 characters.");
        }
        if (!validateUsername(cleanUsername)) {
          throw new Error("Username can only contain letters, numbers, and underscores.");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }

        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (existingUser) {
          throw new Error("Username already taken. Please choose another.");
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              username: cleanUsername,
              avatar_url: null,
              is_private: false,
              last_username_change: new Date().toISOString()
            }
          }
        });

        if (signUpError) throw signUpError;
        setSuccess('Account created! Please check your email inbox to verify your account.');
      } else if (activeTab === 'signin') {
        let targetEmail = sanitizeInput(identifier);

        if (!targetEmail.includes('@')) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', targetEmail)
            .maybeSingle();

          if (profileError || !profile) {
            throw new Error("We couldn't find an account with that username.");
          }
          targetEmail = profile.email;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        });

        if (signInError) throw new Error("Incorrect email or password.");
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
      setSuccess('Check your email! We sent a password reset link.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link. Email not found.');
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
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-hawk-gold/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-40 h-40 mb-8 drop-shadow-[0_0_25px_rgba(255,163,26,0.4)]">
            <Logo />
          </div>
          <div className="flex flex-col items-center mb-2">
            <h1 className="text-[42px] font-black text-white uppercase tracking-[0.2em] leading-none text-center italic">
              Hawk
            </h1>
          </div>
        </div>

        {activeTab !== 'reset' ? (
          <div className="flex bg-hawk-ui/60 backdrop-blur-md p-1 rounded-2xl border border-hawk-ui mb-8">
            <button 
              onClick={() => { setActiveTab('signin'); setError(null); setSuccess(null); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-300 ${activeTab === 'signin' ? 'bg-hawk-gold text-black shadow-lg shadow-hawk-gold/20' : 'text-hawk-textMuted hover:text-white'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setActiveTab('signup'); setError(null); setSuccess(null); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-300 ${activeTab === 'signup' ? 'bg-hawk-gold text-black shadow-lg shadow-hawk-gold/20' : 'text-hawk-textMuted hover:text-white'}`}
            >
              Create Account
            </button>
          </div>
        ) : (
          <button 
            onClick={() => { setActiveTab('signin'); setError(null); setSuccess(null); }}
            className="flex items-center gap-2 mb-8 text-[10px] font-black text-hawk-gold uppercase tracking-widest hover:translate-x-[-4px] transition-transform"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Sign In
          </button>
        )}

        <div className="bg-hawk-surface/40 border border-hawk-ui p-8 rounded-[32px] shadow-2xl backdrop-blur-2xl">
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-slide-up">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-red-200 text-[10px] leading-relaxed font-bold uppercase tracking-widest">{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-hawk-gold/10 border border-hawk-gold/20 rounded-2xl flex items-start gap-3 animate-slide-up">
                    <CheckCircle2 className="w-4 h-4 text-hawk-gold shrink-0 mt-0.5" />
                    <span className="text-hawk-gold text-[10px] leading-relaxed font-bold uppercase tracking-widest">{success}</span>
                </div>
            )}

            {activeTab === 'reset' ? (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="mb-4">
                  <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-2">Password Recovery</h2>
                  <p className="text-[10px] text-hawk-textMuted font-bold leading-relaxed uppercase tracking-widest">
                    Enter the email associated with your account and we'll send a recovery link.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-hawk-textMuted uppercase tracking-widest pl-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-hawk-textMuted" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-black/40 border border-hawk-ui rounded-2xl p-4 pl-12 text-white placeholder-hawk-textMuted focus:outline-none focus:border-hawk-gold transition-all text-xs font-bold"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-hawk-gold text-black font-black uppercase tracking-[0.3em] py-5 rounded-2xl mt-4 hover:bg-white hover:translate-y-[-2px] active:translate-y-[1px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-hawk-gold/10 disabled:opacity-50 text-[11px]"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send Reset Link
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-6">
                {activeTab === 'signup' ? (
                  <>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-hawk-textMuted uppercase tracking-widest pl-1">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-hawk-textMuted" />
                          <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-black/40 border border-hawk-ui rounded-2xl p-4 pl-12 text-white placeholder-hawk-textMuted focus:outline-none focus:border-hawk-gold transition-all text-xs font-bold"
                              placeholder="you@example.com"
                          />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-hawk-textMuted uppercase tracking-widest">Username</label>
                          <span className={`text-[9px] font-black ${username.length > 16 || (username.length > 0 && username.length < 2) ? 'text-red-500' : 'text-hawk-gold'}`}>
                            {username.length}/16
                          </span>
                        </div>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-hawk-textMuted" />
                          <input
                              type="text"
                              required
                              value={username}
                              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                              className="w-full bg-black/40 border border-hawk-ui rounded-2xl p-4 pl-12 text-white placeholder-hawk-textMuted focus:outline-none focus:border-hawk-gold transition-all text-xs font-bold tracking-[0.2em]"
                              placeholder="username_x"
                          />
                        </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-hawk-textMuted uppercase tracking-widest pl-1">Email or Username</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-hawk-textMuted" />
                        <input
                            type="text"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full bg-black/40 border border-hawk-ui rounded-2xl p-4 pl-12 text-white placeholder-hawk-textMuted focus:outline-none focus:border-hawk-gold transition-all text-xs font-bold"
                            placeholder="Email or Username"
                        />
                      </div>
                  </div>
                )}
                
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-hawk-textMuted uppercase tracking-widest pl-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-hawk-textMuted" />
                      <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-black/40 border border-hawk-ui rounded-2xl p-4 pl-12 pr-12 text-white placeholder-hawk-textMuted focus:outline-none focus:border-hawk-gold transition-all text-xs font-bold"
                          placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-hawk-textMuted hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                </div>

                {activeTab === 'signin' && (
                  <div className="flex justify-end pr-1">
                    <button 
                      type="button"
                      onClick={() => { setActiveTab('reset'); setError(null); setSuccess(null); }}
                      className="text-[9px] font-black text-hawk-gold uppercase tracking-[0.2em] hover:text-white transition-colors italic"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black font-black uppercase tracking-[0.3em] py-5 rounded-2xl mt-4 hover:bg-hawk-gold hover:translate-y-[-2px] active:translate-y-[1px] transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 text-[11px]"
                >
                    {loading ? (
                      <span className="flex items-center gap-3">
                        <Loader className="w-4 h-4 animate-spin" />
                        {activeTab === 'signup' ? 'Creating Account...' : 'Signing in...'}
                      </span>
                    ) : (
                      activeTab === 'signup' ? 'Create Account' : 'Sign In'
                    )}
                </button>
              </form>
            )}

            {activeTab !== 'reset' && (
              <>
                <div className="flex items-center gap-4 my-8">
                    <div className="h-[1px] bg-hawk-ui/50 flex-1"></div>
                    <span className="text-[9px] text-hawk-textMuted uppercase tracking-[0.4em] font-black italic">or</span>
                    <div className="h-[1px] bg-hawk-ui/50 flex-1"></div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full bg-hawk-ui/20 text-hawk-textSecondary hover:text-white font-bold text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-hawk-ui/40 transition-all flex items-center justify-center gap-3 border border-hawk-ui"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                    </svg>
                    Continue with Google
                </button>
              </>
            )}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-[9px] text-hawk-textMuted font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2">
            Beta V0.9.9
          </p>
        </div>
      </div>

      <button 
        onClick={handleBypass}
        className="fixed bottom-4 right-4 opacity-5 hover:opacity-40 transition-opacity text-[8px] font-black uppercase tracking-[0.2em] text-hawk-gold z-[9999] bg-black/40 px-2 py-1 rounded-md border border-hawk-gold/20"
      >
        Bypass Auth (Preview)
      </button>
    </div>
  );
};
