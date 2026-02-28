'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Sparkles, Code2, Users, Zap, ArrowRight, Terminal } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot';

export function AuthPage() {
  const { login, register, resetPassword, error, loading, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLocalError('');
    clearError();

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        if (password.length < 8) {
          setLocalError('Password must be at least 8 characters');
          return;
        }
        await register(email, password, displayName);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setMessage('Password reset email sent! Check your inbox.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      const errorMsg = error.message || '';
      
      if (errorMsg === 'Email is not registered') {
        setLocalError('Email is not registered');
      } else if (errorMsg === 'Incorrect password') {
        setLocalError('Incorrect password');
      } else if (errorMsg.includes('Password')) {
        setLocalError(errorMsg);
      } else if (errorMsg.includes('Firebase:')) {
        const cleanMessage = errorMsg
          .replace('Firebase: ', '')
          .replace('auth/invalid-credential', 'Incorrect password')
          .replace('auth/wrong-password', 'Incorrect password')
          .replace('auth/email-already-in-use', 'This email is already registered')
          .replace('auth/weak-password', 'Password must be at least 8 characters with uppercase, lowercase, and number')
          .replace('auth/invalid-email', 'Invalid email address');
        setLocalError(cleanMessage);
      } else if (!errorMsg.includes('Login failed')) {
        setLocalError(errorMsg);
      }
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setMessage('');
    setLocalError('');
    clearError();
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        
        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-16">
          <div className="max-w-lg">
            {/* Logo & Title */}
            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-2xl" />
                <div className="relative bg-gradient-to-br from-primary to-purple-600 p-4 rounded-2xl shadow-lg shadow-primary/25">
                  <Terminal className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Code<span className="text-primary">Forge</span>
                </h1>
                <p className="text-sm text-muted-foreground font-medium">Collaborative IDE</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Code together.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-accent">
                Build faster.
              </span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              A powerful browser-based IDE for real-time collaboration. 
              Write, run, and share code instantly with your team.
            </p>
          
            {/* Feature cards */}
            <div className="space-y-4">
              {[
                { icon: Code2, title: 'Multi-Language Support', desc: 'Python, JavaScript, TypeScript, C++, Java & more', color: 'from-blue-500 to-cyan-500' },
                { icon: Users, title: 'Real-time Collaboration', desc: 'Code together with live cursors and instant sync', color: 'from-purple-500 to-pink-500' },
                { icon: Zap, title: 'Instant Execution', desc: 'Run code directly in secure containers', color: 'from-emerald-500 to-teal-500' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card/40 border border-border/40 backdrop-blur-sm hover:bg-card/60 transition-all duration-300 group">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-card/30 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        
        <div className="relative z-10 w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="bg-gradient-to-br from-primary to-purple-600 p-2.5 rounded-lg">
              <Terminal className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">CodeForge</span>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">
              {mode === 'login' && 'Welcome back'}
              {mode === 'register' && 'Get started'}
              {mode === 'forgot' && 'Reset password'}
            </h2>
            <p className="text-muted-foreground">
              {mode === 'login' && 'Enter your credentials to continue'}
              {mode === 'register' && 'Create your account to start coding'}
              {mode === 'forgot' && 'We\'ll send you a reset link'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium text-foreground/80">
                  Full Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="h-12 bg-background/60 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-background/60 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                    Password
                  </Label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-12 bg-background/60 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {mode === 'register' && (
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className={password.length >= 8 ? 'text-emerald-500' : ''}>✓ 8+</span>
                    <span className={/[A-Z]/.test(password) ? 'text-emerald-500' : ''}>✓ A-Z</span>
                    <span className={/[a-z]/.test(password) ? 'text-emerald-500' : ''}>✓ a-z</span>
                    <span className={/[0-9]/.test(password) ? 'text-emerald-500' : ''}>✓ 0-9</span>
                  </div>
                )}
              </div>
            )}

            {(localError || error) && (
              <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                {localError || error}
              </div>
            )}
            
            {message && (
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium">
                {message}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 group" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === 'login' && 'Sign In'}
                  {mode === 'register' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/30">
            {mode === 'login' && (
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => switchMode('register')}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Sign up free
                </button>
              </p>
            )}
            {mode === 'register' && (
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
