'use client';

import { useState } from 'react';
import { Share2, Users, Copy, Check, LogOut, Download, Package, FileArchive, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { useAuth } from "@/contexts/auth-context";
import { useSession } from "@/contexts/session-context";
import { BACKEND_URL } from "@/lib/firebase";

export function IdeHeader() {
  const { user, logout } = useAuth();
  const { session, leaveSession, addOutput, files } = useSession();
  const [shareOpen, setShareOpen] = useState(false);
  const [dockerCheckOpen, setDockerCheckOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const participantCount = session ? Object.keys(session.participants).length : 0;

  const handleCopySessionId = () => {
    if (session?.sessionId) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(session.sessionId).catch(() => {
          // Fallback for clipboard errors
          const textArea = document.createElement('textarea');
          textArea.value = session.sessionId;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        });
      } else {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = session.sessionId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveSession = () => {
    if (confirm('Are you sure you want to leave this session?')) {
      leaveSession();
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  const handleBuildContainerImage = async () => {
    addOutput('info', '🔍 Checking for Docker installation...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/check-docker`);
      const data = await response.json();
      
      if (data.installed) {
        addOutput('success', '✅ Docker is installed and ready!');
      } else {
        setDockerCheckOpen(true);
      }
    } catch (error) {
      addOutput('error', '❌ Failed to check Docker installation');
      setDockerCheckOpen(true);
    }
  };

  const handleExportSourceCode = async () => {
    if (!files || files.length === 0) {
      addOutput('error', '❌ No files to export');
      return;
    }

    addOutput('info', '📦 Preparing source code export...');

    try {
      const nonFolderFiles = files.filter(f => !f.isFolder);
      
      if (nonFolderFiles.length === 0) {
        addOutput('error', '❌ No source files to export');
        return;
      }

      const fileContents: Record<string, string> = {};
      nonFolderFiles.forEach(file => {
        fileContents[file.name] = file.content;
      });

      const response = await fetch(`${BACKEND_URL}/api/export-zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileContents, sessionName: session?.name || 'codeforge-export' })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session?.name || 'codeforge'}-source.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addOutput('success', '✅ Source code exported successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addOutput('error', `❌ Export failed: ${message}`);
    }
  };

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b border-border/50 bg-card/50 backdrop-blur-sm px-4 lg:h-16 lg:px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo />
          </div>

          {session && (
            <>
              <div className="w-px h-8 bg-border/50 mx-2"></div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-sm font-semibold">{session.name}</span>
                </div>
                <span className="text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-full font-medium capitalize border border-primary/20">
                  {session.role.replace('-', ' ')}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {participantCount} online
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          {session && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary"
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="h-4 w-4" />
                Share Session
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-border/50 hover:bg-secondary/50"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem onClick={handleBuildContainerImage} className="flex flex-col items-start gap-1 p-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Build Container Image</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-6">Packages: Code + Dependencies</span>
                    <span className="text-xs text-muted-foreground ml-6">Result: Ready-to-deploy Docker image</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportSourceCode} className="flex flex-col items-start gap-1 p-3">
                    <div className="flex items-center gap-2">
                      <FileArchive className="h-4 w-4 text-accent" />
                      <span className="font-semibold">Export Source Code</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-6">Packages: Code only</span>
                    <span className="text-xs text-muted-foreground ml-6">Result: ZIP file</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleLeaveSession}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || undefined} alt="User Avatar" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.displayName || 'User'}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Share Session</DialogTitle>
            <DialogDescription>
              Share this code with others to let them join your session.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input
              value={session?.sessionId || ''}
              readOnly
              className="font-mono text-lg tracking-widest text-center bg-background/50 border-border/50"
            />
            <Button
              type="button"
              size="icon"
              onClick={handleCopySessionId}
              className={copied ? 'bg-accent hover:bg-accent' : ''}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          {copied && (
            <p className="text-sm text-accent text-center">Copied to clipboard!</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Docker Not Installed Alert Dialog */}
      <Dialog open={dockerCheckOpen} onOpenChange={setDockerCheckOpen}>
        <DialogContent className="sm:max-w-md border-destructive/50 bg-background/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Docker Not Found
            </DialogTitle>
            <DialogDescription className="text-base">
              Docker is not installed on this system. To build container images, please install Docker first.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive font-medium">Installation Steps:</p>
            <ol className="mt-2 text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Download Docker Desktop from docker.com</li>
              <li>Run the installer and follow prompts</li>
              <li>Start Docker Desktop application</li>
              <li>Restart your IDE session</li>
            </ol>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setDockerCheckOpen(false)} variant="default">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
