'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Share2, Users, Copy, Check, LogOut, Download, Package, FileArchive, AlertTriangle, Cloud, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
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
import type { FileItem } from "@/contexts/session-context";
import { BACKEND_URL } from "@/lib/firebase";

function resetBodyPointerEvents() {
  document.body.style.pointerEvents = '';
}

export function IdeHeader() {
  const { user, logout } = useAuth();
  const { session, leaveSession, addOutput, files } = useSession();
  const [shareOpen, setShareOpen] = useState(false);
  const [dockerCheckOpen, setDockerCheckOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const [deployAction, setDeployAction] = useState<'download' | 'dockerhub' | 'cloud'>('download');
  const [autoImport, setAutoImport] = useState(false);
  const [dockerHubUsername, setDockerHubUsername] = useState('');
  const [dockerHubPassword, setDockerHubPassword] = useState('');
  const [dockerHubRepos, setDockerHubRepos] = useState<string[]>([]);
  const [selectedDockerHubRepo, setSelectedDockerHubRepo] = useState('');
  const [dockerHubCustomRepo, setDockerHubCustomRepo] = useState('');
  const [dockerHubActualUsername, setDockerHubActualUsername] = useState('');
  const [isLoadingDockerHubRepos, setIsLoadingDockerHubRepos] = useState(false);
  const [dockerHubReposError, setDockerHubReposError] = useState('');
  const [cloudProvider, setCloudProvider] = useState('aws');
  const [deploying, setDeploying] = useState(false);
  const [copied, setCopied] = useState(false);
  const deployAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!deployOpen && !shareOpen && !dockerCheckOpen) {
      resetBodyPointerEvents();
    }
  }, [deployOpen, shareOpen, dockerCheckOpen]);

  useEffect(() => {
    return () => resetBodyPointerEvents();
  }, []);

  const fetchDockerHubRepos = useCallback(async () => {
    if (!dockerHubUsername || !dockerHubPassword || deployAction !== 'dockerhub') return;
    setIsLoadingDockerHubRepos(true);
    setDockerHubReposError('');
    setDockerHubRepos([]);
    setSelectedDockerHubRepo('');
    setDockerHubCustomRepo('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/dockerhub/repos?identifier=${encodeURIComponent(dockerHubUsername)}&password=${encodeURIComponent(dockerHubPassword)}`);
      const data = await res.json();
      console.log('[Docker Hub] Repos response:', data);
      if (data.username) {
        setDockerHubActualUsername(data.username);
      }
      if (data.repos && data.repos.length > 0) {
        setDockerHubRepos(data.repos.map((r: { name: string }) => r.name));
      } else if (data.error) {
        setDockerHubReposError(data.error);
      }
    } catch (err) {
      console.error('[Docker Hub] Fetch error:', err);
      setDockerHubReposError('Failed to fetch repositories');
    } finally {
      setIsLoadingDockerHubRepos(false);
    }
  }, [dockerHubUsername, dockerHubPassword, deployAction]);

  const participantCount = session ? Object.keys(session.participants).length : 0;

  const handleCopySessionId = () => {
    if (session?.sessionId) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(session.sessionId).catch(() => {
          const textArea = document.createElement('textarea');
          textArea.value = session.sessionId;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        });
      } else {
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

  const closeDeployDialog = useCallback(() => {
    setDeployOpen(false);
    setDeploying(false);
    resetBodyPointerEvents();
  }, []);

  const handleBuildContainerImage = () => {
    if (!files || files.length === 0) {
      addOutput('error', '❌ No files to build');
      return;
    }
    setDeployAction('download');
    setDeployOpen(true);
  };

  const handleDeploy = async () => {
    setDeploying(true);
    addOutput('info', '🔍 Checking for Docker installation...');

    try {
      const response = await fetch(`${BACKEND_URL}/api/check-docker`);
      const data = await response.json();

      if (!data.installed) {
        closeDeployDialog();
        setDockerCheckOpen(true);
        return;
      }

      addOutput('info', '📦 Building container image...');

      const nonFolderFiles: Record<string, string> = {};
      const getFilePath = (file: FileItem): string => {
        const parts: string[] = [file.name];
        let current: FileItem = file;
        while (current.parentId) {
          const parent = files.find(f => f.id === current.parentId);
          if (parent) { parts.unshift(parent.name); current = parent; } else break;
        }
        return parts.join('/');
      };
      files.filter(f => !f.isFolder).forEach(file => {
        nonFolderFiles[getFilePath(file)] = file.content;
      });

      if (Object.keys(nonFolderFiles).length === 0) {
        addOutput('error', '❌ No files to build');
        return;
      }

      const buildBody: Record<string, unknown> = {
        files: nonFolderFiles,
        sessionName: session?.name || 'codeforge-project',
        action: deployAction === 'download' && autoImport ? 'autoimport' : deployAction
      };

      if (deployAction === 'dockerhub') {
        buildBody.dockerHubUsername = dockerHubActualUsername || dockerHubUsername;
        buildBody.dockerHubPassword = dockerHubPassword;
        buildBody.dockerHubRepo = dockerHubCustomRepo || selectedDockerHubRepo || session?.name || 'codeforge-project';
      } else if (deployAction === 'cloud') {
        buildBody.cloudProvider = cloudProvider;
      }

      const controller = new AbortController();
      deployAbortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      let buildResponse;
      try {
        buildResponse = await fetch(`${BACKEND_URL}/api/build-container`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBody),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          addOutput('error', '⏱️ Build timed out after 2 minutes');
        } else {
          addOutput('error', `❌ Network error: ${fetchErr instanceof Error ? fetchErr.message : 'Unknown'}`);
        }
        return;
      } finally {
        deployAbortRef.current = null;
      }

      if (!buildResponse.ok) {
        const errorData = await buildResponse.json().catch(() => ({}));
        const fullMessage = errorData.details || errorData.error || 'Build failed';
        const buildLog = errorData.buildLog || '';
        const shortMessage = fullMessage.length > 200 ? fullMessage.substring(0, 200) + '...' : fullMessage;
        if (buildLog) {
          addOutput('error', `❌ ${shortMessage}\n${buildLog.substring(0, 500)}`);
        } else {
          throw new Error(shortMessage);
        }
        return;
      }

      if (deployAction === 'download' && autoImport) {
        const result = await buildResponse.json();
        const imgName = result.imageName ? result.imageName.split(':')[0] : 'codeforge/project';
        addOutput('success', `✅ Built: ${imgName}`);
      } else if (deployAction === 'download') {
        const result = await buildResponse.json();

        if (!result.downloadUrl) {
          throw new Error(result.error || 'Build failed - no download URL');
        }

        const fullUrl = result.downloadUrl.startsWith('http')
          ? result.downloadUrl
          : `${BACKEND_URL}${result.downloadUrl}`;

        const tarResponse = await fetch(fullUrl);
        if (!tarResponse.ok) throw new Error('Download failed');
        const blob = await tarResponse.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        const imgName = result.imageName ? result.imageName.split(':')[0] : 'codeforge-project';
        a.download = result.fileName || `${session?.name || 'codeforge'}-container.tar`;
        a.click();
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);

        addOutput('success', `✅ Built: ${imgName}`);
      } else if (deployAction === 'dockerhub') {
        const result = await buildResponse.json();
        addOutput('success', `✅ ${result.message}`);
      } else if (deployAction === 'cloud') {
        const result = await buildResponse.json();
        addOutput('success', `✅ ${result.message}`);
        if (result.instructions) {
          addOutput('info', `📋 Instructions: ${result.instructions}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addOutput('error', `❌ Build failed: ${message}`);
    } finally {
      closeDeployDialog();
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
      const getExportPath = (file: FileItem): string => {
        const parts: string[] = [file.name];
        let current: FileItem = file;
        while (current.parentId) {
          const parent = files.find(f => f.id === current.parentId);
          if (parent) { parts.unshift(parent.name); current = parent; } else break;
        }
        return parts.join('/');
      };
      nonFolderFiles.forEach(file => {
        fileContents[getExportPath(file)] = file.content;
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

      setTimeout(() => {
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);
      }, 10);

      addOutput('success', '✅ Source code exported successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addOutput('error', `❌ Export failed: ${message}`);
    }
  };

  const handleDeployDialogChange = useCallback((open: boolean) => {
    if (deploying) return;
    if (!open) {
      closeDeployDialog();
    } else {
      setDeployOpen(true);
    }
  }, [deploying, closeDeployDialog]);

  const handleShareDialogChange = useCallback((open: boolean) => {
    setShareOpen(open);
    if (!open) resetBodyPointerEvents();
  }, []);

  const handleDockerCheckDialogChange = useCallback((open: boolean) => {
    setDockerCheckOpen(open);
    if (!open) resetBodyPointerEvents();
  }, []);

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
                    <span className="text-xs text-muted-foreground ml-6">Auto-detects language & framework</span>
                    <span className="text-xs text-muted-foreground ml-6">Result: Ready-to-run Docker image</span>
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
      <Dialog open={shareOpen} onOpenChange={handleShareDialogChange}>
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
      <Dialog open={dockerCheckOpen} onOpenChange={handleDockerCheckDialogChange}>
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
            <Button onClick={() => { setDockerCheckOpen(false); resetBodyPointerEvents(); }} variant="default">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deploy Container Dialog - non-modal to avoid pointer-events lock */}
      {deployOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/80" onClick={() => !deploying && closeDeployDialog()} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
            <div className="bg-background border border-border rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Package className="h-5 w-5" />
                  Build & Deploy Container
                </div>
                {!deploying && (
                  <button onClick={closeDeployDialog} className="text-muted-foreground hover:text-foreground rounded-sm opacity-70 hover:opacity-100 transition-opacity">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Choose how you want to deploy your container image.
              </p>

              <div className="space-y-4 relative">
                <div className="space-y-2">
                  <Label>Deployment Option</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={deployAction === 'download' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDeployAction('download')}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <Download className="h-5 w-5" />
                      <span className="text-xs">Save .tar</span>
                    </Button>
                    <Button
                      variant={deployAction === 'dockerhub' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDeployAction('dockerhub')}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-xs">Docker Hub</span>
                    </Button>
                    <Button
                      variant={deployAction === 'cloud' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDeployAction('cloud')}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <Cloud className="h-5 w-5" />
                      <span className="text-xs">Cloud</span>
                    </Button>
                  </div>
                </div>

                {deployAction === 'dockerhub' && (
                  <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <Label htmlFor="dh-user" className="text-xs">Docker Hub Username or Email</Label>
                      <Input
                        id="dh-user"
                        value={dockerHubUsername}
                        onChange={(e) => setDockerHubUsername(e.target.value)}
                        placeholder="your-username (not email)"
                        title="Enter your Docker Hub username, not email. Find it at https://hub.docker.com/settings/general"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="dh-pass" className="text-xs">Docker Hub Password</Label>
                      <Input
                        id="dh-pass"
                        type="password"
                        value={dockerHubPassword}
                        onChange={(e) => setDockerHubPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchDockerHubRepos}
                      disabled={!dockerHubUsername || !dockerHubPassword || isLoadingDockerHubRepos}
                      className="w-full"
                    >
                      {isLoadingDockerHubRepos ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                          Fetching repositories...
                        </>
                      ) : (
                        'Fetch Repositories'
                      )}
                    </Button>

                    {!isLoadingDockerHubRepos && dockerHubUsername && dockerHubPassword && dockerHubRepos.length > 0 && (
                      <div className="space-y-1">
                        <Label htmlFor="dh-repo" className="text-xs">Select Repository</Label>
                        <select
                          id="dh-repo"
                          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                          value={selectedDockerHubRepo}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setSelectedDockerHubRepo('');
                              setDockerHubCustomRepo(session?.name || '');
                            } else {
                              setSelectedDockerHubRepo(e.target.value);
                              setDockerHubCustomRepo('');
                            }
                          }}
                        >
                          <option value="">Select a repository...</option>
                          {dockerHubRepos.map(repo => (
                            <option key={repo} value={repo}>{repo}</option>
                          ))}
                          <option value="__custom__">+ Enter custom repository name</option>
                        </select>
                      </div>
                    )}

                    {(!isLoadingDockerHubRepos && (dockerHubReposError || dockerHubRepos.length === 0)) && (
                      <div className="space-y-1">
                        <Label htmlFor="dh-custom-repo" className="text-xs">
                          {dockerHubReposError ? 'Enter repository name (fetch failed)' : 'Repository Name'}
                        </Label>
                        <Input
                          id="dh-custom-repo"
                          value={dockerHubCustomRepo}
                          onChange={(e) => {
                            setDockerHubCustomRepo(e.target.value);
                            setSelectedDockerHubRepo('');
                          }}
                          placeholder={session?.name || 'my-repo'}
                        />
                        {dockerHubReposError && (
                          <p className="text-xs text-destructive">{dockerHubReposError}</p>
                        )}
                      </div>
                    )}

                  </div>
                )}

                {deployAction === 'cloud' && (
                  <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <Label className="text-xs">Cloud Provider</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['aws', 'gcp', 'azure', 'kubernetes'].map((provider) => (
                          <Button
                            key={provider}
                            variant={cloudProvider === provider ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCloudProvider(provider)}
                            className="capitalize"
                          >
                            {provider}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {deployAction === 'download' && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <input
                      type="checkbox"
                      id="autoImport"
                      checked={autoImport}
                      onChange={(e) => setAutoImport(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="autoImport" className="text-sm cursor-pointer">
                      Auto-import to Docker Desktop
                    </Label>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeDeployDialog} disabled={deploying}>
                    Cancel
                  </Button>
                  <Button onClick={handleDeploy} disabled={deploying}>
                    {deploying ? 'Building...' : deployAction === 'download' ? 'Build & Download' : 'Build & Deploy'}
                  </Button>
                </div>

                {deploying && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50 rounded-lg">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground">Building container image...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
