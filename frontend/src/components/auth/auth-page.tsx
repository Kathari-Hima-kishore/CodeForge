'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import gsap from 'gsap';
import { Loader2, ArrowRight, Eye, EyeOff, Zap } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot';

// ── Password strength ──────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const labelColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-emerald-400'];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : 'bg-white/10'}`} />
        ))}
      </div>
      {score > 0 && <p className={`text-[11px] ${labelColors[score - 1]}`}>{labels[score - 1]}</p>}
    </div>
  );
}

// ── Code snippets for the terminal showcase ────────────────────────────────────
type Line = { text: string; indent?: number; type: 'keyword' | 'fn' | 'string' | 'comment' | 'plain' | 'num' | 'type' };

const SNIPPETS: { lang: string; color: string; lines: Line[] }[] = [
  {
    lang: 'Python',
    color: '#4B8BBE',
    lines: [
      { text: '# real-time fibonacci', type: 'comment' },
      { text: 'def fibonacci(n: int) -> int:', type: 'plain' },
      { text: 'if n <= ', indent: 1, type: 'keyword' },
      { text: '    if n <= 1: return n', indent: 1, type: 'plain' },
      { text: '    return fib(n-1) + fib(n-2)', indent: 1, type: 'plain' },
      { text: '', type: 'plain' },
      { text: 'for i in range(10):', type: 'plain' },
      { text: '    print(fibonacci(i))', indent: 1, type: 'plain' },
    ],
  },
  {
    lang: 'JavaScript',
    color: '#F7DF1E',
    lines: [
      { text: '// async fetch with error handling', type: 'comment' },
      { text: 'const fetchUser = async (id) => {', type: 'plain' },
      { text: '  try {', indent: 1, type: 'plain' },
      { text: '    const res = await fetch(`/api/${id}`)', indent: 2, type: 'plain' },
      { text: '    const data = await res.json()', indent: 2, type: 'plain' },
      { text: '    return data', indent: 2, type: 'plain' },
      { text: '  } catch (err) {', indent: 1, type: 'plain' },
      { text: '    console.error(err.message)', indent: 2, type: 'plain' },
      { text: '  }', indent: 1, type: 'plain' },
      { text: '}', type: 'plain' },
    ],
  },
  {
    lang: 'Java',
    color: '#ED8B00',
    lines: [
      { text: '// Generic stack implementation', type: 'comment' },
      { text: 'public class Stack<T> {', type: 'plain' },
      { text: '  private List<T> items = new ArrayList<>();', indent: 1, type: 'plain' },
      { text: '', type: 'plain' },
      { text: '  public void push(T item) {', indent: 1, type: 'plain' },
      { text: '    items.add(item);', indent: 2, type: 'plain' },
      { text: '  }', indent: 1, type: 'plain' },
      { text: '', type: 'plain' },
      { text: '  public T pop() {', indent: 1, type: 'plain' },
      { text: '    return items.remove(items.size()-1);', indent: 2, type: 'plain' },
      { text: '  }', indent: 1, type: 'plain' },
      { text: '}', type: 'plain' },
    ],
  },
  {
    lang: 'C++',
    color: '#00599C',
    lines: [
      { text: '// Binary search', type: 'comment' },
      { text: 'int binarySearch(vector<int>& arr, int x) {', type: 'plain' },
      { text: '  int lo = 0, hi = arr.size() - 1;', indent: 1, type: 'plain' },
      { text: '  while (lo <= hi) {', indent: 1, type: 'plain' },
      { text: '    int mid = lo + (hi - lo) / 2;', indent: 2, type: 'plain' },
      { text: '    if (arr[mid] == x) return mid;', indent: 2, type: 'plain' },
      { text: '    else if (arr[mid] < x) lo = mid + 1;', indent: 2, type: 'plain' },
      { text: '    else hi = mid - 1;', indent: 2, type: 'plain' },
      { text: '  }', indent: 1, type: 'plain' },
      { text: '  return -1;', indent: 1, type: 'plain' },
      { text: '}', type: 'plain' },
    ],
  },
];

const LANG_BADGES = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C', 'C#', 'HTML', 'CSS'];

// ── Terminal left panel ────────────────────────────────────────────────────────
function TerminalPanel() {
  const [snippetIdx, setSnippetIdx] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const snippet = SNIPPETS[snippetIdx];

  // Cycle snippets + animate lines in
  useEffect(() => {
    setVisibleLines(0);
    let line = 0;
    const iv = setInterval(() => {
      line++;
      setVisibleLines(line);
      if (line >= snippet.lines.length) clearInterval(iv);
    }, 90);
    return () => clearInterval(iv);
  }, [snippetIdx, snippet.lines.length]);

  // Auto-cycle every 6 seconds
  useEffect(() => {
    const t = setTimeout(() => {
      setSnippetIdx(i => (i + 1) % SNIPPETS.length);
    }, 6000);
    return () => clearTimeout(t);
  }, [snippetIdx]);

  // Entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(heroRef.current, { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out' });
      gsap.from(terminalRef.current, { y: 32, opacity: 0, duration: 0.9, delay: 0.15, ease: 'power3.out' });
      gsap.from(badgesRef.current?.children ?? [], {
        y: 12, opacity: 0, duration: 0.5, stagger: 0.06, delay: 0.4, ease: 'power2.out',
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="relative flex flex-col justify-between h-full px-10 py-10 overflow-hidden select-none">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Subtle radial glow */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-600/8 blur-[100px] pointer-events-none" />

      {/* Logo */}
      <div ref={heroRef} className="relative z-10">
        <div className="flex items-center gap-2.5 mb-16">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          <span className="font-bold text-white/80 text-sm tracking-wide">CodeForge</span>
          <span className="ml-auto text-[10px] font-semibold bg-violet-500/15 border border-violet-500/25 text-violet-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
        </div>

        <h2 className="text-4xl font-bold text-white leading-[1.15] tracking-tight max-w-xs">
          Write code.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
            Run anywhere.
          </span><br />
          Ship together.
        </h2>
        <p className="mt-4 text-white/35 text-sm leading-relaxed max-w-xs">
          A real-time collaborative IDE for teams that move fast. Multi-language, instant execution, zero setup.
        </p>
      </div>

      {/* Terminal window */}
      <div ref={terminalRef} className="relative z-10 my-6 flex-1 min-h-0 flex flex-col max-h-[320px]">
        <div className="rounded-xl border border-white/8 bg-[#0d0e18] shadow-2xl shadow-black/60 overflow-hidden flex flex-col h-full">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#0a0b14] border-b border-white/6 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]/80" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]/80" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]/80" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-[11px] text-white/25 font-mono">codeforge — main.{snippet.lang === 'Python' ? 'py' : snippet.lang === 'JavaScript' ? 'js' : snippet.lang === 'Java' ? 'java' : 'cpp'}</span>
            </div>
            <div
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all duration-500"
              style={{ color: snippet.color + 'cc', borderColor: snippet.color + '30', background: snippet.color + '12' }}
            >
              {snippet.lang}
            </div>
          </div>

          {/* Code area */}
          <div className="flex-1 p-4 font-mono text-[12.5px] leading-[1.75] overflow-hidden">
            {snippet.lines.slice(0, visibleLines).map((line, i) => (
              <div
                key={`${snippetIdx}-${i}`}
                className="flex gap-3 transition-all duration-150"
                style={{ opacity: visibleLines > i ? 1 : 0 }}
              >
                <span className="text-white/15 w-4 text-right shrink-0 text-[11px]">{i + 1}</span>
                <span
                  className={
                    line.type === 'comment' ? 'text-[#6a7280] italic' :
                    'text-[#e2e8f0]/85'
                  }
                >
                  {line.text}
                </span>
              </div>
            ))}
            {/* Blinking cursor */}
            {visibleLines < snippet.lines.length && (
              <div className="flex gap-3">
                <span className="text-white/15 w-4 text-right shrink-0 text-[11px]">{visibleLines + 1}</span>
                <span className="inline-block w-2 h-4 bg-violet-400/70 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Language badges + stats */}
      <div className="relative z-10 space-y-5">
        <div ref={badgesRef} className="flex flex-wrap gap-1.5">
          {LANG_BADGES.map(lang => (
            <span
              key={lang}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all duration-300 cursor-default ${
                lang === snippet.lang
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                  : 'bg-white/4 border-white/8 text-white/30 hover:border-white/15 hover:text-white/50'
              }`}
            >
              {lang}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-6 pt-2 border-t border-white/6">
          <div>
            <p className="text-xl font-bold text-white">9+</p>
            <p className="text-white/25 text-[11px]">Languages</p>
          </div>
          <div className="w-px h-8 bg-white/8" />
          <div>
            <p className="text-xl font-bold text-white">∞</p>
            <p className="text-white/25 text-[11px]">Sessions</p>
          </div>
          <div className="w-px h-8 bg-white/8" />
          <div>
            <p className="text-xl font-bold text-white">0ms</p>
            <p className="text-white/25 text-[11px]">Sync delay</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main auth page ────────────────────────────────────────────────────────────
export function AuthPage() {
  const { login, register, resetPassword, error, loading, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [localError, setLocalError] = useState('');

  const formRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(rightRef.current, { x: 20, opacity: 0, duration: 0.8, delay: 0.1, ease: 'power3.out' });
    });
    return () => ctx.revert();
  }, []);

  // Animate form on mode switch
  useEffect(() => {
    if (!formRef.current) return;
    gsap.fromTo(formRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
    );
  }, [mode]);

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
    setMode(m);
    setMessage('');
    setLocalError('');
    clearError();
    setShowPassword(false);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex bg-[#08090f] overflow-hidden">

      {/* ── LEFT: Terminal showcase ── */}
      <div className="hidden lg:flex lg:w-[52%] border-r border-white/[0.06] bg-[#08090f]">
        <TerminalPanel />
      </div>

      {/* ── RIGHT: Auth form ── */}
      <div ref={rightRef} className="w-full lg:w-[48%] flex items-center justify-center p-8 relative bg-[#08090f]">

        {/* Subtle top-right glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />

        {/* Mobile logo */}
        <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="font-bold text-white/70 text-sm">CodeForge</span>
        </div>

        <div className="relative z-10 w-full max-w-[360px]">

          <div ref={formRef}>
            {/* Header */}
            <div className="mb-8">
              <p className="text-[11px] font-bold text-violet-400 uppercase tracking-[0.15em] mb-2">
                {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Reset Password'}
              </p>
              <h1 className="text-[28px] font-bold text-white leading-tight tracking-tight">
                {mode === 'login' && 'Welcome back'}
                {mode === 'register' && 'Join CodeForge'}
                {mode === 'forgot' && 'Reset your password'}
              </h1>
              <p className="text-white/35 text-sm mt-1.5">
                {mode === 'login' && 'Sign in to your workspace.'}
                {mode === 'register' && 'Start building in seconds.'}
                {mode === 'forgot' && "We'll email you a reset link."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="displayName" className="text-[13px] text-white/50 font-medium">Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                    autoFocus
                    className="h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/60 focus:bg-white/[0.06] transition-all rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] text-white/50 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus={mode !== 'register'}
                  className="h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/60 focus:bg-white/[0.06] transition-all rounded-lg"
                />
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[13px] text-white/50 font-medium">Password</Label>
                    {mode === 'login' && (
                      <button type="button" onClick={() => switchMode('forgot')} className="text-[12px] text-white/30 hover:text-violet-400 transition-colors">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-11 bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-violet-500/60 focus:bg-white/[0.06] transition-all rounded-lg pr-11"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {mode === 'register' && <PasswordStrength password={password} />}
                </div>
              )}

              {displayError && (
                <div className="py-2.5 px-3 rounded-lg bg-red-500/8 border border-red-500/20 text-red-400 text-[13px]">
                  {displayError}
                </div>
              )}
              {message && (
                <div className="py-2.5 px-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 text-[13px]">
                  {message}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-lg bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold text-[14px] shadow-lg shadow-violet-600/20 transition-all duration-150 group"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {mode === 'login' && 'Continue'}
                    {mode === 'register' && 'Create account'}
                    {mode === 'forgot' && 'Send reset link'}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            {/* Switch mode */}
            <p className="mt-6 text-center text-[13px] text-white/30">
              {mode === 'login' && (
                <>No account?{' '}<button onClick={() => switchMode('register')} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Sign up free</button></>
              )}
              {mode === 'register' && (
                <>Already a member?{' '}<button onClick={() => switchMode('login')} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Sign in</button></>
              )}
              {mode === 'forgot' && (
                <>Remember it?{' '}<button onClick={() => switchMode('login')} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Back to sign in</button></>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
