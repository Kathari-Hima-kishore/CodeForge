'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Code, Play, Loader2, X, FileCode, File } from 'lucide-react';
import { useSession } from '@/contexts/session-context';
import { LucideIcon } from 'lucide-react';

const LANGUAGES: { id: string; name: string; icon: LucideIcon; extension: string }[] = [
  { id: 'javascript', name: 'JavaScript', icon: FileCode, extension: '.js' },
  { id: 'typescript', name: 'TypeScript', icon: FileCode, extension: '.ts' },
  { id: 'python', name: 'Python', icon: FileCode, extension: '.py' },
  { id: 'java', name: 'Java', icon: FileCode, extension: '.java' },
  { id: 'cpp', name: 'C++', icon: FileCode, extension: '.cpp' },
  { id: 'c', name: 'C', icon: FileCode, extension: '.c' },
  { id: 'csharp', name: 'C#', icon: FileCode, extension: '.cs' },
  { id: 'html', name: 'HTML', icon: FileCode, extension: '.html' },
  { id: 'css', name: 'CSS', icon: FileCode, extension: '.css' },
];

const getLanguageIcon = (language: string): LucideIcon => {
  const lang = LANGUAGES.find(l => l.id === language);
  return lang?.icon || File;
};

export function CodeEditorPanel() {
  const {
    files,
    currentFileId,
    setCurrentFileId,
    updateFileContent,
    createFile,
    deleteFile,
    executeCode,
    isExecuting,
    session,
  } = useSession();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [openFileIds, setOpenFileIds] = useState<string[]>([]);

  // Initialize open files when files change
  useEffect(() => {
    const fileIds = files.filter(f => !f.isFolder).map(f => f.id);
    if (openFileIds.length === 0 && fileIds.length > 0) {
      setOpenFileIds(fileIds);
    } else {
      // Filter out deleted files
      setOpenFileIds(prev => prev.filter(id => fileIds.includes(id)));
    }
  }, [files]);

  const currentFile = files.find(f => f.id === currentFileId);
  const code = currentFile?.content || '';
  const lineCount = Math.max(code.split('\n').length, 1);

  // Check if user can edit
  const canEdit = session ? ['host', 'co-host', 'editor'].includes(session.role) : true;

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (currentFileId && canEdit) {
      updateFileContent(currentFileId, e.target.value);
    }
  };

  const handleRun = async () => {
    if (!currentFile) return;
    executeCode(currentFile.language, currentFile.content);
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const text = textarea.value.substring(0, textarea.selectionStart);
    const lines = text.split('\n');
    setCursorPosition({
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter to run
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }

    // Ctrl+S - Save (prevent default browser save)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      // Content is auto-saved via Firestore debounce
    }

    // Ctrl+N - New file (if not in edit mode)
    if (e.ctrlKey && e.key === 'n' && !canEdit) {
      e.preventDefault();
    }

    // Tab key inserts spaces
    if (e.key === 'Tab' && canEdit) {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);

      if (currentFileId) {
        updateFileContent(currentFileId, newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
        }, 0);
      }
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter to run (global) - handled in local handler
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="h-full flex flex-col min-h-0 bg-background">
      {/* File tabs - only show when there are open files */}
      {openFileIds.length > 0 && (
        <div className="flex items-center border-b border-border/50 h-10 px-2 overflow-x-auto bg-card/30 scrollbar-thin">
          {openFileIds.map(fileId => {
            const file = files.find(f => f.id === fileId);
            if (!file || file.isFolder) return null;
            const Icon = getLanguageIcon(file.language);
            const isActive = file.id === currentFileId;
            const handleClose = (e: React.MouseEvent) => {
              e.stopPropagation();
              const newOpenFiles = openFileIds.filter(id => id !== fileId);
              setOpenFileIds(newOpenFiles);
              if (currentFileId === fileId) {
                if (newOpenFiles.length > 0) {
                  setCurrentFileId(newOpenFiles[0]);
                } else {
                  setCurrentFileId(null as unknown as string);
                }
              }
            };
            const FileIcon = Icon;
            return (
              <div
                key={file.id}
                className={`group flex items-center gap-2 px-4 h-full text-sm border-r border-border/30 cursor-pointer transition-all duration-200 flex-shrink-0 ${isActive
                  ? 'bg-background text-foreground border-b-2 border-b-primary -mb-[2px]'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                onClick={() => setCurrentFileId(file.id)}
              >
                <FileIcon className="h-4 w-4" />
                <span className="max-w-[120px] truncate font-medium">{file.name}</span>
                <button
                  onClick={handleClose}
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all ml-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border/50 h-12 px-4 bg-secondary/20">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" />
            <span className="font-semibold">{currentFile?.name || 'No file'}</span>
          </div>
          <span className="text-muted-foreground text-xs font-mono bg-background/50 px-2 py-0.5 rounded">
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </span>
          {!canEdit && (
            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2.5 py-1 rounded-full font-medium border border-yellow-500/20">
              👁 View Only
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold glow-accent"
            onClick={handleRun}
            disabled={isExecuting || !currentFile}
          >
            {isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isExecuting ? 'Running...' : 'Run'}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div className="text-right py-3 px-3 text-muted-foreground/60 select-none font-mono text-sm bg-card/50 border-r border-border/30 min-w-[3.5rem]">
          {Array.from({ length: lineCount }, (_, i) => i + 1).map((lineNumber) => (
            <div key={lineNumber} className="leading-6 h-6 hover:text-muted-foreground transition-colors">{lineNumber}</div>
          ))}
        </div>

        {/* Code textarea */}
        <Textarea
          ref={textareaRef}
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCursorPosition}
          onClick={updateCursorPosition}
          readOnly={!canEdit}
          className={`flex-1 resize-none border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm py-3 px-4 leading-6 ${!canEdit ? 'cursor-not-allowed opacity-60' : ''
            }`}
          placeholder={canEdit ? "// Start coding here..." : "// You can only view this file"}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
