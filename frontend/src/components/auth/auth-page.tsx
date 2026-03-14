'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import gsap from 'gsap';
import { Loader2, ArrowRight, Eye, EyeOff, Zap, Mail, Lock, User, ShieldCheck } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-violet-500', 'bg-fuchsia-400'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const labelColors = ['text-red-400', 'text-orange-400', 'text-violet-400', 'text-fuchsia-400'];
  
  if (!password) return null;
  
  return (
    <div className="mt-3 space-y-2 w-[calc(100%-48px)]">
      <div className="flex gap-1.5 w-full h-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`flex-1 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0)] ${i < score ? `${colors[score - 1]} shadow-${colors[score-1]}/50` : 'bg-white/10'}`} />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${labelColors[score - 1]}`}>
          {score === 4 && <ShieldCheck className="w-3.5 h-3.5" />}
          {labels[score - 1]}
        </p>
      )}
    </div>
  );
}

export function AuthPage() {
  const { login, register, resetPassword, error, loading, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [localError, setLocalError] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  // Mouse Spotlight Tracker
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Entrance Animations - Refined for a deeply creamy, native-app feel
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Main card drops in smoothly
      gsap.from(cardRef.current, {
        y: 40,
        opacity: 0,
        scale: 0.98,
        duration: 1.4,
        ease: 'power4.out',
      });
      // Left side text staggers in
      gsap.from('.reveal-text', {
        y: 20,
        opacity: 0,
        duration: 1.2,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.2
      });
      // Right side form elements slide in
      gsap.from('.form-element', {
        x: 15,
        opacity: 0,
        duration: 1,
        stagger: 0.05,
        ease: 'power3.out',
        delay: 0.4
      });
      // Background blobs fade in
      gsap.from('.ambient-blob', {
        opacity: 0,
        duration: 2,
        ease: 'power2.inOut',
        delay: 0.5
      });
    });
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLocalError('');
    clearError();
    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        if (password.length < 8) { setLocalError('Password must be at least 8 characters'); return; }
        await register(email, password, displayName);
      } else {
        await resetPassword(email);
        setMessage('Reset link sent! Check your inbox.');
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || '';
      if (['Email is not registered', 'Incorrect password'].includes(msg)) {
        setLocalError(msg);
      } else if (msg.includes('Firebase:')) {
        setLocalError(msg
          .replace('Firebase: ', '')
          .replace(/\(auth\/.*?\)\.?/, '')
          .replace('invalid-credential', 'Incorrect email or password.')
          .replace('wrong-password', 'Incorrect password.')
          .replace('email-already-in-use', 'Email already registered.')
          .replace('weak-password', 'Password too weak.')
          .replace('invalid-email', 'Invalid email address.')
          .trim()
        );
      } else if (msg && !msg.includes('Login failed')) {
        setLocalError(msg);
      }
    }
  };

  const switchMode = (m: AuthMode) => {
    if (m === mode) return;
    
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }
    
    setMode(m);
    setMessage('');
    setLocalError('');
    clearError();
    setShowPassword(false);
    setPassword('');
  };

  const displayError = localError || error;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 20s infinite alternate;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 5s;
        }
        .glass-panel {
          background: linear-gradient(145deg, rgba(20, 22, 33, 0.6) 0%, rgba(10, 12, 22, 0.8) 100%);
          backdrop-filter: blur(50px);
          -webkit-backdrop-filter: blur(50px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .glass-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .gradient-text-purple {
          background: linear-gradient(90deg, #c084fc, #e879f9, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .btn-shimmer {
          background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
        }
        .btn-shimmer::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
          transform: skewX(-25deg);
          transition: left 0.7s ease;
        }
        .btn-shimmer:hover::before {
          left: 200%;
        }
        .input-glow-wrapper {
          position: relative;
        }
        .input-glow-wrapper::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 13px;
          padding: 1px;
          background: linear-gradient(180deg, rgba(139, 92, 246, 0.5), transparent);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .input-glow-wrapper:focus-within::before {
          opacity: 1;
        }
        .input-glow-wrapper:focus-within::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 12px;
          background: rgba(139, 92, 246, 0.05);
          pointer-events: none;
          z-index: 0;
        }
      `}} />

      <div className="min-h-screen bg-[#06070B] relative flex items-center justify-center p-4 sm:p-8 overflow-hidden selection:bg-violet-500/30">
        
        {/* Cursor Spotlight Overlay (Global) */}
        <div 
          className="fixed inset-0 pointer-events-none z-50 transition-transform duration-75 mix-blend-screen"
          style={{
            background: `radial-gradient(700px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139,92,246,0.06), transparent 40%)`
          }}
        />

        {/* Ambient Morphing Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="ambient-blob absolute top-[5%] left-[15%] w-[700px] h-[700px] bg-violet-600/15 rounded-full mix-blend-screen blur-[130px] animate-blob" />
          <div className="ambient-blob absolute top-[25%] right-[10%] w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full mix-blend-screen blur-[120px] animate-blob animation-delay-2000" />
          <div className="ambient-blob absolute bottom-[-15%] left-[25%] w-[900px] h-[900px] bg-indigo-600/15 rounded-full mix-blend-screen blur-[160px] animate-blob animation-delay-4000" />
          
          {/* Extremely fine noise texture for premium matte aesthetic */}
          <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} />
        </div>

        {/* Static Container Wrapper */}
        <div className="w-full max-w-[1160px] flex items-center justify-center relative z-10">
          
          {/* Main Glass Slab - No Tilt, Just Absolute Premium Polish */}
          <div 
            ref={cardRef} 
            className="w-full flex flex-col lg:flex-row rounded-[2rem] overflow-hidden glass-panel relative"
          >
            
            {/* ── LEFT PANEL: Vision & Branding ── */}
            <div className="hidden lg:flex w-[48%] flex-col justify-center p-16 relative overflow-hidden bg-white/[0.01]">
               {/* Internal glowing corner highlights */}
               <div className="absolute -top-32 -left-32 w-80 h-80 bg-violet-500/15 blur-[90px] rounded-full pointer-events-none" />
               <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-fuchsia-500/10 blur-[90px] rounded-full pointer-events-none" />

               <div className="relative z-10 w-full max-w-sm">
                 <div className="reveal-text flex items-center gap-3.5 mb-16">
                   <div className="w-11 h-11 rounded-[14px] bg-white/[0.04] border border-white/10 flex items-center justify-center backdrop-blur-md shadow-[0_8px_30px_rgba(139,92,246,0.15)] relative">
                      <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full" />
                      <Zap className="w-[22px] h-[22px] text-violet-400 relative z-10" />
                   </div>
                   <span className="font-extrabold text-[22px] tracking-wide text-white">CodeForge</span>
                   <div className="ml-auto px-2.5 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 backdrop-blur-md">
                     <span className="text-[10px] font-bold text-violet-300 uppercase tracking-widest">BETA</span>
                   </div>
                 </div>

                 <div className="space-y-1.5 mb-8">
                   <h1 className="reveal-text text-[52px] font-bold text-white leading-[1.1] tracking-[-0.03em]">
                     Write code.
                   </h1>
                   <h1 className="reveal-text text-[52px] font-bold leading-[1.1] tracking-[-0.03em] gradient-text-purple pb-1">
                     Run anywhere.
                   </h1>
                   <h1 className="reveal-text text-[52px] font-bold text-white leading-[1.1] tracking-[-0.03em]">
                     Ship together.
                   </h1>
                 </div>

                 <p className="reveal-text text-[#8F9BB3] text-[16px] font-medium leading-relaxed">
                   The ultimate real-time collaborative IDE built for teams that move fast. Multi-language, instant execution, zero setup.
                 </p>
               </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden lg:block w-px h-[calc(100%-120px)] bg-gradient-to-b from-transparent via-white/10 to-transparent absolute left-[48%] top-[60px]" />

            {/* ── RIGHT PANEL: Auth Form ── */}
            <div className="w-full lg:w-[52%] p-8 sm:p-14 lg:p-16 flex flex-col justify-center bg-black/20 relative backdrop-blur-sm">
              
              {/* Mobile Branding */}
              <div className="flex lg:hidden items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shadow-lg">
                    <Zap className="w-[18px] h-[18px] text-violet-400" />
                  </div>
                  <span className="font-bold text-lg text-white tracking-wide">CodeForge</span>
                </div>
                <div className="px-2.5 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10">
                  <span className="text-[9px] font-bold text-violet-300 uppercase tracking-widest">BETA</span>
                </div>
              </div>

              <div className="form-element mb-10">
                <p className="text-[12px] font-bold text-violet-400 uppercase tracking-widest mb-2.5 ml-1">
                  {mode === 'login' && 'Sign In'}
                  {mode === 'register' && 'Create Account'}
                  {mode === 'forgot' && 'Recovery'}
                </p>
                <h2 className="text-3xl font-bold text-white tracking-tight mb-2.5 ml-1">
                  {mode === 'login' && 'Welcome back'}
                  {mode === 'register' && 'Join the workspace'}
                  {mode === 'forgot' && 'Reset your password'}
                </h2>
                <p className="text-[#8F9BB3] text-[15px] ml-1">
                  {mode === 'login' && 'Sign in to access your projects and team.'}
                  {mode === 'register' && 'Start building in seconds, entirely in the browser.'}
                  {mode === 'forgot' && "We'll send you a securely signed reset link."}
                </p>
              </div>

              <div ref={formRef}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Name Input */}
                  {mode === 'register' && (
                    <div className="space-y-1.5 form-element group">
                      <Label htmlFor="displayName" className="text-[13px] font-medium text-white/50 ml-1 transition-colors group-focus-within:text-violet-300">
                        Full Name
                      </Label>
                      <div className="input-glow-wrapper rounded-xl">
                        <Input
                          id="displayName"
                          type="text"
                          required
                          autoFocus
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          className="relative z-10 h-12 bg-white/[0.02] border-white/5 text-white placeholder:text-white/20 focus:border-transparent focus:ring-0 transition-all rounded-xl pl-11 text-[15px]"
                          placeholder="Ada Lovelace"
                        />
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/30 group-focus-within:text-violet-400 transition-colors z-20" />
                      </div>
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="space-y-1.5 form-element group">
                    <Label htmlFor="email" className="text-[13px] font-medium text-white/50 ml-1 transition-colors group-focus-within:text-violet-300">
                      Email address
                    </Label>
                    <div className="input-glow-wrapper rounded-xl">
                      <Input
                        id="email"
                        type="email"
                        required
                        autoFocus={mode !== 'register'}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="relative z-10 h-12 bg-white/[0.02] border-white/5 text-white placeholder:text-white/20 focus:border-transparent focus:ring-0 transition-all rounded-xl pl-11 text-[15px]"
                        placeholder="you@example.com"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/30 group-focus-within:text-violet-400 transition-colors z-20" />
                    </div>
                  </div>

                  {/* Password Input */}
                  {mode !== 'forgot' && (
                    <div className="space-y-1.5 form-element group">
                      <div className="flex justify-between items-center ml-1">
                        <Label htmlFor="password" className="text-[13px] font-medium text-white/50 transition-colors group-focus-within:text-violet-300">
                          Password
                        </Label>
                        {mode === 'login' && (
                          <button 
                            type="button" 
                            onClick={() => switchMode('forgot')} 
                            className="text-[13px] font-medium text-white/40 hover:text-violet-400 transition-colors"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="input-glow-wrapper rounded-xl">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="relative z-10 h-12 bg-white/[0.02] border-white/5 text-white placeholder:text-white/20 focus:border-transparent focus:ring-0 transition-all rounded-xl pl-11 pr-11 text-[15px] font-mono tracking-wider"
                          placeholder="••••••••"
                        />
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/30 group-focus-within:text-violet-400 transition-colors z-20" />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors z-20 p-1"
                        >
                          {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                        </button>
                      </div>
                      {mode === 'register' && <PasswordStrength password={password} />}
                    </div>
                  )}

                  {/* Alerts */}
                  {displayError && (
                    <div className="form-element p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[14px] font-medium flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      {displayError}
                    </div>
                  )}
                  {message && (
                    <div className="form-element p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[14px] font-medium flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {message}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="form-element w-full h-12 mt-6 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white rounded-xl font-semibold text-[15px] overflow-hidden btn-shimmer transition-transform active:scale-[0.98] shadow-[0_8px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_12px_25px_rgba(139,92,246,0.5)] border border-violet-400/20"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {mode === 'login' && 'Sign In'}
                        {mode === 'register' && 'Create Account'}
                        {mode === 'forgot' && 'Send Reset Link'}
                        <ArrowRight className="h-[18px] w-[18px] ml-0.5" />
                      </span>
                    )}
                  </Button>
                </form>

                {/* Footer Modes */}
                <div className="form-element mt-8 text-center text-[14px] text-[#8F9BB3] pt-6 border-t border-white/5">
                  {mode === 'login' && (
                    <p>
                      No account?{' '}
                      <button onClick={() => switchMode('register')} className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                        Sign up free
                      </button>
                    </p>
                  )}
                  {mode === 'register' && (
                    <p>
                      Already a member?{' '}
                      <button onClick={() => switchMode('login')} className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                        Sign in
                      </button>
                    </p>
                  )}
                  {mode === 'forgot' && (
                    <p>
                      <button onClick={() => switchMode('login')} className="text-violet-400 hover:text-violet-300 font-semibold transition-colors flex items-center justify-center gap-1.5 w-full">
                        <ArrowRight className="h-4 w-4 rotate-180" /> Back to sign in
                      </button>
                    </p>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
