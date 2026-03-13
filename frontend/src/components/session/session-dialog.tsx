'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession, SessionSummary } from '@/contexts/session-context';
import { useAuth } from '@/contexts/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2, Plus, LogIn, LogOut, ArrowLeft, Users,
  Clock, Crown, RefreshCw, ChevronRight, Terminal,
  Sparkles, Hash, Zap, Code2, FolderOpen,
} from 'lucide-react';

type SessionMode = 'select' | 'create' | 'join';

const FEATURE_CHIPS = [
  { icon: Users, label: 'Live Cursors',   color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
  { icon: Code2, label: 'Multi-Language', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { icon: Zap,   label: 'Instant Run',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
];

export function SessionDialog() {
  const {
    createSession,
    joinSession,
    rejoinSession,
    isConnecting,
    connectionError,
    mySessions,
    isLoadingSessions,
    refreshMySessions,
  } = useSession();
  const { user, logout } = useAuth();
  const [mode, setMode] = useState<SessionMode>('select');
  const [sessionName, setSessionName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!sessionName.trim()) { setError('Please enter a session name'); return; }
    try {
      await createSession(sessionName.trim());
    } catch {
      setError('Failed to create session');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!sessionId.trim()) { setError('Please enter a session code'); return; }
    try {
      await joinSession(sessionId.trim());
    } catch {
      setError('Failed to join session');
    }
  };

  const handleRejoin = async (session: SessionSummary) => {
    setError('');
    try {
      await rejoinSession(session.sessionId);
    } catch {
      setError('Failed to rejoin session');
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch {}
  };

  const formatTime = (ts: number) => {
    const diffMs = Date.now() - ts;
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  const displayError = error || connectionError;
  const userName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(99,102,241,0.08),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_80%_90%,rgba(168,85,247,0.05),transparent)]" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 w-full max-w-[410px]">

        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3.5">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
              <div className="relative bg-gradient-to-br from-primary to-purple-600 p-3.5 rounded-2xl shadow-xl shadow-primary/20">
                <Terminal className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Code<span className="text-primary">Forge</span>
          </h1>
          <p className="text-xs text-muted-foreground/50 mt-1 font-medium tracking-wider uppercase">
            Collaborative IDE
          </p>
          {/* Feature chips */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {FEATURE_CHIPS.map(({ icon: Icon, label, color, bg }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${bg}`}
              >
                <Icon className={`h-3 w-3 ${color}`} />
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Shimmer line */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="p-5">

            {/* User greeting */}
            {mode === 'select' && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-secondary/25 border border-border/20">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-primary/20">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground/60 truncate">{user?.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-semibold">Online</span>
                </div>
              </div>
            )}

            {/* Back button */}
            {mode !== 'select' && (
              <button
                onClick={() => { setMode('select'); setError(''); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors group"
              >
                <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back
              </button>
            )}

            {/* ── SELECT MODE ── */}
            {mode === 'select' && (
              <div className="space-y-3">

                {/* Recent sessions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Recent Sessions
                    </h3>
                    <button
                      onClick={refreshMySessions}
                      disabled={isLoadingSessions}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors disabled:opacity-40 font-medium"
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>

                  {isLoadingSessions ? (
                    <div className="space-y-1.5">
                      {[1, 2].map(i => (
                        <div key={i} className="h-[52px] rounded-xl bg-secondary/30 border border-border/15 animate-pulse" />
                      ))}
                    </div>
                  ) : mySessions.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <div className="w-9 h-9 rounded-xl bg-secondary/40 border border-border/20 flex items-center justify-center">
                        <FolderOpen className="h-4 w-4 text-muted-foreground/30" />
                      </div>
                      <p className="text-xs text-muted-foreground/40 font-medium">No recent sessions</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-44">
                      <div className="space-y-1 pr-1">
                        {mySessions.map(session => (
                          <button
                            key={session.sessionId}
                            onClick={() => handleRejoin(session)}
                            disabled={isConnecting}
                            className="w-full p-2.5 rounded-xl border border-border/20 bg-background/20 hover:bg-secondary/35 hover:border-primary/20 transition-all duration-150 text-left group disabled:opacity-50"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="font-semibold text-sm truncate">{session.name}</span>
                                  {session.isHost && (
                                    <span className="flex items-center gap-0.5 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold border border-primary/15 shrink-0">
                                      <Crown className="h-2 w-2" />
                                      Host
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
                                  <span className="flex items-center gap-0.5">
                                    <Users className="h-2.5 w-2.5" />
                                    {session.participantCount}
                                  </span>
                                  <span>{formatTime(session.createdAt)}</span>
                                  <span className="font-mono text-[10px] bg-secondary/60 px-1.5 py-0.5 rounded border border-border/20 text-muted-foreground/40">
                                    {session.sessionId}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/25 group-hover:text-primary/70 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
                  <span className="text-[11px] text-muted-foreground/35 font-medium">or start new</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
                </div>

                {/* Action buttons */}
                <Button
                  size="lg"
                  className="w-full h-11 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-white font-semibold shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 group"
                  onClick={() => setMode('create')}
                >
                  <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                  New Session
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-11 border-border/35 bg-secondary/15 hover:bg-secondary/40 hover:border-primary/20 font-semibold transition-all"
                  onClick={() => setMode('join')}
                >
                  <Hash className="h-4 w-4 mr-2 text-muted-foreground/70" />
                  Join With Code
                </Button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors py-1 font-medium"
                >
                  <LogOut className="h-3 w-3" />
                  Sign out
                </button>
              </div>
            )}

            {/* ── CREATE MODE ── */}
            {mode === 'create' && (
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold mb-0.5">New Session</h2>
                  <p className="text-[13px] text-muted-foreground/70">Start a collaborative coding session</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sessionName" className="text-sm font-medium text-foreground/80">Session Name</Label>
                  <Input
                    id="sessionName"
                    placeholder="e.g. Team Sprint, Interview, Study Group…"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    required
                    autoFocus
                    className="h-11 bg-secondary/30 border-border/40 focus:border-primary/60 focus:ring-0 transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground/50">Give it a descriptive name</p>
                </div>

                {displayError && (
                  <div className="p-3 rounded-lg bg-destructive/8 border border-destructive/20 text-destructive text-sm">
                    {displayError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 font-semibold shadow-md shadow-primary/15 transition-all"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Create Session</>
                  )}
                </Button>
              </form>
            )}

            {/* ── JOIN MODE ── */}
            {mode === 'join' && (
              <form onSubmit={handleJoin} className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold mb-0.5">Join Session</h2>
                  <p className="text-[13px] text-muted-foreground/70">Enter the code shared by the session host</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sessionId" className="text-sm font-medium text-foreground/80">Session Code</Label>
                  <Input
                    id="sessionId"
                    placeholder="ABC12345"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                    required
                    autoFocus
                    maxLength={12}
                    className="h-12 bg-secondary/30 border-border/40 focus:border-primary/60 focus:ring-0 font-mono tracking-[0.25em] text-center text-lg uppercase transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground/50 text-center">8-character code from the session host</p>
                </div>

                {displayError && (
                  <div className="p-3 rounded-lg bg-destructive/8 border border-destructive/20 text-destructive text-sm">
                    {displayError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold transition-all"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining…</>
                  ) : (
                    <><LogIn className="mr-2 h-4 w-4" /> Join Session</>
                  )}
                </Button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
