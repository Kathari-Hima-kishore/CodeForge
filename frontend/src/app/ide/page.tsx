'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from '@/contexts/session-context';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, FileCode, Play, Users, LogOut, Share2, ChevronLeft, ChevronRight, MessageCircle, File, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

// Lazy load Monaco Editor
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="text-sm text-gray-400">Loading editor...</span>
      </div>
    </div>
  ),
});

const LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  csharp: 'csharp',
  html: 'html',
  css: 'css',
};

const WELCOME_CODE: Record<string, string> = {
  javascript: '// JavaScript\nconsole.log("Hello!");\n',
  typescript: '// TypeScript\ngreeting: string = "Hello!";\n',
  python: '# Python\nprint("Hello!")\n',
  java: '// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello!");\n    }\n}\n',
  cpp: '// C++\n#include <iostream>\nint main() {\n    std::cout << "Hello!" << std::endl;\n    return 0;\n}\n',
};

export default function IdePage() {
  const { user, logout } = useAuth();
  const {
    files,
    currentFileId,
    setCurrentFileId,
    updateFileContent,
    deleteFile,
    messages,
    sendMessage,
    output,
    clearOutput,
    executeCode,
    isExecuting,
    session,
    leaveSession,
  } = useSession();

  const [filesCollapsed, setFilesCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [leftWidth, setLeftWidth] = useState(220);
  const [middleWidth, setMiddleWidth] = useState(300);
  const [bottomHeight, setBottomHeight] = useState(200);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const getFilesWidth = () => filesCollapsed ? 48 : leftWidth;
  const getChatWidth = () => chatCollapsed ? 48 : middleWidth;

  const currentFile = files.find(f => f.id === currentFileId);
  const currentLanguage = currentFile?.language || 'python';
  const displayCode = currentFile ? currentFile.content : WELCOME_CODE[currentLanguage] || WELCOME_CODE.python;

  const canEdit = session ? ['host', 'co-host', 'editor'].includes(session.role) : true;

  const handleCodeChange = useCallback((value: string | undefined) => {
    if (currentFileId && canEdit && value !== undefined && value !== null) {
      updateFileContent(currentFileId, value);
    }
  }, [currentFileId, canEdit, updateFileContent]);

  const handleRun = async () => {
    if (currentFile) {
      executeCode(currentFile.language, currentFile.content);
    } else {
      executeCode('python', WELCOME_CODE.python);
    }
  };

  const handleEditorMount = (editor: any) => {
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.column });
    });
    editor.focus();
  };

  const getEditorLanguage = () => {
    if (!currentFile) return 'python';
    return LANGUAGE_MAP[currentFile.language] || 'plaintext';
  };

  const handleLeave = () => {
    if (confirm('Leave this session?')) {
      leaveSession();
    }
  };

  const handleCopySessionId = () => {
    if (session?.sessionId) {
      navigator.clipboard.writeText(session.sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const participantCount = session ? Object.keys(session.participants).length : 0;

  const startResize = (direction: 'horizontal' | 'vertical', initial: number, setFn: (v: number) => void, min: number, max: number, isLeft: boolean) => {
    return (e: React.MouseEvent) => {
      const start = direction === 'horizontal' ? e.clientX : e.clientY;
      const startVal = initial;
      const moveHandler = (me: MouseEvent) => {
        const current = direction === 'horizontal' ? me.clientX : me.clientY;
        const delta = isLeft ? current - start : start - current;
        setFn(Math.max(min, Math.min(max, startVal + delta)));
      };
      const upHandler = () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
      };
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
    };
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1e1e1e] text-gray-200 font-body">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b border-gray-700 bg-[#252526] px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">CF</span>
          </div>
          <span className="font-bold text-lg">CodeForge</span>
        </div>
        {session && (
          <>
            <div className="w-px h-8 bg-gray-700" />
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold">{session.name}</span>
              <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded capitalize">{session.role}</span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Users className="h-3 w-3" /> {participantCount}
              </span>
            </div>
          </>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {session && (
            <>
              <Button variant="outline" size="sm" className="gap-2 border-gray-600" onClick={() => setShowShareDialog(true)}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400" onClick={handleLeave}>
                <LogOut className="h-4 w-4 mr-1" /> Leave
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback className="bg-blue-600">{user?.displayName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        <div style={{ width: getFilesWidth() }} className="h-full flex-shrink-0 bg-[#252526] flex flex-col">
          {filesCollapsed ? (
            <div className="h-full flex flex-col items-center py-4 gap-2 w-12">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFilesCollapsed(false)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="w-8 h-px bg-gray-700" />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFilesCollapsed(false)} title="Expand Explorer">
                <File className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                <span className="text-xs font-semibold text-gray-400 uppercase">Explorer</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFilesCollapsed(true)}>
                  <ChevronLeft className="h-3 w-3" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="py-1">
                  {files.filter(f => !f.isFolder).map(file => (
                    <div
                      key={file.id}
                      className={`flex items-center gap-1 px-2 py-1 cursor-pointer text-sm ${currentFileId === file.id ? 'bg-[#094771] text-white' : 'text-gray-300 hover:bg-[#2a2d2e]'}`}
                      onClick={() => setCurrentFileId(file.id)}
                    >
                      <File className="h-4 w-4 text-gray-500" />
                      <span className="truncate flex-1">{file.name}</span>
                      <button
                        className="opacity-0 hover:opacity-100 hover:text-red-400 p-0.5"
                        onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Resize Handle 1 */}
        {!filesCollapsed && (
          <div
            className="w-0.5 bg-gray-700 hover:bg-blue-500 cursor-col-resize flex-shrink-0"
            onMouseDown={startResize('horizontal', leftWidth, setLeftWidth, 150, 400, false)}
          />
        )}

        {/* Chat Panel */}
        <div style={{ width: getChatWidth() }} className="h-full flex-shrink-0 bg-[#252526] flex flex-col border-l border-gray-700">
          {chatCollapsed ? (
            <div className="h-full flex flex-col items-center py-4 gap-2 w-12">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setChatCollapsed(false)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="w-8 h-px bg-gray-700" />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setChatCollapsed(false)} title="Expand Chat">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                <span className="text-xs font-semibold text-gray-400 uppercase">Chat</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setChatCollapsed(true)}>
                  <ChevronLeft className="h-3 w-3" />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-4">
                      <MessageCircle className="h-6 w-6 mx-auto mb-1 opacity-50" />
                      <p>No messages</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id}>
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-sm" style={{ color: msg.userColor }}>{msg.userName}</span>
                          <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-gray-300 pl-0">{msg.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="p-2 border-t border-gray-700">
                <Input
                  placeholder="Type message..."
                  className="bg-[#3c3c3c] border-gray-600"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      sendMessage(e.currentTarget.value.trim());
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Resize Handle 2 */}
        {!chatCollapsed && (
          <div
            className="w-0.5 bg-gray-700 hover:bg-blue-500 cursor-col-resize flex-shrink-0"
            onMouseDown={startResize('horizontal', middleWidth, setMiddleWidth, 150, 500, true)}
          />
        )}

        {/* Editor Area */}
        <div className="flex flex-col flex-1 h-full min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-gray-700 h-14 px-4 bg-[#252526]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 rounded-lg border border-blue-500/30">
                <FileCode className="h-5 w-5 text-blue-400" />
                <span className="font-bold text-blue-400">Editor</span>
              </div>
              <div className="w-px h-8 bg-gray-700" />
              <span className="font-semibold text-lg">{currentFile?.name || 'Untitled'}</span>
              {currentFile && (
                <span className="text-xs font-mono bg-gray-800 text-gray-400 px-2 py-1 rounded">
                  {currentFile.language}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-mono bg-gray-800 px-2 py-1 rounded">
                Ln {cursorPosition.line}, Col {cursorPosition.column}
              </span>
              <Button
                size="sm"
                className="gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6"
                onClick={handleRun}
                disabled={isExecuting}
              >
                {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isExecuting ? 'Running...' : '▶ Run'}
              </Button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <MonacoEditor
              height="100%"
              language={getEditorLanguage()}
              value={displayCode}
              onChange={handleCodeChange}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                readOnly: !canEdit && !!currentFile,
                minimap: { enabled: true },
                fontSize: 15,
                fontFamily: "'JetBrains Mono', monospace",
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>

          {/* Bottom Panel */}
          <div
            className="w-0.5 bg-gray-700 hover:bg-blue-500 cursor-row-resize flex-shrink-0"
            onMouseDown={startResize('vertical', bottomHeight, setBottomHeight, 100, 500, false)}
          />
          <div style={{ height: bottomHeight }} className="flex-shrink-0 bg-[#1e1e1e] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-[#252526]">
              <span className="px-3 py-1 text-xs font-medium rounded bg-[#094771] text-white">Output</span>
              <Button variant="ghost" size="sm" onClick={clearOutput} className="h-6 text-xs">
                Clear
              </Button>
            </div>
            <ScrollArea className="flex-1 p-2">
              <div className="font-mono text-sm space-y-1">
                {output.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    <p>No output yet</p>
                  </div>
                ) : (
                  output.map((item, i) => (
                    <div key={i} className={`whitespace-pre-wrap ${
                      item.type === 'error' ? 'text-red-400' :
                      item.type === 'success' ? 'text-green-400' :
                      item.type === 'info' ? 'text-blue-400' :
                      'text-gray-300'
                    }`}>
                      {item.content}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#252526] border border-gray-700 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Share Session</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowShareDialog(false)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Share this code with others</p>
            <div className="flex gap-2">
              <Input value={session?.sessionId || ''} readOnly className="font-mono text-lg bg-[#1e1e1e]" />
              <Button onClick={handleCopySessionId} className={copied ? 'bg-green-600' : 'bg-blue-600'}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
