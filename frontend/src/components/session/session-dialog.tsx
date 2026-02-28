'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useSession, SessionSummary } from '@/contexts/session-context';
import { useAuth } from '@/contexts/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, Plus, LogIn, LogOut, ArrowLeft, Sparkles, Users, 
  Clock, Crown, RefreshCw, ChevronRight 
} from 'lucide-react';

type SessionMode = 'select' | 'create' | 'join';

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
    
    if (!sessionName.trim()) {
      setError('Please enter a session name');
      return;
    }

    try {
      await createSession(sessionName.trim());
    } catch {
      setError('Failed to create session');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!sessionId.trim()) {
      setError('Please enter a session code');
      return;
    }

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
    try {
      await logout();
    } catch {
      // Error handled by auth context
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const displayError = error || connectionError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-gradient-radial p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      
      <Card className="relative w-full max-w-lg border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-accent" />
        
        <CardHeader className="space-y-4 text-center pb-2 pt-8">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
              <Logo className="h-16 w-16 relative" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">
              {mode === 'select' && 'Ready to Code?'}
              {mode === 'create' && 'Create Session'}
              {mode === 'join' && 'Join Session'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {mode === 'select' && (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Logged in as <span className="text-foreground font-medium">{user?.displayName || user?.email}</span>
                </span>
              )}
              {mode === 'create' && 'Start a new collaborative coding session'}
              {mode === 'join' && 'Enter the session code shared with you'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-8">
          {mode === 'select' && (
            <div className="space-y-4">
              {/* Existing Sessions */}
              {mySessions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Your Sessions
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={refreshMySessions}
                      disabled={isLoadingSessions}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  
                  <ScrollArea className="max-h-48">
                    <div className="space-y-2">
                      {mySessions.map((session) => (
                        <button
                          key={session.sessionId}
                          onClick={() => handleRejoin(session)}
                          disabled={isConnecting}
                          className="w-full p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-secondary/50 hover:border-primary/30 transition-all duration-200 text-left group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{session.name}</span>
                                {session.isHost && (
                                  <span className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                                    <Crown className="h-3 w-3" />
                                    Host
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {session.participantCount}
                                </span>
                                <span>{formatTime(session.createdAt)}</span>
                                <span className="font-mono text-[10px] bg-secondary px-1.5 py-0.5 rounded">
                                  {session.sessionId}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-4 text-muted-foreground">or start fresh</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {isLoadingSessions && mySessions.length === 0 && (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading your sessions...
                </div>
              )}

              <Button
                size="lg"
                className="w-full h-14 gap-3 bg-primary hover:bg-primary/90 glow-primary text-lg font-semibold transition-all duration-200"
                onClick={() => setMode('create')}
              >
                <Plus className="h-5 w-5" />
                Create New Session
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="w-full h-14 gap-3 border-border/50 hover:bg-secondary/50 text-lg font-semibold transition-all duration-200"
                onClick={() => setMode('join')}
              >
                <Users className="h-5 w-5" />
                Join With Code
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          )}

          {mode === 'create' && (
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sessionName" className="text-sm font-medium">
                  Session Name
                </Label>
                <Input
                  id="sessionName"
                  placeholder="e.g., Team Project, Study Group, Interview..."
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  required
                  className="h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 text-lg"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Choose a descriptive name for your session
                </p>
              </div>
              
              {displayError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {displayError}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 border-border/50"
                  onClick={() => setMode('select')}
                  disabled={isConnecting}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-[2] h-12 bg-primary hover:bg-primary/90 glow-primary font-semibold" 
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Session
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {mode === 'join' && (
            <form onSubmit={handleJoin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sessionId" className="text-sm font-medium">
                  Session Code
                </Label>
                <Input
                  id="sessionId"
                  placeholder="e.g., ABC123XY"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                  required
                  className="h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 text-lg font-mono tracking-widest text-center uppercase"
                  autoFocus
                  maxLength={12}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 8-character code shared by the session host
                </p>
              </div>
              
              {displayError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {displayError}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 border-border/50"
                  onClick={() => setMode('select')}
                  disabled={isConnecting}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-[2] h-12 bg-accent hover:bg-accent/90 glow-accent font-semibold text-accent-foreground" 
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Join Session
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
